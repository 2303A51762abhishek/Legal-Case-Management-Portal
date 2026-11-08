const express = require('express');
const router = express.Router();
const {
  createCase,
  getCases,
  getCaseById,
  updateCase,
} = require('../controllers/case.controller');
const authenticate = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

// All case routes require authentication
router.use(authenticate);

// Get All Cases (Role-scoped at controller level)
router.get('/', getCases);

// Register New Case (Admin, Clerk)
router.post('/', authorizeRoles('ADMIN', 'CLERK'), createCase);

// Get Case Details by ID (Scoped per role)
router.get('/:id', getCaseById);

// Update Case Info & Progress (Admin, Lawyer, Clerk)
router.put('/:id', authorizeRoles('ADMIN', 'LAWYER', 'CLERK'), updateCase);

module.exports = router;
