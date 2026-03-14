const orderService = require('./service');
const Review = require('../reviews/model');
const { success, error } = require('../../utils/response');
const { asyncHandler } = require('../../utils/asyncHandler');

const track = asyncHandler(async (req, res) => {
  const { orderNumber, email } = req.query;
  const data = await orderService.track(orderNumber, email);
  if (!data) return error(res, 'Order not found', 404);
  success(res, data);
});

const checkout = asyncHandler(async (req, res) => {
  const userId = req.user?.userId || null;
  const cartKey = req.cartKey || null;
  if (!userId && !req.body.guestEmail?.trim()) {
    return error(res, 'guestEmail required when not authenticated', 400);
  }
  const result = await orderService.checkout(req.body, userId, cartKey);
  success(res, result, 201);
});

const getMyOrders = asyncHandler(async (req, res) => {
  const { page, limit, status } = req.query;
  const result = await orderService.findByUser(req.user.userId, page, limit, status);
  success(res, result);
});

const getOrderById = asyncHandler(async (req, res) => {
  const order = await orderService.findById(req.params.id);
  if (!order) {
    return error(res, 'Order not found', 404);
  }
  const orderUserId = order.userId?.toString?.();
  if (orderUserId && orderUserId !== req.user.userId) {
    return error(res, 'Forbidden', 403);
  }
  success(res, order);
});

const getReviewedProducts = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const order = await orderService.findById(id);
  if (!order) return error(res, 'Order not found', 404);
  const orderUserId = order.userId?.toString?.();
  if (orderUserId && orderUserId !== req.user.userId) return error(res, 'Forbidden', 403);
  const reviews = await Review.find({ userId: req.user.userId, orderId: id }).select('productId');
  const productIds = reviews.map((r) => r.productId?.toString?.()).filter(Boolean);
  success(res, { productIds });
});

module.exports = {
  track,
  checkout,
  getMyOrders,
  getOrderById,
  getReviewedProducts,
};
