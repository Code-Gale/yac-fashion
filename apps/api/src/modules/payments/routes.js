const express = require('express');
const paymentController = require('./controller');
const { auth } = require('../../middleware/auth');
const { validate } = require('../../middleware/validate');
const { body } = require('express-validator');

const router = express.Router();

router.post(
  '/paystack/initialize',
  [body('orderId').notEmpty()],
  validate,
  paymentController.initiatePaystack
);

router.post(
  '/flutterwave/initialize',
  [body('orderId').notEmpty()],
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
