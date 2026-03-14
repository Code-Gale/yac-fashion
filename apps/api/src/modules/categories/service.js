const Category = require('./model');
const Product = require('../products/model');

const findAllActive = async () => {
  return Category.find({ isActive: true }).sort({ name: 1 });
};

const findBySlug = async (slug) => {
  return Category.findOne({ slug, isActive: true });
};

const getCategoryWithProductCount = async (slug) => {
  const category = await Category.findOne({ slug, isActive: true });
  if (!category) return null;
  const count = await Product.countDocuments({ category: category._id, isActive: true });
  return { ...category.toObject(), productCount: count };
};

const create = async (data) => {
  return Category.create(data);
};

const update = async (id, data) => {
  return Category.findByIdAndUpdate(id, data, { new: true });
};

const softDelete = async (id) => {
  return Category.findByIdAndUpdate(id, { isActive: false }, { new: true });
};

const findAllForAdmin = async () => {
  const categories = await Category.find().sort({ name: 1 }).lean();
  const counts = await Product.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);
  const countMap = Object.fromEntries(counts.map((c) => [c._id?.toString(), c.count]));
  return categories.map((c) => ({ ...c, productCount: countMap[c._id?.toString()] ?? 0 }));
};

const findById = async (id) => {
  return Category.findById(id);
};

module.exports = {
  findAllActive,
  findBySlug,
  getCategoryWithProductCount,
  create,
  update,
  softDelete,
  findAllForAdmin,
  findById,
};
