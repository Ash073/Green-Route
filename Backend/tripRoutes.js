import express from 'express';
import Trip from './models/Trip.js';
import User from './models/User.js';
import { asyncHandler, AppError } from './middleware/errorHandler.js';
import { authenticateToken } from './middleware/auth.js';
import { validateTripData } from './validators/inputValidator.js';
import { getCache, setCache, delCache } from './utils/cache.js';
import { createLogger } from './utils/logger.js';

const router = express.Router();

// Middleware: Authenticate all trip routes
router.use(authenticateToken);

// Helper function: Check if two routes match (route similarity algorithm)
function doRoutesMatch(driverRoute, userRoute, maxDeviationKm = 2) {
  if (!driverRoute || !userRoute) return false;
  
  // Extract coordinates
  const driverOrigin = driverRoute.origin?.coordinates;
  const driverDest = driverRoute.destination?.coordinates;
  const userOrigin = userRoute.origin?.coordinates;
  const userDest = userRoute.destination?.coordinates;
  
  if (!driverOrigin || !driverDest || !userOrigin || !userDest) return false;
  
  // Calculate distances between key points
  const originDistance = calculateDistance(
    driverOrigin.lat, driverOrigin.lng,
    userOrigin.lat, userOrigin.lng
  );
  
  const destDistance = calculateDistance(
    driverDest.lat, driverDest.lng,
    userDest.lat, userDest.lng
  );
  
  // Check if user's origin is along driver's route (near driver's origin)
  const userOriginNearDriverOrigin = originDistance <= maxDeviationKm;
  
  // Check if user's destination is along driver's route (near driver's destination)
  const userDestNearDriverDest = destDistance <= maxDeviationKm;
  
  // Routes match if both origin and destination are within acceptable deviation
  const routesAlign = userOriginNearDriverOrigin && userDestNearDriverDest;
  
  // Alternative: Check if user's origin is near driver's current route
  // and destination is in the same general direction
  const userOriginNearDriverRoute = originDistance <= maxDeviationKm * 1.5;
  const destinationsAlign = destDistance <= maxDeviationKm * 2;
  
  return routesAlign || (userOriginNearDriverRoute && destinationsAlign);
}

// Save a trip
router.post('/save', asyncHandler(async (req, res, next) => {
  const { origin, destination, selectedRoute, alternativeRoutes, emissionSavings, status } = req.body;
  const userId = req.user.userId;
  
  // Validate trip data
  const validation = validateTripData({ userId, origin, destination, selectedRoute });
  if (!validation.valid) {
    return next(new AppError(JSON.stringify(validation.errors), 400));
  }

  const validStatuses = ['planned', 'in-progress', 'completed', 'cancelled'];
  const initialStatus = validStatuses.includes(status) ? status : 'in-progress';

  const trip = new Trip({
    userId,
    origin,
    destination,
    selectedRoute,
    alternativeRoutes: alternativeRoutes || [],
    emissionSavings: emissionSavings || { amount: 0, percentage: 0 },
    status: initialStatus
  });

  await trip.save();
  // Invalidate cached stats for this user
  delCache(`stats:${userId}`);
  
  res.status(201).json({
    success: true,
    message: 'Trip saved successfully',
    trip
  });
}));

// Get user's trips
router.get('/user/:userId', asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  const { status, limit = 50, page = 1 } = req.query;
  
  // Check if user is requesting their own trips or is admin
  if (req.user.userId.toString() !== userId && req.user.userType !== 'admin') {
    return next(new AppError('You can only view your own trips', 403));
  }
  
  const query = { userId };
  if (status) {
    if (!['planned', 'in-progress', 'completed', 'cancelled'].includes(status)) {
      return next(new AppError('Invalid status filter', 400));
    }
    query.status = status;
  }
  
  const limitNum = Math.min(parseInt(limit) || 50, 100);
  const pageNum = Math.max(1, parseInt(page) || 1);
  
  const trips = await Trip.find(query)
    .sort({ createdAt: -1 })
    .limit(limitNum)
    .skip((pageNum - 1) * limitNum);
  
  const totalTrips = await Trip.countDocuments(query);
  
  res.json({
    success: true,
    trips,
    pagination: {
      total: totalTrips,
      currentPage: pageNum,
      totalPages: Math.ceil(totalTrips / limitNum),
      limit: limitNum
    }
  });
}));

// Get single trip
router.get('/:tripId', asyncHandler(async (req, res, next) => {
  const { tripId } = req.params;
  
  const trip = await Trip.findById(tripId);
  
  if (!trip) {
    return next(new AppError('Trip not found', 404));
  }
  
  // Check authorization
  if (trip.userId.toString() !== req.user.userId.toString()) {
    return next(new AppError('You do not have permission to view this trip', 403));
  }
  
  res.json({
    success: true,
    trip
  });
}));

