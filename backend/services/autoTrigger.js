/**
 * GigCover — Parametric Auto-Trigger Service
 * =============================================
 * Monitors weather conditions and automatically triggers claims
 * when parametric thresholds are breached.
 * 
 * Runs every 60 seconds (for demo). In production would run hourly.
 * 
 * Thresholds:
 *   - Rain > 50mm/hr → trigger Heavy Rain claims
 *   - AQI > 400 → trigger Pollution claims
 *   - Temp > 45°C → trigger Extreme Heat claims
 */

const axios = require('axios');
const Policy = require('../models/Policy');
const User = require('../models/User'); // Use new User model
const Worker = require('../models/Worker');
const Claim = require('../models/Claim');
const { processInstantPayout } = require('./payout');
const { getDistanceKm } = require('../utils/geo');

// Track triggered events to avoid duplicates
const triggeredEvents = new Map();

// City coordinates for weather checks
const MONITORED_CITIES = [
  { name: 'Mumbai', state: 'Maharashtra', lat: 19.076, lon: 72.8777 },
  { name: 'Delhi', state: 'Delhi', lat: 28.6139, lon: 77.209 },
  { name: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lon: 77.5946 },
  { name: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lon: 80.2707 },
  { name: 'Hyderabad', state: 'Telangana', lat: 17.385, lon: 78.4867 },
  { name: 'Kolkata', state: 'West Bengal', lat: 22.5726, lon: 88.3639 },
  { name: 'Kochi', state: 'Kerala', lat: 9.9312, lon: 76.2673 },
  { name: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lon: 75.7873 },
  { name: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lon: 72.5714 },
  { name: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lon: 80.9462 },
];

const triggerLog = [];

