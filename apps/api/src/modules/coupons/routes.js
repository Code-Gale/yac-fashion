const express = require('express');
const couponController = require('./controller');

const router = express.Router();

router.post('/validate', couponController.validateCoupon);

module.exports = router;
