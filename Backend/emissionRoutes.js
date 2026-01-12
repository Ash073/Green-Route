import express from 'express';
import axios from 'axios';
import { createLogger } from './utils/logger.js';

const router = express.Router();
const logger = createLogger('EmissionRoutes');

// Emission calculation factors for local calculation (fallback)
const EMISSION_FACTORS = {
  petrol_small: 0.12,
  petrol_medium: 0.19,
  petrol_large: 0.25,
  diesel_small: 0.11,
  diesel_medium: 0.18,
  diesel_large: 0.24,
  hybrid_medium: 0.10,
  electric_medium: 0.05,
  cng_medium: 0.15,
  driving: 0.19,
  transit: 0.04,
  bicycling: 0.004,
  walking: 0.002
};

/**
 * Calculate emissions for a trip
 * POST /api/emissions/calculate
 * Body: { distance, mode, vehicleType, origin, destination }
 */
router.post('/calculate', async (req, res) => {
  try {
    const { distance, mode, vehicleType, origin, destination } = req.body;

    // Validate inputs
    if (!distance || distance <= 0) {
      logger.warn('Invalid distance provided:', distance);
      return res.status(400).json({
        success: false,
        message: 'Valid distance is required'
      });
    }

    logger.debug('Calculating emissions:', { distance, mode, vehicleType });

    // Try external API first if environment variable is set
    const externalApiUrl = process.env.EMISSION_API_URL;
    const externalApiKey = process.env.EMISSION_API_KEY;

    if (externalApiUrl && externalApiKey) {
      try {
        logger.debug('Attempting external emission API call');
        const response = await axios.post(
          `${externalApiUrl}/calculate`,
          {
            distance: distance / 1000, // Convert to km
            vehicle_type: vehicleType || mode,
            fuel_type: getFuelType(vehicleType),
            origin,
            destination,
            mode
          },
          {
            headers: {
              'Authorization': externalApiKey,
              'Content-Type': 'application/json'
            },
            timeout: 5000
          }
        );

        if (response.data && response.data.emission) {
          logger.debug('External API succeeded:', { emission: response.data.emission });
          return res.json({
            success: true,
            co2e: response.data.emission,
            co2e_unit: 'kg',
            source: 'external_api',
            distance_km: distance / 1000,
            vehicle_type: vehicleType,
            calculation_method: 'external_api'
          });
        }
      } catch (error) {
        logger.warn('External emission API failed:', {
          message: error.message,
          status: error.response?.status
        });
        // Fall through to local calculation
      }
    }

    // Fallback to local calculation
    const distanceKm = distance / 1000;
    const factor = EMISSION_FACTORS[vehicleType] || EMISSION_FACTORS[mode] || EMISSION_FACTORS.petrol_medium;
    const emission = distanceKm * factor;

    logger.debug('Using local calculation:', { emission, factor });

    res.json({
      success: true,
      co2e: emission,
      co2e_unit: 'kg',
      source: 'local_calculation',
      distance_km: distanceKm,
      vehicle_type: vehicleType,
      calculation_method: 'local_factors',
      message: 'Calculated using local emission factors'
    });
  } catch (error) {
    logger.error('Error calculating emissions:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error calculating emissions',
      error: error.message
    });
  }
});

// Helper function to map vehicle type to fuel type
const getFuelType = (vehicleType) => {
  const fuelTypeMap = {
    petrol_small: 'petrol',
    petrol_medium: 'petrol',
    petrol_large: 'petrol',
    diesel_small: 'diesel',
    diesel_medium: 'diesel',
    diesel_large: 'diesel',
    hybrid_medium: 'hybrid',
    electric_medium: 'electric',
    cng_medium: 'cng'
  };
  return fuelTypeMap[vehicleType] || 'petrol';
};

export default router;
