const express = require('express');
const router = express.Router();
const { sendSuccess } = require('../utils/response');
const authenticate = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

router.use(authenticate);

// Reports accessible to Admin, Lawyer, Clerk
router.get('/case-status', authorizeRoles('ADMIN', 'LAWYER', 'CLERK'), (req, res) => {
  return sendSuccess(res, { report: 'Case Status Report' }, 'Case status report route initialized', 200);
});

router.get('/hearing-calendar', authorizeRoles('ADMIN', 'LAWYER', 'CLERK'), (req, res) => {
  return sendSuccess(res, { report: 'Hearing Calendar Report' }, 'Hearing calendar report route initialized', 200);
});

router.get('/pending-tasks', authorizeRoles('ADMIN', 'LAWYER', 'CLERK'), (req, res) => {
  return sendSuccess(res, { report: 'Pending Tasks Report' }, 'Pending tasks report route initialized', 200);
});

router.get('/client-summary', authorizeRoles('ADMIN', 'LAWYER', 'CLERK'), (req, res) => {
  return sendSuccess(res, { report: 'Client Case Summary Report' }, 'Client summary report route initialized', 200);
});

module.exports = router;
