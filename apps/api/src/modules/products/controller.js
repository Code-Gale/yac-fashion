const productService = require('./service');
const { success, error } = require('../../utils/response');
const { asyncHandler } = require('../../utils/asyncHandler');

const getAll = asyncHandler(async (req, res) => {
  const result = await productService.findAll(req.query);
  success(res, result);
});

const getBySlug = asyncHandler(async (req, res) => {
  const product = await productService.findBySlug(req.params.slug);
  if (!product) {
    return error(res, 'Product not found', 404);
  }
  success(res, product);
});

const getFeatured = asyncHandler(async (req, res) => {
  const products = await productService.findFeatured();
  success(res, products);
});

const searchProducts = asyncHandler(async (req, res) => {
  const q = req.query.q || '';
  const products = await productService.search(q);
  success(res, products);
});

const getRelated = asyncHandler(async (req, res) => {
  const products = await productService.findRelated(req.params.slug);
  success(res, products);
});

const getFlashSale = asyncHandler(async (req, res) => {
  const products = await productService.findFlashSale();
  success(res, products);
});

const create = asyncHandler(async (req, res) => {
  const product = await productService.create(req.body);
  success(res, product, 201);
});

const update = asyncHandler(async (req, res) => {
  const product = await productService.update(req.params.id, req.body);
  if (!product) {
    return error(res, 'Product not found', 404);
  }
  success(res, product);
});

const remove = asyncHandler(async (req, res) => {
  const product = await productService.softDelete(req.params.id);
  if (!product) {
    return error(res, 'Product not found', 404);
  }
  success(res, { message: 'Product deactivated' });
});

const updateStock = asyncHandler(async (req, res) => {
  const product = await productService.updateStock(req.params.id, req.body.stock);
  if (!product) {
    return error(res, 'Product not found', 404);
  }
  success(res, product);
});

const updateFlashSale = asyncHandler(async (req, res) => {
  const body = req.body;
  const data = body.flashSalePrice != null || body.flashSaleEndsAt != null
    ? { flashSalePrice: body.flashSalePrice, flashSaleEndsAt: body.flashSaleEndsAt }
    : null;
  const product = await productService.updateFlashSale(req.params.id, data);
  if (!product) {
    return error(res, 'Product not found', 404);
  }
  success(res, product);
});

module.exports = {
  getAll,
  getBySlug,
  getFeatured,
  searchProducts,
  getRelated,
  getFlashSale,
  create,
  update,
  remove,
  updateStock,
  updateFlashSale,
};
