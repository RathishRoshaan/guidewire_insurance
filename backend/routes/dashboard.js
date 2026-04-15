const express = require('express');
const router = express.Router();
const Worker = require('../models/Worker');
const Policy = require('../models/Policy');
const Claim = require('../models/Claim');

// Worker Dashboard Data
router.get('/worker/:workerId', async (req, res) => {
    try {
        const { workerId } = req.params;

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

        // Predictive Analytics (Simple statistical heuristic for demonstration)
        const recentClaimsCount = await Claim.countDocuments({ claimDate: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }).catch(() => 0);
        const predictedClaimsNextWeek = Math.round(recentClaimsCount * 1.15); // +15% expected

        res.json({
            lossRatio: parseFloat(lossRatio),
            totalPremiums,
            totalPayouts,
            predictiveAnalytics: {
                expectedClaimsNextWeek: predictedClaimsNextWeek,
                trend: '+15%',
                highRiskZones: ['Mumbai (Monsoon)', 'Delhi (AQI)']
            }
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Server error fetching admin dashboard UI" });
    }
});

module.exports = router;
