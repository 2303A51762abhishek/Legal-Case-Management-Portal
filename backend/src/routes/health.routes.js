const express = require('express');
const router = express.Router();
const config = require('../config/env');
const { sendSuccess } = require('../utils/response');

/**
 * @route   GET /api/health
 * @desc    System Health Check Endpoint
 * @access  Public
 */
router.get('/', (req, res) => {
  const healthData = {
    status: 'HEALTHY',
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
      status: 'Awaiting Phase 4 Schema Connection',
      target: config.mongodbUri.replace(/\/\/.*@/, '//***:***@'), // Mask credentials if present
    },
  };

  return sendSuccess(res, healthData, 'JurisFlow Backend Service is Operational', 200);
});

module.exports = router;