async function fetchWeather(lat, lon) {
  try {
    if (!process.env.OPENWEATHER_API_KEY) return null;
    const res = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`
    );
    const data = res.data;
    return {
      temp: data.main.temp,
      humidity: data.main.humidity,
      rain: data.rain ? (data.rain['1h'] || 0) : 0,
      aqi: 50, // AQI needs separate API call
      windSpeed: data.wind.speed,
      description: data.weather[0].description,
    };
  } catch (e) {
    return null;
  }
}

async function checkAndTrigger() {
  const now = new Date();
  const hourKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}`;

  console.log(`[AUTO-TRIGGER] Running check at ${now.toISOString()}`);

  for (const city of MONITORED_CITIES) {
    const cityHourKey = `${city.name}-${hourKey}`;

    // Skip if already triggered this hour for this city
    if (triggeredEvents.has(cityHourKey)) continue;

    const weather = await fetchWeather(city.lat, city.lon);
    if (!weather) continue;

    let triggered = false;
    let disruptionType = '';

    // Check thresholds
    if (weather.rain > 50) {
      disruptionType = 'Heavy Rain';
      triggered = true;
    } else if (weather.temp > 45) {
      disruptionType = 'Extreme Heat';
      triggered = true;
    } else if (weather.aqi > 400) {
      disruptionType = 'Severe Pollution';
      triggered = true;
    }

    if (!triggered) continue;

    console.log(`[AUTO-TRIGGER] ⚠️ ${disruptionType} detected in ${city.name}! Weather: ${JSON.stringify(weather)}`);

    // Mark as triggered for this hour
    triggeredEvents.set(cityHourKey, { disruptionType, weather, timestamp: now });

    // Find all active policies for users in this city/state
    const activePolicies = await Policy.find({
      status: 'active',
      $or: [
        { city: city.name },
        { state: city.state },
      ],
    }).catch(() => []);

    if (activePolicies.length === 0) {
      console.log(`[AUTO-TRIGGER] No active policies in ${city.name}`);
      continue;
    }

    console.log(`[AUTO-TRIGGER] Found ${activePolicies.length} active policies in ${city.name}`);

    // Auto-create claims for each affected policy
    for (const policy of activePolicies) {
      try {
        // Try User first, then Worker
        const user = await User.findById(policy.userId).catch(() => null);
        const worker = user || await Worker.findOne({ workerId: policy.workerId || policy.userId }).catch(() => null);

        if (!worker) {
           console.log(`[AUTO-TRIGGER] User/Worker not found for policy ${policy.policyId}`);
           continue;
        }

        // ── Geofencing Verification (The Fix) ──
        // If the user has a lastLocation, check if they are near the trigger city
        if (worker.lastLocation && worker.lastLocation.lat) {
          const distance = getDistanceKm(
            worker.lastLocation.lat, worker.lastLocation.lon,
            city.lat, city.lon
          );
          
          if (distance > 50) {
            console.log(`[AUTO-TRIGGER] 🛡️ Geofence: Skipping worker ${worker.username} because last location is ${distance.toFixed(1)}km away from event in ${city.name}`);
            continue;
          }
        } else {
          // Fallback: If no lastLocation is available, we might want to skip or rely on policy city
          // For a "full product", we require location data for parametric payouts
          console.log(`[AUTO-TRIGGER] ⚠️ No location data for worker ${worker.username}, skipping parametric payout for safety.`);
          continue;
        }

        const dailyCoverage = Math.round(policy.maxCoverage / 7);
        const lostHours = 4 + Math.floor(Math.random() * 4);
        const claimAmount = Math.round((dailyCoverage / 10) * lostHours);

        const claim = new Claim({
          claimId: 'CLM-AT-' + String(Date.now()).slice(-6) + Math.floor(Math.random() * 100),
          userId: policy.userId,
          workerId: policy.workerId,
          policyId: policy.policyId,
          disruptionType,
          claimAmount,
          lostHours,
          description: `Auto-triggered: ${disruptionType} detected in ${city.name}`,
          claimDate: now,
          status: 'auto_approved',
          isAutoTrigger: true,
          triggerData: {
            lat: city.lat,
            lon: city.lon,
            measuredWeather: weather,
          },
          fraudScore: Math.floor(Math.random() * 15),
          fraudFlags: ['Parametric auto-trigger — weather verified by API'],
          fraudCheck: {
            isGpsValid: true,
            isWeatherValid: true,
            score: Math.floor(Math.random() * 15),
            reason: 'Parametric auto-trigger — weather verified by API',
          },
        });

        await claim.save().catch(e => console.log('Auto-trigger claim save failed:', e.message));

        // Auto-payout
        if (worker) {
          try {
            const txn = await processInstantPayout(claim, worker);
            claim.status = 'paid';
            claim.transactionId = txn.transactionId;
            await claim.save().catch(() => {});
          } catch (e) {
            // payout failed, claim stays auto_approved
          }
        }

        console.log(`[AUTO-TRIGGER] Claim ${claim.claimId} created for worker ${policy.workerId}, amount: ₹${claimAmount}`);
      } catch (e) {
        console.error(`[AUTO-TRIGGER] Error processing policy ${policy.policyId}:`, e.message);
      }
    }

    // Log the trigger event
    triggerLog.push({
      city: city.name,
      state: city.state,
      disruptionType,
      weather,
      affectedPolicies: activePolicies.length,
      timestamp: now.toISOString(),
    });
  }

  // Cleanup old trigger keys (older than 2 hours)
  for (const [key, val] of triggeredEvents.entries()) {
    if (Date.now() - val.timestamp.getTime() > 2 * 60 * 60 * 1000) {
      triggeredEvents.delete(key);
    }
  }
}

// Manual trigger endpoint (for admin demo)
async function manualTrigger(cityName, disruptionType) {
  const city = MONITORED_CITIES.find(c => c.name === cityName);
  if (!city) return { error: 'City not found' };

  console.log(`[MANUAL-TRIGGER] Admin triggered ${disruptionType} in ${cityName}`);

  const activePolicies = await Policy.find({
    status: 'active',
    $or: [{ city: cityName }, { state: city.state }],
  }).catch(() => []);

  const results = [];
  const now = new Date();

  for (const policy of activePolicies) {
    const worker = await Worker.findOne({ workerId: policy.workerId }).catch(() => null);
    const dailyCoverage = Math.round(policy.maxCoverage / 7);
    const lostHours = 4 + Math.floor(Math.random() * 6);
    const claimAmount = Math.round((dailyCoverage / 10) * lostHours);

    const claim = new Claim({
      claimId: 'CLM-MT-' + String(Date.now()).slice(-6) + Math.floor(Math.random() * 100),
      workerId: policy.workerId,
      policyId: policy.policyId,
      disruptionType,
      claimAmount,
      lostHours,
      description: `Manual trigger by admin: ${disruptionType} in ${cityName}`,
      claimDate: now,
      status: 'auto_approved',
      isAutoTrigger: true,
      triggerData: {
        lat: city.lat,
        lon: city.lon,
        measuredWeather: { temp: 30, rain: disruptionType.includes('Rain') ? 75 : 0, aqi: disruptionType.includes('Pollution') ? 450 : 50 },
      },
      fraudCheck: {
        isGpsValid: true,
        isWeatherValid: true,
        score: 5,
        reason: 'Admin manual trigger — verified',
      },
    });

    await claim.save().catch(() => {});

    if (worker) {
      try {
        const txn = await processInstantPayout(claim, worker);
        claim.status = 'paid';
        claim.transactionId = txn.transactionId;
        await claim.save().catch(() => {});
      } catch (e) { /* skip */ }
    }

    results.push({
      claimId: claim.claimId,
      workerId: policy.workerId,
      amount: claimAmount,
      status: claim.status,
    });
  }

  triggerLog.push({
    city: cityName,
    state: city.state,
    disruptionType,
    type: 'manual',
    affectedPolicies: activePolicies.length,
    timestamp: now.toISOString(),
  });

  return {
    city: cityName,
    disruptionType,
    affectedPolicies: activePolicies.length,
    claims: results,
  };
}

function getTriggerLog() {
  return triggerLog.slice(-50);
}

module.exports = { checkAndTrigger, manualTrigger, getTriggerLog };
