const Order = require('../orders/model');
const Product = require('../products/model');
const Coupon = require('../coupons/model');
const User = require('../users/model');
const userService = require('../users/service');
const { sendEmail } = require('../../utils/email');
const { orderStatusUpdate, paymentReceipt, adminNewOrder } = require('../../utils/emailTemplates');
const { ADMIN_EMAIL } = require('../../config/env');

const getOrderCustomerEmail = async (order) => {
  if (order.guestEmail) return order.guestEmail;
  if (order.userId) {
    const user = await userService.findById(order.userId);
    return user?.email || null;
  }
  return null;
};

const STATUS_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'shipped', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

const getOrders = async (params) => {
  const page = Math.max(1, parseInt(params.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(params.limit) || 20));
  const skip = (page - 1) * limit;
  const query = {};
  if (params.status) query.status = params.status;
  if (params.paymentStatus) query.paymentStatus = params.paymentStatus;
  if (params.userId) query.userId = params.userId;
  if (params.from || params.to) {
    query.createdAt = {};
    if (params.from) query.createdAt.$gte = new Date(params.from);
    if (params.to) query.createdAt.$lte = new Date(params.to);
  }
  if (params.search && params.search.trim()) {
    const s = params.search.trim();
    const users = await User.find({ email: { $regex: s, $options: 'i' } }).select('_id');
    const userIds = users.map((u) => u._id);
    query.$or = [
      { orderNumber: { $regex: s, $options: 'i' } },
      { guestEmail: { $regex: s, $options: 'i' } },
      ...(userIds.length ? [{ userId: { $in: userIds } }] : []),
    ];
  }
  const [orders, total] = await Promise.all([
    Order.find(query).populate('userId', 'name email').sort({ createdAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments(query),
  ]);
  return { orders, total, page, totalPages: Math.ceil(total / limit) };
};

const getOrderById = async (id) => {
  return Order.findById(id).populate('userId', 'name email');
};

const updateOrderStatus = async (id, status) => {
  const order = await Order.findById(id);
  if (!order) return null;
  const allowed = STATUS_TRANSITIONS[order.status] || [];
  if (!allowed.includes(status)) {
    const err = new Error(`Invalid status transition from ${order.status} to ${status}`);
    err.statusCode = 400;
    throw err;
  }
  order.status = status;
  await order.save();
  const email = await getOrderCustomerEmail(order);
  if (email) {
    const tpl = orderStatusUpdate(order);
    sendEmail({ to: email, subject: tpl.subject, html: tpl.html }).catch((err) => console.error('Email error:', err));
  }
  return order;
};

const updateOrderPayment = async (orderId, paymentStatus, paymentRef) => {
  const order = await Order.findById(orderId);
  if (!order) return null;
  const wasAlreadyPaid = order.paymentStatus === 'paid';
  if (paymentRef != null) order.paymentRef = paymentRef;
  if (paymentStatus) order.paymentStatus = paymentStatus;
  if (paymentStatus !== 'paid') {
    await order.save();
    return order;
  }
  if (wasAlreadyPaid) return order;
  order.paymentStatus = 'paid';
  order.paymentRef = paymentRef ?? order.paymentRef;
  order.status = 'confirmed';
  await order.save();
  const bulkOps = order.items.map((item) => ({
    updateOne: {
      filter: { _id: item.productId },
      update: { $inc: { stock: -item.quantity } },
    },
  }));
  if (bulkOps.length > 0) {
    await Product.bulkWrite(bulkOps);
  }
  if (order.couponCode) {
    await Coupon.findOneAndUpdate({ code: order.couponCode }, { $inc: { usedCount: 1 } });
  }
  const email = await getOrderCustomerEmail(order);
  if (email) {
    const tpl = paymentReceipt(order);
    sendEmail({ to: email, subject: tpl.subject, html: tpl.html }).catch((err) => console.error('Email error:', err));
  }
  if (ADMIN_EMAIL) {
    const populated = await Order.findById(order._id).populate('userId', 'name email');
    const tpl = adminNewOrder(populated || order);
    sendEmail({ to: ADMIN_EMAIL, subject: tpl.subject, html: tpl.html }).catch((err) => console.error('Email error:', err));
  }
  return order;
};

module.exports = {
  getOrders,
  getOrderById,
  updateOrderStatus,
  updateOrderPayment,
};
