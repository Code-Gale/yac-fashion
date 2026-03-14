const crypto = require('crypto');
const Order = require('../orders/model');
const Product = require('../products/model');
const Coupon = require('../coupons/model');
const userService = require('../users/service');
const paymentService = require('./service');
const { sendEmail } = require('../../utils/email');
const { paymentReceipt, adminNewOrder } = require('../../utils/emailTemplates');
const { PAYSTACK_SECRET_KEY, FLUTTERWAVE_SECRET_KEY, ADMIN_EMAIL } = require('../../config/env');

const getOrderCustomerEmail = async (order) => {
  if (order.guestEmail) return order.guestEmail;
  if (order.userId) {
    const user = await userService.findById(order.userId);
    return user?.email || null;
  }
  return null;
};

const processSuccessfulPayment = async (orderId, paymentRef) => {
  const order = await Order.findById(orderId);
  if (!order) return;
  if (order.paymentStatus === 'paid') return;
  order.paymentStatus = 'paid';
  order.paymentRef = paymentRef;
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
    await Coupon.findOneAndUpdate(
      { code: order.couponCode },
      { $inc: { usedCount: 1 } }
    );
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
};

const paystackWebhook = async (req, res) => {
  const signature = req.headers['x-paystack-signature'];
  if (!signature || !PAYSTACK_SECRET_KEY) {
    return res.status(401).send();
  }
  const rawBody = Buffer.isBuffer(req.body) ? req.body : (typeof req.body === 'string' ? Buffer.from(req.body) : Buffer.from(JSON.stringify(req.body)));
  const hash = crypto.createHmac('sha512', PAYSTACK_SECRET_KEY).update(rawBody).digest('hex');
  if (hash !== signature) {
    return res.status(401).send();
  }
  res.status(200).send();
  let event;
  try {
    event = typeof req.body === 'object' ? req.body : JSON.parse(rawBody.toString());
  } catch (err) {
    return;
  }
  if (event.event !== 'charge.success') return;
  const orderId = event.data?.metadata?.orderId;
  if (!orderId) return;
  const order = await Order.findById(orderId);
  if (!order) return;
  const amountKobo = Math.round(order.total * 100);
  if (event.data?.amount !== amountKobo) return;
  await processSuccessfulPayment(orderId, event.data?.reference || event.data?.id?.toString?.());
};

const flutterwaveWebhook = async (req, res) => {
  const verifHash = req.headers['verif-hash'];
  if (!verifHash || !FLUTTERWAVE_SECRET_KEY) {
    return res.status(401).send();
  }
  const rawBody = Buffer.isBuffer(req.body) ? req.body : (typeof req.body === 'string' ? Buffer.from(req.body) : Buffer.from(JSON.stringify(req.body)));
  const computedHash = crypto.createHash('sha256').update(rawBody.toString() + FLUTTERWAVE_SECRET_KEY).digest('hex');
  if (computedHash !== verifHash) {
    return res.status(401).send();
  }
  res.status(200).send();
  let event;
  try {
    event = typeof req.body === 'object' ? req.body : JSON.parse(rawBody.toString());
  } catch (err) {
    return;
  }
  if (event.event !== 'charge.completed') return;
  const orderId = event.data?.meta?.orderId;
  if (!orderId) return;
  const order = await Order.findById(orderId);
  if (!order) return;
  if (event.data?.amount !== order.total || event.data?.currency !== 'NGN') return;
  await processSuccessfulPayment(orderId, event.data?.id?.toString?.() || event.data?.tx_ref);
};

module.exports = {
  paystackWebhook,
  flutterwaveWebhook,
};
