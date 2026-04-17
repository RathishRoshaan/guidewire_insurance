/**
 * GigCover — AI/ML Parametric Risk Engine
 * ==========================================
 * Calculates risk scores, risk levels, risk factors, and generates
 * 3 dynamically-priced insurance packages based on:
 *   - State/city geography & seasonal risk
 *   - Worker's weekly income & gig platform
 *   - Real-time weather data (rain, AQI, temp, humidity)
 */

// ── State-specific risk profiles ──
const STATE_RISK_PROFILES = {
  'Kerala':        { flood: 0.9, rain: 0.85, heat: 0.3, aqi: 0.15, cyclone: 0.5, label: 'Flood & Monsoon Zone' },
  'Maharashtra':   { flood: 0.6, rain: 0.7,  heat: 0.4, aqi: 0.4,  cyclone: 0.3, label: 'Monsoon & Urban Congestion' },
  'Delhi':         { flood: 0.2, rain: 0.3,  heat: 0.6, aqi: 0.95, cyclone: 0.05, label: 'Severe Air Pollution Zone' },
  'Rajasthan':     { flood: 0.1, rain: 0.15, heat: 0.95, aqi: 0.5, cyclone: 0.05, label: 'Extreme Heat Zone' },
  'Tamil Nadu':    { flood: 0.5, rain: 0.6,  heat: 0.5, aqi: 0.3,  cyclone: 0.7, label: 'Cyclone-Prone Coast' },
  'West Bengal':   { flood: 0.7, rain: 0.75, heat: 0.35, aqi: 0.4, cyclone: 0.65, label: 'Cyclone & Flood Zone' },
  'Karnataka':     { flood: 0.35, rain: 0.5, heat: 0.3, aqi: 0.25, cyclone: 0.15, label: 'Moderate Risk Zone' },
  'Telangana':     { flood: 0.4, rain: 0.5,  heat: 0.55, aqi: 0.35, cyclone: 0.2, label: 'Heat & Rain Mixed Zone' },
  'Gujarat':       { flood: 0.4, rain: 0.45, heat: 0.7, aqi: 0.4,  cyclone: 0.45, label: 'Heat & Cyclone Zone' },
  'Uttar Pradesh': { flood: 0.3, rain: 0.4,  heat: 0.6, aqi: 0.8,  cyclone: 0.05, label: 'Pollution & Heat Zone' },
};

// ── Platform reliability factor ──
const PLATFORM_RISK = {
  'Swiggy': 0.10, 'Zomato': 0.12, 'Dunzo': 0.18, 'Blinkit': 0.15,
  'Amazon Flex': 0.08, 'Flipkart': 0.09, 'Zepto': 0.20, 'Porter': 0.14,
};

// ── Seasonal multiplier (month-based) ──
function getSeasonalMultiplier(state) {
  const month = new Date().getMonth(); // 0-11
  // Monsoon: June(5)–Sept(8)
  if (month >= 5 && month <= 8) {
    if (['Kerala', 'Maharashtra', 'West Bengal', 'Karnataka'].includes(state)) return 1.35;
    return 1.15;
  }
  // Winter fog/AQI: Nov(10)–Jan(0)
  if (month >= 10 || month <= 0) {
    if (['Delhi', 'Uttar Pradesh'].includes(state)) return 1.30;
    return 1.05;
  }
  // Summer heat: March(2)–May(4)
  if (month >= 2 && month <= 4) {
    if (['Rajasthan', 'Delhi', 'Gujarat', 'Telangana'].includes(state)) return 1.25;
    return 1.05;
  }
  return 1.0;
}

/**
 * Calculate the composite risk score (0–100)
 */
