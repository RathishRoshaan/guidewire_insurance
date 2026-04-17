const express = require('express');
const router = express.Router();
const Policy = require('../models/Policy');
const jwt = require('jsonwebtoken');
const Storage = require('../services/storage');
const mongoose = require('mongoose');

// GET /api/policies/worker/:workerId
router.get('/worker/:workerId', async (req, res) => {
  try {
    const { workerId } = req.params;
    
    // Execute query

    const policies = await Policy.find({ userId: workerId });
    res.json(policies);
  } catch (err) {
    console.error('Fetch worker policies error:', err);
    res.status(500).json({ error: 'Failed to fetch policies' });
  }
});

// GET /api/policies
// Returns active policies
router.get('/', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const filter = { status: 'active' };
    if (decoded.role !== 'admin') {
      filter.$or = [{ userId: decoded.id }, { workerId: decoded.id }];
    }

    // Execute query

    const policies = await Policy.find(filter);
    res.json(policies);
  } catch (err) {
    console.error('Fetch policies error:', err);
    res.status(500).json({ error: 'Failed to fetch policies' });
  }
});

// POST /api/policies — Create a new policy
router.post('/', async (req, res) => {
  try {
    const { 
      workerId, workerName, city, platform, 
      packageId, packageName, weeklyPremium, 
      maxCoverage, coveredDisruptions, exclusions 
    } = req.body;

    if (!workerId || !packageId) {
      return res.status(400).json({ error: 'Missing required fields: workerId, packageId' });
    }

    const policyId = 'POL-' + String(Date.now()).slice(-6);
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7); // 7-day policy

    const newPolicy = new Policy({
      policyId,
      workerId,
      userId: workerId, // In this app, workerId and userId are often the same string
      workerName: workerName || 'Worker',
      city: city || 'Unknown',
      platform: platform || 'Swiggy',
      packageId,
      packageName,
      weeklyPremium,
      maxCoverage,
      coveredDisruptions: coveredDisruptions || [],
      exclusions: exclusions || [],
      startDate,
      endDate,
      status: 'active'
    });

    await newPolicy.save();
    console.log(`[Policies] New policy created: ${policyId} for ${workerId}`);
    res.status(201).json(newPolicy);
  } catch (err) {
    console.error('Create policy error:', err);
    res.status(500).json({ error: 'Failed to create policy' });
  }
});

module.exports = router;
