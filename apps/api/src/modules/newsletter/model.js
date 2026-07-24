const mongoose = require('mongoose');

const subscriberSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  source: { type: String, default: 'homepage' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('NewsletterSubscriber', subscriberSchema);
