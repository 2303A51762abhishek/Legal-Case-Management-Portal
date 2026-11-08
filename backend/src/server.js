const app = require('./app');
const config = require('./config/env');

const PORT = config.port || 5000;
const HOST = config.host || '127.0.0.1';

const server = app.listen(PORT, HOST, () => {
  console.log('====================================================');
  console.log(`⚖️  JurisFlow Legal Portal Backend API running`);
  console.log(`📡 Host: ${HOST} | Port: ${PORT} | Environment: ${config.env}`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`🎓 Project: ${config.project.name}`);
  console.log(`👨‍🎓 Student: ${config.project.student} (${config.project.roll})`);
  console.log('====================================================');
});

// Graceful process shutdown handling
const gracefulShutdown = (signal) => {
  console.log(`\nReceived ${signal}. Gracefully closing HTTP server...`);
  server.close(() => {
    console.log('HTTP server closed successfully.');
    process.exit(0);
  });

  // Force close if server does not terminate in 5s
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 5000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = server;
