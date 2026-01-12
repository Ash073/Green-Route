import express from 'express';
import { authenticateToken } from './middleware/auth.js';
import Trip from './models/Trip.js';
import { asyncHandler } from './middleware/errorHandler.js';

const router = express.Router();

router.use(authenticateToken);

// GET /api/analytics/summary - summary for current user
router.get('/summary', asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  const totalTrips = await Trip.countDocuments({ userId });
  const completedTrips = await Trip.countDocuments({ userId, status: 'completed' });

  const trips = await Trip.find({ userId }).select(
    'selectedRoute.emission selectedRoute.distance emissionSavings.amount status createdAt'
  );

  const totals = trips.reduce(
    (acc, t) => {
      acc.distance += t.selectedRoute?.distance || 0;
      acc.emission += t.selectedRoute?.emission || 0;
      acc.savings += t.emissionSavings?.amount || 0;
      return acc;
    },
    { distance: 0, emission: 0, savings: 0 }
  );

  res.json({
    success: true,
    data: {
      totalTrips,
      completedTrips,
      totalDistance: totals.distance,
      totalEmission: totals.emission,
      totalSavings: totals.savings,
    },
  });
}));

export default router;
