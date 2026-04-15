/**
 * Trigger Routes — Manual trigger + trigger log for admin
 */
const express = require('express');
const router = express.Router();
const { manualTrigger, getTriggerLog } = require('../services/autoTrigger');

// POST /api/triggers/manual — Admin manual trigger
router.post('/manual', async (req, res) => {
  try {
    const { city, disruptionType } = req.body;
    if (!city || !disruptionType) {
      return res.status(400).json({ error: 'Missing city or disruptionType' });
    }
    const result = await manualTrigger(city, disruptionType);
    res.json(result);
  } catch (err) {
    console.error('Manual trigger error:', err);
    res.status(500).json({ error: 'Manual trigger failed' });
  }
});

// GET /api/triggers/log — Get trigger history
router.get('/log', (req, res) => {
  res.json(getTriggerLog());
});

module.exports = router;
