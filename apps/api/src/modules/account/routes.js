const express = require('express');
const orderController = require('../orders/controller');
const wishlistController = require('../wishlist/controller');
const addressController = require('./addressController');
const profileController = require('./profileController');
const { auth } = require('../../middleware/auth');
const { validate } = require('../../middleware/validate');
const { body } = require('express-validator');

const router = express.Router();

router.use(auth);

router.put('/profile', [body('name').trim().notEmpty()], validate, profileController.updateProfile);
router.put('/password', [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 8 }),
], validate, profileController.changePassword);

router.get('/orders', orderController.getMyOrders);
router.get('/orders/:id/reviewed-products', orderController.getReviewedProducts);
router.get('/orders/:id', orderController.getOrderById);

router.get('/wishlist', wishlistController.getWishlist);
router.post('/wishlist', [body('productId').notEmpty()], validate, wishlistController.addItem);
router.delete('/wishlist/:productId', wishlistController.removeItem);

router.get('/addresses', addressController.getAddresses);
router.post(
  '/addresses',
  [
    body('label').optional().trim(),
    body('name').optional().trim(),
    body('street').trim().notEmpty(),
    body('city').trim().notEmpty(),
    body('state').trim().notEmpty(),
    body('phone').trim().notEmpty(),
    ],
  validate,
  addressController.addAddress
);
router.put(
  '/addresses/:addressId',
  [
    body('label').optional().trim(),
    body('name').optional().trim(),
    body('street').optional().trim().notEmpty(),
    body('city').optional().trim().notEmpty(),
    body('state').optional().trim().notEmpty(),
    body('phone').optional().trim().notEmpty(),
  ],
  validate,
  addressController.updateAddress
);
router.delete('/addresses/:addressId', addressController.deleteAddress);
router.post('/addresses/:addressId/default', addressController.setDefaultAddress);

module.exports = router;
