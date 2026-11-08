const { verifyToken } = require('../services/jwt.service');
const { sendError } = require('../utils/response');

/**
 * Authentication Middleware: Validates Bearer JWT header or HttpOnly cookie
 */
const authenticate = (req, res, next) => {
  try {
    let token = null;

    // 1. Check Authorization Bearer Header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    // 2. Fallback to HttpOnly Cookie if header not present
    if (!token && req.cookies && req.cookies.juris_token) {
      token = req.cookies.juris_token;
    }

    if (!token) {
      return sendError(
        res,
        'Authentication required. Please log in to access this legal docket resource.',
        401
      );
    }

    const decoded = verifyToken(token);
    req.user = decoded; // { id, role, email, name }
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 'Authentication session has expired. Please log in again.', 401);
    }
    if (error.name === 'JsonWebTokenError') {
      return sendError(res, 'Invalid authentication signature.', 401);
    }
    return sendError(res, 'Authentication verification failed.', 401);
  }
};

module.exports = authenticate;
