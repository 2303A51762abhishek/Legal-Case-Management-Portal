const express = require('express');
const router = express.Router();
const { sendSuccess } = require('../utils/response');
const authenticate = require('../middleware/auth.middleware');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new legal user
 */
router.post('/register', (req, res) => {
  return sendSuccess(res, { readyFor: 'Phase 5 Controller Implementation' }, 'Auth register route registered', 200);
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and return JWT
 */
router.post('/login', (req, res) => {
  return sendSuccess(res, { readyFor: 'Phase 5 Controller Implementation' }, 'Auth login route registered', 200);
});

/**
 * @route   GET /api/auth/me
 * @desc    Retrieve currently authenticated user profile
 */
router.get('/me', authenticate, (req, res) => {
  return sendSuccess(res, { user: req.user }, 'Authenticated profile retrieved', 200);
});

module.exports = router;
