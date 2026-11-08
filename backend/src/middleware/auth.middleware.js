const { verifyToken } = require('../services/jwt.service');
const { sendError } = require('../utils/response');

/**
 * Authentication Middleware: Validates Bearer JWT in request header
 */
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Authentication required. No Bearer token provided in Authorization header.', 401);
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return sendError(res, 'Authentication token format invalid.', 401);
    }

    const decoded = verifyToken(token);
    req.user = decoded; // Contains id, email, role, etc.
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
