import jwt from 'jsonwebtoken';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('ErrorHandler');

// Custom error class
export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

// Error handling middleware
export const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || 'Internal Server Error';

  // Handle invalid JWT
  if (err.name === 'JsonWebTokenError') {
    err.statusCode = 401;
    err.message = 'Invalid token';
  }

  // Handle expired JWT
  if (err.name === 'TokenExpiredError') {
    err.statusCode = 401;
    err.message = 'Token has expired';
  }

  // Handle duplicate key error (MongoDB)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    err.statusCode = 400;
    err.message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
  }

  // Handle validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
    err.statusCode = 400;
    err.message = messages;
  }

  // Log error
  const logData = {
    statusCode: err.statusCode,
    message: err.message,
    method: req.method,
    path: req.path,
    userId: req.user?.userId || 'anonymous'
  };

  if (err.statusCode >= 500) {
    logger.error(`Server Error: ${err.message}`, logData);
  } else if (err.statusCode >= 400) {
    logger.warn(`Client Error: ${err.message}`, logData);
  }

  // Send error response
  res.status(err.statusCode).json({
    success: false,
    statusCode: err.statusCode,
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// Async handler to wrap async route handlers
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// 404 handler
export const notFound = (req, res, next) => {
  logger.warn(`Route not found: ${req.method} ${req.path}`);
  const error = new AppError(`Not Found - ${req.originalUrl}`, 404);
  next(error);
};
