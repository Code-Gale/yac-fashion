const express = require('express');
const productController = require('./controller');
const productService = require('./service');
const { success } = require('../../utils/response');
const { asyncHandler } = require('../../utils/asyncHandler');
const { validate } = require('../../middleware/validate');
const { body } = require('express-validator');

const router = express.Router();

router.get('/', asyncHandler(async (req, res) => {
  const result = await productService.findAllForAdmin(req.query);
  success(res, result);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const product = await productService.findById(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  success(res, product);
}));

router.post(
  '/',
  [
    body('name').trim().notEmpty(),
    body('description').trim().notEmpty(),
    body('category').isMongoId(),
    body('images').isArray({ min: 1 }),
    body('images.*').isString(),
    body('price').isFloat({ min: 0 }),
    body('compareAtPrice').optional().isFloat({ min: 0 }),
    body('stock').optional().isInt({ min: 0 }),
    body('sku').optional().trim(),
    body('tags').optional().isArray(),
    body('tags.*').optional().isString(),
    body('isFeatured').optional().isBoolean(),
    body('isActive').optional().isBoolean(),
  ],
  validate,
  productController.create
);

router.put(
  '/:id',
  [
    body('name').optional().trim().notEmpty(),
    body('slug').optional().trim(),
    body('description').optional().trim().notEmpty(),
    body('category').optional().isMongoId(),
    body('images').optional().isArray({ min: 1 }),
    body('images.*').optional().isString(),
    body('price').optional().isFloat({ min: 0 }),
    body('compareAtPrice').optional().isFloat({ min: 0 }),
    body('stock').optional().isInt({ min: 0 }),
    body('sku').optional().trim(),
    body('tags').optional().isArray(),
    body('tags.*').optional().isString(),
    body('isFeatured').optional().isBoolean(),
    body('isActive').optional().isBoolean(),
  ],
  validate,
  productController.update
);

router.put(
  '/:id/stock',
  [body('stock').isInt({ min: 0 })],
  validate,
  productController.updateStock
);

router.put(
  '/:id/flash-sale',
  [
    body('flashSalePrice').optional().isFloat({ min: 0 }),
    body('flashSaleEndsAt').optional().isISO8601(),
  ],
  validate,
  productController.updateFlashSale
);

router.delete('/:id', productController.remove);

module.exports = router;
