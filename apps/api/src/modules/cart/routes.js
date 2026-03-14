const express = require('express');
const cartController = require('./controller');
const { optionalAuth } = require('../../middleware/optionalAuth');
const { auth } = require('../../middleware/auth');
const { cartContext, cartContextOptional } = require('../../middleware/cartContext');
const { validate } = require('../../middleware/validate');
const { body } = require('express-validator');

const router = express.Router();

router.use(optionalAuth);

router.get(
  '/',
  cartContextOptional,
  cartController.getCart
);

router.post(
  '/items',
  cartContext,
  [body('productId').notEmpty(), body('quantity').optional().isInt({ min: 1 })],
  validate,
  cartController.addItem
);

router.put(
  '/items/:productId',
  cartContext,
  [body('quantity').isInt({ min: 0 })],
  validate,
  cartController.updateItem
);

router.delete(
  '/items/:productId',
  cartContext,
  cartController.removeItem
);

router.delete(
  '/',
  cartContext,
  cartController.clearCart
);

router.post(
  '/merge',
  auth,
  cartController.mergeCart
);

router.post(
  '/coupon',
  cartContext,
  [body('code').trim().notEmpty()],
  validate,
  cartController.applyCoupon
);

router.delete(
  '/coupon',
  cartContext,
  cartController.removeCoupon
);

module.exports = router;
