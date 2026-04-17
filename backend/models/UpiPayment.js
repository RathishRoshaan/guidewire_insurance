const mongoose = require('mongoose');

const upiPaymentSchema = new mongoose.Schema({
  transactionId: { type: String, required: true, unique: true },
  userId: { type: String, required: true },          // User._id or username
  policyId: { type: String, default: null },          // Policy.policyId linked after activation
  amount: { type: Number, required: true },
  upiId: { type: String, default: 'gigcover@upi' },  // Payee UPI ID
  userUpiRef: { type: String, default: '' },          // UPI reference entered by user
  status: {
    type: String,
    enum: ['pending', 'success', 'failed'],
    default: 'pending'
  },
  simulatorVerified: { type: Boolean, default: false },
  packageId: { type: String, default: '' },
  packageName: { type: String, default: '' },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('UpiPayment', upiPaymentSchema);
