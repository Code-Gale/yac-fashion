const couponService = require('./service');
const { success } = require('../../utils/response');
const { asyncHandler } = require('../../utils/asyncHandler');

const validateCoupon = asyncHandler(async (req, res) => {
  const { code, subtotal } = req.body;
  const result = await couponService.validate(code, subtotal || 0);
  success(res, result);
});

module.exports = {
  validateCoupon,
};
