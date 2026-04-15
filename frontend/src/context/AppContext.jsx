import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { initializeMockData, calculatePremium, generateRiskAssessment, CITIES, PLATFORMS, DISRUPTION_TYPES, getPackages, PLAN_FEATURES, getStatePlanDiscovery } from '../data/mockData';
import * as backendApi from '../services/api';

const AppContext = createContext();

const GEMINI_API_KEY = 'AIzaSyBuVRgqXE-pt3KpSkfurumn3zyOunsijTk';

// eslint-disable-next-line react-refresh/only-export-components
export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};

// ── Simple SHA-like hash (deterministic, not cryptographic) ──
function simpleHash(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
}

// ── Fetch real weather data from Open-Meteo API (free, no key) ──
async function fetchRealWeather(lat, lng) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=temperature_2m,relativehumidity_2m,precipitation,windspeed_10m,weathercode&current_weather=true&timezone=Asia%2FKolkata&forecast_days=1`;
    const res = await fetch(url);
    const json = await res.json();
    const hourly = json.hourly;
    const currentHour = new Date().getHours();

    // Build last 24 hours data
    const data = [];
    for (let i = 0; i < Math.min(24, hourly.time.length); i++) {
      const timeStr = hourly.time[i];
      const hour = new Date(timeStr).getHours();
      const isCurrentOrPast = i <= currentHour;
      data.push({
        time: `${String(hour).padStart(2, '0')}:00`,
        temperature: hourly.temperature_2m[i] ?? 28,
        humidity: hourly.relativehumidity_2m[i] ?? 60,
        rainfall: hourly.precipitation[i] ?? 0,
        windSpeed: hourly.windspeed_10m[i] ?? 10,
        aqi: null, // fetched separately
        isLive: isCurrentOrPast,
      });
    }

    // Also try Open-Meteo air quality endpoint
    try {
      const aqUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&hourly=european_aqi&timezone=Asia%2FKolkata&forecast_days=1`;
      const aqRes = await fetch(aqUrl);
      const aqJson = await aqRes.json();
      const aqiArr = aqJson?.hourly?.european_aqi || [];
      data.forEach((d, i) => {
        d.aqi = aqiArr[i] != null ? Math.round(aqiArr[i] * 2) : (50 + Math.round(Math.random() * 100));
      });
    } catch {
      data.forEach(d => { d.aqi = 80 + Math.round(Math.random() * 80); });
    }

    return data;
  } catch (err) {
    console.error('Weather fetch failed:', err);
    return null;
  }
}

