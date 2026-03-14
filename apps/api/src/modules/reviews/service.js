const mongoose = require('mongoose');
const Review = require('./model');
const Order = require('../orders/model');
const Product = require('../products/model');

const create = async (userId, productId, orderId, data) => {
  if (!mongoose.Types.ObjectId.isValid(productId) || !mongoose.Types.ObjectId.isValid(orderId)) {
    const err = new Error('Invalid product or order');
    err.statusCode = 400;
    throw err;
  }
  const deliveredOrder = await Order.findOne({
    _id: orderId,
    userId,
    status: 'delivered',
    'items.productId': new mongoose.Types.ObjectId(productId),
  });
  if (!deliveredOrder) {
    const err = new Error('You must have a delivered order containing this product to review');
    err.statusCode = 403;
    throw err;
  }
  const existing = await Review.findOne({ productId, userId, orderId });
  if (existing) {
    const err = new Error('You have already reviewed this product for this order');
    err.statusCode = 409;
    throw err;
  }
  const review = await Review.create({
    productId,
    userId,
    orderId,
    rating: data.rating,
    comment: data.comment,
  });
  const agg = await Review.aggregate([
    { $match: { productId: review.productId } },
    { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const result = agg[0] || { average: 0, count: 0 };
  await Product.findByIdAndUpdate(productId, {
    'ratings.average': Math.round(result.average * 100) / 100,
    'ratings.count': result.count,
  });
  return review;
};

const findByProduct = async (productId, page = 1, limit = 20) => {
  const skip = (Math.max(1, page) - 1) * Math.min(50, Math.max(1, limit));
  const [reviews, total] = await Promise.all([
    Review.find({ productId }).populate('userId', 'name').sort({ createdAt: -1 }).skip(skip).limit(limit),
    Review.countDocuments({ productId }),
  ]);
  return { reviews, total, page: Math.max(1, page), totalPages: Math.ceil(total / Math.min(50, Math.max(1, limit))) };
};

module.exports = {
  create,
  findByProduct,
};
