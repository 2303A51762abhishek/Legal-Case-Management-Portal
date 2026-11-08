const { sendError } = require('../utils/response');

/**
 * Role-Based Access Control (RBAC) Authorization Middleware
 * Enforces strict backend authorization for: ADMIN, LAWYER, CLIENT, CLERK
 * @param  {...string} allowedRoles 
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return sendError(res, 'Access denied. User role not authenticated.', 403);
    }

    const userRole = req.user.role.toUpperCase();
    const authorized = allowedRoles.map((r) => r.toUpperCase());

    if (!authorized.includes(userRole)) {
      return sendError(
        res,
        `Forbidden. Access restricted. Required role(s): [${authorized.join(', ')}]. Your role: ${userRole}.`,
        403
      );
    }

    next();
  };
};

module.exports = {
  authorizeRoles,
};
