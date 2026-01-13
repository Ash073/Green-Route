import express from 'express';
import User from './models/User.js';
import { authenticateToken } from './middleware/auth.js';
import { asyncHandler, AppError } from './middleware/errorHandler.js';

const router = express.Router();

// Get driver's vehicle details
router.get('/details', authenticateToken, asyncHandler(async (req, res, next) => {
  console.log('[Vehicle] Fetching details for user ID:', req.user?.id);
  const user = await User.findById(req.user.id);
  
  if (!user) {
    console.error('[Vehicle] User not found in database for ID:', req.user?.id);
    return next(new AppError('User not found', 404));
  }
  
  console.log('[Vehicle] User found:', user.email, 'Type:', user.userType);

  if (user.userType !== 'driver') {
    return next(new AppError('Only drivers can access vehicle details', 403));
  }

  res.json({
    success: true,
    vehicleType: user.vehicleType,
    vehicleDetails: user.vehicleDetails,
    phoneNumber: user.phoneNumber
  });
}));

// Update driver's vehicle details
router.put('/details', authenticateToken, asyncHandler(async (req, res, next) => {
  const { vehicleType, vehicleDetails, phoneNumber } = req.body;

  const user = await User.findById(req.user.id);
  
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  if (user.userType !== 'driver') {
    return next(new AppError('Only drivers can update vehicle details', 403));
  }

  // Update phone number
  if (phoneNumber) {
    user.phoneNumber = phoneNumber;
  }

  // Update vehicle type
  if (vehicleType && ['bike', 'scooter', 'auto', 'car', 'cycle', 'van'].includes(vehicleType)) {
    user.vehicleType = vehicleType;
  }

  // Update vehicle details
  if (vehicleDetails) {
    user.vehicleDetails = {
      ...user.vehicleDetails,
      registrationNumber: vehicleDetails.registrationNumber?.toUpperCase() || user.vehicleDetails.registrationNumber,
      make: vehicleDetails.make || user.vehicleDetails.make,
      model: vehicleDetails.model || user.vehicleDetails.model,
      year: vehicleDetails.year ? parseInt(vehicleDetails.year) : user.vehicleDetails.year,
      color: vehicleDetails.color || user.vehicleDetails.color,
      fuelType: vehicleDetails.fuelType || user.vehicleDetails.fuelType,
      seatingCapacity: vehicleDetails.seatingCapacity ? parseInt(vehicleDetails.seatingCapacity) : user.vehicleDetails.seatingCapacity,
      rcNumber: vehicleDetails.rcNumber || user.vehicleDetails.rcNumber,
      insuranceExpiry: vehicleDetails.insuranceExpiry ? new Date(vehicleDetails.insuranceExpiry) : user.vehicleDetails.insuranceExpiry,
      pollutionCertificateExpiry: vehicleDetails.pollutionCertificateExpiry ? new Date(vehicleDetails.pollutionCertificateExpiry) : user.vehicleDetails.pollutionCertificateExpiry
    };
  }

  await user.save();

  res.json({
    success: true,
    message: 'Vehicle details updated successfully',
    vehicleType: user.vehicleType,
    vehicleDetails: user.vehicleDetails,
    phoneNumber: user.phoneNumber
  });
}));

// Get vehicle verification status
router.get('/verification-status', authenticateToken, asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  if (user.userType !== 'driver') {
    return next(new AppError('Only drivers can access verification status', 403));
  }

  res.json({
    success: true,
    verificationStatus: user.vehicleDetails.verificationStatus || 'pending',
    verificationDate: user.vehicleDetails.verificationDate,
    registrationNumber: user.vehicleDetails.registrationNumber,
    make: user.vehicleDetails.make,
    model: user.vehicleDetails.model
  });
}));

// Check if vehicle documents are expiring soon
router.get('/expiry-check', authenticateToken, asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  if (user.userType !== 'driver') {
    return next(new AppError('Only drivers can access expiry information', 403));
  }

  const today = new Date();
  const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  
  const alerts = [];

  if (user.vehicleDetails.insuranceExpiry) {
    const insuranceDate = new Date(user.vehicleDetails.insuranceExpiry);
    if (insuranceDate < today) {
      alerts.push({ type: 'insurance', status: 'expired', date: insuranceDate });
    } else if (insuranceDate < thirtyDaysFromNow) {
      alerts.push({ type: 'insurance', status: 'expiring_soon', date: insuranceDate });
    }
  }

  if (user.vehicleDetails.pollutionCertificateExpiry) {
    const pollutionDate = new Date(user.vehicleDetails.pollutionCertificateExpiry);
    if (pollutionDate < today) {
      alerts.push({ type: 'pollution', status: 'expired', date: pollutionDate });
    } else if (pollutionDate < thirtyDaysFromNow) {
      alerts.push({ type: 'pollution', status: 'expiring_soon', date: pollutionDate });
    }
  }

  res.json({
    success: true,
    alerts,
    vehicleDetails: {
      registrationNumber: user.vehicleDetails.registrationNumber,
      insuranceExpiry: user.vehicleDetails.insuranceExpiry,
      pollutionCertificateExpiry: user.vehicleDetails.pollutionCertificateExpiry
    }
  });
}));

export default router;
