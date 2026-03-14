const userService = require('../users/service');
const { success, error } = require('../../utils/response');
const { asyncHandler } = require('../../utils/asyncHandler');
const bcrypt = require('bcryptjs');

const updateProfile = asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    return error(res, 'Name is required', 400);
  }
  const user = await userService.updateName(req.user.userId, name);
  if (!user) return error(res, 'User not found', 404);
  success(res, { user: { _id: user._id, name: user.name, email: user.email, role: user.role } });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return error(res, 'Current password and new password are required', 400);
  }
  if (newPassword.length < 8) {
    return error(res, 'New password must be at least 8 characters', 400);
  }
  const user = await userService.findById(req.user.userId);
  if (!user) return error(res, 'User not found', 404);
  const userWithHash = await require('../users/model').findById(req.user.userId).select('passwordHash');
  const valid = await bcrypt.compare(currentPassword, userWithHash.passwordHash);
  if (!valid) return error(res, 'Current password is incorrect', 400);
  const passwordHash = await bcrypt.hash(newPassword, 12);
  await userService.updatePassword(req.user.userId, passwordHash);
  success(res, { message: 'Password updated' });
});

module.exports = {
  updateProfile,
  changePassword,
};
