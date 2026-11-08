const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { sendError } = require('../utils/response');

// Ensure uploads directory exists
const UPLOADS_DIR = path.resolve(__dirname, '../uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Allowed MIME types and extensions
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
]);

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png']);

// Storage configuration with secure random filenames
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const rawExt = path.extname(file.originalname).toLowerCase();
    const safeExt = ALLOWED_EXTENSIONS.has(rawExt) ? rawExt : '.bin';
    const uniqueSuffix = `${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
    const safeFilename = `doc_${uniqueSuffix}${safeExt}`;
    cb(null, safeFilename);
  },
});

// Multer instance with 10 MB limit and extension/MIME pre-filter
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 Megabytes
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return cb(new Error('Invalid file type. Only PDF, DOC, DOCX, JPG, and PNG documents are allowed.'));
    }
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(new Error('Invalid MIME type. Document format is not supported.'));
    }
    cb(null, true);
  },
});

/**
 * Validates actual file content headers (magic bytes) to prevent disguised scripts
 * @param {string} filePath Absolute path of saved file
 * @returns {boolean} True if magic bytes match expected format
 */
const validateMagicBytes = (filePath) => {
  try {
    const buffer = Buffer.alloc(8);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, 8, 0);
    fs.closeSync(fd);

    // PDF: %PDF (0x25 0x50 0x44 0x46)
    if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
      return true;
    }

    // PNG: 0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A
    if (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4E &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0D &&
      buffer[5] === 0x0A &&
      buffer[6] === 0x1A &&
      buffer[7] === 0x0A
    ) {
      return true;
    }

    // JPEG: 0xFF 0xD8 0xFF
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
      return true;
    }

    // DOCX (ZIP format): 0x50 0x4B 0x03 0x04 or 0x50 0x4B 0x05 0x06
    if (buffer[0] === 0x50 && buffer[1] === 0x4B) {
      return true;
    }

    // DOC (OLE Compound File Binary): 0xD0 0xCF 0x11 0xE0
    if (buffer[0] === 0xD0 && buffer[1] === 0xCF && buffer[2] === 0x11 && buffer[3] === 0xE0) {
      return true;
    }

    return false;
  } catch (err) {
    return false;
  }
};

/**
 * Express middleware wrapping multer with magic byte verification and error normalization
 */
const documentUploadMiddleware = (req, res, next) => {
  const uploadSingle = upload.single('file');

  uploadSingle(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return sendError(res, 'File size limit exceeded. Maximum allowed size is 10 MB.', 400);
      }
      return sendError(res, `Upload error: ${err.message}`, 400);
    } else if (err) {
      return sendError(res, err.message, 400);
    }

    if (!req.file) {
      return sendError(res, 'No file was provided for upload.', 400);
    }

    // Perform deep magic byte header inspection
    const isValidSignature = validateMagicBytes(req.file.path);
    if (!isValidSignature) {
      // Clean up fraudulent/corrupted file immediately
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupErr) {
        console.error('Failed to unlink rejected upload:', cleanupErr);
      }
      return sendError(
        res,
        'File verification failed. The uploaded file content does not match genuine PDF, Word, or Image signatures.',
        400
      );
    }

    next();
  });
};

module.exports = {
  documentUploadMiddleware,
  UPLOADS_DIR,
  validateMagicBytes,
};
