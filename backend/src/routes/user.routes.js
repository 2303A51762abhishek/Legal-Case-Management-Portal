const express = require('express');
const router = express.Router();
const { sendSuccess } = require('../utils/response');
const authenticate = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

// All user management routes require ADMIN privileges
router.use(authenticate);

router.get('/', authorizeRoles('ADMIN'), (req, res) => {
  return sendSuccess(res, [], 'Users route ready for Phase 5 DB population', 200);
});

router.post('/', authorizeRoles('ADMIN'), (req, res) => {
  return sendSuccess(res, null, 'User creation route ready for Phase 5', 201);
});

module.exports = router;
