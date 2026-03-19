import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { initializeMockData, calculatePremium, generateWeatherData, generateRiskAssessment, CITIES, PLATFORMS, DISRUPTION_TYPES } from '../data/mockData';

const AppContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};

export const AppProvider = ({ children }) => {
  const [data, setData] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [weatherData, setWeatherData] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);

  useEffect(() => {
    const mockData = initializeMockData();
    setData(mockData);
    setWeatherData(generateWeatherData());
    
    // Check for saved session
    try {
      const savedUser = localStorage.getItem('gigshield_user');
      const savedAdmin = localStorage.getItem('gigshield_isAdmin');
      
      if (savedUser === 'true' && savedAdmin === 'true') {
        setCurrentUser({ firstName: 'Admin', lastName: 'User', email: 'admin@gigshield.com' });
        setIsLoggedIn(true);
        setIsAdmin(true);
      } else if (savedUser && savedUser !== 'null') {
        setCurrentUser(JSON.parse(savedUser));
        setIsLoggedIn(true);
        setIsAdmin(savedAdmin === 'true');
      }
    } catch (e) {
      console.error('Session restoration failed:', e);
      localStorage.removeItem('gigshield_user');
      localStorage.removeItem('gigshield_isAdmin');
    }
  }, []);

  // Toast notifications
  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const login = useCallback((role, userData = null) => {
    if (role === 'admin') {
      const adminObj = { firstName: 'Admin', lastName: 'User', email: 'admin@gigshield.com' };
      setIsAdmin(true);
      setIsLoggedIn(true);
      setCurrentUser(adminObj);
      localStorage.setItem('gigshield_isAdmin', 'true');
      localStorage.setItem('gigshield_user', 'true'); // marker for easier session restoration
      addToast('Welcome back, Admin!', 'success');
    } else if (userData) {
      setCurrentUser(userData);
      setIsAdmin(false);
      setIsLoggedIn(true);
      localStorage.setItem('gigshield_isAdmin', 'false');
      localStorage.setItem('gigshield_user', JSON.stringify(userData));
      addToast(`Welcome back, ${userData.firstName}!`, 'success');
    }
  }, [addToast]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    setIsAdmin(false);
    setIsLoggedIn(false);
    localStorage.removeItem('gigshield_user');
    localStorage.removeItem('gigshield_isAdmin');
    addToast('Logged out successfully', 'info');
  }, [addToast]);

  const detectLocation = useCallback(() => {
    if (!currentUser || !currentUser.city) return;
    addToast(`AI is analyzing your surroundings in ${currentUser.city.name}...`, 'info');
    setTimeout(() => {
      setCurrentLocation(currentUser.city);
      addToast(`Location Verified: ${currentUser.city.name}, ${currentUser.city.state}`, 'success');
    }, 1500);
  }, [currentUser, addToast]);

  // Register new worker
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
      workers: [...prev.workers, newWorker],
    }));
    addToast(`Worker ${newWorker.firstName} ${newWorker.lastName} registered successfully!`, 'success');
    return newWorker;
  }, [data, addToast]);

  // Create policy
  const createPolicy = useCallback((policyData) => {
    const newPolicy = {
      ...policyData,
      id: `POL-${String((data?.policies?.length || 0) + 1).padStart(5, '0')}`,
      status: 'active',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    };
    setData(prev => ({
      ...prev,
      policies: [...prev.policies, newPolicy],
    }));
    addToast(`Policy ${newPolicy.id} created successfully!`, 'success');
    return newPolicy;
  }, [data, addToast]);

  // Process claim
  const processClaim = useCallback((claimId, action) => {
    setData(prev => ({
      ...prev,
      claims: prev.claims.map(c =>
        c.id === claimId
          ? { ...c, status: action === 'approve' ? 'paid' : action === 'reject' ? 'rejected' : c.status, payoutDate: action === 'approve' ? new Date().toISOString().split('T')[0] : c.payoutDate }
          : c
      ),
    }));
    addToast(`Claim ${claimId} ${action === 'approve' ? 'approved & paid' : 'rejected'}`, action === 'approve' ? 'success' : 'warning');
  }, [addToast]);

  // Simulate disruption trigger
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

    addToast(`⚠️ ${disruption.icon} ${disruption.name} triggered in ${city.name}! ${affectedPolicies.length} claims auto-generated.`, 'warning', 6000);
    return { newClaims, newAlert };
  }, [data, addToast]);

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
    weatherData,
    currentLocation,
    detectLocation,
    setCurrentLocation,
    registerWorker,
    createPolicy,
    processClaim,
    triggerDisruption,
    calculatePremium,
    generateRiskAssessment,
    CITIES,
    PLATFORMS,
    DISRUPTION_TYPES,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
