const app = require('./app');
const config = require('./config/env');
const { connectDB, disconnectDB } = require('./config/db');
const { User } = require('./models');
const seedDatabase = require('./utils/seed');

const PORT = config.port || 5000;
const HOST = config.host || '127.0.0.1';

let server;

// Initialize Database Connection and start HTTP Server
const startServer = async () => {
  try {
    await connectDB();

    // Auto-seed demo accounts if database is fresh
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('🌱 Fresh database detected. Auto-seeding initial demo records...');
      await seedDatabase(false);
    }

    server = app.listen(PORT, HOST, () => {
      console.log('====================================================');
      console.log(`⚖️  JurisFlow Legal Portal Backend API running`);
      console.log(`📡 Host: ${HOST} | Port: ${PORT} | Environment: ${config.env}`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`🎓 Project: ${config.project.name}`);
      console.log(`👨‍🎓 Student: ${config.project.student} (${config.project.roll})`);
      console.log('====================================================');
    });
  } catch (err) {
    console.error('❌ Failed to start backend server:', err.message);
    process.exit(1);
  }
};

startServer();

// Graceful process shutdown handling
const gracefulShutdown = async (signal) => {
  console.log(`\nReceived ${signal}. Gracefully closing HTTP server and database...`);
  if (server) {
    server.close(async () => {
      await disconnectDB();
      console.log('HTTP server and database connections closed successfully.');
      process.exit(0);
    });
  } else {
    await disconnectDB();
    process.exit(0);
  }

  // Force close if server does not terminate in 5s
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 5000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = app;
