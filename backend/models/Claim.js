const mongoose = require('mongoose');

const claimSchema = new mongoose.Schema({
  claimId: { type: String, required: true, unique: true },
  userId: { type: String }, // For new User model
  workerId: { type: String }, // Legacy compatibility
  policyId: { type: String, required: true },
  disruptionType: { type: String, required: true },
  claimAmount: { type: Number, required: true },
  lostHours: { type: Number, default: 4 },
  description: { type: String, default: '' },
  claimDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['pending_review', 'auto_approved', 'paid', 'flagged', 'rejected'], default: 'pending_review' },
  isAutoTrigger: { type: Boolean, default: false },
  
  // Fraud detection outputs
  fraudScore: { type: Number, default: 0 },
  fraudFlags: { type: Array, default: [] },
  
  triggerData: {
    lat: Number,
    lon: Number,
    measuredWeather: {
      temp: Number,
      rain: Number,
      aqi: Number,
      description: String,
      humidity: Number,
      windSpeed: Number,
    }
  },
  fraudCheck: {
    isGpsValid: Boolean,
    isWeatherValid: Boolean,
    score: Number,
    reason: String,
  },
  transactionId: { type: String, default: null }
});

module.exports = mongoose.model('Claim', claimSchema);
