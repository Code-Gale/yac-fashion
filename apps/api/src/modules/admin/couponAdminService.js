const Coupon = require('../coupons/model');
const Order = require('../orders/model');

const getCoupons = async () => {
  return Coupon.find().sort({ createdAt: -1 });
};

const createCoupon = async (data) => {
  return Coupon.create(data);
};

const updateCoupon = async (id, data) => {
  return Coupon.findByIdAndUpdate(id, data, { new: true });
};

const deleteCoupon = async (id) => {
  return Coupon.findByIdAndDelete(id);
};

const getCouponUsage = async (id) => {
  const coupon = await Coupon.findById(id);
  if (!coupon) return null;
  const recentOrders = await Order.find({
    couponCode: { $regex: new RegExp(`^${coupon.code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
  })
    .populate('userId', 'name email')
    .sort({ createdAt: -1 })
    .limit(10);
  return {
    usedCount: coupon.usedCount,
    recentOrders,
  };
};

module.exports = {
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getCouponUsage,
};
