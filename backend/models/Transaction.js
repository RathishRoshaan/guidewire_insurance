const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  transactionId: { type: String, required: true, unique: true }, // Ext mock ID like "rzp_test_12345"
  claimId: { type: String, required: true },
  workerId: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['processing', 'processed', 'failed'], default: 'processing' },
  method: { type: String, default: 'UPI' },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', transactionSchema);
