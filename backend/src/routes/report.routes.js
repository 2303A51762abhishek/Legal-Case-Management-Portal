const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth.middleware');
const {
  getCaseStatusReport,
  getHearingCalendarReport,
  getPendingTasksReport,
  getClientSummaryReport,
} = require('../controllers/report.controller');

router.use(authenticate);

// 1. Case Status Report
router.get('/case-status', getCaseStatusReport);

// 2. Hearing Calendar Report
router.get('/hearing-calendar', getHearingCalendarReport);

// 3. Pending Tasks Report
router.get('/pending-tasks', getPendingTasksReport);

// 4. Client Case Summary Report
router.get('/client-summary', getClientSummaryReport);

module.exports = router;
