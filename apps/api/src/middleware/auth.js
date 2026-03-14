const { verifyAccessToken } = require('../utils/jwt');
const { error } = require('../utils/response');

const auth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(res, 'Unauthorized', 401);
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    return error(res, 'Unauthorized', 401);
  }
};

module.exports = { auth };
