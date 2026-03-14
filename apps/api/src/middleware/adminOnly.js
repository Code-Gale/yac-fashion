const { error } = require('../utils/response');

const adminOnly = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'staff')) {
    return next();
  }
  return error(res, 'Forbidden', 403);
};

module.exports = { adminOnly };
