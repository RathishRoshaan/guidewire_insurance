const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  platform: { type: String, required: true },
  weeklyIncome: { type: Number, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  
  // ML Outputs
  riskScore: { type: Number },
  riskLevel: { type: String },
  riskFactors: { type: Array, default: [] },
  packs: {
    basic: { type: Object },
    standard: { type: Object },
    premium: { type: Object }
  },

  // Location Tracking
  lastLocation: {
    lat: { type: Number },
    lon: { type: Number },
    updatedAt: { type: Date }
  },
  operationZone: {
    lat: { type: Number },
    lon: { type: Number },
    radius_km: { type: Number, default: 50 }
  },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
