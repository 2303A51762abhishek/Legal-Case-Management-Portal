const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');
const { documentUploadMiddleware } = require('../middleware/upload.middleware');
const {
  uploadDocument,
  getDocuments,
  getDocumentById,
  downloadDocument,
  deleteDocument,
} = require('../controllers/document.controller');

router.use(authenticate);

// Document upload route with Multer & magic-byte check
router.post('/upload', documentUploadMiddleware, uploadDocument);

// Collection listing route
router.get('/', getDocuments);

// Single document routes
router.get('/:id', getDocumentById);
router.get('/:id/download', downloadDocument);
router.delete('/:id', authorizeRoles('ADMIN', 'LAWYER'), deleteDocument);

module.exports = router;
