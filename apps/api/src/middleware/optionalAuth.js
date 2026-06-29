const { verifyAccessToken } = require('../utils/jwt');
const { getAccessTokenFromCookies } = require('../utils/cookies');
const User = require('../modules/users/model');

const optionalAuth = async (req, res, next) => {
  // Check both cookie and Authorization header for token
  let token = getAccessTokenFromCookies(req);
  
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }
  
  if (!token) {
    return next();
  }
  
  try {
    const decoded = verifyAccessToken(token);
    
    // Revalidate user status and role from database if token is provided
    const user = await User.findById(decoded.userId).select('isActive role').lean();
    if (user && user.isActive) {
      req.user = {
        userId: decoded.userId,
        role: user.role,
      };
    }
  } catch (err) {
    // Silent fail for optional auth
  }
  next();
};

module.exports = { optionalAuth };
