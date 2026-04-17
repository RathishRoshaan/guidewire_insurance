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

module.exports = router;
