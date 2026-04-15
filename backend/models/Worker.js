const mongoose = require('mongoose');

const workerSchema = new mongoose.Schema({
  workerId: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
  idType: { type: String, enum: ['Aadhaar', 'PAN', 'Voter ID', 'Driving License'], default: 'Aadhaar' },
  idNumber: { type: String, default: '' },
  city: { type: String, required: true },
  state: { type: String },
  operationZone: {
    lat: { type: Number, required: true },
    lon: { type: Number, required: true },
    radius_km: { type: Number, default: 50 },
  },
  platform: { type: String, required: true },
  weeklyIncome: { type: Number, default: 7000 },
  joinDate: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }
});

module.exports = mongoose.model('Worker', workerSchema);
