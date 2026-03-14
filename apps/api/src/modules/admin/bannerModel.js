const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  title: { type: String },
  subtitle: { type: String },
  imageUrl: { type: String, required: true },
  ctaText: { type: String },
  ctaLink: { type: String },
  position: {
    type: String,
    enum: ['hero', 'category', 'sidebar'],
    default: 'hero',
  },
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
  startDate: { type: Date },
  endDate: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Banner', bannerSchema);
