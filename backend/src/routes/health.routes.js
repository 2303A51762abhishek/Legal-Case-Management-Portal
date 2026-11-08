const express = require('express');
const router = express.Router();
const config = require('../config/env');
const { getDBStatus } = require('../config/db');
const { sendSuccess } = require('../utils/response');

/**
 * @route   GET /api/health
 * @desc    System Health Check Endpoint reporting actual database connection
 * @access  Public
 */
router.get('/', (req, res) => {
  const dbStatus = getDBStatus();

  const healthData = {
    status: dbStatus.isConnected ? 'HEALTHY' : 'DEGRADED',
    service: 'Legal Case and Court Hearing Management Portal API',
    version: '1.0.0',
    environment: config.env,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    academicMetadata: {
      student: config.project.student,
      rollNumber: config.project.roll,
      academicYear: config.project.academicYear,
      course: 'DevOps & Full Stack (B.Tech IV-I)',
    },
    database: {
      status: dbStatus.state,
      connected: dbStatus.isConnected,
      host: dbStatus.host,
      databaseName: dbStatus.databaseName,
    },
    modelsLoaded: [
      'User',
      'Client',
      'Case',
      'Hearing',
      'Task',
      'Document',
      'Notification',
    ],
  };

  return sendSuccess(res, healthData, 'JurisFlow Backend Service Health Status', 200);
});

module.exports = router;
