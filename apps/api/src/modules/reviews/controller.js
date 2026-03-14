const reviewService = require('./service');
const { success, error } = require('../../utils/response');
const { asyncHandler } = require('../../utils/asyncHandler');

const create = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { orderId, rating, comment } = req.body;
  const review = await reviewService.create(req.user.userId, productId, orderId, { rating, comment });
  success(res, review, 201);
});

const getByProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { page, limit } = req.query;
  const result = await reviewService.findByProduct(productId, page, limit);
  success(res, result);
});

module.exports = {
  create,
  getByProduct,
};
