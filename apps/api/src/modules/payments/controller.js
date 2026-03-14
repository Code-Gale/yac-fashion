const Order = require('../orders/model');
const paymentService = require('./service');
const { success, error } = require('../../utils/response');
const { asyncHandler } = require('../../utils/asyncHandler');

const initiatePaystack = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.body.orderId);
  if (!order) {
    return error(res, 'Order not found', 404);
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
  const order = await Order.findById(req.body.orderId);
  if (!order) {
    return error(res, 'Order not found', 404);
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

const verifyPaystack = asyncHandler(async (req, res) => {
  const result = await paymentService.verifyPaystack(req.body.reference);
  success(res, result);
});

const verifyFlutterwave = asyncHandler(async (req, res) => {
  const result = await paymentService.verifyFlutterwave(req.body.transactionId);
  success(res, result);
});

module.exports = {
  initiatePaystack,
  initiateFlutterwave,
  verifyPaystack,
  verifyFlutterwave,
};
