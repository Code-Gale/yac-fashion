const mongoose = require('mongoose');

const shippingMethodSchema = new mongoose.Schema({
  // Stable identifier used in orders/checkout payloads and never shown to customers.
  key: { type: String, required: true, unique: true, trim: true, lowercase: true },
  label: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  // Default estimate/price used for any state without a specific override.
  estimatedDays: { type: String, default: '' },
  price: { type: Number, required: true, min: 0 },
  sortOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

shippingMethodSchema.index({ sortOrder: 1 });

module.exports = mongoose.model('ShippingMethod', shippingMethodSchema);
