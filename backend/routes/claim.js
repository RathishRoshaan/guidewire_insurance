/**
 * Claim Routes — Create, List, Process claims with fraud detection
 */
const express = require('express');
const router = express.Router();
const axios = require('axios');
const Worker = require('../models/Worker');
const Policy = require('../models/Policy');
const Claim = require('../models/Claim');
const { analyzeFraud } = require('../ml/fraud_engine');
const { processInstantPayout } = require('../services/payout');

// POST / — Create a new claim (parametric auto-trigger or manual)
router.post('/', async (req, res) => {
  try {
    const { workerId, policyId, disruptionType, lat, lon, lostHours, description, isAutoTrigger } = req.body;

    if (!workerId || !policyId || !disruptionType) {
      return res.status(400).json({ error: 'Missing required: workerId, policyId, disruptionType' });
    }

    // Fetch worker and policy
    const worker = await Worker.findOne({ workerId }).catch(() => null);
    const policy = await Policy.findOne({ policyId }).catch(() => null);

    if (!worker || !policy) {
      return res.status(404).json({ error: 'Worker or Policy not found' });
    }

    // Fetch actual weather for fraud verification
    let actualWeather = { temp: 30, rain: 0, aqi: 50 };
    const claimLat = lat || worker.operationZone.lat;
    const claimLon = lon || worker.operationZone.lon;

    try {
      if (process.env.OPENWEATHER_API_KEY) {
        const weatherRes = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?lat=${claimLat}&lon=${claimLon}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`
        );
        actualWeather.temp = weatherRes.data.main.temp;
        if (weatherRes.data.rain && weatherRes.data.rain['1h']) {
          actualWeather.rain = weatherRes.data.rain['1h'];
        }
      }
    } catch (e) {
      console.log('Weather verification skipped:', e.message);
    }

    // Calculate claim amount
    const dailyCoverage = Math.round(policy.maxCoverage / 7);
    const hours = lostHours || (4 + Math.floor(Math.random() * 6));
    const hourlyRate = dailyCoverage / 10; // ~10 working hours/day
    const claimAmount = Math.round(hourlyRate * hours);

    // Run fraud detection
    const fraudResult = await analyzeFraud({
      workerId,
      disruptionType,
      claimAmount,
      dailyCoverage,
      location: { lat: claimLat, lon: claimLon },
      operationZone: worker.operationZone,
      actualWeather,
    });

    // Override: auto-trigger claims with low fraud score get auto-approved
    let finalStatus = fraudResult.status;
    if (isAutoTrigger && fraudResult.fraudScore < 35) {
      finalStatus = 'auto_approved';
    }

    // Save claim
    const newClaim = new Claim({
      claimId: 'CLM-' + String(Date.now()).slice(-6),
      workerId,
      policyId,
      disruptionType,
      claimAmount,
      lostHours: hours,
      description: description || `${disruptionType} disruption detected`,
      claimDate: new Date(),
      status: finalStatus,
      isAutoTrigger: !!isAutoTrigger,
      triggerData: {
        lat: claimLat,
        lon: claimLon,
        measuredWeather: {
          temp: actualWeather.temp,
          rain: actualWeather.rain,
          aqi: actualWeather.aqi,
          description: disruptionType,
        },
      },
      fraudCheck: {
        isGpsValid: fraudResult.checks.locationVerified,
        isWeatherValid: fraudResult.checks.weatherVerified,
        score: fraudResult.fraudScore,
        reason: fraudResult.reasons.join(' | '),
      },
    });

    await newClaim.save().catch(e => console.log('Claim DB save:', e.message));

    // Auto-payout if approved
    let transaction = null;
    if (finalStatus === 'auto_approved') {
      try {
        transaction = await processInstantPayout(newClaim, worker);
        newClaim.status = 'paid';
        newClaim.transactionId = transaction.transactionId;
        await newClaim.save().catch(() => {});
      } catch (e) {
        console.log('Payout processing skipped:', e.message);
      }
    }

    res.json({
      claimId: newClaim.claimId,
      status: newClaim.status,
      claimAmount,
      disruptionType,
      lostHours: hours,
      fraudScore: fraudResult.fraudScore,
      fraudStatus: fraudResult.status,
      fraudReasons: fraudResult.reasons,
      fraudChecks: fraudResult.checks,
      transaction: transaction ? transaction.transactionId : null,
      isAutoTrigger: !!isAutoTrigger,
    });
  } catch (err) {
    console.error('Create claim error:', err);
    res.status(500).json({ error: 'Failed to create claim' });
  }
});

// GET /list/:workerId — Get claims for a worker
router.get('/list/:workerId', async (req, res) => {
  try {
    const claims = await Claim.find({ workerId: req.params.workerId }).sort({ claimDate: -1 }).limit(50);
    res.json(claims);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch claims' });
  }
});

// GET /all — Get all claims (admin)
router.get('/all', async (req, res) => {
  try {
    const claims = await Claim.find().sort({ claimDate: -1 }).limit(200);
    res.json(claims);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch claims' });
  }
});

// PATCH /:claimId/process — Admin approve or reject a claim
router.patch('/:claimId/process', async (req, res) => {
  try {
    const { action } = req.body; // 'approve' or 'reject'
    const claim = await Claim.findOne({ claimId: req.params.claimId });

    if (!claim) return res.status(404).json({ error: 'Claim not found' });

    if (action === 'approve') {
      const worker = await Worker.findOne({ workerId: claim.workerId }).catch(() => null);
      if (worker) {
        try {
          const txn = await processInstantPayout(claim, worker);
          claim.status = 'paid';
          claim.transactionId = txn.transactionId;
        } catch (e) {
          claim.status = 'paid';
        }
      } else {
        claim.status = 'paid';
      }
    } else if (action === 'reject') {
      claim.status = 'rejected';
    }

    await claim.save();
    res.json({ claimId: claim.claimId, status: claim.status });
  } catch (err) {
    console.error('Process claim error:', err);
    res.status(500).json({ error: 'Failed to process claim' });
  }
});

module.exports = router;