// Update trip
router.put('/:tripId', asyncHandler(async (req, res, next) => {
  const { tripId } = req.params;
  const { origin, destination, selectedRoute, alternativeRoutes, emissionSavings } = req.body;
  
  const trip = await Trip.findById(tripId);
  
  if (!trip) {
    return next(new AppError('Trip not found', 404));
  }
  
  // Check authorization
  if (trip.userId.toString() !== req.user.userId.toString()) {
    return next(new AppError('You do not have permission to update this trip', 403));
  }
  
  // Update fields
  if (origin) trip.origin = origin;
  if (destination) trip.destination = destination;
  if (selectedRoute) trip.selectedRoute = selectedRoute;
  if (alternativeRoutes) trip.alternativeRoutes = alternativeRoutes;
  if (emissionSavings) trip.emissionSavings = emissionSavings;
  
  await trip.save();
  // Invalidate cached stats for this user
  delCache(`stats:${trip.userId}`);
  
  res.json({
    success: true,
    message: 'Trip updated successfully',
    trip
  });
}));

// Update trip status
router.patch('/:tripId/status', asyncHandler(async (req, res, next) => {
  const { tripId } = req.params;
  const { status } = req.body;
  
  if (!['planned', 'in-progress', 'completed', 'cancelled'].includes(status)) {
    return next(new AppError('Invalid status. Must be: planned, in-progress, completed, or cancelled', 400));
  }
  
  const trip = await Trip.findById(tripId);
  
  if (!trip) {
    return next(new AppError('Trip not found', 404));
  }
  
  // Check authorization
  if (trip.userId.toString() !== req.user.userId.toString()) {
    return next(new AppError('You do not have permission to update this trip', 403));
  }
  
  trip.status = status;
  if (status === 'completed') {
    trip.completedAt = new Date();
  }
  
  await trip.save();
  // Invalidate cached stats for this user
  delCache(`stats:${trip.userId}`);
  
  res.json({
    success: true,
    message: 'Trip status updated successfully',
    trip
  });
}));

// Cancel trip with reason and driver notification
router.patch('/:tripId/cancel', asyncHandler(async (req, res, next) => {
  const { tripId } = req.params;
  const { reason, cancelledBy } = req.body;
  const logger = createLogger('TripCancel');
  
  if (!reason || reason.trim() === '') {
    return next(new AppError('Cancellation reason is required', 400));
  }
  
  const trip = await Trip.findById(tripId);
  
  if (!trip) {
    return next(new AppError('Trip not found', 404));
  }
  
  // Check authorization
  const isUser = trip.userId.toString() === req.user.userId.toString();
  const isDriver = trip.driverId && trip.driverId.toString() === req.user.userId.toString();
  
  if (!isUser && !isDriver) {
    return next(new AppError('You do not have permission to cancel this trip', 403));
  }
  
  trip.status = 'cancelled';
  trip.cancellationReason = reason;
  trip.cancelledBy = cancelledBy || (isUser ? 'user' : 'driver');
  trip.cancelledAt = new Date();
  
  await trip.save();
  
  // Notify the other party
  if (trip.driverId && isUser) {
    // User cancelled - notify driver
    const driver = await User.findById(trip.driverId);
    if (driver) {
      logger.info(`User cancelled trip ${tripId}. Driver ${driver.name} notified. Reason: ${reason}`);
      // In production, send push notification or SMS to driver here
      // For now, we'll store a notification flag that driver can poll
      await User.findByIdAndUpdate(trip.driverId, {
        $push: {
          notifications: {
            type: 'trip_cancelled',
            tripId: trip._id,
            message: `Trip cancelled by user. Reason: ${reason}`,
            createdAt: new Date()
          }
        }
      });
    }
  } else if (trip.userId && isDriver) {
    // Driver cancelled - notify user
    const user = await User.findById(trip.userId);
    if (user) {
      logger.info(`Driver cancelled trip ${tripId}. User ${user.name} notified. Reason: ${reason}`);
      await User.findByIdAndUpdate(trip.userId, {
        $push: {
          notifications: {
            type: 'trip_cancelled',
            tripId: trip._id,
            message: `Trip cancelled by driver. Reason: ${reason}`,
            createdAt: new Date()
          }
        }
      });
    }
  }
  
  // Invalidate cached stats
  delCache(`stats:${trip.userId}`);
  
  res.json({
    success: true,
    message: 'Trip cancelled successfully',
    trip,
    notificationSent: !!trip.driverId || !!trip.userId
  });
}));

