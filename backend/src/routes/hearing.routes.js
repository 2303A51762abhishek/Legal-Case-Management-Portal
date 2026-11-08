const express = require('express');
const router = express.Router();
const { sendSuccess } = require('../utils/response');
const authenticate = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

router.use(authenticate);

// Hearings calendar access
router.get('/', (req, res) => {
  return sendSuccess(res, [], 'Hearings route initialized', 200);
});

// Admin, Lawyer, and Clerk can schedule hearings
router.post('/', authorizeRoles('ADMIN', 'LAWYER', 'CLERK'), (req, res) => {
  return sendSuccess(res, null, 'Schedule hearing route initialized', 201);
});

module.exports = router;
