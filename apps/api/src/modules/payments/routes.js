const express = require('express');
const paymentController = require('./controller');
const { auth } = require('../../middleware/auth');
const { optionalAuth } = require('../../middleware/optionalAuth');
const { paymentRateLimiter } = require('../../middleware/rateLimiter');
const { validate } = require('../../middleware/validate');
const { body } = require('express-validator');

const router = express.Router();

router.post(
  '/paystack/initialize',
  paymentRateLimiter,
  optionalAuth,
  [body('orderId').notEmpty(), body('guestEmail').optional().isEmail()],
  validate,
  paymentController.initiatePaystack
);

router.post(
  '/flutterwave/initialize',
  paymentRateLimiter,
  optionalAuth,
  [body('orderId').notEmpty(), body('guestEmail').optional().isEmail()],
  validate,
  paymentController.initiateFlutterwave
);

router.post(
  '/paystack/verify',
  auth,
  [body('reference').notEmpty()],
  validate,
  paymentController.verifyPaystack
);

router.post(
  '/flutterwave/verify',
  auth,
  [body('transactionId').notEmpty()],
  validate,
  paymentController.verifyFlutterwave
);

module.exports = router;
