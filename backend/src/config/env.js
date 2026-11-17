const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from backend/.env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  env: process.env.NODE_ENV || 'development',
  host: process.env.HOST || '0.0.0.0',
  port: parseInt(process.env.PORT || '5000', 10),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/legal_case_management_db',
  jwt: {
    secret: process.env.JWT_SECRET || 'dev_jwt_fallback_secret_not_for_prod',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  upload: {
    path: path.resolve(__dirname, '../uploads'),
    maxSizeBytes: parseInt(process.env.MAX_FILE_SIZE_BYTES || '10485760', 10), // 10MB default
    allowedMimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png'
    ],
  },
  project: {
    name: 'Legal Case and Court Hearing Management Portal',
    student: process.env.STUDENT_NAME || 'MAMILLAPALLY ABHISHEK',
    roll: process.env.STUDENT_ROLL || '2303A51762',
    academicYear: process.env.ACADEMIC_YEAR || '2026-2027',
  }
};

module.exports = config;
