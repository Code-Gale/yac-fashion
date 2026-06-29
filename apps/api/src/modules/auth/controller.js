const authService = require('./service');
const { setAccessTokenCookie, setRefreshTokenCookie, clearAuthCookies, getRefreshTokenFromCookies } = require('../../utils/cookies');
const { success } = require('../../utils/response');
const { asyncHandler } = require('../../utils/asyncHandler');

const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  
  // Set tokens in HttpOnly cookies
  setAccessTokenCookie(res, result.accessToken);
  setRefreshTokenCookie(res, result.refreshToken);
  
  // Also return tokens in response body for backwards compatibility
  success(res, result, 201);
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  
  // Set tokens in HttpOnly cookies
  setAccessTokenCookie(res, result.accessToken);
  setRefreshTokenCookie(res, result.refreshToken);
  
  // Also return tokens in response body for backwards compatibility
  success(res, result);
});

const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user.userId);
  
  // Clear auth cookies
  clearAuthCookies(res);
  
  success(res, { message: 'Logged out' });
});

const refresh = asyncHandler(async (req, res) => {
  // Try to get refresh token from cookie first, then from body
  const refreshToken = getRefreshTokenFromCookies(req) || req.body.refreshToken;
  
  if (!refreshToken) {
    return res.status(400).json({ success: false, message: 'Refresh token required' });
  }
  
  const result = await authService.refresh(refreshToken);
  
  // Set new tokens in HttpOnly cookies
  setAccessTokenCookie(res, result.accessToken);
  setRefreshTokenCookie(res, result.refreshToken);
  
  // Also return tokens in response body for backwards compatibility
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
