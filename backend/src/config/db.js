const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const config = require('./env');

const DEV_URI_FILE = path.join(__dirname, '../../.mongo_dev_uri');

let memoryServer = null;
let isListenersAttached = false;

/**
 * Get current Mongoose connection status
 */
const getDBStatus = () => {
  const states = {
    0: 'DISCONNECTED',
    1: 'CONNECTED',
    2: 'CONNECTING',
    3: 'DISCONNECTING',
  };

  const readyState = mongoose.connection.readyState;
  return {
    state: states[readyState] || 'UNKNOWN',
    isConnected: readyState === 1,
    host: mongoose.connection.host || null,
    databaseName: mongoose.connection.name || null,
  };
};

/**
 * Attach connection event listeners once
 */
const setupEventListeners = () => {
  if (isListenersAttached) return;

  mongoose.connection.on('connected', () => {
    console.log(`🍃 MongoDB Connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
  });

  mongoose.connection.on('error', (err) => {
    console.error(`❌ MongoDB Connection Error: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB Disconnected.');
  });

  isListenersAttached = true;
};

/**
 * Connect to MongoDB with error handling and dev memory-server fallback
 */
const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return getDBStatus();
  }

  setupEventListeners();
  const uri = config.mongodbUri;

  try {
    console.log(`🔌 Attempting to connect to MongoDB at: ${uri.replace(/\/\/.*@/, '//***:***@')}`);
    await mongoose.connect(uri, {
      dbName: 'legal_case_management_db',
      serverSelectionTimeoutMS: 2500,
    });
    return getDBStatus();
  } catch (err) {
    console.warn(`⚠️  Could not connect to external/Docker MongoDB (${err.message}).`);

    // In development mode, provide automatic in-memory MongoDB fallback
    if (config.env === 'development') {
      try {
        if (!memoryServer) {
          // Check if an existing dev memory server is already running and recorded
          if (fs.existsSync(DEV_URI_FILE)) {
            try {
              const recordedUri = fs.readFileSync(DEV_URI_FILE, 'utf8').trim();
              if (recordedUri) {
                await mongoose.connect(recordedUri, {
                  dbName: 'legal_case_management_db',
                  serverSelectionTimeoutMS: 2500,
                });
                console.log(`💡 Connected to active shared In-Memory MongoDB: ${recordedUri}`);
                return getDBStatus();
              }
            } catch (_) {
              // Stale file or inaccessible; continue to create fresh
            }
          }

          console.log('🔄 Initializing in-memory MongoDB development server...');
          const { MongoMemoryServer } = require('mongodb-memory-server');
          memoryServer = await MongoMemoryServer.create({
            instance: {
              dbName: 'legal_case_management_db',
            },
          });
          const memoryUri = memoryServer.getUri();
          try {
            fs.writeFileSync(DEV_URI_FILE, memoryUri);
          } catch (_) {}
        }
        const memoryUri = memoryServer.getUri();
        console.log(`💡 In-Memory MongoDB running for local development: ${memoryUri}`);

        await mongoose.connect(memoryUri, {
          dbName: 'legal_case_management_db',
          serverSelectionTimeoutMS: 5000,
        });
        return getDBStatus();
      } catch (memErr) {
        console.error('❌ Failed to launch in-memory MongoDB fallback:', memErr.message);
        throw err;
      }
    } else {
      throw err;
    }
  }
};

/**
 * Disconnect from MongoDB gracefully
 */
const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
    try {
      if (fs.existsSync(DEV_URI_FILE)) fs.unlinkSync(DEV_URI_FILE);
    } catch (_) {}
  }
  console.log('🍃 MongoDB connection closed.');
};

module.exports = {
  connectDB,
  disconnectDB,
  getDBStatus,
};
