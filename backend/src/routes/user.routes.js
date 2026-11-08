const express = require('express');
const router = express.Router();
const { getUsers, createUser, updateUserStatus } = require('../controllers/user.controller');
const authenticate = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

// All user management routes strictly require ADMIN role
router.use(authenticate);
router.use(authorizeRoles('ADMIN'));

router.get('/', getUsers);
router.post('/', createUser);
router.patch('/:id/status', updateUserStatus);

module.exports = router;
