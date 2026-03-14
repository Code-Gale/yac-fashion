const Banner = require('./bannerModel');

const getAllBanners = async () => {
  return Banner.find().sort({ sortOrder: 1, createdAt: -1 });
};

const createBanner = async (data) => {
  return Banner.create(data);
};

const updateBanner = async (id, data) => {
  return Banner.findByIdAndUpdate(id, data, { new: true });
};

const deleteBanner = async (id) => {
  return Banner.findByIdAndDelete(id);
};

module.exports = {
  getAllBanners,
  createBanner,
  updateBanner,
  deleteBanner,
};
