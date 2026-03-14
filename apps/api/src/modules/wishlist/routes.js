const express = require('express');
const wishlistController = require('./controller');
const { auth } = require('../../middleware/auth');

const router = express.Router();

router.use(auth);

router.get('/', wishlistController.getWishlist);
router.post('/items', wishlistController.addItem);
router.delete('/items/:productId', wishlistController.removeItem);

module.exports = router;
