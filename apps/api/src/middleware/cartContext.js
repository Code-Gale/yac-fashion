const { error } = require('../utils/response');

const CART_SESSION_HEADER = 'x-session-id';

const cartContext = (req, res, next) => {
  if (req.user) {
    req.cartKey = `cart:user:${req.user.userId}`;
    req.cartTtl = 30 * 24 * 60 * 60;
    return next();
  }
  const sessionId = req.headers[CART_SESSION_HEADER];
  if (!sessionId || typeof sessionId !== 'string' || !sessionId.trim()) {
    return error(res, 'x-session-id header required for guest cart', 400);
  }
  req.cartKey = `cart:session:${sessionId.trim()}`;
  req.cartTtl = 7 * 24 * 60 * 60;
  next();
};

const cartContextOptional = (req, res, next) => {
  if (req.user) {
    req.cartKey = `cart:user:${req.user.userId}`;
    req.cartTtl = 30 * 24 * 60 * 60;
    return next();
  }
  const sessionId = req.headers[CART_SESSION_HEADER];
  if (sessionId && typeof sessionId === 'string' && sessionId.trim()) {
    req.cartKey = `cart:session:${sessionId.trim()}`;
    req.cartTtl = 7 * 24 * 60 * 60;
  } else {
    req.cartKey = null;
  }
  next();
};

module.exports = { cartContext, cartContextOptional };
