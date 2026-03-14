const { verifyAccessToken } = require('../utils/jwt');

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
  } catch (err) {
  }
  next();
};

module.exports = { optionalAuth };
