const dashboardService = require('./dashboardService');
const customerService = require('./customerService');
const orderAdminService = require('./orderAdminService');
const couponAdminService = require('./couponAdminService');
const inventoryService = require('./inventoryService');
const reportService = require('./reportService');
const bannerAdminService = require('./bannerAdminService');
const abandonedCartService = require('./abandonedCartService');
const { invalidateCacheKeys, CACHE_KEYS } = require('../../utils/cache');
const { success, error } = require('../../utils/response');
const { asyncHandler } = require('../../utils/asyncHandler');

const getDashboard = asyncHandler(async (req, res) => {
  const data = await dashboardService.getDashboard();
  success(res, data);
});

const getCustomers = asyncHandler(async (req, res) => {
  const { page, limit, search } = req.query;
  const data = await customerService.getCustomers(page, limit, search);
  success(res, data);
});

const getCustomerById = asyncHandler(async (req, res) => {
  const customer = await customerService.getCustomerById(req.params.id);
  if (!customer) return error(res, 'Customer not found', 404);
  success(res, customer);
});

const updateCustomerStatus = asyncHandler(async (req, res) => {
  const customer = await customerService.updateCustomerStatus(req.params.id, req.body.isActive);
  if (!customer) return error(res, 'Customer not found', 404);
  success(res, customer);
});

const updateCustomerRole = asyncHandler(async (req, res) => {
  const user = await customerService.updateCustomerRole(req.params.id, req.body.role);
  if (!user) return error(res, 'User not found', 404);
  success(res, user);
});

const getOrders = asyncHandler(async (req, res) => {
  const data = await orderAdminService.getOrders(req.query);
  success(res, data);
});

const getOrderById = asyncHandler(async (req, res) => {
  const order = await orderAdminService.getOrderById(req.params.id);
  if (!order) return error(res, 'Order not found', 404);
  success(res, order);
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  try {
    const order = await orderAdminService.updateOrderStatus(req.params.id, req.body.status);
    if (!order) return error(res, 'Order not found', 404);
    success(res, order);
  } catch (err) {
    if (err.statusCode === 400) return error(res, err.message, 400);
    throw err;
  }
});

const updateOrderPayment = asyncHandler(async (req, res) => {
  const order = await orderAdminService.updateOrderPayment(
    req.params.id,
    req.body.paymentStatus,
    req.body.paymentRef
  );
  if (!order) return error(res, 'Order not found', 404);
  success(res, order);
});

const getCoupons = asyncHandler(async (req, res) => {
  const coupons = await couponAdminService.getCoupons();
  success(res, coupons);
});

const createCoupon = asyncHandler(async (req, res) => {
  const coupon = await couponAdminService.createCoupon(req.body);
  success(res, coupon, 201);
});

const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await couponAdminService.updateCoupon(req.params.id, req.body);
  if (!coupon) return error(res, 'Coupon not found', 404);
  success(res, coupon);
});

const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await couponAdminService.deleteCoupon(req.params.id);
  if (!coupon) return error(res, 'Coupon not found', 404);
  success(res, { deleted: true });
});

const getCouponUsage = asyncHandler(async (req, res) => {
  const data = await couponAdminService.getCouponUsage(req.params.id);
  if (!data) return error(res, 'Coupon not found', 404);
  success(res, data);
});

const getInventory = asyncHandler(async (req, res) => {
  const products = await inventoryService.getInventory(req.query.filter);
  success(res, products);
});

const updateInventoryStock = asyncHandler(async (req, res) => {
  const product = await inventoryService.updateStock(req.params.productId, req.body.stock);
  if (!product) return error(res, 'Product not found', 404);
  await invalidateCacheKeys([CACHE_KEYS.productsFeatured, CACHE_KEYS.productsFlashSale]);
  success(res, product);
});

const getSalesReport = asyncHandler(async (req, res) => {
  const { from, to, groupBy } = req.query;
  const data = await reportService.getSalesReport(from, to, groupBy);
  success(res, data);
});

const getBanners = asyncHandler(async (req, res) => {
  const banners = await bannerAdminService.getAllBanners();
  success(res, banners);
});

const createBanner = asyncHandler(async (req, res) => {
  const banner = await bannerAdminService.createBanner(req.body);
  success(res, banner, 201);
});

const updateBanner = asyncHandler(async (req, res) => {
  const banner = await bannerAdminService.updateBanner(req.params.id, req.body);
  if (!banner) return error(res, 'Banner not found', 404);
  success(res, banner);
});

const deleteBanner = asyncHandler(async (req, res) => {
  const banner = await bannerAdminService.deleteBanner(req.params.id);
  if (!banner) return error(res, 'Banner not found', 404);
  success(res, { deleted: true });
});

const getAbandonedCarts = asyncHandler(async (req, res) => {
  const data = await abandonedCartService.getAbandonedCarts();
  success(res, data);
});

module.exports = {
  getDashboard,
  getCustomers,
  getCustomerById,
  updateCustomerStatus,
  getOrders,
  getOrderById,
  updateOrderStatus,
  updateOrderPayment,
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getCouponUsage,
  getInventory,
  updateInventoryStock,
  getSalesReport,
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  getAbandonedCarts,
  updateCustomerRole,
};
