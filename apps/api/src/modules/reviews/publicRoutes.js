const express = require('express');
const reviewController = require('./controller');

const router = express.Router();

// Public, site-wide feed of real verified-purchase reviews for homepage
// social proof — distinct from productReviewRoutes.js, which is scoped to
// a single product's reviews.
router.get('/featured', reviewController.getFeatured);

module.exports = router;
