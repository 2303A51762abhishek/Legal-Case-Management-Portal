const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');
const {
  getAdminDashboard,
  getLawyerDashboard,
  getClientDashboard,
  getClerkDashboard,
} = require('../controllers/dashboard.controller');

router.use(authenticate);

// 1. Admin Governance Dashboard
router.get('/admin', authorizeRoles('ADMIN'), getAdminDashboard);

// 2. Lawyer Practice Dashboard
router.get('/lawyer', authorizeRoles('LAWYER'), getLawyerDashboard);

// 3. Client Case Portal Dashboard
router.get('/client', authorizeRoles('CLIENT'), getClientDashboard);

// 4. Registry & Bench Clerk Dashboard
router.get('/clerk', authorizeRoles('CLERK'), getClerkDashboard);

module.exports = router;
