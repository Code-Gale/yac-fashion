const mongoose = require('mongoose');
const slugify = require('slugify');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, unique: true },
  description: { type: String, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  images: {
  type: [{ type: String }],
  validate: {
    validator: (v) => Array.isArray(v) && v.length >= 1,
    message: 'At least one image is required',
  },
},
  price: { type: Number, required: true, min: 0 },
  compareAtPrice: { type: Number },
  stock: { type: Number, required: true, min: 0, default: 0 },
  sku: { type: String, unique: true, sparse: true },
  tags: [{ type: String }],
  isFeatured: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  ratings: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 },
  },
  flashSalePrice: { type: Number },
  flashSaleEndsAt: { type: Date },
}, { timestamps: true });

productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, isFeatured: 1, isActive: 1, price: 1, createdAt: -1 });
productSchema.index({ isActive: 1, flashSalePrice: 1, flashSaleEndsAt: 1 });
productSchema.index({ isActive: 1, isFeatured: 1 });
productSchema.index({ isActive: 1, createdAt: -1 });
productSchema.index({ isActive: 1, category: 1, createdAt: -1 });

productSchema.pre('save', function (next) {
  if (!this.slug && this.name) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);
