const express = require('express');
const router = express.Router();

router.post('/', (req, res) => {
    const { rain, aqi, temp } = req.body;

    if (rain === undefined || aqi === undefined || temp === undefined) {
        return res.status(400).json({ error: 'Missing required parameters: rain, aqi, temp' });
    }

    const rainVal = Number(rain);
    const aqiVal = Number(aqi);
    const tempVal = Number(temp);

    // Check trigger: rain > 50 OR aqi > 200 OR temp > 40
    let trigger = null;
    let reason = "Conditions are within normal bounds.";
    let status = "rejected";

    if (rainVal > 50) {
        trigger = "rain";
        reason = `Rainfall of ${rainVal}mm exceeded the 50mm threshold.`;
        status = "approved";
    } else if (aqiVal > 200) {
        trigger = "aqi";
        reason = `AQI of ${aqiVal} exceeded the 200 threshold.`;
        status = "approved";
    } else if (tempVal > 40) {
        trigger = "temp";
        reason = `Temperature of ${tempVal}°C exceeded the 40°C threshold.`;
        status = "approved";
    }

    res.json({
        status,
        reason,
        trigger
    });
});

module.exports = router;
