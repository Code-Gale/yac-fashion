const Banner = require('../admin/bannerModel');

const getActiveBanners = async () => {
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
};

module.exports = { getActiveBanners };
