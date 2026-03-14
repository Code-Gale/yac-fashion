const express = require('express');
const orderController = require('./controller');
const { optionalAuth } = require('../../middleware/optionalAuth');
const { auth } = require('../../middleware/auth');
const { cartContextOptional } = require('../../middleware/cartContext');
const { validate } = require('../../middleware/validate');
const { body } = require('express-validator');

const router = express.Router();

router.get('/track', orderController.track);

router.post(
  '/checkout',
  optionalAuth,
  cartContextOptional,
  [
    body('guestEmail').optional().isEmail(),
    body('items').isArray({ min: 1 }),
    body('items.*.productId').notEmpty(),
    body('items.*.quantity').isInt({ min: 1 }),
    body('shippingAddress').isObject(),
    body('shippingAddress.name').trim().notEmpty(),
    body('shippingAddress.street').trim().notEmpty(),
    body('shippingAddress.city').trim().notEmpty(),
    body('shippingAddress.state').trim().notEmpty(),
    body('shippingAddress.phone').trim().notEmpty(),
    body('shippingOption').isObject(),
    body('shippingOption.label').trim().notEmpty(),
    body('shippingOption.price').isFloat({ min: 0 }),
    body('paymentMethod').isIn(['paystack', 'flutterwave', 'bank_transfer', 'cash_on_delivery']),
    body('couponCode').optional().trim(),
  ],
  validate,
  orderController.checkout
);

module.exports = router;
