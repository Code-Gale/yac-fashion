const express = require('express');
const adminController = require('./controller');
const uploadController = require('./uploadController');
const { auth } = require('../../middleware/auth');
const { adminOnly } = require('../../middleware/adminOnly');
const { adminFullAccess, staffAllowed } = require('../../middleware/staffAllowed');
const { uploadImages } = require('../../middleware/upload');
const { validate } = require('../../middleware/validate');
const { body } = require('express-validator');

const categoryAdminRoutes = require('../categories/adminRoutes');
const productAdminRoutes = require('../products/adminRoutes');

const router = express.Router();

router.use(auth);
router.use(adminOnly);

router.get('/dashboard', adminFullAccess, adminController.getDashboard);

router.get('/customers', adminFullAccess, adminController.getCustomers);
router.get('/customers/:id', adminFullAccess, adminController.getCustomerById);
router.put(
  '/customers/:id/status',
  adminFullAccess,
  [body('isActive').isBoolean()],
  validate,
  adminController.updateCustomerStatus
);
router.put(
  '/customers/:id/role',
  adminFullAccess,
  [body('role').isIn(['admin', 'staff', 'customer'])],
  validate,
  adminController.updateCustomerRole
);

router.get('/orders', staffAllowed, adminController.getOrders);
router.get('/orders/:id', staffAllowed, adminController.getOrderById);
router.put(
  '/orders/:id/status',
  staffAllowed,
  [body('status').isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'])],
  validate,
  adminController.updateOrderStatus
);
router.put(
  '/orders/:id/payment',
  staffAllowed,
  [
    body('paymentStatus').optional().isIn(['pending', 'paid', 'failed']),
    body('paymentRef').optional().trim(),
  ],
  validate,
  adminController.updateOrderPayment
);

router.get('/coupons', adminFullAccess, adminController.getCoupons);
router.post(
  '/coupons',
  adminFullAccess,
  [
    body('code').trim().notEmpty(),
    body('type').isIn(['percent', 'flat']),
    body('value').isFloat({ min: 0 }),
    body('minOrderAmount').optional().isFloat({ min: 0 }),
    body('usageLimit').optional().isInt({ min: 0 }),
    body('expiresAt').optional().isISO8601(),
    body('isActive').optional().isBoolean(),
  ],
  validate,
  adminController.createCoupon
);
router.put(
  '/coupons/:id',
  adminFullAccess,
  [
    body('code').optional().trim().notEmpty(),
    body('type').optional().isIn(['percent', 'flat']),
    body('value').optional().isFloat({ min: 0 }),
    body('minOrderAmount').optional().isFloat({ min: 0 }),
    body('usageLimit').optional().isInt({ min: 0 }),
    body('expiresAt').optional().isISO8601(),
    body('isActive').optional().isBoolean(),
  ],
  validate,
  adminController.updateCoupon
);
router.delete('/coupons/:id', adminFullAccess, adminController.deleteCoupon);
router.get('/coupons/:id/usage', adminFullAccess, adminController.getCouponUsage);

router.get('/inventory', staffAllowed, adminController.getInventory);
router.put(
  '/inventory/:productId',
  staffAllowed,
  [body('stock').isInt({ min: 0 })],
  validate,
  adminController.updateInventoryStock
);

router.get('/reports/sales', adminFullAccess, adminController.getSalesReport);

router.get('/banners', adminFullAccess, adminController.getBanners);
router.post(
  '/banners',
  adminFullAccess,
  [
    body('title').optional().trim(),
    body('subtitle').optional().trim(),
    body('imageUrl').trim().notEmpty(),
    body('ctaText').optional().trim(),
    body('ctaLink').optional().trim(),
    body('position').optional().isIn(['hero', 'category', 'sidebar']),
    body('isActive').optional().isBoolean(),
    body('sortOrder').optional().isInt(),
    body('startDate').optional().isISO8601(),
    body('endDate').optional().isISO8601(),
  ],
  validate,
  adminController.createBanner
);
router.put(
  '/banners/:id',
  adminFullAccess,
  [
    body('title').optional().trim(),
    body('subtitle').optional().trim(),
    body('imageUrl').optional().trim().notEmpty(),
    body('ctaText').optional().trim(),
    body('ctaLink').optional().trim(),
    body('position').optional().isIn(['hero', 'category', 'sidebar']),
    body('isActive').optional().isBoolean(),
    body('sortOrder').optional().isInt(),
    body('startDate').optional().isISO8601(),
    body('endDate').optional().isISO8601(),
  ],
  validate,
  adminController.updateBanner
);
router.delete('/banners/:id', adminFullAccess, adminController.deleteBanner);

router.get('/abandoned-carts', adminFullAccess, adminController.getAbandonedCarts);

router.post(
  '/upload',
  adminFullAccess,
  (req, res, next) => {
    uploadImages(req, res, (err) => {
      if (err) {
        const msg = err.code === 'LIMIT_FILE_SIZE' ? 'File too large (max 5MB)' : err.message;
        return res.status(400).json({ success: false, message: msg });
      }
      next();
    });
  },
  uploadController.uploadImages
);

router.use('/categories', adminFullAccess, categoryAdminRoutes);
router.use('/products', adminFullAccess, productAdminRoutes);

module.exports = router;
