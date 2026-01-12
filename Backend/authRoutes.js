import express from 'express';
import jwt from 'jsonwebtoken';
import User from './models/User.js';
import { 
  generateTokens, 
  verifyRefreshToken, 
  revokeRefreshToken,
  revokeAllTokensForUser 
} from './middleware/tokenManager.js';
import { validateSignupInput, validateLoginInput } from './validators/inputValidator.js';
import { asyncHandler, AppError } from './middleware/errorHandler.js';
import { authenticateToken } from './middleware/auth.js';

const router = express.Router();

// Signup route
router.post('/signup', asyncHandler(async (req, res, next) => {
  const { name, email, password, userType, vehicleType, vehicleDetails, phoneNumber } = req.body;
  
  // Validate input
  const validation = validateSignupInput({ name, email, password });
  if (!validation.valid) {
    return next(new AppError(JSON.stringify(validation.errors), 400));
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return next(new AppError('Email already registered', 409));
  }

  // Create user object
  const userTypeVal = userType && ['driver', 'user'].includes(userType) ? userType : 'user';
  const user = new User({
    name: name.trim(),
    email: email.toLowerCase(),
    passwordHash: password,
    userType: userTypeVal,
    phoneNumber: phoneNumber || null
  });

  // If driver, add vehicle information
  if (userTypeVal === 'driver') {
    if (vehicleType && ['bike', 'scooter', 'auto', 'car', 'cycle', 'van'].includes(vehicleType)) {
      user.vehicleType = vehicleType;
    }
    
    // Add detailed vehicle information if provided
    if (vehicleDetails) {
      user.vehicleDetails = {
        registrationNumber: vehicleDetails.registrationNumber?.toUpperCase() || null,
        make: vehicleDetails.make || null,
        model: vehicleDetails.model || null,
        year: vehicleDetails.year ? parseInt(vehicleDetails.year) : null,
        color: vehicleDetails.color || null,
        fuelType: vehicleDetails.fuelType || null,
        seatingCapacity: vehicleDetails.seatingCapacity ? parseInt(vehicleDetails.seatingCapacity) : null,
        rcNumber: vehicleDetails.rcNumber || null,
        insuranceExpiry: vehicleDetails.insuranceExpiry ? new Date(vehicleDetails.insuranceExpiry) : null,
        pollutionCertificateExpiry: vehicleDetails.pollutionCertificateExpiry ? new Date(vehicleDetails.pollutionCertificateExpiry) : null,
        verificationStatus: 'pending'
      };
    }
  }

  await user.save();

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(
    user._id.toString(),
    user.email,
    user.userType
  );

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    user: user.toJSON(),
    accessToken,
    refreshToken
  });
}));

// Login route
router.post('/login', asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  
  // Validate input
  const validation = validateLoginInput({ email, password });
  if (!validation.valid) {
    return next(new AppError(JSON.stringify(validation.errors), 400));
  }

  // Find user by email
  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  if (!user) {
    return next(new AppError('Invalid email or password', 401));
  }

  // Compare password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return next(new AppError('Invalid email or password', 401));
  }

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(
    user._id.toString(),
    user.email,
    user.userType
  );

  res.json({
    success: true,
    message: 'Login successful',
    user: user.toJSON(),
    accessToken,
    refreshToken
  });
}));

// Refresh token route
router.post('/refresh', asyncHandler(async (req, res, next) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return next(new AppError('Refresh token is required', 400));
  }

  // Verify refresh token
  const decoded = verifyRefreshToken(refreshToken);

  // Get user
  const user = await User.findById(decoded.userId);
  if (!user) {
    revokeRefreshToken(refreshToken);
    return next(new AppError('User not found', 404));
  }

  // Generate new tokens
  const { accessToken: newAccessToken, refreshToken: newRefreshToken } = generateTokens(
    user._id.toString(),
    user.email,
    user.userType
  );

  // Revoke old refresh token
  revokeRefreshToken(refreshToken);

  res.json({
    success: true,
    message: 'Tokens refreshed successfully',
    accessToken: newAccessToken,
    refreshToken: newRefreshToken
  });
}));

// Get current user
router.get('/me', authenticateToken, asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.userId);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  res.json({
    success: true,
    user: user.toJSON()
  });
}));

// Logout route
router.post('/logout', authenticateToken, asyncHandler(async (req, res, next) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    revokeRefreshToken(refreshToken);
  }

  // Set driver's online status to false
  await User.findByIdAndUpdate(req.user.userId, { 
    isOnline: false,
    'currentLocation.updatedAt': new Date()
  });

  res.json({
    success: true,
    message: 'Logged out successfully'
  });
}));

// Logout from all devices (revoke all tokens)
router.post('/logout-all', authenticateToken, asyncHandler(async (req, res, next) => {
  revokeAllTokensForUser(req.user.userId);

  // Set driver's online status to false
  await User.findByIdAndUpdate(req.user.userId, { 
    isOnline: false,
    'currentLocation.updatedAt': new Date()
  });

  res.json({
    success: true,
    message: 'Logged out from all devices'
  });
}));

export default router;
