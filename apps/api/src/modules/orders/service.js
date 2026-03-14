const Order = require('./model');
const Product = require('../products/model');
const couponService = require('../coupons/service');
const cartService = require('../cart/service');
const paymentService = require('../payments/service');
const { sendEmail } = require('../../utils/email');
const { orderConfirmation } = require('../../utils/emailTemplates');
const { PAYSTACK_PUBLIC_KEY, FLUTTERWAVE_PUBLIC_KEY, CLIENT_URL } = require('../../config/env');

const generateOrderNumber = () => {
  const date = new Date();
  const yyyymmdd = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `YAC-${yyyymmdd}-${random}`;
};

const checkout = async (data, userId, cartKey) => {
  const { guestEmail, items, shippingAddress, shippingOption, paymentMethod, couponCode } = data;
  if (!userId && !guestEmail) {
    const err = new Error('guestEmail required when not authenticated');
    err.statusCode = 400;
    throw err;
  }
  if (!items || !Array.isArray(items) || items.length === 0) {
    const err = new Error('At least one item required');
    err.statusCode = 400;
    throw err;
  }
  if (!shippingAddress || !shippingAddress.name || !shippingAddress.street || !shippingAddress.city || !shippingAddress.state || !shippingAddress.phone) {
    const err = new Error('Invalid shipping address');
    err.statusCode = 400;
    throw err;
  }
  if (!shippingOption || typeof shippingOption.label !== 'string' || typeof shippingOption.price !== 'number') {
    const err = new Error('Invalid shipping option');
    err.statusCode = 400;
    throw err;
  }
  const validMethods = ['paystack', 'flutterwave', 'bank_transfer', 'cash_on_delivery'];
  if (!validMethods.includes(paymentMethod)) {
    const err = new Error('Invalid payment method');
    err.statusCode = 400;
    throw err;
  }
  const orderItems = [];
  let subtotal = 0;
  for (const entry of items) {
    const product = await Product.findOne({ _id: entry.productId, isActive: true });
    if (!product) {
      const err = new Error(`Product ${entry.productId} not found or inactive`);
      err.statusCode = 400;
      throw err;
    }
    const qty = Math.max(1, Math.floor(Number(entry.quantity) || 1));
    if (qty > product.stock) {
      const err = new Error(`Insufficient stock for ${product.name}`);
      err.statusCode = 400;
      throw err;
    }
    const itemSubtotal = product.price * qty;
    subtotal += itemSubtotal;
    orderItems.push({
      productId: product._id,
      name: product.name,
      slug: product.slug,
      image: product.images?.[0] || null,
      price: product.price,
      quantity: qty,
      subtotal: itemSubtotal,
    });
  }
  let discount = 0;
  let appliedCouponCode = null;
  if (couponCode && couponCode.trim()) {
    const couponResult = await couponService.validate(couponCode.trim(), subtotal);
    if (couponResult.valid) {
      discount = couponResult.discountAmount;
      appliedCouponCode = couponResult.coupon.code;
    }
  }
  const shippingFee = shippingOption.price;
  const total = Math.max(0, subtotal - discount + shippingFee);
  let orderNumber = generateOrderNumber();
  let exists = await Order.findOne({ orderNumber });
  while (exists) {
    orderNumber = generateOrderNumber();
    exists = await Order.findOne({ orderNumber });
  }
  const isCod = paymentMethod === 'cash_on_delivery';
  const order = await Order.create({
    orderNumber,
    userId: userId || null,
    guestEmail: userId ? null : (guestEmail?.trim() || '').toLowerCase() || null,
    items: orderItems,
    shippingAddress: {
      name: shippingAddress.name,
      street: shippingAddress.street,
      city: shippingAddress.city,
      state: shippingAddress.state,
      phone: shippingAddress.phone,
    },
    shippingOption: {
      label: shippingOption.label,
      price: shippingOption.price,
    },
    subtotal,
    discount,
    shippingFee,
    total,
    couponCode: appliedCouponCode,
    paymentMethod,
    paymentStatus: 'pending',
    status: isCod ? 'confirmed' : 'pending',
  });
  if (isCod) {
    const bulkOps = orderItems.map((item) => ({
      updateOne: {
        filter: { _id: item.productId },
        update: { $inc: { stock: -item.quantity } },
      },
    }));
    if (bulkOps.length > 0) {
      await Product.bulkWrite(bulkOps);
    }
  }
  if (cartKey) {
    await cartService.clearCart(cartKey);
  }
  let email = null;
  if (userId) {
    const user = await require('../users/service').findById(userId);
    email = user?.email || null;
  } else {
    email = guestEmail?.trim() || null;
  }
  if (email) {
    const tpl = orderConfirmation(order);
    sendEmail({ to: email, subject: tpl.subject, html: tpl.html }).catch((err) => console.error('Email error:', err));
  }
  const response = { order };
  if (paymentMethod === 'paystack') {
    const init = await paymentService.initializePaystack(order);
    response.paymentInitiation = { ...init, publicKey: PAYSTACK_PUBLIC_KEY };
  } else if (paymentMethod === 'flutterwave') {
    const init = await paymentService.initializeFlutterwave(order);
    response.paymentInitiation = { ...init, publicKey: FLUTTERWAVE_PUBLIC_KEY };
  } else if (paymentMethod === 'bank_transfer') {
    response.statusLabel = 'Awaiting Payment';
    response.instructions = {
      message: `Transfer ₦${order.total.toLocaleString()} to account details below. Your order will be confirmed once payment is received.`,
      orderNumber,
      total: order.total,
    };
  } else if (paymentMethod === 'cash_on_delivery') {
    response.statusLabel = 'Order Confirmed';
    response.instructions = {
      message: 'Pay on delivery when your order arrives.',
      orderNumber,
    };
  }
  return response;
};

