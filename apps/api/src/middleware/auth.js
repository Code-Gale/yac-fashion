const { verifyAccessToken } = require('../utils/jwt');
const { getAccessTokenFromCookies } = require('../utils/cookies');
const { error } = require('../utils/response');
const User = require('../modules/users/model');

const auth = async (req, res, next) => {
  // Check both cookie and Authorization header for token
  let token = getAccessTokenFromCookies(req);
  
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }
  
  if (!token) {
    return error(res, 'Unauthorized', 401);
  }
  
  try {
    const decoded = verifyAccessToken(token);
    
    // Revalidate user status and role from database
    const user = await User.findById(decoded.userId).select('isActive role').lean();
    if (!user) {
      return error(res, 'Unauthorized', 401);
    }
    if (!user.isActive) {
      return error(res, 'Account is disabled', 403);
    }
    
    // Update req.user with current role from database (not from stale JWT)
    req.user = {
      userId: decoded.userId,
      role: user.role, // Use fresh role from DB, not JWT
    };
    
    next();
  } catch (err) {
    return error(res, 'Unauthorized', 401);
  }
};

module.exports = { auth };