// Delete a trip
router.delete('/:tripId', asyncHandler(async (req, res, next) => {
  const { tripId } = req.params;
  
  const trip = await Trip.findById(tripId);
  
  if (!trip) {
    return next(new AppError('Trip not found', 404));
  }
  
  // Check authorization
  if (trip.userId.toString() !== req.user.userId.toString()) {
    return next(new AppError('You do not have permission to delete this trip', 403));
  }
  
  await Trip.findByIdAndDelete(tripId);
  // Invalidate cached stats for this user
  delCache(`stats:${trip.userId}`);
  
  res.json({
    success: true,
    message: 'Trip deleted successfully'
  });
}));

// Get user's carbon savings summary
router.get('/stats/:userId', asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  const logger = createLogger('TripStats');
  
  // Check if user is requesting their own stats
  if (req.user.userId.toString() !== userId && req.user.userType !== 'admin') {
    return next(new AppError('You can only view your own statistics', 403));
  }
  
  // Try cache first
  const cacheKey = `stats:${userId}`;
  const cached = getCache(cacheKey);
  if (cached) {
    logger.debug('Stats cache hit', { userId });
    return res.json({ success: true, stats: cached, cached: true });
  }

  logger.debug('Stats cache miss', { userId });
  const trips = await Trip.find({ 
    userId, 
    status: { $in: ['planned', 'in-progress', 'completed'] } 
  });
  
  const summary = {
    totalTrips: trips.length,
    totalDistance: trips.reduce((sum, trip) => sum + (trip.selectedRoute?.distance || 0), 0),
    totalEmission: trips.reduce((sum, trip) => sum + (trip.selectedRoute?.emission || 0), 0),
    totalEmissionSavings: trips.reduce((sum, trip) => sum + (trip.emissionSavings?.amount || 0), 0),
    averageEcoScore: trips.length > 0 ? 
      trips.reduce((sum, trip) => sum + (trip.selectedRoute?.ecoScore || 0), 0) / trips.length : 0,
    tripsByMode: {},
    monthlyStats: {}
  };
  
  // Group by transport mode
  trips.forEach(trip => {
    const mode = trip.selectedRoute?.mode || 'unknown';
    if (!summary.tripsByMode[mode]) {
      summary.tripsByMode[mode] = {
        count: 0,
        totalDistance: 0,
        totalEmission: 0,
        totalSavings: 0
      };
    }
    summary.tripsByMode[mode].count++;
    summary.tripsByMode[mode].totalDistance += trip.selectedRoute?.distance || 0;
    summary.tripsByMode[mode].totalEmission += trip.selectedRoute?.emission || 0;
    summary.tripsByMode[mode].totalSavings += trip.emissionSavings?.amount || 0;
  });
  
  // Monthly statistics (current month)
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  const currentMonthTrips = trips.filter(trip => {
    const tripDate = new Date(trip.createdAt);
    return tripDate.getMonth() === currentMonth && tripDate.getFullYear() === currentYear;
  });
  
  summary.monthlyStats = {
    currentMonth: {
      trips: currentMonthTrips.length,
      distance: currentMonthTrips.reduce((sum, trip) => sum + (trip.selectedRoute?.distance || 0), 0),
      emission: currentMonthTrips.reduce((sum, trip) => sum + (trip.selectedRoute?.emission || 0), 0),
      savings: currentMonthTrips.reduce((sum, trip) => sum + (trip.emissionSavings?.amount || 0), 0)
    }
  };
  
  // Cache for 60s
  setCache(cacheKey, summary, 60 * 1000);
  
  res.json({
    success: true,
    stats: summary,
    cached: false
  });
}));

// Alias endpoint for carbon-summary (used by frontend)
router.get('/carbon-summary/:userId', asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  const logger = createLogger('CarbonSummary');
  
  // Check if user is requesting their own stats
  if (req.user.userId !== userId) {
    logger.warn('Unauthorized stats access attempt', { requestedUser: userId, authenticatedUser: req.user.userId });
    return next(new AppError('Unauthorized', 403));
  }

  const cacheKey = `stats:${userId}`;
  const cached = getCache(cacheKey);
  if (cached) {
    logger.debug('Carbon summary cache hit', { userId });
    return res.json({ success: true, stats: cached, cached: true });
  }

  logger.debug('Carbon summary cache miss', { userId });

  const trips = await Trip.find({ userId });

  let summary = {
    totalTrips: trips.length,
    totalDistance: 0,
    totalEmission: 0,
    totalDuration: 0,
    averageEmissionPerKm: 0,
    bestEcoScore: 0,
    worstEcoScore: 100,
    emissionTrend: [],
    ecoScoreTrend: [],
    monthlyStats: {}
  };

  trips.forEach((trip) => {
    const route = trip.selectedRoute;
    if (route) {
      summary.totalDistance += route.distance / 1000; // Convert to km
      summary.totalEmission += route.emission || 0;
      summary.totalDuration += route.duration || 0;
      summary.bestEcoScore = Math.max(summary.bestEcoScore, route.ecoScore || 0);
      summary.worstEcoScore = Math.min(summary.worstEcoScore, route.ecoScore || 0);
    }
  });

  summary.averageEmissionPerKm = summary.totalDistance > 0 ? (summary.totalEmission / summary.totalDistance).toFixed(2) : 0;
  summary.totalDuration = (summary.totalDuration / 3600).toFixed(2); // Convert to hours
  summary.totalDistance = summary.totalDistance.toFixed(2);
  summary.totalEmission = summary.totalEmission.toFixed(2);

  setCache(cacheKey, summary, 300); // Cache for 5 minutes

  res.json({
    success: true,
    stats: summary,
    cached: false
  });
}));

