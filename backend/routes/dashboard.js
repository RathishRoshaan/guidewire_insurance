const express = require('express');
const router = express.Router();
const Worker = require('../models/Worker');
const Policy = require('../models/Policy');
const Claim = require('../models/Claim');
const { fetchWeatherData } = require('../utils/weather');
const Storage = require('../services/storage');
const mongoose = require('mongoose');

// Worker Dashboard Data
router.get('/worker/:workerId', async (req, res) => {
    try {
        const { workerId } = req.params;

        // Extract worker data

        const worker = await Worker.findOne({ workerId }).catch(() => null);
        if (!worker) {
            return res.status(404).json({ error: "Worker not found" });
        }

        const activePolicy = await Policy.findOne({ workerId, status: 'active' }).catch(() => null);
        const claims = await Claim.find({ workerId }).sort({ claimDate: -1 }).limit(10).catch(() => []);

        const totalPayouts = claims.filter(c => c.status === 'paid').reduce((acc, c) => acc + c.claimAmount, 0);

        res.json({
            earningsProtected: activePolicy ? activePolicy.maxCoverage : 0,
            activeWeeklyCoverage: activePolicy ? true : false,
            renewalInDays: activePolicy ? Math.max(0, Math.ceil((new Date(activePolicy.endDate) - Date.now()) / (1000 * 60 * 60 * 24))) : 0,
            totalPayouts,
            recentClaims: claims
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Server error fetching worker dashboard UI" });
    }
});

// Admin Dashboard Data
router.get('/admin', async (req, res) => {
    try {
        // Mongoose Aggregations

        const totalPremiumsResult = await Policy.aggregate([
            { $match: { status: 'active' } },
            { $group: { _id: null, total: { $sum: "$weeklyPremium" } } }
        ]).catch(() => []);

        const totalPremiums = totalPremiumsResult.length > 0 ? totalPremiumsResult[0].total : 0;

        const totalPayoutsResult = await Claim.aggregate([
            { $match: { status: 'paid' } },
            { $group: { _id: null, total: { $sum: "$claimAmount" } } }
        ]).catch(() => []);

        const totalPayouts = totalPayoutsResult.length > 0 ? totalPayoutsResult[0].total : 0;

        let lossRatio = 0;
        if (totalPremiums > 0) {
            lossRatio = ((totalPayouts / totalPremiums) * 100).toFixed(2);
        }

        // Predictive Analytics (Weather-Driven Logic)
        const recentClaimsCount = await Claim.countDocuments({ claimDate: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }).catch(() => 0);
        
        // Find cities with active policies to evaluate their live weather risk
        const activeCities = await Policy.distinct('city', { status: 'active' }).catch(() => []);
        const demoCities = ['Mumbai', 'Delhi', 'Chennai', 'Bengaluru']; // Test fallback
        const targetCities = activeCities.length > 0 ? activeCities : demoCities;
        
        let totalWeatherMultiplier = 0;
        let highRiskZones = [];
        let maxConfidence = 70;

        for (const city of targetCities.slice(0, 4)) {
            const wData = await fetchWeatherData(city);
            let risk = 0;
            let reason = '';
            
            if (wData.rain > 5 || wData.description.includes('rain') || wData.description.includes('storm')) {
                risk = 85 + (wData.rain > 20 ? 10 : 0);
                reason = `High Rainfall Expected (${wData.description})`;
            } else if (wData.temp > 40) {
                risk = 75 + ((wData.temp - 40) * 2);
                reason = `Extreme Heatwave (${Math.round(wData.temp)}°C)`;
            } else if (wData.windSpeed > 15) {
                risk = 65 + ((wData.windSpeed - 15) * 1.5);
                reason = `Heavy Winds (${wData.windSpeed}m/s)`;
            } else {
                risk = 20 + (wData.humidity / 5);
                reason = `Clear Conditions`;
            }

            if (risk > 60) {
               highRiskZones.push({ city, riskScore: risk, reason });
            }
            totalWeatherMultiplier += (risk / 50); // E.g., risk 80 = 1.6x multiplier
        }

        const avgMultiplier = (totalWeatherMultiplier / (targetCities.length || 1)) || 1;
        const predictedClaimsNextWeek = Math.round(Math.max(recentClaimsCount, 5) * Math.max(1.1, avgMultiplier));
        const avgClaimValue = totalPayouts / (await Claim.countDocuments({ status: 'paid' }).catch(() => 1)) || 2500;
        const estFuturePayout = predictedClaimsNextWeek * avgClaimValue;

        const predictionConfidence = highRiskZones.length > 0 ? 88 - (highRiskZones.length * 2) : 76;
        const riskTrend = predictedClaimsNextWeek > recentClaimsCount ? `+${Math.round(((predictedClaimsNextWeek - recentClaimsCount)/Math.max(1, recentClaimsCount)) * 100)}%` : '-5%';

        res.json({
            lossRatio: parseFloat(lossRatio),
            totalPremiums,
            totalPayouts,
            predictiveAnalytics: {
                expectedClaimsNextWeek: predictedClaimsNextWeek,
                estimatedPayout: estFuturePayout,
                confidence: predictionConfidence,
                trend: riskTrend,
                highRiskZones: highRiskZones.sort((a,b) => b.riskScore - a.riskScore).slice(0, 3)
            }
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Server error fetching admin dashboard UI" });
    }
});

module.exports = router;
