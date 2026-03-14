const express = require('express');
const reviewController = require('./controller');
const { auth } = require('../../middleware/auth');
const { validate } = require('../../middleware/validate');
const { body } = require('express-validator');

const router = express.Router({ mergeParams: true });

router.get('/', reviewController.getByProduct);

router.post(
  '/',
  auth,
  [
    body('orderId').notEmpty(),
    body('rating').isInt({ min: 1, max: 5 }),
    body('comment').isLength({ min: 10, max: 1000 }),
  ],
  validate,
  reviewController.create
);

module.exports = router;
