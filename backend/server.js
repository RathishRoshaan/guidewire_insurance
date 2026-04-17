const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
require('dotenv').config();
const mongoose = require('mongoose');

const riskRoutes = require('./routes/risk');
const claimRoutes = require('./routes/claim');
const dashboardRoutes = require('./routes/dashboard');
const authRoutes = require('./routes/auth');
const workerRoutes = require('./routes/workers');
const policyRoutes = require('./routes/policies');
const triggerRoutes = require('./routes/triggers');
const paymentRoutes = require('./routes/payments');
const { checkAndTrigger } = require('./services/autoTrigger');

const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Connect to MongoDB
connectDB();


// Health check
app.get('/', (req, res) => {
  res.json({
    service: 'GigCover Backend',
    status: 'running',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    features: ['ML Risk Engine', 'Fraud Detection', 'Auto-Trigger', 'JWT Auth', 'UPI Payout'],
  });
});

// ── API Routes ──
// Auth (public)
app.use('/api/auth', authRoutes);

// Risk calculation (public — used by landing page)
app.use('/api/risk', riskRoutes);
app.use('/calculate-risk', riskRoutes); // Legacy compatibility

// Claims
app.use('/api/claims', claimRoutes);
app.use('/create-claim', claimRoutes); // Legacy compatibility

// Dashboard
app.use('/api/dashboard', dashboardRoutes);
app.use('/dashboard', dashboardRoutes); // Legacy compatibility

// Workers
app.use('/api/workers', workerRoutes);

// Policies
app.use('/api/policies', require('./routes/policies'));

// Triggers
app.use('/api/triggers', triggerRoutes);

// Payments
app.use('/api/payments', paymentRoutes);

// AI Chatbot
app.use('/api/chat', require('./routes/chat'));

// ── Parametric Auto-Trigger Scheduler ──
// Runs every 2 minutes for demo (would be hourly in production)
cron.schedule('*/2 * * * *', async () => {
  console.log('\n🔄 [CRON] Running parametric auto-trigger check...');
  try {
    await checkAndTrigger();
  } catch (err) {
    console.error('[CRON] Auto-trigger error:', err.message);
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 GigCover Backend running on port ${PORT}`);
  console.log(`   📡 API: http://localhost:${PORT}`);
  console.log(`   🤖 Auto-trigger: every 2 minutes`);
  console.log(`   🔐 JWT Auth: enabled\n`);
});
