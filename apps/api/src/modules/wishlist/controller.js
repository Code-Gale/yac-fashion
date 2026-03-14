const wishlistService = require('./service');
const { success } = require('../../utils/response');
const { asyncHandler } = require('../../utils/asyncHandler');

const getWishlist = asyncHandler(async (req, res) => {
  const wishlist = await wishlistService.getWishlist(req.user.userId);
  success(res, wishlist);
});

const addItem = asyncHandler(async (req, res) => {
  const wishlist = await wishlistService.addItem(req.user.userId, req.body.productId);
  success(res, wishlist);
});

const removeItem = asyncHandler(async (req, res) => {
  const wishlist = await wishlistService.removeItem(req.user.userId, req.params.productId);
  success(res, wishlist);
});

module.exports = {
  getWishlist,
  addItem,
  removeItem,
};
