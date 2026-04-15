const mongoose = require('mongoose');

const policySchema = new mongoose.Schema({
  policyId: { type: String, required: true, unique: true },
  workerId: { type: String, required: true },
  packageId: { type: String, default: 'standard' },
  packageName: { type: String, required: true, enum: ['Essential Guard', 'Smart Partner', 'Total Resilience'] },
  weeklyPremium: { type: Number, required: true },
  maxCoverage: { type: Number, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ['active', 'expired', 'cancelled'], default: 'active' },
  coveredDisruptions: [{ type: String }],
  transactionId: { type: String, default: null },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
});

module.exports = mongoose.model('Policy', policySchema);
