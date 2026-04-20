const Banner = require('../admin/bannerModel');
const { getCached, CACHE_KEYS } = require('../../utils/cache');

const getActiveBanners = async () => {
  return getCached(CACHE_KEYS.banners, async () => {
    const now = new Date();
    return Banner.find({
      isActive: true,
      $and: [
        { $or: [{ startDate: null }, { startDate: { $lte: now } }] },
        { $or: [{ endDate: null }, { endDate: { $gte: now } }] },
      ],
    })
      .sort({ sortOrder: 1, createdAt: 1 })
      .lean();
  });
};

module.exports = { getActiveBanners };
