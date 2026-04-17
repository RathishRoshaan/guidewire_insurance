/**
 * Auth Routes — Register, Login, Admin Login
 */
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const Storage = require('../services/storage');
const { calculateRiskScore, generatePackages } = require('../ml/risk_model');
const { fetchWeatherData } = require('../utils/weather');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { fullName, username, password, platform, weeklyIncome, city, state } = req.body;

    if (!fullName || !username || !password || !platform || !weeklyIncome || !city || !state) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if username exists
    const existing = await User.findOne({ username: username.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    // 1. Fetch real weather data
    const weatherData = await fetchWeatherData(city);

    // 2. Call ML Risk Engine
    const { riskScore, riskLevel, riskFactors } = calculateRiskScore({
      state,
      city,
      weeklyIncome,
      platform,
      weatherData
    });

    const packages = generatePackages({
      state,
      weeklyIncome,
      riskScore,
      riskLevel
    });

    const packs = {
      basic: packages.find(p => p.id === 'basic'),
      standard: packages.find(p => p.id === 'standard'),
      premium: packages.find(p => p.id === 'premium')
    };

    const passwordHash = await bcrypt.hash(password, 10);

    // 3. Store everything in MongoDB

    const user = new User({
      fullName,
      username: username.toLowerCase(),
      password: passwordHash,
      platform,
      weeklyIncome,
      city,
      state,
      riskScore,
      riskLevel,
      riskFactors,
      packs,
      createdAt: new Date()
    });

    await user.save();

    const token = jwt.sign(
      { id: user._id, username: user.username, role: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        fullName: user.fullName,
        username: user.username,
        platform: user.platform,
        weeklyIncome: user.weeklyIncome,
        city: user.city,
        state: user.state,
        riskScore: user.riskScore,
        riskLevel: user.riskLevel,
        riskFactors: user.riskFactors,
        packs: user.packs
      }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Admin check
    if (username === 'admin' && password === 'admin123') {
      const token = jwt.sign(
        { id: 'ADMIN', role: 'admin', username: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      return res.json({
        token,
        user: { fullName: 'Admin User', username: 'admin', role: 'admin' },
        role: 'admin',
      });
    }

    // Mongoose execution

    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username, role: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        fullName: user.fullName,
        username: user.username,
        platform: user.platform,
        weeklyIncome: user.weeklyIncome,
        city: user.city,
        state: user.state,
        riskScore: user.riskScore,
        riskLevel: user.riskLevel,
        riskFactors: user.riskFactors,
        packs: user.packs
      },
      role: 'user',
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.role === 'admin') {
      return res.json({ fullName: 'Admin User', username: 'admin', role: 'admin' });
    }

    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json(user);
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// GET /api/auth/me
// ... (omitting current implementation for brevity in match)

// POST /api/auth/update-location
// Called by the frontend/app to update the user's current GPS location
router.post('/update-location', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const { lat, lon } = req.body;
    if (!lat || !lon) return res.status(400).json({ error: 'Missing lat/lon' });

    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.lastLocation = {
      lat,
      lon,
      updatedAt: new Date()
    };

    // Also update operationZone if not set
    if (!user.operationZone || !user.operationZone.lat) {
      user.operationZone = { lat, lon, radius_km: 50 };
    }

    await user.save();
    res.json({ status: 'Location updated', location: user.lastLocation });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token or update failed' });
  }
});

module.exports = router;

