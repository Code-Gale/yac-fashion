const express = require('express');
const reviewController = require('./controller');
const { auth } = require('../../middleware/auth');

const router = express.Router();

router.get('/product/:productId', reviewController.getByProduct);

router.use(auth);

router.post('/', reviewController.create);
router.get('/me', reviewController.getMyReviews);

module.exports = router;
