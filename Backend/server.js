import dotenv from 'dotenv';
import { createLogger } from './utils/logger.js';
import { connectDB } from './db.js';
import app from './app.js';

dotenv.config();

const PORT = process.env.PORT;
const NODE_ENV = process.env.NODE_ENV || 'development';

const logger = createLogger('Server');

const mongoURI = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME;

logger.info(`Starting application in ${NODE_ENV} environment`);

// Connect DB then listen
const mongoConnectAndListen = async () => {
  try {
    await connectDB(mongoURI, dbName);
  } catch (err) {
    logger.error('MongoDB connection failed:', { error: err.message });
    logger.warn('Server will continue but database features will not work');
    logger.info('To fix MongoDB connection:');
    logger.info('1. Check if MongoDB Atlas cluster is running');
    logger.info('2. Verify IP address is whitelisted (0.0.0.0/0 for testing)');
    logger.info('3. Confirm MONGODB_URI in .env is correct');
    logger.info('4. Check network connection');
  }

  app.listen(PORT, () => {
    logger.info(`🚀 Server running on port ${PORT}`);
    logger.info(`📡 Environment: ${NODE_ENV}`);
    logger.info('✅ Backend is ready to accept requests');
  });
};

mongoConnectAndListen();