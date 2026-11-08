const express = require('express');
const router = express.Router();
const {
  createClient,
  getClients,
  getClientById,
  updateClient,
  getClientCases,
} = require('../controllers/client.controller');
const authenticate = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

// All client routes require authentication
router.use(authenticate);

// Client List (Admin, Clerk, Lawyer)
router.get('/', authorizeRoles('ADMIN', 'CLERK', 'LAWYER'), getClients);

// Register Client (Admin, Clerk)
router.post('/', authorizeRoles('ADMIN', 'CLERK'), createClient);

// Get Client Details (Admin, Clerk, Lawyer, Client - checked in controller)
router.get('/:id', getClientById);

// Update Client (Admin, Clerk)
router.put('/:id', authorizeRoles('ADMIN', 'CLERK'), updateClient);

// View Client Case History
router.get('/:id/cases', getClientCases);

module.exports = router;
