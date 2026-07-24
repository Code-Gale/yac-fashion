const Order = require('../orders/model');
const userService = require('../users/service');
const { sendEmail } = require('../../utils/email');
const { paymentReceipt, adminNewOrder } = require('../../utils/emailTemplates');
const { ADMIN_EMAIL } = require('../../config/env');

const getOrderCustomerEmail = async (order) => {
  if (order.guestEmail) return order.guestEmail;
  if (order.userId) {
    const user = await userService.findById(order.userId);
    return user?.email || null;
  }
  return null;
};

/**
 * Idempotently mark an order as paid and fire notification emails.
 *
 * Safe to call concurrently from multiple sources (gateway webhook AND
 * client-triggered verify-on-return) — the atomic findOneAndUpdate with a
 * `paymentStatus: { $ne: 'paid' }` guard ensures only the winner of the race
 * flips the order and sends emails; everyone else gets `null` back and is a
 * silent no-op.
 *
 * Returns the updated order, or null if it was already paid / doesn't exist.
 */
const processSuccessfulPayment = async (orderId, paymentRef) => {
  const order = await Order.findOneAndUpdate(
    { _id: orderId, paymentStatus: { $ne: 'paid' } },
    { $set: { paymentStatus: 'paid', paymentRef, status: 'confirmed' } },
    { new: true }
  );
  if (!order) return null;

  const email = await getOrderCustomerEmail(order);
  if (email) {
    const tpl = paymentReceipt(order);
    sendEmail({ to: email, subject: tpl.subject, html: tpl.html }).catch((err) =>
      console.error('Email error:', err)
    );
  }
  if (ADMIN_EMAIL) {
    const populated = await Order.findById(order._id).populate('userId', 'name email');
    const tpl = adminNewOrder(populated || order);
    sendEmail({ to: ADMIN_EMAIL, subject: tpl.subject, html: tpl.html }).catch((err) =>
      console.error('Email error:', err)
    );
  }
  return order;
};

module.exports = { processSuccessfulPayment, getOrderCustomerEmail };
