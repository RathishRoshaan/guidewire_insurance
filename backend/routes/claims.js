const express = require('express');
const router = express.Router();
const Claim = require('../models/Claim');

// GET /api/claims
// Returns all claims with fraud scores
router.get('/', async (req, res) => {
  try {
    const claims = await Claim.find().sort({ claimDate: -1 });
    res.json(claims);
  } catch (err) {
    console.error('Fetch claims error:', err);
    res.status(500).json({ error: 'Failed to fetch claims' });
  }
});

module.exports = router;