function calculateRiskScore({ state, city, weeklyIncome, platform, weatherData }) {
  const stateProfile = STATE_RISK_PROFILES[state] || {
    flood: 0.3, rain: 0.3, heat: 0.3, aqi: 0.3, cyclone: 0.2, label: 'General Zone'
  };

  // ── Weather-based risk components ──
  const rain = weatherData?.rain || 0;
  const aqi  = weatherData?.aqi  || 50;
  const temp = weatherData?.temp || 30;
  const humidity = weatherData?.humidity || 60;

  // Normalize each parameter to 0–1 scale
  const rainNorm = Math.min(rain / 100, 1);         // 100mm = max danger
  const aqiNorm  = Math.min(aqi / 500, 1);           // 500 AQI = max danger
  const tempNorm = Math.min(Math.max(temp - 30, 0) / 20, 1); // 50°C = max danger
  const humidityNorm = Math.min(humidity / 100, 1);

  // ── Weighted risk calculation ──
  const weatherRisk = (
    rainNorm     * 0.30 * stateProfile.rain +
    aqiNorm      * 0.25 * stateProfile.aqi +
    tempNorm     * 0.25 * stateProfile.heat +
    humidityNorm * 0.10 +
    stateProfile.flood   * 0.05 +
    stateProfile.cyclone * 0.05
  );

  // Platform risk component
  const platformRiskVal = PLATFORM_RISK[platform] || 0.12;

  // Seasonal multiplier
  const seasonalMult = getSeasonalMultiplier(state);

  // Income exposure factor (higher income = more to protect = slightly higher risk weighting)
  const incomeExposure = Math.min(weeklyIncome / 15000, 1) * 0.15;

  // Composite score (0–1)
  const rawScore = (weatherRisk * 0.55 + platformRiskVal * 0.15 + incomeExposure * 0.10 + (seasonalMult - 1) * 0.20);

  // Scale to 0–100 with realistic floor/ceiling
  const riskScore = Math.round(Math.min(100, Math.max(5, rawScore * 130 + 15)));

  // ── Determine risk level ──
  let riskLevel;
  if (riskScore <= 35) riskLevel = 'Low';
  else if (riskScore <= 65) riskLevel = 'Medium';
  else riskLevel = 'High';

  // ── Identify risk factors ──
  const riskFactors = [];
  if (rainNorm > 0.4)  riskFactors.push({ factor: 'Heavy Rainfall', severity: 'high', detail: `${rain}mm/hr detected` });
  if (aqiNorm > 0.6)   riskFactors.push({ factor: 'Severe Air Pollution', severity: 'high', detail: `AQI ${aqi}` });
  if (tempNorm > 0.5)  riskFactors.push({ factor: 'Extreme Heat', severity: 'high', detail: `${temp}°C` });
  if (stateProfile.flood > 0.6)   riskFactors.push({ factor: 'Flood-Prone Region', severity: 'medium', detail: stateProfile.label });
  if (stateProfile.cyclone > 0.5) riskFactors.push({ factor: 'Cyclone Risk', severity: 'medium', detail: stateProfile.label });
  if (seasonalMult > 1.2) riskFactors.push({ factor: 'High-Risk Season', severity: 'medium', detail: `Seasonal multiplier: ${seasonalMult}x` });
  if (platformRiskVal > 0.15) riskFactors.push({ factor: 'Platform Reliability', severity: 'low', detail: `${platform} outage risk elevated` });
  if (riskFactors.length === 0) riskFactors.push({ factor: 'Stable Conditions', severity: 'low', detail: 'No major risks detected' });

  return { riskScore, riskLevel, riskFactors, stateProfile, seasonalMult };
}

const packageCache = {};

/**
 * Generate 3 dynamically-priced insurance packages
 */
