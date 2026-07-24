const mongoose = require('mongoose');

// Per-state price/estimate override for a shipping method. A method without
// a matching rate for the customer's state falls back to the method's
// default price/estimatedDays.
const shippingRateSchema = new mongoose.Schema({
  method: { type: mongoose.Schema.Types.ObjectId, ref: 'ShippingMethod', required: true },
  state: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  estimatedDays: { type: String, default: '' },
}, { timestamps: true });

shippingRateSchema.index({ method: 1, state: 1 }, { unique: true });

module.exports = mongoose.model('ShippingRate', shippingRateSchema);