// Helper function to calculate distance between two coordinates (in km)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Find nearby users going in similar direction (for drivers)
router.get('/nearby-users/:driverId', asyncHandler(async (req, res, next) => {
  const { driverId } = req.params;
  const radiusKm = 1; // 1km radius
  
  // Get driver's trip
  const driverTrip = await Trip.findOne({ 
    userId: driverId, 
    status: 'in-progress',
    matchedDriverId: null // Not already matched
  }).populate('userId', 'name email');
  
  if (!driverTrip) {
    return res.json({
      success: true,
      nearbyUsers: []
    });
  }
  
  // Find users going similar direction within radius
  const userTrips = await Trip.find({
    status: 'in-progress',
    userId: { $ne: driverId },
    matchedDriverId: null, // Not already matched
    driverResponse: 'pending'
  }).populate('userId', 'name email phoneNumber');
  
  const nearbyUsers = userTrips.filter(userTrip => {
    // Check origin proximity (within 1km)
    const originDist = calculateDistance(
      driverTrip.origin.coordinates.lat,
      driverTrip.origin.coordinates.lng,
      userTrip.origin.coordinates.lat,
      userTrip.origin.coordinates.lng
    );
    
    // Check destination proximity (within 1km)
    const destDist = calculateDistance(
      driverTrip.destination.coordinates.lat,
      driverTrip.destination.coordinates.lng,
      userTrip.destination.coordinates.lat,
      userTrip.destination.coordinates.lng
    );
    
    return originDist <= radiusKm && destDist <= radiusKm;
  }).map(trip => ({
    tripId: trip._id,
    userId: trip.userId._id,
    userName: trip.userId.name,
    userEmail: trip.userId.email,
    origin: trip.origin.name,
    destination: trip.destination.name,
    distance: trip.selectedRoute?.distance,
    emission: trip.selectedRoute?.emission,
    mode: trip.selectedRoute?.mode
  }));
  
  res.json({
    success: true,
    nearbyUsers,
    message: `Found ${nearbyUsers.length} users going similar direction`
  });
}));

// Check if a driver has accepted user's trip
router.get('/check-driver-match/:userId', asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  
  // Find user's in-progress trip with a matched driver that has accepted
  const userTrip = await Trip.findOne({
    userId: userId,
    status: 'in-progress',
    matchedDriverId: { $ne: null },
    driverResponse: 'accepted',
    userResponse: 'pending'
  }).populate('matchedDriverId', 'name email phoneNumber userType');
  
  if (!userTrip) {
    return res.json({
      success: true,
      driverMatch: null
    });
  }
  
  const driverMatch = {
    tripId: userTrip._id,
    driverName: userTrip.matchedDriverId.name,
    driverEmail: userTrip.matchedDriverId.email,
    phone: userTrip.matchedDriverId.phoneNumber,
    rating: 4.8, // Can be fetched from ratings collection in future
    vehicle: 'Economy Car', // Can be stored in driver profile in future
    matchedAt: userTrip.matchedAt
  };
  
  res.json({
    success: true,
    driverMatch
  });
}));

// Driver accepts/rejects a user
router.patch('/:tripId/driver-response', asyncHandler(async (req, res, next) => {
  const { tripId } = req.params;
  const { response } = req.body; // 'accepted' or 'rejected'
  const driverId = req.user.userId;
  
  if (!['accepted', 'rejected'].includes(response)) {
    return next(new AppError('Response must be accepted or rejected', 400));
  }
  
  const trip = await Trip.findById(tripId);
  if (!trip) {
    return next(new AppError('Trip not found', 404));
  }
  
  trip.driverResponse = response;
  if (response === 'accepted') {
    trip.matchedDriverId = driverId;
    trip.matchedAt = new Date();
  }
  
  await trip.save();
  
  res.json({
    success: true,
    message: `Driver ${response} the match request`,
    trip
  });
}));

