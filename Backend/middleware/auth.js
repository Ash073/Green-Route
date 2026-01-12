import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler.js';

export const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return next(new AppError('Access token required', 401));
    }

    jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret', (err, user) => {
      if (err) {
        return next(new AppError('Invalid or expired token', 401));
      }
      req.user = user;
      next();
    });
  } catch (error) {
    next(new AppError('Authentication failed', 401));
  }
};

export const isDriver = (req, res, next) => {
  if (req.user?.userType !== 'driver') {
    return next(new AppError('Only drivers can access this resource', 403));
  }
  next();
};

export const isAuthenticated = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }
  next();
};
