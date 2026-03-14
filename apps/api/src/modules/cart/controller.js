const cartService = require('./service');
const couponService = require('../coupons/service');
const { success, error } = require('../../utils/response');
const { asyncHandler } = require('../../utils/asyncHandler');

const getCart = asyncHandler(async (req, res) => {
  const cart = await cartService.getCart(req.cartKey, req.cartTtl);
  success(res, cart);
});

const addItem = asyncHandler(async (req, res) => {
  const cart = await cartService.addItem(
    req.cartKey,
    req.cartTtl,
    req.body.productId,
    req.body.quantity || 1
  );
  success(res, cart);
});

const updateItem = asyncHandler(async (req, res) => {
  const cart = await cartService.updateItem(
    req.cartKey,
    req.cartTtl,
    req.params.productId,
    req.body.quantity
  );
  success(res, cart);
});

const removeItem = asyncHandler(async (req, res) => {
  const cart = await cartService.removeItem(req.cartKey, req.cartTtl, req.params.productId);
  success(res, cart);
});

const clearCart = asyncHandler(async (req, res) => {
  const cart = await cartService.clearCart(req.cartKey);
  success(res, cart);
});

const mergeCart = asyncHandler(async (req, res) => {
  const sessionId = req.headers['x-session-id'];
  const guestCartKey = sessionId && typeof sessionId === 'string' && sessionId.trim()
    ? `cart:session:${sessionId.trim()}`
    : null;
  const userCartKey = `cart:user:${req.user.userId}`;
  const cart = await cartService.mergeCarts(guestCartKey, userCartKey);
  success(res, cart);
});

const applyCoupon = asyncHandler(async (req, res) => {
  const { code } = req.body;
  const cart = await cartService.getCart(req.cartKey, req.cartTtl);
  const subtotal = cart.subtotal;
  const result = await couponService.validate(code, subtotal);
  if (!result.valid) {
    return error(res, 'Invalid or expired coupon', 400);
  }
  const redis = await require('../../config/redis').getRedis();
  if (!redis || !req.cartKey) {
    return error(res, 'Cart unavailable', 503);
  }
  const raw = await redis.get(req.cartKey);
  const data = raw ? JSON.parse(raw) : { items: cart.items, couponCode: null, discount: 0 };
  data.couponCode = result.coupon.code;
  data.discount = result.discountAmount;
  await redis.setEx(req.cartKey, req.cartTtl, JSON.stringify(data));
  success(res, {
    discountAmount: result.discountAmount,
    couponCode: result.coupon.code,
    items: cart.items,
    subtotal,
    itemCount: cart.itemCount,
    discount: result.discountAmount,
  });
});

const removeCoupon = asyncHandler(async (req, res) => {
  const redis = await require('../../config/redis').getRedis();
  if (!redis || !req.cartKey) {
    return error(res, 'Cart unavailable', 503);
  }
  const raw = await redis.get(req.cartKey);
  const data = raw ? JSON.parse(raw) : { items: [], couponCode: null, discount: 0 };
  data.couponCode = null;
  data.discount = 0;
  await redis.setEx(req.cartKey, req.cartTtl, JSON.stringify(data));
  const cart = await cartService.getCart(req.cartKey, req.cartTtl);
  success(res, cart);
});

module.exports = {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
  mergeCart,
  applyCoupon,
  removeCoupon,
};
