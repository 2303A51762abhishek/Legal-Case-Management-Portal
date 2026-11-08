const rateLimit = require('express-rate-limit');

/**
 * Rate Limiting Middleware for Authentication Endpoints
 * Prevents brute force password attacks
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 authentication attempts per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
    timestamp: new Date().toISOString(),
  },
});

module.exports = {
  authLimiter,
};
