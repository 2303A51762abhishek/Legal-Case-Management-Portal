const { sendError } = require('../utils/response');

/**
 * 404 Route Not Found Handler
 */
const notFoundHandler = (req, res, next) => {
  return sendError(res, `API Endpoint Not Found: [${req.method}] ${req.originalUrl}`, 404);
};

/**
 * Centralized Global Error Handler
 */
const errorHandler = (err, req, res, next) => {
  console.error('[Error Middleware Caught]:', err.stack || err.message);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  return sendError(
    res,
    message,
    statusCode,
    process.env.NODE_ENV === 'development' ? { stack: err.stack } : null
  );
};

module.exports = {
  notFoundHandler,
  errorHandler,
};
