const rateLimit = require('express-rate-limit');

/**
 * Rate Limiting Middleware for Authentication Endpoints
 * Prevents brute force password attacks (30 in production, 300 during local dev/testing)
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 30 : 300,
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
