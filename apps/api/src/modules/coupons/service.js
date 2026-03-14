const Coupon = require('./model');

const findByCode = async (code) => {
  return Coupon.findOne({ code: (code || '').toUpperCase().trim() });
};

const validate = async (code, subtotal) => {
  const coupon = await findByCode(code);
  if (!coupon || !coupon.isActive) return { valid: false, discountAmount: 0 };
  if (coupon.expiresAt && coupon.expiresAt < new Date()) return { valid: false, discountAmount: 0 };
  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) return { valid: false, discountAmount: 0 };
  if (subtotal < coupon.minOrderAmount) return { valid: false, discountAmount: 0 };
  let discountAmount = 0;
  if (coupon.type === 'percent') {
    discountAmount = (subtotal * coupon.value) / 100;
  } else {
    discountAmount = Math.min(coupon.value, subtotal);
  }
  discountAmount = Math.min(discountAmount, subtotal);
  return { valid: true, discountAmount, coupon };
};

module.exports = {
  findByCode,
  validate,
};
