const express = require('express');
const productController = require('./controller');
const reviewRoutes = require('../reviews/productReviewRoutes');

const router = express.Router();

router.get('/featured', productController.getFeatured);
router.get('/search', productController.searchProducts);
router.get('/flash-sale', productController.getFlashSale);
router.get('/', productController.getAll);
router.get('/:slug/related', productController.getRelated);
router.use('/:productId/reviews', reviewRoutes);
router.get('/:slug', productController.getBySlug);

module.exports = router;
