const { error } = require('../utils/response');

const STAFF_ALLOWED_PATHS = ['/orders', '/inventory'];

const staffAllowed = (req, res, next) => {
  if (req.user.role === 'admin') return next();
  if (req.user.role === 'staff') {
    const path = req.path || '/';
    const allowed = STAFF_ALLOWED_PATHS.some((p) => path === p || path.startsWith(p + '/'));
    if (allowed) return next();
  }
  return error(res, 'Forbidden', 403);
};

const adminFullAccess = (req, res, next) => {
  if (req.user.role === 'admin') return next();
  return error(res, 'Forbidden', 403);
};

module.exports = { staffAllowed, adminFullAccess };
