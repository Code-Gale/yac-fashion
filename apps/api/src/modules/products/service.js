const Product = require('./model');
const Category = require('../categories/model');
const { deleteFromMinio } = require('../../utils/upload');
const { getCached, invalidateCacheKeys, CACHE_KEYS } = require('../../utils/cache');

const LIST_PROJECTION =
  'name slug price compareAtPrice flashSalePrice flashSaleEndsAt images category stock isActive isFeatured ratings';

const invalidateProductPublicCaches = () =>
  invalidateCacheKeys([CACHE_KEYS.productsFeatured, CACHE_KEYS.productsFlashSale]);

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
    Product.find(query)
      .select(LIST_PROJECTION)
      .populate('category', 'name slug')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(query),
  ]);
  return { products, total, page, totalPages: Math.ceil(total / limit) };
};

const findBySlug = async (slug) => {
  return Product.findOne({ slug, isActive: true }).populate('category');
};

const findFeatured = async () => {
  return getCached(CACHE_KEYS.productsFeatured, async () => {
    const products = await Product.find({ isFeatured: true, isActive: true })
      .select(LIST_PROJECTION)
      .populate('category', 'name slug')
      .limit(8)
      .lean();
    return products;
  });
};

const search = async (q) => {
  if (!q || typeof q !== 'string' || !q.trim()) {
    return [];
  }
  return Product.find({
    $text: { $search: q.trim() },
    isActive: true,
  })
    .select(LIST_PROJECTION)
    .populate('category', 'name slug')
    .limit(50)
    .lean();
};

const create = async (data) => {
  const created = await Product.create(data);
  await invalidateProductPublicCaches();
  return created;
};

const update = async (id, data) => {
  if (data.images && Array.isArray(data.images)) {
    const existing = await Product.findById(id).select('images');
    if (existing && existing.images) {
      const toRemove = existing.images.filter((url) => !data.images.includes(url));
      await Promise.all(toRemove.map((url) => deleteFromMinio(url)));
    }
  }
  const updated = await Product.findByIdAndUpdate(id, data, { new: true }).populate('category');
  await invalidateProductPublicCaches();
  return updated;
};

const softDelete = async (id) => {
  const product = await Product.findById(id);
  if (product && product.images && product.images.length > 0) {
    await Promise.all(product.images.map((url) => deleteFromMinio(url)));
  }
  const result = await Product.findByIdAndUpdate(id, { isActive: false }, { new: true });
  await invalidateProductPublicCaches();
  return result;
};

const updateStock = async (id, stock) => {
  const updated = await Product.findByIdAndUpdate(
    id,
    { stock: Math.max(0, Number(stock)) },
    { new: true }
  );
  await invalidateProductPublicCaches();
  return updated;
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
    .select(LIST_PROJECTION)
    .populate('category', 'name slug')
    .sort({ 'ratings.count': -1 })
    .limit(6)
    .lean();
};

const findFlashSale = async () => {
  const now = new Date();
  return getCached(CACHE_KEYS.productsFlashSale, async () => {
    const products = await Product.find({
      isActive: true,
      flashSalePrice: { $exists: true, $ne: null },
      flashSaleEndsAt: { $gt: now },
    })
      .select(LIST_PROJECTION)
      .populate('category', 'name slug')
      .limit(12)
      .lean();
    return products;
  });
};

const updateFlashSale = async (id, data) => {
  let updated;
  if (data === null || (data.flashSalePrice == null && data.flashSaleEndsAt == null)) {
    updated = await Product.findByIdAndUpdate(
      id,
      { $unset: { flashSalePrice: '', flashSaleEndsAt: '' } },
      { new: true }
    ).populate('category');
  } else {
    const update = {};
    if (data.flashSalePrice != null) update.flashSalePrice = data.flashSalePrice;
    if (data.flashSaleEndsAt != null) update.flashSaleEndsAt = data.flashSaleEndsAt;
    updated = await Product.findByIdAndUpdate(id, update, { new: true }).populate('category');
  }
  await invalidateProductPublicCaches();
  return updated;
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
