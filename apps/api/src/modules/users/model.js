const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  label: { type: String },
  name: { type: String },
  street: { type: String },
  city: { type: String },
  state: { type: String },
  phone: { type: String },
  isDefault: { type: Boolean, default: false },
}, { _id: true });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxLength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['customer', 'admin', 'staff'], default: 'customer' },
  isActive: { type: Boolean, default: true },
  addresses: [addressSchema],
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  passwordResetToken: { type: String },
  passwordResetExpires: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
