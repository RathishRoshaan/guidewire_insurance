/**
 * Auth Routes — Register, Login, Admin Login
 */
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Worker = require('../models/Worker');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, username, password, phone, email, idType, idNumber,
            city, state, lat, lon, platform, weeklyIncome } = req.body;

    if (!firstName || !lastName || !username || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if username exists
    const existing = await Worker.findOne({ username: username.toLowerCase() }).catch(() => null);
    if (existing) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const workerId = 'WKR-' + String(Date.now()).slice(-6);

    const worker = new Worker({
      workerId,
      firstName,
      lastName,
      username: username.toLowerCase(),
      password: passwordHash,
      phone: phone || '',
      email: email || '',
      idType: idType || 'Aadhaar',
      idNumber: idNumber || '',
      city: city || 'Mumbai',
      state: state || 'Maharashtra',
      operationZone: {
        lat: lat || 19.076,
        lon: lon || 72.8777,
        radius_km: 50,
      },
      platform: platform || 'Swiggy',
      weeklyIncome: weeklyIncome || 7000,
      isActive: true,
    });

    await worker.save();

    const token = jwt.sign(
      { id: worker.workerId, role: 'worker', username: worker.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: worker.workerId,
        firstName: worker.firstName,
        lastName: worker.lastName,
        username: worker.username,
        email: worker.email,
        phone: worker.phone,
        city: worker.city,
        state: worker.state,
        platform: worker.platform,
        weeklyIncome: worker.weeklyIncome,
        lat: worker.operationZone.lat,
        lon: worker.operationZone.lon,
      },
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
        user: { id: 'ADMIN', firstName: 'Admin', lastName: 'User', username: 'admin', role: 'admin' },
        role: 'admin',
      });
    }

    const worker = await Worker.findOne({ username: username.toLowerCase() }).catch(() => null);
    if (!worker) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, worker.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: worker.workerId, role: 'worker', username: worker.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: worker.workerId,
        firstName: worker.firstName,
        lastName: worker.lastName,
        username: worker.username,
        email: worker.email,
        phone: worker.phone,
        city: worker.city,
        state: worker.state,
        platform: worker.platform,
        weeklyIncome: worker.weeklyIncome,
        lat: worker.operationZone.lat,
        lon: worker.operationZone.lon,
      },
      role: 'worker',
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;
