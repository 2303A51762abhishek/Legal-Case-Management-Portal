const express = require('express');
const router = express.Router();
const { sendSuccess } = require('../utils/response');
const authenticate = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

router.use(authenticate);

// Admin, Lawyer, and Clerk manage tasks
router.get('/', authorizeRoles('ADMIN', 'LAWYER', 'CLERK'), (req, res) => {
  return sendSuccess(res, [], 'Tasks route initialized', 200);
});

router.post('/', authorizeRoles('ADMIN', 'LAWYER', 'CLERK'), (req, res) => {
  return sendSuccess(res, null, 'Task creation route initialized', 201);
});

module.exports = router;