export const AppProvider = ({ children }) => {
  const [data, setData] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [weatherData, setWeatherData] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [weatherLoading, setWeatherLoading] = useState(false);

  // ── Initialize mock data ──
  useEffect(() => {
    const mockData = initializeMockData();
    setData(mockData);
  }, []);

  // ── Toast notifications ──
  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  // ── GPS + Reverse geocode location detection ──
  const detectLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      addToast('Geolocation not supported by your browser', 'warning');
      return;
    }
    setLocationLoading(true);
    addToast('Detecting your location...', 'info', 2000);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          // Reverse geocode via OpenStreetMap Nominatim
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const geo = await res.json();
          const city = geo.address?.city || geo.address?.town || geo.address?.county || 'Unknown';
          const state = geo.address?.state || '';

          // Try to match against our CITIES list
          const matched = CITIES.find(c =>
            city.toLowerCase().includes(c.name.toLowerCase()) ||
            c.name.toLowerCase().includes(city.toLowerCase())
          );

          const locationObj = matched || {
            id: 'detected',
            name: city,
            state,
            lat: latitude,
            lng: longitude,
            riskMultiplier: 1.0,
          };

          setCurrentLocation(locationObj);
          setLocationLoading(false);
          addToast(`📍 Location: ${city}, ${state}`, 'success');

          // Fetch real weather for detected location
          setWeatherLoading(true);
          const wData = await fetchRealWeather(latitude, longitude);
          if (wData) setWeatherData(wData);
          setWeatherLoading(false);
        } catch (err) {
          console.error('Geocode failed:', err);
          setLocationLoading(false);
          addToast('Could not resolve location name', 'warning');
        }
      },
      (err) => {
        setLocationLoading(false);
        addToast(`Location denied: ${err.message}`, 'warning');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [addToast]);

  // ── Fetch weather for a specific city (by coordinates) ──
  const fetchWeatherForCity = useCallback(async (city) => {
    setWeatherLoading(true);
    const wData = await fetchRealWeather(city.lat, city.lng);
    if (wData) setWeatherData(wData);
    setWeatherLoading(false);
  }, []);

  // ── Restore session ──
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('gigcover_user');
      const savedAdmin = localStorage.getItem('gigcover_isAdmin');
      if (savedAdmin === 'true') {
        setCurrentUser({ firstName: 'Admin', lastName: 'User', username: 'admin', email: 'admin@gigcover.com' });
        setIsLoggedIn(true);
        setIsAdmin(true);
      } else if (savedUser) {
        const u = JSON.parse(savedUser);
        setCurrentUser(u);
        setIsLoggedIn(true);
        setIsAdmin(false);
        // Auto fetch weather for saved city
        if (u.city?.lat) {
          fetchRealWeather(u.city.lat, u.city.lng).then(wData => {
            if (wData) setWeatherData(wData);
          });
        }
      }
    } catch {
      localStorage.removeItem('gigcover_user');
      localStorage.removeItem('gigcover_isAdmin');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Auto detect location on login ──
  useEffect(() => {
    if (isLoggedIn) {
      detectLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  // ── Auth & Identity ──
  const login = useCallback((role, userData = null, silent = false) => {
    setIsLoggedIn(true);
    setIsAdmin(role === 'admin');
    if (userData) {
      setCurrentUser(userData);
      localStorage.setItem('gigcover_isAdmin', 'false');
      localStorage.setItem('gigcover_user', JSON.stringify(userData));
      if (!silent) addToast(`Welcome back, ${userData.firstName}! 👋`, 'success');
    } else {
      localStorage.setItem('gigcover_isAdmin', 'true');
      localStorage.removeItem('gigcover_user');
      if (!silent) addToast('Welcome back, Admin! 🛡️', 'success');
    }
  }, [addToast]);

  // ── Logout ──
  const logout = useCallback(() => {
    setCurrentUser(null);
    setIsAdmin(false);
    setIsLoggedIn(false);
    setCurrentLocation(null);
    setWeatherData([]);
    localStorage.removeItem('gigcover_user');
    localStorage.removeItem('gigcover_isAdmin');
    addToast('Logged out successfully', 'info');
  }, [addToast]);

  // ── Auth: validate login with stored credentials ──
  const validateLogin = useCallback((username, password) => {
    // Admin check
    if (username === 'admin' && password === 'admin123') return { role: 'admin' };

    // Worker check from localStorage registry
    const registry = JSON.parse(localStorage.getItem('gigcover_registry') || '{}');
    const stored = registry[username.toLowerCase()];
    if (stored && stored.passwordHash === simpleHash(password)) {
      return { role: 'worker', userData: stored.profile };
    }
    return null;
  }, []);

  // ── Auth: register new worker ──
  const registerWorker = useCallback((workerData) => {
    const newWorker = {
      ...workerData,
      id: `WKR-${String((data?.workers?.length || 0) + 1).padStart(4, '0')}`,
      isActive: true,
      totalClaims: 0,
      totalPayouts: 0,
      joinDate: new Date().toISOString().split('T')[0],
    };
    setData(prev => ({
      ...prev,
      workers: [...(prev?.workers || []), newWorker],
    }));

    // Save credentials to registry
    const registry = JSON.parse(localStorage.getItem('gigcover_registry') || '{}');
    registry[workerData.username.toLowerCase()] = {
      passwordHash: simpleHash(workerData.password),
      profile: {
        id: newWorker.id,
        firstName: workerData.firstName,
        lastName: workerData.lastName,
        username: workerData.username,
        phone: workerData.phone,
        email: workerData.email,
        city: workerData.city,
        platform: workerData.platform,
        vehicleType: workerData.vehicleType,
        avgWeeklyEarning: workerData.avgWeeklyEarning,
        avgDeliveriesPerDay: workerData.avgDeliveriesPerDay,
        riskScore: workerData.riskScore || 50,
        isActive: true,
        totalClaims: 0,
        totalPayouts: 0,
        joinDate: newWorker.joinDate,
      },
    };
    localStorage.setItem('gigcover_registry', JSON.stringify(registry));
    addToast(`Welcome to GigCover, ${newWorker.firstName}! ✅`, 'success');
    return newWorker;
  }, [data, addToast]);

  // ── Policies & Claims ──
  const createPolicy = useCallback((policyData, silent = false) => {
    const newPolicy = {
      ...policyData,
      id: `POL-${Math.floor(Math.random() * 10000)}`,
      status: 'active',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
    setData(prev => ({
      ...prev,
      policies: [...(prev?.policies || []), newPolicy]
    }));
    if (!silent) addToast(`Policy ${newPolicy.packageName} activated!`, 'success');
    return newPolicy;
  }, [addToast]);

  // ── Update existing policy (Upgrade/Change) ──
  const updatePolicy = useCallback((policyId, newPackage) => {
    setData(prev => ({
      ...prev,
      policies: prev.policies.map(p => {
        if (p.id === policyId) {
          return {
            ...p,
            packageId: newPackage.id,
            packageName: newPackage.name,
            weeklyPremium: newPackage.premium,
            maxCoverage: newPackage.coverage,
            coveredDisruptions: newPackage.included,
          };
        }
        return p;
      })
    }));
    addToast(`Plan updated to ${newPackage.name} 🚀`, 'success');
  }, [addToast]);

  // ── Process claim ──
  const processClaim = useCallback((claimId, action) => {
    setData(prev => ({
      ...prev,
      claims: prev.claims.map(c =>
        c.id === claimId
          ? { ...c, status: action === 'approve' ? 'paid' : action === 'reject' ? 'rejected' : c.status, payoutDate: action === 'approve' ? new Date().toISOString().split('T')[0] : c.payoutDate }
          : c
      ),
    }));
    addToast(`Claim ${claimId} ${action === 'approve' ? 'approved & paid ✅' : 'rejected ❌'}`, action === 'approve' ? 'success' : 'warning');
  }, [addToast]);

  // ── Simulate disruption trigger ──
  const triggerDisruption = useCallback((cityId, disruptionId) => {
    const city = CITIES.find(c => c.id === cityId);
    const disruption = DISRUPTION_TYPES.find(d => d.id === disruptionId);
    if (!city || !disruption) return;

    const affectedPolicies = data?.policies?.filter(p => p.city === city.name && p.status === 'active') || [];
    const newClaims = affectedPolicies.map((policy, idx) => ({
      id: `CLM-${String((data?.claims?.length || 0) + idx + 1).padStart(5, '0')}`,
      policyId: policy.id,
      workerId: policy.workerId,
      workerName: policy.workerName,
      city: city.name,
      platform: policy.platform,
      disruptionType: disruption,
      claimDate: new Date().toISOString().split('T')[0],
      claimTime: new Date().toTimeString().slice(0, 5),
      lostHours: 4 + Math.floor(Math.random() * 6),
      claimAmount: Math.round(policy.maxCoverage * 0.3 * disruption.payoutMultiplier),
      status: 'auto_approved',
      triggerData: {
        source: 'Live API Trigger',
        value: 'Auto-detected',
        threshold: disruption.triggerThreshold,
        confidence: 92 + Math.floor(Math.random() * 8),
      },
      fraudCheck: {
        score: Math.floor(Math.random() * 15),
        locationVerified: true,
        duplicateCheck: 'passed',
        anomalyFlag: 'clear',
      },
      payoutDate: null,
      payoutMethod: 'UPI',
    }));

    const newAlert = {
      id: `ALT-${String(Date.now()).slice(-5)}`,
      type: 'critical',
      disruption,
      city: city.name,
      message: `${disruption.name} detected in ${city.name}: ${disruption.triggerThreshold}`,
      timestamp: new Date().toISOString(),
      affectedWorkers: affectedPolicies.length,
      estimatedPayout: newClaims.reduce((sum, c) => sum + c.claimAmount, 0),
      status: 'active',
    };

    setData(prev => ({
      ...prev,
      claims: [...prev.claims, ...newClaims],
      alerts: [newAlert, ...prev.alerts],
    }));

    addToast(`⚠️ ${disruption.icon} ${disruption.name} in ${city.name}! ${affectedPolicies.length} claims auto-generated.`, 'warning', 6000);
    return { newClaims, newAlert };
  }, [data, addToast]);

  // ── Gemini AI risk analysis ──
  const getAiRiskAnalysis = useCallback(async (city, weatherContext) => {
    try {
      const prompt = `You are a parametric insurance risk analyst for GigCover, protecting gig delivery workers in India.
Analyze the risk for ${city.name}, ${city.state} with the following real-time conditions:
- Temperature: ${weatherContext.temperature}°C
- Humidity: ${weatherContext.humidity}%
- Rainfall: ${weatherContext.rainfall}mm/hr
- Wind Speed: ${weatherContext.windSpeed} km/h
- AQI: ${weatherContext.aqi}

Provide a concise 2-sentence risk summary and a risk score 0-100. Format: {score: N, summary: "..."}`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        }
      );
      const json = await res.json();
      const text = json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const match = text.match(/\{[^}]+\}/s);
      if (match) return JSON.parse(match[0]);
    } catch (err) {
      console.error('Gemini AI failed:', err);
    }
    return null;
  }, []);

  // ── Backend API Integrations ──
  const getBackendRisk = useCallback(async (rain, aqi, temp) => {
    try {
      return await backendApi.calculateRisk({ rain, aqi, temp });
    } catch (err) {
      console.error('Backend Risk API failed:', err);
      return null;
    }
  }, []);

  const verifyClaimWithBackend = useCallback(async (claimData) => {
    try {
      return await backendApi.createClaim(claimData);
    } catch (err) {
      console.error('Backend Claim API failed:', err);
      return null;
    }
  }, []);

  // ── Gemini AI State Pricing (Phase 4) ──
  const getAiStatePricing = useCallback(async (stateName) => {
    try {
      const prompt = `You are an actuary for GigCover, a parametric insurance platform for delivery gig workers in India.
Calculate the risk-adjusted premium for the Indian state of ${stateName}.
Consider the state's typical traffic congestion, weather events (monsoon, heat), and pollution levels.

Return ONLY valid JSON strictly in this structural format without any markdown blocks or comments:
{
  "basePremium": 350,
  "maxCoverage": 5000,
  "payouts": {
    "rain": "Heavy Rain (>50mm): ₹1200",
    "heat": "Heat (>45°C): ₹800",
    "aqi": "AQI >400: ₹1500",
    "flood": "Flooding (>30cm): ₹2500",
    "outage": "Platform Outage: ₹1000",
    "cyclone": "Cyclone (>90km/h): ₹4000"
  }
}`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        }
      );
      const json = await res.json();
      const text = json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        // Construct the packages dynamically with specific AI payouts
        return [
          {
            id: 'basic',
            name: 'Essential Guard',
            premium: Math.round(parsed.basePremium * 0.8),
            coverage: Math.round(parsed.maxCoverage * 0.6),
            multiplier: 0.8,
            included: [parsed.payouts.rain, parsed.payouts.heat, parsed.payouts.aqi, '48hr Support'],
            excluded: ['Flooding', 'Platform Outage', 'Accidents'],
          },
          {
            id: 'standard',
            name: 'Smart Partner',
            premium: parsed.basePremium,
            coverage: parsed.maxCoverage,
            multiplier: 1.0,
            recommended: true,
            included: ['Everything in Basic', parsed.payouts.flood, parsed.payouts.outage, '12hr Support'],
            excluded: ['Cyclones', 'Theft', 'Vehicle Damage'],
          },
          {
            id: 'prime',
            name: 'Total Resilience',
            premium: Math.round(parsed.basePremium * 1.4),
            coverage: Math.round(parsed.maxCoverage * 1.5),
            multiplier: 1.4,
            included: ['Everything in Smart', parsed.payouts.cyclone, 'Instant Payout', '2hr Support'],
            excluded: ['War', 'Pandemics', 'Terrorism', 'Nuclear'],
          }
        ];
      }
    } catch (err) {
      console.error('Gemini AI State Pricing failed:', err);
    }
    // Fallback if AI fails (e.g. quota)
    return getPackages(350, 5000);
  }, []);

  const value = {
    data,
    toasts,
    addToast,
    currentUser,
    setCurrentUser,
    isAdmin,
    setIsAdmin,
    isLoggedIn,
    login,
    logout,
    validateLogin,
    weatherData,
    weatherLoading,
    currentLocation,
    locationLoading,
    detectLocation,
    setCurrentLocation,
    fetchWeatherForCity,
    registerWorker,
    createPolicy,
    processClaim,
    triggerDisruption,
    calculatePremium,
    generateRiskAssessment,
    getAiRiskAnalysis,
    getAiStatePricing,
    updatePolicy,
    getPackages,
    PLAN_FEATURES,
    getStatePlanDiscovery,
    CITIES,
    PLATFORMS,
    DISRUPTION_TYPES,
    getBackendRisk,
    verifyClaimWithBackend
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
