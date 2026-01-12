import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { AppError, asyncHandler } from './errorHandler.js';

// Store refresh tokens (in production, use Redis or database)
const refreshTokens = new Set();

export const generateTokens = (userId, email, userType) => {
  const accessToken = jwt.sign(
    { userId, email, userType },
    process.env.JWT_SECRET || 'fallback-secret',
    { expiresIn: process.env.JWT_EXPIRE || '15m' }
  );

  const refreshToken = jwt.sign(
    { userId, email },
    process.env.JWT_REFRESH_SECRET || 'refresh-fallback-secret',
    { expiresIn: '7d' }
  );

  // Store refresh token
  refreshTokens.add(refreshToken);

  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
  } catch (error) {
    throw new AppError('Invalid access token', 401);
  }
};

export const verifyRefreshToken = (token) => {
  try {
    if (!refreshTokens.has(token)) {
      throw new AppError('Refresh token has been revoked', 401);
    }
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'refresh-fallback-secret');
  } catch (error) {
    if (error.message === 'Refresh token has been revoked') {
      throw error;
    }
    throw new AppError('Invalid refresh token', 401);
  }
};

export const revokeRefreshToken = (token) => {
  refreshTokens.delete(token);
};

export const revokeAllTokensForUser = (userId) => {
  // In production, you'd query the database for all tokens for this user
  // For now, clear all tokens (in production use Redis)
  refreshTokens.clear();
};
