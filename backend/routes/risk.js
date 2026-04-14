const express = require('express');
const router = express.Router();
const { calculateRiskScore } = require('../ml/risk_model');

router.post('/', (req, res) => {
    const { rain, aqi, temp } = req.body;
    
    if (rain === undefined || aqi === undefined || temp === undefined) {
        return res.status(400).json({ error: 'Missing required parameters: rain, aqi, temp' });
    }

    const risk_score = calculateRiskScore(Number(rain), Number(aqi), Number(temp));
    res.json({ risk_score });
});

module.exports = router;
