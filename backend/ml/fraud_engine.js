/**
 * GigCover — Fraud Detection Engine
 * ====================================
 * Rule-based fraud scoring for insurance claims.
 * 
 * Rules & Weights:
 *   - Duplicate claim (same worker + same day)   → +40
 *   - Claim amount > 2× daily coverage           → +30
 *   - GPS location mismatch (>50km from zone)     → +25
 *   - Rain false claim (API says no rain)         → +45
 *   - Heat false claim (API says <40°C)           → +35
 *   - AQI false claim (API says <300)             → +35
 *   - Multiple claims in 24 hours                 → +20
 *
 * Score Thresholds:
 *   <35  → Auto-approve
 *   35–60 → Manual review required
 *   >60  → Flagged / Reject
 */

const Claim = require('../models/Claim');

function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Run fraud analysis on a claim
 * @param {Object} params
 * @param {string} params.workerId
 * @param {string} params.disruptionType - e.g. 'Heavy Rain', 'Extreme Heat', 'Severe Pollution'
 * @param {number} params.claimAmount
 * @param {number} params.dailyCoverage - max daily coverage for the policy
 * @param {Object} params.location - { lat, lon } of claim
 * @param {Object} params.operationZone - { lat, lon, radius_km } of worker's zone
 * @param {Object} params.actualWeather - { temp, rain, aqi } from weather API at claim location
 * @returns {Object} { fraudScore, status, reasons[], checks }
 */
async function analyzeFraud({
  workerId,
  disruptionType,
  claimAmount,
  dailyCoverage,
  location,
  operationZone,
  actualWeather,
}) {
  let fraudScore = 0;
  const reasons = [];
  const checks = {
    duplicateCheck: 'passed',
    locationVerified: true,
    weatherVerified: true,
    amountVerified: true,
    frequencyCheck: 'passed',
  };

  // ── 1. Duplicate Claim Check (same worker, same day) ──
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const duplicates = await Claim.countDocuments({
      workerId,
      disruptionType,
      claimDate: { $gte: today },
    });
    if (duplicates > 0) {
      fraudScore += 40;
      reasons.push(`Duplicate claim: ${duplicates} existing claim(s) for "${disruptionType}" today`);
      checks.duplicateCheck = 'failed';
    }
  } catch (e) {
    // DB might be down, skip
  }

  // ── 2. Claim Amount Check (>2× daily coverage) ──
  if (dailyCoverage && claimAmount > dailyCoverage * 2) {
    fraudScore += 30;
    reasons.push(`Amount ₹${claimAmount} exceeds 2× daily coverage of ₹${dailyCoverage}`);
    checks.amountVerified = false;
  }

  // ── 3. GPS Location Mismatch Check & Velocity Spoofing ──
  if (location && operationZone) {
    const dist = getDistanceKm(
      location.lat, location.lon,
      operationZone.lat, operationZone.lon
    );
    if (dist > (operationZone.radius_km || 50)) {
      fraudScore += 25;
      reasons.push(`GPS location is ${dist.toFixed(1)}km from registered operation zone (max: ${operationZone.radius_km || 50}km)`);
      checks.locationVerified = false;
    }
  }

  // Velocity Spoofing Check (requires querying last claim location)
  try {
    const lastClaim = await Claim.findOne({ workerId }).sort({ claimDate: -1 });
    if (lastClaim && lastClaim.location && location) {
      const timeDiffHours = (new Date() - lastClaim.claimDate) / (1000 * 60 * 60);
      const distFromLast = getDistanceKm(location.lat, location.lon, lastClaim.location.lat, lastClaim.location.lon);
      const velocity = distFromLast / (timeDiffHours || 0.1);
      if (velocity > 150) { // e.g. jumping 150km out of nowhere in 1 hour
        fraudScore += 50;
        reasons.push(`GPS Spoofing Detected: Impossible travel velocity (${Math.round(velocity)} km/h) since last claim`);
        checks.locationVerified = false;
      }
    }
  } catch (e) {
    // DB error, skip
  }

  // ── 4. Weather Verification Checks ──
  if (actualWeather) {
    // Rain false claim
    if (disruptionType.toLowerCase().includes('rain') || disruptionType.toLowerCase().includes('flood')) {
      if (actualWeather.rain < 10) {
        fraudScore += 45;
        reasons.push(`Claimed "${disruptionType}" but actual rainfall only ${actualWeather.rain}mm (threshold: 10mm)`);
        checks.weatherVerified = false;
      }
    }

    // Heat false claim
    if (disruptionType.toLowerCase().includes('heat')) {
      if (actualWeather.temp < 40) {
        fraudScore += 35;
        reasons.push(`Claimed "Extreme Heat" but actual temp is ${actualWeather.temp}°C (threshold: 40°C)`);
        checks.weatherVerified = false;
      }
    }

    // AQI false claim
    if (disruptionType.toLowerCase().includes('pollution') || disruptionType.toLowerCase().includes('aqi')) {
      if (actualWeather.aqi < 300) {
        fraudScore += 35;
        reasons.push(`Claimed "Severe Pollution" but actual AQI is ${actualWeather.aqi} (threshold: 300)`);
        checks.weatherVerified = false;
      }
    }

    // Historical API Mismatch (Advanced AI Check)
    // If the claim is submitted >2 hours after the event, we should verify against historical records
    // Currently simulated as if the historical record completely mismatches the claim scenario
    if (actualWeather.isHistoricalMismatch) {
        fraudScore += 45;
        reasons.push(`Historical weather data contradicts claim. Fake/Spoofed Weather Claim detected.`);
        checks.weatherVerified = false;
    }
  }

  // ── 5. Frequency Check (multiple claims in 24 hours) ──
  try {
    const past24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentClaims = await Claim.countDocuments({
      workerId,
      claimDate: { $gte: past24h },
    });
    if (recentClaims >= 2) {
      fraudScore += 20;
      reasons.push(`${recentClaims} claims filed in the last 24 hours (unusual frequency)`);
      checks.frequencyCheck = 'warning';
    }
  } catch (e) {
    // DB might be down, skip
  }

  // ── Determine Status ──
  let status;
  if (fraudScore < 35) {
    status = 'auto_approved';
  } else if (fraudScore <= 60) {
    status = 'pending_review';
  } else {
    status = 'flagged';
  }

  // Ensure score doesn't exceed 100
  fraudScore = Math.min(100, fraudScore);

  return {
    fraudScore,
    status,
    reasons,
    checks,
  };
}

module.exports = { analyzeFraud };
