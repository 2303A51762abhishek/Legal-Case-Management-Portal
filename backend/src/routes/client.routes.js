const express = require('express');
const router = express.Router();
const { sendSuccess } = require('../utils/response');
const authenticate = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

router.use(authenticate);

// Admin, Lawyer, and Clerk can view client lists
router.get('/', authorizeRoles('ADMIN', 'LAWYER', 'CLERK'), (req, res) => {
  return sendSuccess(res, [], 'Clients route initialized', 200);
});

// Admin and Clerk can register new clients
router.post('/', authorizeRoles('ADMIN', 'CLERK'), (req, res) => {
  return sendSuccess(res, null, 'Client registration route initialized', 201);
});

module.exports = router;
