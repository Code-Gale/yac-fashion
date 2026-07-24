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

// Real, verified-purchase reviews only (Review docs can only be created
// against a delivered order — see create() above) — used for homepage
// social proof. Never fabricate testimonials; if there aren't enough
// genuine high-rated reviews yet, this simply returns fewer/none and the
// homepage section hides itself.
const getFeatured = async (limit = 9) => {
  const reviews = await Review.find({ rating: { $gte: 4 } })
    .sort({ rating: -1, createdAt: -1 })
    .limit(Math.min(20, Math.max(1, limit)))
    .populate('userId', 'name')
    .populate('productId', 'name slug images');
  return reviews
    .filter((r) => r.userId && r.productId)
    .map((r) => {
      // Match the "First L." format already used for reviews on product
      // pages — never expose a customer's full name.
      const parts = (r.userId?.name || '').trim().split(/\s+/).filter(Boolean);
      const customerName = parts.length
        ? `${parts[0]}${parts[1] ? ` ${parts[1][0]}.` : ''}`
        : 'Verified Buyer';
      return {
        _id: r._id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        customerName,
        product: r.productId
          ? { name: r.productId.name, slug: r.productId.slug, image: r.productId.images?.[0] || null }
          : null,
      };
    });
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
  getFeatured,
};
