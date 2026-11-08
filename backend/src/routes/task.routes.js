const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');
const {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  updateTaskStatus,
  deleteTask,
} = require('../controllers/task.controller');

router.use(authenticate);

// Tasks collection routes
router
  .route('/')
  .get(getTasks)
  .post(authorizeRoles('ADMIN', 'LAWYER', 'CLERK'), createTask);

// Single task routes
router
  .route('/:id')
  .get(getTaskById)
  .put(authorizeRoles('ADMIN', 'LAWYER', 'CLERK'), updateTask)
  .delete(authorizeRoles('ADMIN', 'LAWYER', 'CLERK'), deleteTask);

// Status transition
router.patch('/:id/status', authorizeRoles('ADMIN', 'LAWYER', 'CLERK'), updateTaskStatus);

module.exports = router;
