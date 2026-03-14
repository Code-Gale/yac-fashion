const Product = require('./model');
const Category = require('../categories/model');
const { deleteFromMinio } = require('../../utils/upload');

const getSort = (sortParam) => {
  switch (sortParam) {
    case 'price_asc': return { price: 1 };
    case 'price_desc': return { price: -1 };
    case 'newest': return { createdAt: -1 };
    case 'popular': return { 'ratings.count': -1 };
    default: return { createdAt: -1 };
  }
};

const findAll = async (params) => {
  const page = Math.max(1, parseInt(params.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(params.limit) || 20));
  const skip = (page - 1) * limit;
  const sort = getSort(params.sort);
  const query = { isActive: true };
  if (params.category) {
    const cat = await Category.findOne({ slug: params.category, isActive: true });
    if (cat) query.category = cat._id;
  }
  if (params.minPrice != null) query.price = { ...(query.price || {}), $gte: Number(params.minPrice) };
  if (params.maxPrice != null) query.price = { ...(query.price || {}), $lte: Number(params.maxPrice) };
  if (params.minRating != null) query['ratings.average'] = { $gte: Number(params.minRating) };
  if (params.inStock === 'true' || params.inStock === true) query.stock = { $gt: 0 };
  const [products, total] = await Promise.all([
    Product.find(query).populate('category').sort(sort).skip(skip).limit(limit),
    Product.countDocuments(query),
  ]);
  return { products, total, page, totalPages: Math.ceil(total / limit) };
};

const findBySlug = async (slug) => {
  return Product.findOne({ slug, isActive: true }).populate('category');
};

const findFeatured = async () => {
  return Product.find({ isFeatured: true, isActive: true }).populate('category').limit(8);
};

const search = async (q) => {
  if (!q || typeof q !== 'string' || !q.trim()) {
    return [];
  }
  return Product.find({
    $text: { $search: q.trim() },
    isActive: true,
  }).populate('category').limit(50);
};

const create = async (data) => {
  return Product.create(data);
};

const update = async (id, data) => {
  if (data.images && Array.isArray(data.images)) {
    const existing = await Product.findById(id).select('images');
    if (existing && existing.images) {
      const toRemove = existing.images.filter((url) => !data.images.includes(url));
      await Promise.all(toRemove.map((url) => deleteFromMinio(url)));
    }
  }
  return Product.findByIdAndUpdate(id, data, { new: true }).populate('category');
};

const softDelete = async (id) => {
  const product = await Product.findById(id);
  if (product && product.images && product.images.length > 0) {
    await Promise.all(product.images.map((url) => deleteFromMinio(url)));
  }
  return Product.findByIdAndUpdate(id, { isActive: false }, { new: true });
};

const updateStock = async (id, stock) => {
  return Product.findByIdAndUpdate(id, { stock: Math.max(0, Number(stock)) }, { new: true });
};

const findById = async (id) => {
  return Product.findById(id).populate('category');
};

const findAllForAdmin = async (params) => {
  const page = Math.max(1, parseInt(params.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(params.limit) || 20));
  const skip = (page - 1) * limit;
  const query = {};
  if (params.search && params.search.trim()) {
    query.$or = [
      { name: { $regex: params.search.trim(), $options: 'i' } },
      { slug: { $regex: params.search.trim(), $options: 'i' } },
    ];
  }
  if (params.category) query.category = params.category;
  if (params.status === 'active') query.isActive = true;
  if (params.status === 'draft') query.isActive = false;
  const [products, total] = await Promise.all([
    Product.find(query).populate('category', 'name slug').sort({ createdAt: -1 }).skip(skip).limit(limit),
    Product.countDocuments(query),
  ]);
  return { products, total, page, totalPages: Math.ceil(total / limit) };
};

const findRelated = async (slug) => {
  const product = await Product.findOne({ slug, isActive: true });
  if (!product) return [];
  return Product.find({
    _id: { $ne: product._id },
    category: product.category,
    isActive: true,
  })
    .sort({ 'ratings.count': -1 })
    .limit(6)
    .populate('category');
};

const findFlashSale = async () => {
  const now = new Date();
  return Product.find({
    isActive: true,
    flashSalePrice: { $exists: true, $ne: null },
    flashSaleEndsAt: { $gt: now },
  }).populate('category');
};

const updateFlashSale = async (id, data) => {
  if (data === null || (data.flashSalePrice == null && data.flashSaleEndsAt == null)) {
    return Product.findByIdAndUpdate(
      id,
      { $unset: { flashSalePrice: '', flashSaleEndsAt: '' } },
      { new: true }
    ).populate('category');
  }
  const update = {};
  if (data.flashSalePrice != null) update.flashSalePrice = data.flashSalePrice;
  if (data.flashSaleEndsAt != null) update.flashSaleEndsAt = data.flashSaleEndsAt;
  return Product.findByIdAndUpdate(id, update, { new: true }).populate('category');
};

module.exports = {
  findAll,
  findAllForAdmin,
  findBySlug,
  findFeatured,
  search,
  create,
  update,
  softDelete,
  updateStock,
  findById,
  findRelated,
  findFlashSale,
  updateFlashSale,
};
