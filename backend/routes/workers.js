/**
 * Worker Routes
 */
const express = require('express');
const router = express.Router();
const Worker = require('../models/Worker');

// GET /api/workers — List all workers (admin)
router.get('/', async (req, res) => {
  try {
    const workers = await Worker.find({}, '-password').sort({ joinDate: -1 });
    res.json(workers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch workers' });
  }
});

// GET /api/workers/:id — Get single worker
router.get('/:id', async (req, res) => {
  try {
    const worker = await Worker.findOne({ workerId: req.params.id }, '-password');
    if (!worker) return res.status(404).json({ error: 'Worker not found' });
    res.json(worker);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch worker' });
  }
});

module.exports = router;
