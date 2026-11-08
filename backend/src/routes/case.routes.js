const express = require('express');
const router = express.Router();
const { sendSuccess } = require('../utils/response');
const authenticate = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

router.use(authenticate);

// All roles can access cases (filtered by role at controller level)
router.get('/', (req, res) => {
  return sendSuccess(res, [], 'Cases route initialized', 200);
});

// Admin and Clerk can register new cases
router.post('/', authorizeRoles('ADMIN', 'CLERK'), (req, res) => {
  return sendSuccess(res, null, 'Case registration route initialized', 201);
});

module.exports = router;
