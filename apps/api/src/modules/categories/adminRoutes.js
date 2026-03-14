const express = require('express');
const categoryController = require('./controller');
const { validate } = require('../../middleware/validate');
const { body } = require('express-validator');

const router = express.Router();

router.get('/', categoryController.getAllForAdmin);

router.post(
  '/',
  [
    body('name').trim().notEmpty(),
    body('slug').optional().trim(),
    body('description').optional().trim(),
    body('image').optional().trim(),
    body('isActive').optional().isBoolean(),
  ],
  validate,
  categoryController.create
);

router.put(
  '/:id',
  [
    body('name').optional().trim().notEmpty(),
    body('slug').optional().trim(),
    body('description').optional().trim(),
    body('image').optional().trim(),
    body('isActive').optional().isBoolean(),
  ],
  validate,
  categoryController.update
);

router.delete('/:id', categoryController.remove);

module.exports = router;