// User confirms/rejects driver match
router.patch('/:tripId/user-response', asyncHandler(async (req, res, next) => {
  const { tripId } = req.params;
  const { response } = req.body; // 'accepted' or 'rejected'
  const userId = req.user.userId;
  
  if (!['accepted', 'rejected'].includes(response)) {
    return next(new AppError('Response must be accepted or rejected', 400));
  }
  
  const trip = await Trip.findById(tripId);
  if (!trip) {
    return next(new AppError('Trip not found', 404));
  }
  
  // Verify this is the user's trip
  if (trip.userId.toString() !== userId.toString()) {
    return next(new AppError('You can only respond to your own trips', 403));
  }
  
  trip.userResponse = response;
  
  // If user rejects, clear the driver match
  if (response === 'rejected') {
    trip.matchedDriverId = null;
    trip.driverResponse = 'pending';
  }
  
  await trip.save();
  
  res.json({
    success: true,
    message: `User ${response} the driver match`,
    trip
  });
}));

// ========== DRIVER-CENTRIC RIDE SHARING ENDPOINTS ==========

// Update driver online status, current location, and active route
router.post('/driver/set-online', asyncHandler(async (req, res, next) => {
  const driverId = req.user.userId;
  const { isOnline, location, route } = req.body;
  
  const driver = await User.findById(driverId);
  if (!driver || driver.userType !== 'driver') {
    return next(new AppError('Only drivers can use this endpoint', 403));
  }
  
  driver.isOnline = isOnline;
  if (location) {
    driver.currentLocation = {
      coordinates: location.coordinates,
      address: location.address,
      updatedAt: new Date()
    };
  }
  
  // Store driver's active route
  if (route) {
    driver.activeRoute = {
      origin: route.origin,
      destination: route.destination,
      waypoints: route.waypoints || [],
      updatedAt: new Date()
    };
  }
  
  await driver.save();
  
  res.json({
    success: true,
    message: isOnline ? 'You are now online' : 'You are now offline',
    driver: {
      _id: driver._id,
      name: driver.name,
      isOnline: driver.isOnline,
      currentLocation: driver.currentLocation,
      activeRoute: driver.activeRoute
    }
  });
}));

// Get driver status
router.get('/driver/status/:driverId', asyncHandler(async (req, res, next) => {
  const { driverId } = req.params;
  
  const driver = await User.findById(driverId).select('name isOnline currentLocation driverStats activeRoute');
  if (!driver || driver.userType !== 'driver') {
    return next(new AppError('Driver not found', 404));
  }
  
  res.json({
    success: true,
    driver: {
      _id: driver._id,
      name: driver.name,
      isOnline: driver.isOnline,
      currentLocation: driver.currentLocation,
      stats: driver.driverStats,
      activeRoute: driver.activeRoute
    }
  });
}));

// Get all available ride requests for driver (users looking for rides)
router.get('/driver/available-rides', asyncHandler(async (req, res, next) => {
  const driverId = req.user.userId;
  const { radius = 5 } = req.query; // radius in km, default 5km
  const radiusKm = Math.min(parseInt(radius) || 5, 50); // Max 50km
  
  const driver = await User.findById(driverId);
  if (!driver || driver.userType !== 'driver') {
    return next(new AppError('Only drivers can use this endpoint', 403));
  }
  
  // Get all ride requests from users (trips marked as ride requests with pending driver response)
  const availableRides = await Trip.find({
    isRideRequest: true,
    status: 'in-progress',
    driverResponse: 'pending',
    userId: { $ne: driverId }, // Not the driver's own request
    matchedDriverId: null // Not already matched
  }).populate('userId', 'name email phoneNumber');
  
  // Map available rides with distance calculation from driver location
  const ridesWithDistance = availableRides
    .map(trip => {
      const distance = driver.currentLocation?.coordinates
        ? calculateDistance(
            driver.currentLocation.coordinates.lat,
            driver.currentLocation.coordinates.lng,
            trip.origin.coordinates.lat,
            trip.origin.coordinates.lng
          )
        : 0;
      
      return {
        tripId: trip._id,
        userId: trip.userId._id,
        userName: trip.userId.name,
        userEmail: trip.userId.email,
        userPhone: trip.userId.phoneNumber,
        origin: trip.origin.name,
        destination: trip.destination.name,
        originCoords: trip.origin.coordinates,
        destinationCoords: trip.destination.coordinates,
        distance: trip.selectedRoute?.distance,
        duration: trip.selectedRoute?.duration,
        emission: trip.selectedRoute?.emission,
        mode: trip.selectedRoute?.mode,
        distanceFromDriver: distance,
        requestedAt: trip.requestedAt,
        status: trip.status
      };
    })
    // Filter by radius if driver has location
    .filter(ride => !driver.currentLocation || ride.distanceFromDriver <= radiusKm)
    // Sort by distance from driver (nearest first)
    .sort((a, b) => a.distanceFromDriver - b.distanceFromDriver);
  
  res.json({
    success: true,
    availableRides: ridesWithDistance,
    count: ridesWithDistance.length,
    driverLocation: driver.currentLocation?.coordinates,
    searchRadius: radiusKm
  });
}));

