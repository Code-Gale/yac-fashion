const authService = require('./service');
const { success } = require('../../utils/response');
const { asyncHandler } = require('../../utils/asyncHandler');

const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  success(res, result, 201);
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  success(res, result);
});

const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user.userId);
  success(res, { message: 'Logged out' });
});

const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  const result = await authService.refresh(refreshToken);
  success(res, result);
});

const forgotPassword = asyncHandler(async (req, res) => {
  await authService.forgotPassword(req.body.email);
  success(res, { message: 'If the email exists, a reset link has been sent' });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  await authService.resetPassword(token, password);
  success(res, { message: 'Password updated' });
});

module.exports = {
  register,
  login,
  logout,
  refresh,
  forgotPassword,
  resetPassword,
};