const findByUser = async (userId, page = 1, limit = 20, status) => {
  const skip = (Math.max(1, page) - 1) * Math.min(50, Math.max(1, limit));
  const query = { userId };
  if (status && status.trim()) query.status = status.trim();
  const [orders, total] = await Promise.all([
    Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments(query),
  ]);
  return { orders, total, page: Math.max(1, page), totalPages: Math.ceil(total / Math.min(50, Math.max(1, limit))) };
};

const findById = async (id) => {
  return Order.findById(id);
};

const track = async (orderNumber, email) => {
  if (!orderNumber?.trim() || !email?.trim()) return null;
  const order = await Order.findOne({ orderNumber: orderNumber.trim() });
  if (!order) return null;
  const emailLower = email.trim().toLowerCase();
  const orderGuestEmail = (order.guestEmail || '').toLowerCase();
  if (orderGuestEmail && orderGuestEmail === emailLower) {
    return {
      orderNumber: order.orderNumber,
      status: order.status,
      paymentMethod: order.paymentMethod,
      items: order.items.map((i) => ({ name: i.name, quantity: i.quantity, price: i.price })),
      shippingAddress: { city: order.shippingAddress?.city, state: order.shippingAddress?.state },
      subtotal: order.subtotal,
      discount: order.discount,
      shippingFee: order.shippingFee,
      total: order.total,
      updatedAt: order.updatedAt,
    };
  }
  if (order.userId) {
    const user = await require('../users/service').findById(order.userId);
    if (user?.email?.toLowerCase() === emailLower) {
      return {
        orderNumber: order.orderNumber,
        status: order.status,
        paymentMethod: order.paymentMethod,
        items: order.items.map((i) => ({ name: i.name, quantity: i.quantity, price: i.price })),
        shippingAddress: { city: order.shippingAddress?.city, state: order.shippingAddress?.state },
        subtotal: order.subtotal,
        discount: order.discount,
        shippingFee: order.shippingFee,
        total: order.total,
        updatedAt: order.updatedAt,
      };
    }
  }
  return null;
};

const updateStatus = async (id, status) => {
  return Order.findByIdAndUpdate(id, { status }, { new: true });
};

module.exports = {
  checkout,
  findByUser,
  findById,
  track,
  updateStatus,
};
