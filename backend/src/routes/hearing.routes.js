const express = require('express');
const router = express.Router();
const {
  createHearing,
  getHearings,
  getHearingById,
  updateHearing,
  cancelHearing,
  updateHearingStatus,
} = require('../controllers/hearing.controller');
const authenticate = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

// All hearing endpoints require authentication
router.use(authenticate);

// List Hearings (Role-scoped at controller level)
router.get('/', getHearings);

// Schedule Hearing (Admin, Clerk, Lawyer)
router.post('/', authorizeRoles('ADMIN', 'CLERK', 'LAWYER'), createHearing);

// View Hearing by ID (Role-scoped at controller level)
router.get('/:id', getHearingById);

// Reschedule / Update Hearing (Admin, Clerk, Lawyer)
router.put('/:id', authorizeRoles('ADMIN', 'CLERK', 'LAWYER'), updateHearing);

// Cancel Hearing (Admin, Clerk, Lawyer)
router.delete('/:id', authorizeRoles('ADMIN', 'CLERK', 'LAWYER'), cancelHearing);

// Update Status Specifically (SCHEDULED, ADJOURNED, COMPLETED, CANCELLED)
router.patch('/:id/status', authorizeRoles('ADMIN', 'CLERK', 'LAWYER'), updateHearingStatus);

module.exports = router;
