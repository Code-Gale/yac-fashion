const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const userService = require('../users/service');
const { getRedis } = require('../../config/redis');
const { sendEmail } = require('../../utils/email');
const { passwordReset } = require('../../utils/emailTemplates');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require('../../utils/jwt');
const { JWT_REFRESH_EXPIRES_IN, CLIENT_URL } = require('../../config/env');

const SALT_ROUNDS = 12;

const parseExpiryToSeconds = (str) => {
  const match = str.match(/^(\d+)([smhd])$/);
  if (!match) return 604800;
  const val = parseInt(match[1], 10);
  const unit = match[2];
  if (unit === 's') return val;
  if (unit === 'm') return val * 60;
  if (unit === 'h') return val * 3600;
  if (unit === 'd') return val * 86400;
  return 604800;
};

const getRefreshKey = (userId) => `refresh:${userId}`;

const storeRefreshToken = async (userId, token) => {
  const redis = await getRedis();
  if (redis) {
    const ttl = parseExpiryToSeconds(JWT_REFRESH_EXPIRES_IN);
    await redis.setEx(getRefreshKey(userId), ttl, token);
  }
};

const deleteRefreshToken = async (userId) => {
  const redis = await getRedis();
  if (redis) {
    await redis.del(getRefreshKey(userId));
  }
};

const getRefreshToken = async (userId) => {
  const redis = await getRedis();
  if (!redis) return null;
  return redis.get(getRefreshKey(userId));
};

const toUserResponse = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
});

const register = async (data) => {
  const existing = await userService.findByEmail(data.email);
  if (existing) {
    const err = new Error('Email already in use');
    err.statusCode = 400;
    throw err;
  }
  const user = await userService.createUser(data);
  const Order = require('../orders/model');
  Order.updateMany(
    { guestEmail: user.email.toLowerCase(), userId: null },
    { $set: { userId: user._id }, $unset: { guestEmail: '' } }
  ).catch((err) => console.error('Link guest orders:', err));
  const accessToken = generateAccessToken({ userId: user._id.toString(), role: user.role });
  const refreshToken = generateRefreshToken({ userId: user._id.toString() });
  await storeRefreshToken(user._id.toString(), refreshToken);
  return {
    user: toUserResponse(user),
    accessToken,
    refreshToken,
  };
};

const login = async (email, password) => {
  const user = await userService.findByEmail(email);
  if (!user) {
    const err = new Error('Invalid credentials');
    err.statusCode = 401;
    throw err;
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    const err = new Error('Invalid credentials');
    err.statusCode = 401;
    throw err;
  }
  if (!user.isActive) {
    const err = new Error('Account is disabled');
    err.statusCode = 403;
    throw err;
  }
  const Order = require('../orders/model');
  Order.updateMany(
    { guestEmail: user.email.toLowerCase(), userId: null },
    { $set: { userId: user._id }, $unset: { guestEmail: '' } }
  ).catch((err) => console.error('Link guest orders:', err));
  const accessToken = generateAccessToken({ userId: user._id.toString(), role: user.role });
  const refreshToken = generateRefreshToken({ userId: user._id.toString() });
  await storeRefreshToken(user._id.toString(), refreshToken);
  return {
    user: toUserResponse(user),
    accessToken,
    refreshToken,
  };
};

const logout = async (userId) => {
  await deleteRefreshToken(userId);
};

const refresh = async (refreshToken) => {
  const decoded = verifyRefreshToken(refreshToken);
  const userId = decoded.userId;
  const stored = await getRefreshToken(userId);
  if (!stored || stored !== refreshToken) {
    const err = new Error('Invalid refresh token');
    err.statusCode = 401;
    throw err;
  }
  await deleteRefreshToken(userId);
  const user = await userService.findById(userId);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 401;
    throw err;
  }
  const newAccessToken = generateAccessToken({ userId: user._id.toString(), role: user.role });
  const newRefreshToken = generateRefreshToken({ userId: user._id.toString() });
  await storeRefreshToken(user._id.toString(), newRefreshToken);
  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

const forgotPassword = async (email) => {
  const user = await userService.findByEmail(email);
  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await userService.updatePasswordReset(user._id, hashedToken, expiresAt);
    const resetUrl = `${CLIENT_URL}/reset-password?token=${token}`;
    const tpl = passwordReset(resetUrl, user.name);
    sendEmail({ to: user.email, subject: tpl.subject, html: tpl.html }).catch((err) => console.error('Email error:', err));
  }
};

const resetPassword = async (token, password) => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await userService.findByResetToken(hashedToken);
  if (!user) {
    const err = new Error('Invalid or expired token');
    err.statusCode = 400;
    throw err;
  }
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  await userService.updatePassword(user._id, passwordHash);
  await userService.clearPasswordReset(user._id);
};

module.exports = {
  register,
  login,
  logout,
  refresh,
  forgotPassword,
  resetPassword,
};
