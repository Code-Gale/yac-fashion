const categoryService = require('./service');
const { success, error } = require('../../utils/response');
const { asyncHandler } = require('../../utils/asyncHandler');

const getAll = asyncHandler(async (req, res) => {
  const categories = await categoryService.findAllActive();
  success(res, categories);
});

const getBySlug = asyncHandler(async (req, res) => {
  const category = await categoryService.getCategoryWithProductCount(req.params.slug);
  if (!category) {
    return error(res, 'Category not found', 404);
  }
  success(res, category);
});

const create = asyncHandler(async (req, res) => {
  const category = await categoryService.create(req.body);
  success(res, category, 201);
});

const update = asyncHandler(async (req, res) => {
  const category = await categoryService.update(req.params.id, req.body);
  if (!category) {
    return error(res, 'Category not found', 404);
  }
  success(res, category);
});

const remove = asyncHandler(async (req, res) => {
  const result = await categoryService.remove(req.params.id);
  if (!result) {
    return error(res, 'Category not found', 404);
  }
  if (result.hardDeleted) {
    return success(res, { message: 'Category deleted' });
  }
  success(res, {
    message: `Category hidden (${result.productCount} linked product${result.productCount === 1 ? '' : 's'} remain)`,
    deactivated: true,
  });
});

const getAllForAdmin = asyncHandler(async (req, res) => {
  const categories = await categoryService.findAllForAdmin();
  success(res, categories);
});

module.exports = {
  getAll,
  getBySlug,
  create,
  update,
  remove,
  getAllForAdmin,
};
