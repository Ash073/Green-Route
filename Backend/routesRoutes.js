import express from 'express';
import { asyncHandler, AppError } from './middleware/errorHandler.js';
import { getAlternativeRoutes, getDistance } from './routeService.js';
import { createLogger } from './utils/logger.js';

const router = express.Router();
const logger = createLogger('RoutesAPI');

// Get alternative routes between origin and destination
router.post('/alternatives', asyncHandler(async (req, res, next) => {
  const { origin, destination, mode = 'driving' } = req.body;

  if (!origin || !destination) {
    return next(new AppError('Origin and destination are required', 400));
  }

  logger.debug('Alternatives route request:', { origin, destination, mode });

  try {
    const routeData = await getAlternativeRoutes(origin, destination, mode);
    
    res.json({
      success: true,
      message: 'Alternative routes retrieved successfully',
      ...routeData
    });
  } catch (error) {
    logger.error('Error getting alternative routes:', error.message);
    return next(new AppError(error.message || 'Failed to get alternative routes', 500));
  }
}));

// Get distance between two locations
router.post('/distance', asyncHandler(async (req, res, next) => {
  const { origin, destination } = req.body;

  if (!origin || !destination) {
    return next(new AppError('Origin and destination are required', 400));
  }

  logger.debug('Distance request:', { origin, destination });

  try {
    const distanceData = await getDistance(origin, destination);
    
    res.json({
      success: true,
      message: 'Distance calculated successfully',
      ...distanceData
    });
  } catch (error) {
    logger.error('Error calculating distance:', error.message);
    return next(new AppError(error.message || 'Failed to calculate distance', 500));
  }
}));

export default router;
