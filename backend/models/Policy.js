const mongoose = require('mongoose');

const policySchema = new mongoose.Schema({
  policyId: { type: String, required: true, unique: true },
  userId: { type: String }, // For new User model
  workerId: { type: String }, // Legacy compatibility
  packageId: { type: String, required: true },
  packageName: { type: String, required: true },
  weeklyPremium: { type: Number, required: true },
  maxCoverage: { type: Number, required: true },
  riskScoreAtPurchase: { type: Number },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ['active', 'expired', 'cancelled'], default: 'active' },
  coveredDisruptions: [{ type: String }],
  transactionId: { type: String, default: null },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
});

module.exports = mongoose.model('Policy', policySchema);
