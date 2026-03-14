const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  slug: { type: String, required: true },
  image: { type: String },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  subtotal: { type: Number, required: true },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  guestEmail: { type: String, default: null },
  items: [orderItemSchema],
  shippingAddress: {
    name: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    phone: { type: String, required: true },
  },
  shippingOption: {
    label: { type: String, required: true },
    price: { type: Number, required: true },
  },
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  shippingFee: { type: Number, required: true },
  total: { type: Number, required: true },
  couponCode: { type: String, default: null },
  paymentMethod: {
    type: String,
    enum: ['paystack', 'flutterwave', 'bank_transfer', 'cash_on_delivery'],
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending',
  },
  paymentRef: { type: String, default: null },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
  },
  notes: { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