// Get ride details for driver
router.get('/driver/ride-details/:tripId', asyncHandler(async (req, res, next) => {
  const { tripId } = req.params;
  const driverId = req.user.userId;
  
  const trip = await Trip.findById(tripId).populate('userId', 'name email phoneNumber');
  if (!trip) {
    return next(new AppError('Ride not found', 404));
  }
  
  res.json({
    success: true,
    ride: {
      _id: trip._id,
      user: {
        _id: trip.userId._id,
        name: trip.userId.name,
        email: trip.userId.email,
        phone: trip.userId.phoneNumber
      },
      origin: trip.origin,
      destination: trip.destination,
      selectedRoute: trip.selectedRoute,
      alternativeRoutes: trip.alternativeRoutes,
      emission: trip.selectedRoute?.emission,
      status: trip.status,
      requestedAt: trip.requestedAt,
      createdAt: trip.createdAt
    }
  });
}));

// Accept a ride request as driver
router.post('/driver/accept-ride/:tripId', asyncHandler(async (req, res, next) => {
  const { tripId } = req.params;
  const driverId = req.user.userId;
  
  const driver = await User.findById(driverId);
  if (!driver || driver.userType !== 'driver') {
    return next(new AppError('Only drivers can use this endpoint', 403));
  }
  
  const trip = await Trip.findById(tripId).populate('userId', 'name email phoneNumber');
  if (!trip) {
    return next(new AppError('Ride not found', 404));
  }
  
  if (trip.driverResponse !== 'pending') {
    return next(new AppError('This ride request is no longer available', 409));
  }
  
  // Accept the ride
  trip.matchedDriverId = driverId;
  trip.driverResponse = 'accepted';
  trip.driverPrice = driver.activeRoute?.price || 0;
  trip.matchedAt = new Date();
  await trip.save();
  
  res.json({
    success: true,
    message: 'Ride accepted! Waiting for user confirmation.',
    trip
  });
}));

// Reject a ride request as driver
router.post('/driver/reject-ride/:tripId', asyncHandler(async (req, res, next) => {
  const { tripId } = req.params;
  const driverId = req.user.userId;
  
  const trip = await Trip.findById(tripId);
  if (!trip) {
    return next(new AppError('Ride not found', 404));
  }
  
  trip.driverResponse = 'rejected';
  await trip.save();
  
  res.json({
    success: true,
    message: 'Ride rejected.',
    trip
  });
}));

// Cancel an accepted ride (before user confirms)
router.post('/driver/cancel-ride/:tripId', asyncHandler(async (req, res, next) => {
  const { tripId } = req.params;
  const driverId = req.user.userId;
  
  const trip = await Trip.findById(tripId);
  if (!trip) {
    return next(new AppError('Ride not found', 404));
  }
  
  if (trip.matchedDriverId.toString() !== driverId.toString()) {
    return next(new AppError('You are not the matched driver for this ride', 403));
  }
  
  // Cancel the match
  trip.matchedDriverId = null;
  trip.driverResponse = 'rejected';
  trip.userResponse = 'pending';
  await trip.save();
  
  res.json({
    success: true,
    message: 'Ride cancelled.',
    trip
  });
}));

// Get driver's active/upcoming rides
router.get('/driver/my-rides', asyncHandler(async (req, res, next) => {
  const driverId = req.user.userId;
  const { status = 'all' } = req.query; // 'all', 'pending', 'accepted', 'completed'
  
  const driver = await User.findById(driverId);
  if (!driver || driver.userType !== 'driver') {
    return next(new AppError('Only drivers can use this endpoint', 403));
  }
  
  const query = {
    matchedDriverId: driverId
  };
  
  if (status === 'pending') {
    query.userResponse = 'pending';
  } else if (status === 'accepted') {
    query.userResponse = 'accepted';
  } else if (status === 'completed') {
    query.status = 'completed';
  }
  
  const rides = await Trip.find(query)
    .populate('userId', 'name email phoneNumber')
    .sort({ createdAt: -1 });
  
  res.json({
    success: true,
    rides: rides.map(trip => ({
      _id: trip._id,
      user: {
        name: trip.userId.name,
        email: trip.userId.email,
        phone: trip.userId.phoneNumber
      },
      origin: trip.origin,
      destination: trip.destination,
      distance: trip.selectedRoute?.distance,
      emission: trip.selectedRoute?.emission,
      driverResponse: trip.driverResponse,
      userResponse: trip.userResponse,
      matchedAt: trip.matchedAt,
      createdAt: trip.createdAt
    })),
    count: rides.length,
    status
  });
}));

// ========== USER RIDE REQUEST ENDPOINTS ==========

