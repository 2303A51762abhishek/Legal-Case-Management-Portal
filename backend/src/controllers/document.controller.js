const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const { Document, Case, Client, Notification } = require('../models');
const { sendSuccess, sendError } = require('../utils/response');
const { UPLOADS_DIR } = require('../middleware/upload.middleware');

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * Sanitizes document output for safe client-facing responses
 * (Strips host filesystem paths and provides standard downloadUrl)
 */
const sanitizeDoc = (doc) => {
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  delete obj.filePath;
  obj.downloadUrl = `/api/documents/${obj._id}/download`;
  return obj;
};

/**
 * @desc    Upload legal document to the vault with strict validation
 * @route   POST /api/documents/upload
 * @access  Protected
 */
const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return sendError(res, 'No document file was received.', 400);
    }

    const {
      title,
      documentType = 'OTHER',
      case: caseId,
      isConfidential = false,
    } = req.body;

    // 1. Mandatory Metadata Validation
    if (!title || !caseId) {
      // Clean up orphaned uploaded file on validation error
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {}
      return sendError(res, 'Document title and linked case ID are mandatory.', 400);
    }

    if (!isValidId(caseId)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {}
      return sendError(res, 'Invalid case ID format.', 400);
    }

    // 2. Validate Case Existence & Role Scoping
    const legalCase = await Case.findById(caseId).populate('client');
    if (!legalCase) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {}
      return sendError(res, 'Specified legal case does not exist.', 404);
    }

    let confidentialFlag = Boolean(isConfidential === 'true' || isConfidential === true);

    if (req.user.role === 'CLIENT') {
      // Verify client owns this case
      const clientProfile = await Client.findOne({ userAccount: req.user.id });
      if (!clientProfile || legalCase.client?._id.toString() !== clientProfile._id.toString()) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (e) {}
        return sendError(res, 'Access denied. You can only upload documents to your own legal cases.', 403);
      }
      // Litigant clients cannot designate internal advocate-confidential documents
      confidentialFlag = false;
    } else if (req.user.role === 'LAWYER') {
      if (legalCase.assignedLawyer.toString() !== req.user.id) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (e) {}
        return sendError(res, 'Access denied. You can only upload documents to cases assigned to you.', 403);
      }
    }

    // 3. Document Type Enum Validation
    const validTypes = ['PETITION', 'AFFIDAVIT', 'ORDER', 'EVIDENCE', 'VAKALATNAMA', 'OTHER'];
    const sanitizedType = validTypes.includes(documentType.toUpperCase())
      ? documentType.toUpperCase()
      : 'OTHER';

    // 4. Create Document in Database
    const relativePath = path.join('uploads', req.file.filename);

    const doc = await Document.create({
      title: title.trim(),
      documentType: sanitizedType,
      case: legalCase._id,
      uploadedBy: req.user.id,
      fileName: req.file.originalname,
      storedFileName: req.file.filename,
      filePath: relativePath,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      uploadDate: new Date(),
      isConfidential: confidentialFlag,
      isDeleted: false,
    });

    await doc.populate([
      { path: 'uploadedBy', select: 'name email role' },
      { path: 'case', select: 'caseReference title' },
    ]);

    // 5. Notification Dispatch
    // If uploaded by client, notify assigned lawyer
    if (req.user.role === 'CLIENT' && legalCase.assignedLawyer) {
      await Notification.create({
        recipient: legalCase.assignedLawyer,
        title: `Client Document Uploaded: ${doc.title}`,
        message: `Client ${req.user.name} uploaded '${doc.fileName}' (${doc.documentType}) for case ${legalCase.caseReference}.`,
        type: 'CASE_UPDATE',
        relatedCase: legalCase._id,
      });
    }

    return sendSuccess(res, sanitizeDoc(doc), 'Document uploaded successfully to vault', 201);
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {}
    }
    console.error('Error uploading document:', error);
    return sendError(res, error.message || 'Internal server error uploading document', 500);
  }
};

/**
 * @desc    Get all documents with search, case filtering, and role confidentiality guards
 * @route   GET /api/documents
 * @access  Protected
 */
const getDocuments = async (req, res) => {
  try {
    const { caseId, documentType, search } = req.query;

    const query = { isDeleted: false };

    // 1. Role-Based Scoping & Confidentiality Enforcement
    if (req.user.role === 'CLIENT') {
      const clientProfile = await Client.findOne({ userAccount: req.user.id });
      if (!clientProfile) {
        return sendSuccess(res, [], 'No documents found', 200);
      }
      const clientCases = await Case.find({ client: clientProfile._id }).select('_id');
      const caseIds = clientCases.map((c) => c._id);

      query.case = { $in: caseIds };
      // STRICT CONFIDENTIALITY: Litigant clients can NEVER view or retrieve confidential documents!
      query.isConfidential = false;
    } else if (req.user.role === 'LAWYER') {
      const lawyerCases = await Case.find({ assignedLawyer: req.user.id }).select('_id');
      const caseIds = lawyerCases.map((c) => c._id);

      query.case = { $in: caseIds };
    }
    // ADMIN and CLERK can access all documents

    // 2. Query Filters
    if (caseId && isValidId(caseId)) {
      query.case = caseId;
    }

    if (documentType) {
      query.documentType = documentType.toUpperCase();
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ title: searchRegex }, { fileName: searchRegex }];
    }

    const documents = await Document.find(query)
      .populate('uploadedBy', 'name email role')
      .populate('case', 'caseReference title courtName')
      .sort({ createdAt: -1 });

    const sanitizedDocs = documents.map(sanitizeDoc);

    return sendSuccess(res, sanitizedDocs, 'Documents retrieved successfully', 200);
  } catch (error) {
    console.error('Error fetching documents:', error);
    return sendError(res, error.message || 'Internal server error fetching documents', 500);
  }
};

