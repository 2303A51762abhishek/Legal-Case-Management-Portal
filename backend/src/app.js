const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');
const config = require('./config/env');
const routes = require('./routes');
const { notFoundHandler, errorHandler } = require('./middleware/error.middleware');

const app = express();

// 1. Security HTTP Headers
app.use(helmet());

// 2. Cross-Origin Resource Sharing (CORS) Configuration
const configuredOrigins = (config.clientOrigin || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = [
  ...configuredOrigins,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
  'http://localhost:80',
  'http://127.0.0.1:80',
  'http://localhost',
  'http://127.0.0.1',
  'http://frontend',
  'http://jurisflow.local',
  'https://jurisflow.local',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    let isAllowed = allowedOrigins.indexOf(origin) !== -1 || config.env === 'development';
    if (!isAllowed) {
      try {
        const url = new URL(origin);
        if (url.hostname.endsWith('.onrender.com')) {
          isAllowed = true;
        }
      } catch (e) {}
    }
    if (isAllowed) {
      return callback(null, true);
    }
    return callback(new Error('CORS Policy: Request origin not allowed.'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Disposition', 'Content-Length'],
}));

// 3. HTTP Request Logging
if (config.env !== 'test') {
  app.use(morgan(config.env === 'production' ? 'combined' : 'dev'));
}

// 4. Request Body Parsing & Cookies
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 5. Base API Router (Documents are strictly streamed via authenticated /api/documents/:id/download)
app.use('/api', routes);

// 7. Root Route Redirection / Info
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    portal: 'Legal Case and Court Hearing Management Portal API',
    student: config.project.student,
    rollNumber: config.project.roll,
    academicYear: config.project.academicYear,
    healthCheck: '/api/health',
  });
});

// 8. 404 & Centralized Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
