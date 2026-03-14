const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  type: { type: String, enum: ['percent', 'flat'], required: true },
  value: { type: Number, required: true },
  minOrderAmount: { type: Number, default: 0 },
  usageLimit: { type: Number, default: null },
  usedCount: { type: Number, default: 0 },
  expiresAt: { type: Date },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Coupon', couponSchema);
