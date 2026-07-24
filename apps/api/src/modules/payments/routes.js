const express = require('express');
const paymentController = require('./controller');
const { optionalAuth } = require('../../middleware/optionalAuth');
const { paymentRateLimiter } = require('../../middleware/rateLimiter');
const { validate } = require('../../middleware/validate');
const { body } = require('express-validator');

const router = express.Router();

router.post(
  '/paystack/initialize',
  paymentRateLimiter,
  optionalAuth,
  [
    body('orderId').optional().notEmpty(),
    body('orderNumber').optional().trim().notEmpty(),
    body().custom((value) => {
      if (!value.orderId && !value.orderNumber) throw new Error('orderId or orderNumber required');
      return true;
    }),
    body('guestEmail').optional().isEmail(),
  ],
  validate,
  paymentController.initiatePaystack
);

router.post(
  '/flutterwave/initialize',
  paymentRateLimiter,
  optionalAuth,
  [
    body('orderId').optional().notEmpty(),
    body('orderNumber').optional().trim().notEmpty(),
    body().custom((value) => {
      if (!value.orderId && !value.orderNumber) throw new Error('orderId or orderNumber required');
      return true;
    }),
    body('guestEmail').optional().isEmail(),
  ],
  validate,
  paymentController.initiateFlutterwave
);

// Verify endpoints are called by the client when it returns from the gateway
// (fallback in case the webhook is delayed/misconfigured) — guests included,
// so these use optionalAuth + guestEmail ownership rather than requiring login.
router.post(
  '/paystack/verify',
  paymentRateLimiter,
  optionalAuth,
  [
    body('orderNumber').trim().notEmpty(),
    body('reference').trim().notEmpty(),
    body('guestEmail').optional().isEmail(),
  ],
  validate,
  paymentController.verifyPaystack
);

router.post(
  '/flutterwave/verify',
  paymentRateLimiter,
  optionalAuth,
  [
    body('orderNumber').trim().notEmpty(),
    body('transactionId').trim().notEmpty(),
    body('guestEmail').optional().isEmail(),
  ],
  validate,
  paymentController.verifyFlutterwave
);

module.exports = router;
