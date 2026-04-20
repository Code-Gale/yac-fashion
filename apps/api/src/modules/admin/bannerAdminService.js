const Banner = require('./bannerModel');
const { invalidateCacheKeys, CACHE_KEYS } = require('../../utils/cache');

const getAllBanners = async () => {
  return Banner.find().sort({ sortOrder: 1, createdAt: -1 });
};

const createBanner = async (data) => {
  const doc = await Banner.create(data);
  await invalidateCacheKeys([CACHE_KEYS.banners]);
  return doc;
};

const updateBanner = async (id, data) => {
  const doc = await Banner.findByIdAndUpdate(id, data, { new: true });
  await invalidateCacheKeys([CACHE_KEYS.banners]);
  return doc;
};

const deleteBanner = async (id) => {
  const doc = await Banner.findByIdAndDelete(id);
  await invalidateCacheKeys([CACHE_KEYS.banners]);
  return doc;
};

module.exports = {
  getAllBanners,
  createBanner,
  updateBanner,
  deleteBanner,
};
