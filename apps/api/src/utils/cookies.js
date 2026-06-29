/**
 * Cookie utilities for auth token management
 */

const { NODE_ENV, JWT_EXPIRES_IN, JWT_REFRESH_EXPIRES_IN } = require('../config/env');

// Parse JWT expiry strings to milliseconds
const parseExpiryToMs = (str) => {
  const match = str.match(/^(\d+)([smhd])$/);
  if (!match) return 15 * 60 * 1000; // Default 15 minutes
  const val = parseInt(match[1], 10);
  const unit = match[2];
  if (unit === 's') return val * 1000;
  if (unit === 'm') return val * 60 * 1000;
  if (unit === 'h') return val * 60 * 60 * 1000;
  if (unit === 'd') return val * 24 * 60 * 60 * 1000;
  return 15 * 60 * 1000;
};

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: NODE_ENV === 'production', // HTTPS only in production
  sameSite: NODE_ENV === 'production' ? 'strict' : 'lax',
  path: '/',
};

/**
 * Set access token cookie
 */
const setAccessTokenCookie = (res, token) => {
  const maxAge = parseExpiryToMs(JWT_EXPIRES_IN);
  res.cookie('accessToken', token, {
    ...COOKIE_OPTIONS,
    maxAge,
  });
};

/**
 * Set refresh token cookie
 */
const setRefreshTokenCookie = (res, token) => {
  const maxAge = parseExpiryToMs(JWT_REFRESH_EXPIRES_IN);
  res.cookie('refreshToken', token, {
    ...COOKIE_OPTIONS,
    maxAge,
  });
};

/**
 * Clear auth cookies
 */
const clearAuthCookies = (res) => {
  res.clearCookie('accessToken', COOKIE_OPTIONS);
  res.clearCookie('refreshToken', COOKIE_OPTIONS);
};

/**
 * Get access token from cookies
 */
const getAccessTokenFromCookies = (req) => {
  return req.cookies?.accessToken || null;
};

/**
 * Get refresh token from cookies
 */
const getRefreshTokenFromCookies = (req) => {
  return req.cookies?.refreshToken || null;
};

module.exports = {
  setAccessTokenCookie,
  setRefreshTokenCookie,
  clearAuthCookies,
  getAccessTokenFromCookies,
  getRefreshTokenFromCookies,
};