// Post a ride request (user looking for driver)
router.post('/user/post-ride-request/:tripId', asyncHandler(async (req, res, next) => {
  const { tripId } = req.params;
  const userId = req.user.userId;
  
  const trip = await Trip.findById(tripId);
  if (!trip) {
    return next(new AppError('Trip not found', 404));
  }
  
  if (trip.userId.toString() !== userId.toString()) {
    return next(new AppError('You can only post your own trips', 403));
  }
  
  // Mark trip as ride request
  trip.isRideRequest = true;
  trip.requestedAt = new Date();
  trip.status = 'in-progress';
  trip.driverResponse = 'pending';
  await trip.save();
  
  // Invalidate cache
  delCache(`stats:${userId}`);
  
  res.json({
    success: true,
    message: 'Ride request posted! Nearby drivers will be notified.',
    trip
  });
}));

// Get nearby drivers for a user's ride request (drivers within 1km of user location)
router.get('/user/nearby-drivers/:tripId', asyncHandler(async (req, res, next) => {
  const { tripId } = req.params;
  const userId = req.user.userId;
  const radiusKm = 1; // 1km radius as per requirement
  
  const trip = await Trip.findById(tripId);
  if (!trip) {
    return next(new AppError('Trip not found', 404));
  }
  
  if (trip.userId.toString() !== userId.toString()) {
    return next(new AppError('You can only view drivers for your own trips', 403));
  }
  
  // Get all online drivers
  const onlineDrivers = await User.find({
    userType: 'driver',
    isOnline: true
  }).select('name email currentLocation driverStats');
  
  // Filter drivers within 1km radius of user's origin
  const nearbyDrivers = onlineDrivers
    .filter(driver => {
      if (!driver.currentLocation?.coordinates) return false;
      
      const distance = calculateDistance(
        driver.currentLocation.coordinates.lat,
        driver.currentLocation.coordinates.lng,
        trip.origin.coordinates.lat,
        trip.origin.coordinates.lng
      );
      
      return distance <= radiusKm;
    })
    .map(driver => ({
      driverId: driver._id,
      name: driver.name,
      email: driver.email,
      location: driver.currentLocation,
      stats: driver.driverStats,
      rating: driver.driverStats?.averageRating || 5
    }));
  
  res.json({
    success: true,
    nearbyDrivers,
    count: nearbyDrivers.length,
    userLocation: trip.origin,
    searchRadius: radiusKm
  });
}));

// Get notifications for drivers (ride requests within 1km of their location)
router.get('/driver/incoming-requests', asyncHandler(async (req, res, next) => {
  const driverId = req.user.userId;
  
  const driver = await User.findById(driverId);
  if (!driver || driver.userType !== 'driver') {
    return next(new AppError('Only drivers can use this endpoint', 403));
  }
  
  // Driver must be online and have an active route set
  if (!driver.isOnline || !driver.activeRoute) {
    return res.json({
      success: true,
      incomingRequests: [],
      message: 'You must be online and have an active route set to receive ride requests',
      driverRoute: driver.activeRoute || null
    });
  }
  
  // Get all active ride requests from users
  const allRideRequests = await Trip.find({
    isRideRequest: true,
    status: 'in-progress',
    driverResponse: 'pending',
    userId: { $ne: driverId },
    matchedDriverId: null // Not already matched
  }).populate('userId', 'name email phoneNumber');
  
  // Filter requests that match driver's route
  const incomingRequests = allRideRequests
    .filter(trip => {
      // Check if user's route matches driver's route
      const routeMatches = doRoutesMatch(driver.activeRoute, {
        origin: trip.origin,
        destination: trip.destination
      });
      
      return routeMatches;
    })
    .map(trip => {
      // Calculate how far the user's origin is from driver's origin
      const distanceFromDriverOrigin = calculateDistance(
        driver.activeRoute.origin.coordinates.lat,
        driver.activeRoute.origin.coordinates.lng,
        trip.origin.coordinates.lat,
        trip.origin.coordinates.lng
      );
      
      // Calculate destination similarity
      const destinationDistance = calculateDistance(
        driver.activeRoute.destination.coordinates.lat,
        driver.activeRoute.destination.coordinates.lng,
        trip.destination.coordinates.lat,
        trip.destination.coordinates.lng
      );
      
      return {
        tripId: trip._id,
        userId: trip.userId._id,
        userName: trip.userId.name,
        userEmail: trip.userId.email,
        userPhone: trip.userId.phoneNumber,
        origin: trip.origin.name,
        destination: trip.destination.name,
        originCoords: trip.origin.coordinates,
        destinationCoords: trip.destination.coordinates,
        distance: trip.selectedRoute?.distance,
        duration: trip.selectedRoute?.duration,
        emission: trip.selectedRoute?.emission,
        mode: trip.selectedRoute?.mode,
        originDeviation: distanceFromDriverOrigin,
        destinationDeviation: destinationDistance,
        routeMatchScore: 100 - ((distanceFromDriverOrigin + destinationDistance) / 2) * 10,
        driverPrice: driver.activeRoute?.price || 0,
        requestedAt: trip.requestedAt,
        createdAt: trip.createdAt
      };
    })
    // Sort by best route match (lowest deviation = best match)
    .sort((a, b) => (a.originDeviation + a.destinationDeviation) - (b.originDeviation + b.destinationDeviation));
  
  res.json({
    success: true,
    incomingRequests,
    count: incomingRequests.length,
    driverRoute: {
      origin: driver.activeRoute.origin.name,
      destination: driver.activeRoute.destination.name,
      price: driver.activeRoute?.price || 0
    },
    message: incomingRequests.length > 0 
      ? `Found ${incomingRequests.length} ride request(s) matching your route`
      : 'No matching ride requests on your route at the moment'
  });
}));

