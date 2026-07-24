const orderService = require('./service');
const Review = require('../reviews/model');
const shippingService = require('../shipping/service');
const { success, error } = require('../../utils/response');
const { asyncHandler } = require('../../utils/asyncHandler');

const track = asyncHandler(async (req, res) => {
  const { orderNumber, email } = req.query;
  const data = await orderService.track(orderNumber, email);
  if (!data) return error(res, 'Order not found', 404);
  success(res, data);
});

const getShippingOptions = asyncHandler(async (req, res) => {
  const options = await shippingService.getOptionsForState(req.query.state);
  success(res, options);
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
  
  // Check ownership: user orders must match userId, guest orders must match guestEmail
  const orderUserId = order.userId?.toString?.();
  const orderGuestEmail = order.guestEmail?.toLowerCase();
  
  if (orderUserId) {
    // This is a user order - verify the requester is the owner
    if (orderUserId !== req.user.userId) {
      return error(res, 'Order not found', 404); // Don't leak existence
    }
  } else if (orderGuestEmail) {
    // This is a guest order - require guestEmail in query param to prove ownership
    const providedEmail = req.query.guestEmail?.trim()?.toLowerCase();
    if (!providedEmail || providedEmail !== orderGuestEmail) {
      return error(res, 'Order not found', 404); // Don't leak existence
    }
  } else {
    // Order has neither userId nor guestEmail - orphaned order
    return error(res, 'Order not found', 404);
  }
  
  success(res, order);
});

const getReviewedProducts = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const order = await orderService.findById(id);
  if (!order) return error(res, 'Order not found', 404);
  
  // Check ownership: user orders must match userId, guest orders must match guestEmail
  const orderUserId = order.userId?.toString?.();
  const orderGuestEmail = order.guestEmail?.toLowerCase();
  
  if (orderUserId) {
    // This is a user order - verify the requester is the owner
    if (orderUserId !== req.user.userId) {
      return error(res, 'Order not found', 404);
    }
  } else if (orderGuestEmail) {
    // This is a guest order - require guestEmail in query param to prove ownership
    const providedEmail = req.query.guestEmail?.trim()?.toLowerCase();
    if (!providedEmail || providedEmail !== orderGuestEmail) {
      return error(res, 'Order not found', 404);
    }
  } else {
    // Order has neither userId nor guestEmail - orphaned order
    return error(res, 'Order not found', 404);
  }
  
  const reviews = await Review.find({ userId: req.user.userId, orderId: id }).select('productId');
  const productIds = reviews.map((r) => r.productId?.toString?.()).filter(Boolean);
  success(res, { productIds });
});

module.exports = {
  track,
  getShippingOptions,
  checkout,
  getMyOrders,
  getOrderById,
  getReviewedProducts,
};
