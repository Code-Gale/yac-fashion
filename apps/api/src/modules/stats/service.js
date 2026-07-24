const Order = require('../orders/model');
const Review = require('../reviews/model');
const Product = require('../products/model');
const { getCached, CACHE_KEYS } = require('../../utils/cache');

// Real, computed business metrics for homepage social-proof — never
// hardcoded/fabricated. Cached briefly since this aggregates across the
// whole orders/reviews collections and doesn't need to be live-to-the-second.
const getHomepageStats = async () => {
  return getCached(CACHE_KEYS.statsHomepage, async () => {
    const [customerAgg, stateAgg, ratingAgg, productCount] = await Promise.all([
      Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: { $ifNull: ['$userId', '$guestEmail'] } } },
        { $count: 'count' },
      ]),
      Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: '$shippingAddress.state' } },
        { $count: 'count' },
      ]),
      Review.aggregate([
        { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } },
      ]),
      Product.countDocuments({ isActive: true }),
    ]);
    return {
      customerCount: customerAgg[0]?.count || 0,
      statesCount: stateAgg[0]?.count || 0,
      avgRating: ratingAgg[0]?.average ? Math.round(ratingAgg[0].average * 10) / 10 : 0,
      reviewCount: ratingAgg[0]?.count || 0,
      productCount: productCount || 0,
    };
  });
};

module.exports = { getHomepageStats };
