/**
 * Risk Calculation Routes
 */
const express = require('express');
const router = express.Router();
const { calculateRiskScore, generatePackages, calculateSimpleRiskScore, STATE_RISK_PROFILES } = require('../ml/risk_model');

// POST / — Full risk calculation with dynamic packages
router.post('/', async (req, res) => {
  try {
    const { state, city, weeklyIncome, platform, weatherData, rain, aqi, temp } = req.body;

    // Support legacy simple mode
    if (rain !== undefined && aqi !== undefined && temp !== undefined && !state) {
      const risk_score = calculateSimpleRiskScore(Number(rain), Number(aqi), Number(temp));
      return res.json({ risk_score });
    }

    // Full ML risk calculation
    const riskResult = calculateRiskScore({
      state: state || 'Maharashtra',
      city: city || 'Mumbai',
      weeklyIncome: weeklyIncome || 7000,
      platform: platform || 'Swiggy',
      weatherData: weatherData || { rain: rain || 0, aqi: aqi || 50, temp: temp || 30, humidity: 60 },
    });

    const packages = await generatePackages({
      state: state || 'Maharashtra',
      weeklyIncome: weeklyIncome || 7000,
      riskScore: riskResult.riskScore,
      riskLevel: riskResult.riskLevel,
    });

    res.json({
      riskScore: riskResult.riskScore,
      riskLevel: riskResult.riskLevel,
      riskFactors: riskResult.riskFactors,
      seasonalMultiplier: riskResult.seasonalMult,
      stateProfile: riskResult.stateProfile,
      packages,
    });
  } catch (err) {
    console.error('Risk calculation error:', err);
    res.status(500).json({ error: 'Risk calculation failed' });
  }
});

// GET /state/:stateName — Get state-specific pricing for landing page
router.get('/state/:stateName', async (req, res) => {
  try {
    const stateName = req.params.stateName;
    const profile = STATE_RISK_PROFILES[stateName];

    if (!profile) {
      return res.status(404).json({ error: `No risk profile for state: ${stateName}` });
    }

    const income = parseInt(req.query.income) || 7000;
    const riskResult = calculateRiskScore({
      state: stateName,
      city: '',
      weeklyIncome: income,
      platform: 'Swiggy',
      weatherData: { rain: 0, aqi: 50, temp: 30, humidity: 60 },
    });

    const packages = await generatePackages({
      state: stateName,
      weeklyIncome: income,
      riskScore: riskResult.riskScore,
      riskLevel: riskResult.riskLevel,
    });

    res.json({
      state: stateName,
      stateLabel: profile.label,
      riskScore: riskResult.riskScore,
      riskLevel: riskResult.riskLevel,
      riskFactors: riskResult.riskFactors,
      packages,
    });
  } catch (err) {
    console.error('State pricing error:', err);
    res.status(500).json({ error: 'State pricing failed' });
  }
});

// GET /states — List all available states
router.get('/states', (req, res) => {
  const states = Object.entries(STATE_RISK_PROFILES).map(([name, profile]) => ({
    name,
    label: profile.label,
  }));
  res.json(states);
});

module.exports = router;