async function generatePackages({ state, weeklyIncome, riskScore, riskLevel }) {
  const income = weeklyIncome || 7000;
  const cacheKey = `${state}_${income}_${riskScore}`;
  
  // Return cached generated packages if already processed within server session
  if (packageCache[cacheKey]) {
    return packageCache[cacheKey];
  }

  try {
    const axios = require('axios');
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (GEMINI_API_KEY) {
      const prompt = `You are the GigCover ML Risk Pricing Engine.
Input parameters:
- State: "${state}"
- Weekly Income: ${income}
- Risk Score: ${riskScore}/100
- Risk Level: "${riskLevel}"

Based strictly on this data, return EXACTLY a JSON array of 3 insurance packages. Do not output anything else (no markdown text, no backticks).
Format:
[
  {
    "id": "basic",
    "name": "Essential Guard",
    "premium": <compute: income * 0.025 * risk_multiplier>,
    "coverage": <compute: income * 0.5>,
    "dailyCoverage": <coverage / 7>,
    "riskLevel": "${riskLevel}",
    "triggers": { "rain": "Rain > 50mm", "aqi": "AQI > 400", "temp": "Temp > 45C" },
    "inclusions": ["Heavy Rain: 12%", "AQI: 10%"],
    "exclusions": ["Flooding"]
  },
  { "id": "standard", "name": "Smart Partner", ... },
  { "id": "premium", "name": "Total Resilience", ... }
]`;

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        { contents: [{ role: 'user', parts: [{ text: prompt }] }] },
        { headers: { 'Content-Type': 'application/json' } }
      );

      let text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      const generated = JSON.parse(text);
      if (Array.isArray(generated) && generated.length === 3) {
        packageCache[cacheKey] = generated;
        return generated;
      }
    }
  } catch (err) {
    if (err.response?.status === 429) {
      console.warn(`[Gemini API] Rate limit reached (429). Silently falling back to robust mathematical ML logic.`);
    } else {
      console.error('Gemini dynamic pricing error, falling back to ML logic:', err.message);
    }
  }

  // Base premium percentages (Fallback Statistical Model)
  const basePcts = { basic: 0.025, standard: 0.04, premium: 0.06 };

  // Risk adjustment multiplier
  let riskAdj = 1.0;
  if (riskLevel === 'High') riskAdj = 1.30;
  else if (riskLevel === 'Low') riskAdj = 0.80;

  // Seasonal adjustment
  const seasonalMult = getSeasonalMultiplier(state);

  // State-specific trigger thresholds
  const stateProfile = STATE_RISK_PROFILES[state] || STATE_RISK_PROFILES['Maharashtra'];
  const rainThreshold = stateProfile.rain > 0.6 ? 40 : 50;
  const aqiThreshold  = stateProfile.aqi > 0.6 ? 300 : 400;
  const tempThreshold = stateProfile.heat > 0.6 ? 42 : 45;

  const packages = [
    {
      id: 'basic',
      name: 'Essential Guard',
      premium: Math.round(income * basePcts.basic * riskAdj * seasonalMult),
      coverage: Math.round(income * 0.5),
      dailyCoverage: Math.round((income * 0.5) / 7),
      riskLevel,
      triggers: {
        rain: `Rain > ${rainThreshold}mm/hr`,
        aqi: `AQI > ${aqiThreshold}`,
        temp: `Temp > ${tempThreshold}°C`,
      },
      inclusions: [
        `Heavy Rain (>${rainThreshold}mm): ₹${Math.round(income * 0.12)}`,
        `Extreme Heat (>${tempThreshold}°C): ₹${Math.round(income * 0.08)}`,
        `AQI >${aqiThreshold}: ₹${Math.round(income * 0.10)}`,
        '48hr Claim Support',
      ],
      exclusions: ['Flooding', 'Platform Outage', 'Cyclones', 'Accidents', 'Vehicle Damage'],
    },
    {
      id: 'standard',
      name: 'Smart Partner',
      premium: Math.round(income * basePcts.standard * riskAdj * seasonalMult),
      coverage: Math.round(income * 0.75),
      dailyCoverage: Math.round((income * 0.75) / 7),
      riskLevel,
      recommended: true,
      triggers: {
        rain: `Rain > ${rainThreshold - 5}mm/hr`,
        aqi: `AQI > ${aqiThreshold - 50}`,
        temp: `Temp > ${tempThreshold - 2}°C`,
      },
      inclusions: [
        'Everything in Essential Guard',
        `Flooding (>30cm): ₹${Math.round(income * 0.20)}`,
        `Platform Outage (>2hr): ₹${Math.round(income * 0.10)}`,
        '12hr Priority Support',
      ],
      exclusions: ['Cyclones', 'Theft', 'Vehicle Damage', 'Terrorism'],
    },
    {
      id: 'premium',
      name: 'Total Resilience',
      premium: Math.round(income * basePcts.premium * riskAdj * seasonalMult),
      coverage: Math.round(income * 1.0),
      dailyCoverage: Math.round(income / 7),
      riskLevel,
      triggers: {
        rain: `Rain > ${rainThreshold - 10}mm/hr`,
        aqi: `AQI > ${aqiThreshold - 100}`,
        temp: `Temp > ${tempThreshold - 3}°C`,
      },
      inclusions: [
        'Everything in Smart Partner',
        `Cyclone (>90km/h): ₹${Math.round(income * 0.35)}`,
        `Curfew/Bandh: ₹${Math.round(income * 0.15)}`,
        'Instant UPI Payout',
        '2hr Emergency Support',
      ],
      exclusions: ['War', 'Pandemics', 'Terrorism', 'Nuclear Events'],
    },
  ];

  packageCache[cacheKey] = packages;
  return packages;
}

/**
 * Legacy simple risk score for backward compatibility
 */
function calculateSimpleRiskScore(rain, aqi, temp) {
  return (0.4 * rain) + (0.3 * aqi) + (0.3 * temp);
}

module.exports = {
  calculateRiskScore,
  generatePackages,
  calculateSimpleRiskScore,
  STATE_RISK_PROFILES,
};
