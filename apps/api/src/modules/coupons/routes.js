const express = require('express');
const couponController = require('./controller');
const { couponRateLimiter } = require('../../middleware/rateLimiter');

const router = express.Router();

router.post('/validate', couponRateLimiter, couponController.validateCoupon);

module.exports = router;
