const rateLimit = require('express-rate-limit');

// Auth endpoints - strict (login, register, password reset)
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many authentication attempts, please try again later',
});

// Checkout endpoint - strict
const checkoutRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 checkouts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many checkout attempts, please try again later',
});

// Payment initialization - very strict
const paymentRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // 15 payment inits per window
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many payment requests, please try again later',
});

// Order tracking - moderate
const trackingRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30, // 30 tracking lookups per window
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many tracking requests, please try again later',
});

// Coupon validation - moderate
const couponRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 coupon checks per window
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many coupon validation attempts, please try again later',
});

// General API rate limiter - lenient, applied globally
const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests, please try again later',
});

module.exports = {
  authRateLimiter,
  checkoutRateLimiter,
  paymentRateLimiter,
  trackingRateLimiter,
  couponRateLimiter,
  globalRateLimiter,
};
