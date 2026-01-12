import mongoose from 'mongoose';
import { createLogger } from './utils/logger.js';

const logger = createLogger('DB');

export async function connectDB(mongoURI, dbName) {
  mongoose.set('strictQuery', true);

  if (!mongoURI) {
    logger.error('MONGODB_URI not found in environment variables');
    throw new Error('Missing MONGODB_URI');
  }

  logger.info('Attempting to connect to MongoDB...');
  await mongoose.connect(mongoURI, {
    dbName,
    serverSelectionTimeoutMS: 10000,
    retryWrites: true,
    w: 'majority',
  });
  logger.info(`MongoDB connected successfully to database: ${dbName}`);
  return mongoose.connection;
}

export async function disconnectDB() {
  await mongoose.disconnect();
  logger.info('MongoDB connection closed');
}

export function connectionState() {
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  return mongoose.connection.readyState;
}
