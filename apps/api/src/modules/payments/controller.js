const Order = require('../orders/model');
const paymentService = require('./service');
const { success, error } = require('../../utils/response');
const { asyncHandler } = require('../../utils/asyncHandler');

/** Verify the requester owns the order (authenticated user or matching guestEmail). */
const verifyOwnership = (order, req) => {
  const orderUserId = order.userId?.toString?.();
  const orderGuestEmail = order.guestEmail?.toLowerCase();
  const requestUserId = req.user?.userId;
  const providedGuestEmail = req.body.guestEmail?.trim()?.toLowerCase();

  if (orderUserId && requestUserId && orderUserId === requestUserId) return true;
  if (orderGuestEmail && providedGuestEmail && orderGuestEmail === providedGuestEmail) return true;
  return false;
};

/** Look up by Mongo _id (available right after checkout) or orderNumber (available
 * on the order-confirmed page for a later retry) — whichever the caller has. */
const findOrderForInitiate = async (req) => {
  if (req.body.orderId) return Order.findById(req.body.orderId).catch(() => null);
  if (req.body.orderNumber) return Order.findOne({ orderNumber: req.body.orderNumber });
  return null;
};

const initiatePaystack = asyncHandler(async (req, res) => {
  const order = await findOrderForInitiate(req);
  if (!order) {
    return error(res, 'Order not found', 404);
  }
  if (!verifyOwnership(order, req)) {
    return error(res, 'Order not found', 404); // Don't leak existence
  }
  if (order.paymentMethod !== 'paystack') {
    return error(res, 'Order is not a Paystack payment', 400);
  }
  if (order.paymentStatus === 'paid') {
    return error(res, 'Order already paid', 400);
  }
  const result = await paymentService.initializePaystack(order);
  success(res, result);
});

const initiateFlutterwave = asyncHandler(async (req, res) => {
  const order = await findOrderForInitiate(req);
  if (!order) {
    return error(res, 'Order not found', 404);
  }
  if (!verifyOwnership(order, req)) {
    return error(res, 'Order not found', 404); // Don't leak existence
  }
  if (order.paymentMethod !== 'flutterwave') {
    return error(res, 'Order is not a Flutterwave payment', 400);
  }
  if (order.paymentStatus === 'paid') {
    return error(res, 'Order already paid', 400);
  }
  const result = await paymentService.initializeFlutterwave(order);
  success(res, result);
});

/**
 * Client-triggered verify-and-finalize, used as a fallback to the webhook
 * when the customer lands back on our site (webhooks can be delayed, or
 * misconfigured on the gateway dashboard — this must not be the only path
 * to a paid order). Looked up by orderNumber since that's all the gateway
 * return URL carries; ownership is still enforced.
 */
const findOwnedOrderByNumber = async (req, res, orderNumber) => {
  if (!orderNumber) {
    error(res, 'Order not found', 404);
    return null;
  }
  const order = await Order.findOne({ orderNumber });
  if (!order || !verifyOwnership(order, req)) {
    error(res, 'Order not found', 404); // Don't leak existence
    return null;
  }
  return order;
};

const verifyPaystack = asyncHandler(async (req, res) => {
  const order = await findOwnedOrderByNumber(req, res, req.body.orderNumber);
  if (!order) return;

  if (order.paymentMethod !== 'paystack') {
    return error(res, 'Order is not a Paystack payment', 400);
  }
  if (order.paymentStatus === 'paid') {
    return success(res, { order, alreadyPaid: true });
  }
  const updated = await paymentService.confirmPaystackPayment(order, req.body.reference);
  success(res, { order: updated });
});

const verifyFlutterwave = asyncHandler(async (req, res) => {
  const order = await findOwnedOrderByNumber(req, res, req.body.orderNumber);
  if (!order) return;

  if (order.paymentMethod !== 'flutterwave') {
    return error(res, 'Order is not a Flutterwave payment', 400);
  }
  if (order.paymentStatus === 'paid') {
    return success(res, { order, alreadyPaid: true });
  }
  const updated = await paymentService.confirmFlutterwavePayment(order, req.body.transactionId);
  success(res, { order: updated });
});

module.exports = {
  initiatePaystack,
  initiateFlutterwave,
  verifyPaystack,
  verifyFlutterwave,
};