/**
 * @desc    Get single document metadata
 * @route   GET /api/documents/:id
 * @access  Protected
 */
const getDocumentById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return sendError(res, 'Invalid document ID format.', 400);
    }

    const doc = await Document.findOne({ _id: id, isDeleted: false })
      .populate('uploadedBy', 'name email role')
      .populate({
        path: 'case',
        select: 'caseReference title courtName client assignedLawyer',
        populate: { path: 'client', select: 'userAccount' },
      });

    if (!doc) {
      return sendError(res, 'Document not found.', 404);
    }

    // Role-based access verification
    if (req.user.role === 'CLIENT') {
      if (doc.isConfidential) {
        return sendError(res, 'Access denied. Privileged confidential document.', 403);
      }
      if (doc.case?.client?.userAccount?.toString() !== req.user.id) {
        return sendError(res, 'Access denied. You do not have permission to view this document.', 403);
      }
    } else if (req.user.role === 'LAWYER') {
      if (doc.case?.assignedLawyer?.toString() !== req.user.id && req.user.role !== 'ADMIN') {
        return sendError(res, 'Access denied. You can only view documents for your assigned cases.', 403);
      }
    }

    return sendSuccess(res, sanitizeDoc(doc), 'Document metadata retrieved', 200);
  } catch (error) {
    console.error('Error fetching document:', error);
    return sendError(res, error.message || 'Internal server error fetching document', 500);
  }
};

/**
 * @desc    Secure document streaming and download with path traversal prevention
 * @route   GET /api/documents/:id/download
 * @access  Protected
 */
const downloadDocument = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return sendError(res, 'Invalid document ID format.', 400);
    }

    const doc = await Document.findOne({ _id: id, isDeleted: false }).populate({
      path: 'case',
      select: 'caseReference title client assignedLawyer',
      populate: { path: 'client', select: 'userAccount' },
    });

    if (!doc) {
      return sendError(res, 'Document not found.', 404);
    }

    // 1. Strict Role & Confidentiality Guard
    if (req.user.role === 'CLIENT') {
      if (doc.isConfidential) {
        return sendError(res, 'Access denied. This is a confidential privileged legal document.', 403);
      }
      if (doc.case?.client?.userAccount?.toString() !== req.user.id) {
        return sendError(res, 'Access denied. You cannot download documents from other clients’ dockets.', 403);
      }
    } else if (req.user.role === 'LAWYER') {
      if (doc.case?.assignedLawyer?.toString() !== req.user.id && req.user.role !== 'ADMIN') {
        return sendError(res, 'Access denied. You can only download documents for your assigned cases.', 403);
      }
    }

    // 2. Path Traversal Guard: Resolve disk file strictly inside UPLOADS_DIR
    const safeDiskFileName = path.basename(doc.storedFileName || path.basename(doc.filePath));
    const absoluteFilePath = path.resolve(UPLOADS_DIR, safeDiskFileName);

    if (!absoluteFilePath.startsWith(UPLOADS_DIR)) {
      return sendError(res, 'Forbidden. Path traversal attempt detected.', 403);
    }

    if (!fs.existsSync(absoluteFilePath)) {
      return sendError(res, 'Physical document file not found in storage vault.', 404);
    }

    // 3. Stream File with Proper Security Headers
    res.setHeader('Content-Type', doc.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(doc.fileName)}"`
    );
    res.setHeader('Content-Length', doc.fileSize);

    const readStream = fs.createReadStream(absoluteFilePath);
    readStream.pipe(res);
  } catch (error) {
    console.error('Error downloading document:', error);
    return sendError(res, error.message || 'Internal server error downloading document', 500);
  }
};

/**
 * @desc    Soft-delete document
 * @route   DELETE /api/documents/:id
 * @access  Protected (ADMIN, LAWYER)
 */
const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return sendError(res, 'Invalid document ID format.', 400);
    }

    if (req.user.role === 'CLIENT') {
      return sendError(res, 'Forbidden. Litigant clients cannot delete court documents.', 403);
    }

    const doc = await Document.findOne({ _id: id, isDeleted: false }).populate('case');
    if (!doc) {
      return sendError(res, 'Document not found.', 404);
    }

    if (req.user.role === 'LAWYER') {
      if (doc.case?.assignedLawyer?.toString() !== req.user.id && doc.uploadedBy?.toString() !== req.user.id) {
        return sendError(res, 'Access denied. You can only delete documents on cases assigned to you.', 403);
      }
    }

    doc.isDeleted = true;
    await doc.save();

    return sendSuccess(res, { id: doc._id }, 'Document removed from active vault', 200);
  } catch (error) {
    console.error('Error deleting document:', error);
    return sendError(res, error.message || 'Internal server error deleting document', 500);
  }
};

module.exports = {
  uploadDocument,
  getDocuments,
  getDocumentById,
  downloadDocument,
  deleteDocument,
};