// Live: get matched driver's current location for a trip
router.get('/:tripId/live-driver', asyncHandler(async (req, res, next) => {
  const { tripId } = req.params;
  const userId = req.user.userId;
  
  const trip = await Trip.findById(tripId);
  if (!trip) {
    return next(new AppError('Trip not found', 404));
  }
  
  // Ensure the requester is the trip owner (user side tracking)
  if (trip.userId.toString() !== userId.toString()) {
    return next(new AppError('Not authorized to view this trip', 403));
  }
  
  if (!trip.matchedDriverId) {
    return res.json({ success: true, live: { hasDriver: false } });
  }
  
  const driver = await User.findById(trip.matchedDriverId).select('name isOnline currentLocation activeRoute userType profileImage phoneNumber');
  if (!driver) {
    return next(new AppError('Matched driver not found', 404));
  }
  
  res.json({
    success: true,
    live: {
      hasDriver: true,
      driver: {
        _id: driver._id,
        name: driver.name,
        isOnline: driver.isOnline,
        vehicleType: driver.vehicleType || 'bike',
        phoneNumber: driver.phoneNumber || null,
        profileImage: driver.profileImage || null
      },
      location: driver.currentLocation?.coordinates || null,
      updatedAt: driver.currentLocation?.updatedAt || null,
      price: trip.driverPrice || driver.activeRoute?.price || 0,
      route: driver.activeRoute || null
    }
  });
}));

// Driver updates current location (for live tracking)
router.post('/driver/update-location', asyncHandler(async (req, res, next) => {
  const driverId = req.user.userId;
  const { coordinates, address } = req.body;
  
  const driver = await User.findById(driverId);
  if (!driver || driver.userType !== 'driver') {
    return next(new AppError('Only drivers can update location', 403));
  }
  
  if (!coordinates || typeof coordinates.lat !== 'number' || typeof coordinates.lng !== 'number') {
    return next(new AppError('Valid coordinates { lat, lng } required', 400));
  }
  
  driver.currentLocation = {
    coordinates,
    address: address || driver.currentLocation?.address || 'On route',
    updatedAt: new Date()
  };
  await driver.save();
  
  res.json({
    success: true,
    message: 'Location updated',
    currentLocation: driver.currentLocation
  });
}));

// Live: get matched user's current location for a trip (driver tracking user)
router.get('/:tripId/live-user', asyncHandler(async (req, res, next) => {
  const { tripId } = req.params;
  const driverId = req.user.userId;
  
  const trip = await Trip.findById(tripId);
  if (!trip) {
    return next(new AppError('Trip not found', 404));
  }
  
  // Ensure the requester is the matched driver
  if (!trip.matchedDriverId) {
    return res.json({ success: true, live: { hasUser: false, message: 'No user matched yet' } });
  }
  
  if (trip.matchedDriverId.toString() !== driverId.toString()) {
    return next(new AppError('Not authorized to view this trip', 403));
  }
  
  const user = await User.findById(trip.userId).select('name currentLocation phoneNumber profileImage');
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  
  res.json({
    success: true,
    live: {
      hasUser: true,
      user: {
        _id: user._id,
        name: user.name,
        phoneNumber: user.phoneNumber || null,
        profileImage: user.profileImage || null
      },
      location: user.currentLocation?.coordinates || null,
      updatedAt: user.currentLocation?.updatedAt || null
    }
  });
}));

// User updates current location (for live tracking)
router.post('/user/update-location', asyncHandler(async (req, res, next) => {
  const userId = req.user.userId;
  const { coordinates, address } = req.body;
  
  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  
  if (!coordinates || typeof coordinates.lat !== 'number' || typeof coordinates.lng !== 'number') {
    return next(new AppError('Valid coordinates { lat, lng } required', 400));
  }
  
  user.currentLocation = {
    coordinates,
    address: address || user.currentLocation?.address || 'On route',
    updatedAt: new Date()
  };
  await user.save();
  
  res.json({
    success: true,
    message: 'Location updated',
    currentLocation: user.currentLocation
  });
}));

export default router;
