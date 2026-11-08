const express = require('express');
const router = express.Router();

const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const clientRoutes = require('./client.routes');
const caseRoutes = require('./case.routes');
const hearingRoutes = require('./hearing.routes');
const taskRoutes = require('./task.routes');
const documentRoutes = require('./document.routes');
const reportRoutes = require('./report.routes');
const notificationRoutes = require('./notification.routes');
const dashboardRoutes = require('./dashboard.routes');

// Mount routes
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/users', userRoutes);
router.use('/clients', clientRoutes);
router.use('/cases', caseRoutes);
router.use('/hearings', hearingRoutes);
router.use('/tasks', taskRoutes);
router.use('/documents', documentRoutes);
router.use('/reports', reportRoutes);
router.use('/notifications', notificationRoutes);

module.exports = router;
