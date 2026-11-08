const express = require('express');
const router = express.Router();
const { sendSuccess } = require('../utils/response');
const authenticate = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/', (req, res) => {
  return sendSuccess(res, [], 'Notifications route initialized', 200);
});

module.exports = router;
