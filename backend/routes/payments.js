const express = require('express');
const router = express.Router();
const UpiPayment = require('../models/UpiPayment');
const Policy = require('../models/Policy');
const Storage = require('../services/storage');
const mongoose = require('mongoose');

// POST /api/payments/upi/initiate
// Creates a pending UPI payment record and returns a transaction ID
router.post('/upi/initiate', async (req, res) => {
  try {
    const { userId, amount, packageId, packageName, city, state } = req.body;
    if (!userId || !amount) {
      return res.status(400).json({ error: 'Missing userId or amount' });
    }

    const transactionId = `UPI${Date.now()}${Math.floor(Math.random() * 9000 + 1000)}`;

    const paymentData = {
      transactionId,
      userId,
      amount,
      packageId: packageId || '',
      packageName: packageName || '',
      city: city || '',
      state: state || '',
      status: 'pending',
      simulatorVerified: false,
    };

    const payment = new UpiPayment(paymentData);

    await payment.save();

    res.status(201).json({
      transactionId,
      status: 'pending',
      message: 'Payment initiated. Complete UPI transfer and verify.',
    });
  } catch (err) {
    console.error('[Payments] Initiate error:', err.message);
    res.status(500).json({ error: 'Failed to initiate payment' });
  }
});

// POST /api/payments/upi/verify
// Simulates UPI verification — marks payment as success and updates policy weeklyStatus
router.post('/upi/verify', async (req, res) => {
  try {
    const { transactionId, userId, policyId, userUpiRef } = req.body;
    if (!transactionId || !userId) {
      return res.status(400).json({ error: 'Missing transactionId or userId' });
    }

    // Find payment record
    const payment = await UpiPayment.findOne({ transactionId, userId });
    if (!payment) {
      return res.status(404).json({ error: 'Payment record not found' });
    }

    if (payment.status === 'success') {
      return res.json({ status: 'success', message: 'Already verified', transactionId });
    }

    // Simulate 2-second verification delay (handled on frontend)
    payment.status = 'success';
    payment.simulatorVerified = true;
    payment.userUpiRef = userUpiRef || '';
    if (policyId) payment.policyId = policyId;
    await payment.save();

    // Update policy weeklyStatus if policyId provided
    if (policyId) {
      const now = new Date();
      const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      await Policy.findOneAndUpdate(
        { policyId },
        {
          weeklyStatus: {
            isPaid: true,
            coverageStart: now,
            coverageEnd: weekEnd,
            lastPaymentId: transactionId,
          },
        }
      );
    }

    res.json({
      status: 'success',
      transactionId,
      message: 'Payment verified successfully! Policy coverage is now active.',
    });
  } catch (err) {
    console.error('[Payments] Verify error:', err.message);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// GET /api/payments/history/:userId
// Returns all UPI payments for a user, newest first
router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const payments = await UpiPayment.find({ userId })
      .sort({ timestamp: -1 })
      .limit(20);

    const totalPaid = payments
      .filter(p => p.status === 'success')
      .reduce((sum, p) => sum + p.amount, 0);

    res.json({ payments, totalPaid });
  } catch (err) {
    console.error('[Payments] History error:', err.message);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
});

// GET /api/payments/all (admin)
// Returns all UPI payments across all users
router.get('/all', async (req, res) => {
  try {
    const payments = await UpiPayment.find().sort({ timestamp: -1 }).limit(100);
    const totalCollected = payments
      .filter(p => p.status === 'success')
      .reduce((sum, p) => sum + p.amount, 0);
    res.json({ payments, totalCollected });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch all payments' });
  }
});

module.exports = router;
