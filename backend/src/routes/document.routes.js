const express = require('express');
const router = express.Router();
const { sendSuccess } = require('../utils/response');
const authenticate = require('../middleware/auth.middleware');

router.use(authenticate);

// Documents list
router.get('/', (req, res) => {
  return sendSuccess(res, [], 'Documents route initialized', 200);
});

module.exports = router;
