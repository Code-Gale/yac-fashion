const userService = require('./service');
const { success } = require('../../utils/response');
const { asyncHandler } = require('../../utils/asyncHandler');

const getProfile = asyncHandler(async (req, res) => {
  const user = await userService.findById(req.user.userId);
  success(res, user);
});

module.exports = {
  getProfile,
};
