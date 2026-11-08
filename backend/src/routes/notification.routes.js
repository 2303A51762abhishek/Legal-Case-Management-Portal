const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  triggerScan,
} = require('../controllers/notification.controller');

router.use(authenticate);

// Listing
router.get('/', getNotifications);

// Bulk read
router.patch('/read-all', markAllAsRead);

// Single read
router.patch('/:id/read', markAsRead);

// Trigger scan (Admin only)
router.post('/scan', authorizeRoles('ADMIN'), triggerScan);

module.exports = router;
