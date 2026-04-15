/**
 * Policy Routes
 */
const express = require('express');
const router = express.Router();
const Policy = require('../models/Policy');
const Worker = require('../models/Worker');

// POST /api/policies — Create a new policy after payment
router.post('/', async (req, res) => {
  try {
    const { workerId, packageId, packageName, weeklyPremium, maxCoverage,
            coveredDisruptions, transactionId, city, state } = req.body;

    if (!workerId || !packageName || !weeklyPremium) {
      return res.status(400).json({ error: 'Missing required policy fields' });
    }

    const now = new Date();
    const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const policy = new Policy({
      policyId: 'POL-' + String(Date.now()).slice(-6),
      workerId,
      packageId: packageId || 'standard',
      packageName,
      weeklyPremium,
      maxCoverage: maxCoverage || weeklyPremium * 15,
      startDate: now,
      endDate,
      status: 'active',
      coveredDisruptions: coveredDisruptions || [],
      transactionId: transactionId || null,
      city: city || '',
      state: state || '',
    });

    await policy.save();

    res.status(201).json({
      message: 'Policy activated successfully',
      policy: {
        policyId: policy.policyId,
        packageName: policy.packageName,
        weeklyPremium: policy.weeklyPremium,
        maxCoverage: policy.maxCoverage,
        startDate: policy.startDate,
        endDate: policy.endDate,
        status: policy.status,
        daysLeft: 7,
      },
    });
  } catch (err) {
    console.error('Create policy error:', err);
    res.status(500).json({ error: 'Failed to create policy' });
  }
});

// GET /api/policies/worker/:workerId — Get worker's policies
router.get('/worker/:workerId', async (req, res) => {
  try {
    const policies = await Policy.find({ workerId: req.params.workerId }).sort({ startDate: -1 });
    // Update expired policies
    const now = new Date();
    for (const p of policies) {
      if (p.status === 'active' && new Date(p.endDate) < now) {
        p.status = 'expired';
        await p.save();
      }
    }
    res.json(policies);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch policies' });
  }
});

// GET /api/policies — List all policies (admin)
router.get('/', async (req, res) => {
  try {
    const policies = await Policy.find().sort({ startDate: -1 });
    res.json(policies);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch policies' });
  }
});

module.exports = router;
