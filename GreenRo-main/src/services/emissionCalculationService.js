// Enhanced Emission Calculation Service with External API Integration
import axios from 'axios';

// External API endpoints for emission calculation
const EMISSION_APIS = {
  // Emission API provided by user
  emissionAPI: {
    baseUrl: 'https://emissionapi.onrender.com',
    headers: {
      'Content-Type': 'application/json'
    }
  }
};

// Enhanced emission factors with more detailed vehicle types
const ENHANCED_EMISSION_FACTORS = {
  // Cars
  petrol_small: 0.120,    // Hatchback, compact car
  petrol_medium: 0.192,   // Sedan, SUV
  petrol_large: 0.250,    // Large SUV, luxury car
  diesel_small: 0.110,    // Diesel hatchback
  diesel_medium: 0.170,   // Diesel sedan, SUV
  diesel_large: 0.220,    // Large diesel SUV
  hybrid: 0.120,          // Petrol-electric hybrid
  electric: 0.053,        // Battery electric vehicle
  
  // Motorcycles
  petrol_scooter: 0.045,  // 100-150cc scooter
  petrol_motorcycle: 0.103, // 150cc+ motorcycle
  electric_scooter: 0.020, // Electric scooter
  
  // Buses
  city_bus: 0.089,        // Urban public bus
  intercity_bus: 0.070,   // Long-distance bus
  electric_bus: 0.030,    // Electric public bus
  
  // Other modes
  transit: 0.041,         // Public transport average
  bicycling: 0.004,       // Bicycle
  walking: 0.002,         // Walking
  train: 0.041,           // Train
  metro: 0.035,           // Metro/subway
  tram: 0.038,            // Tram/streetcar
  plane: 0.285            // Domestic flight
};

// Map vehicle types to API format
const getVehicleMapping = (vehicleType, mode) => {
  const mapping = {
    // Cars
    petrol_small: { vehicleType: 'car', fuelType: 'petrol', size: 'small' },
    petrol_medium: { vehicleType: 'car', fuelType: 'petrol', size: 'medium' },
    petrol_large: { vehicleType: 'car', fuelType: 'petrol', size: 'large' },
    diesel_small: { vehicleType: 'car', fuelType: 'diesel', size: 'small' },
    diesel_medium: { vehicleType: 'car', fuelType: 'diesel', size: 'medium' },
    diesel_large: { vehicleType: 'car', fuelType: 'diesel', size: 'large' },
    hybrid: { vehicleType: 'car', fuelType: 'hybrid', size: 'medium' },
    electric: { vehicleType: 'car', fuelType: 'electric', size: 'medium' },
    
    // Motorcycles
    petrol_scooter: { vehicleType: 'motorcycle', fuelType: 'petrol', size: 'small' },
    petrol_motorcycle: { vehicleType: 'motorcycle', fuelType: 'petrol', size: 'medium' },
    electric_scooter: { vehicleType: 'motorcycle', fuelType: 'electric', size: 'small' },
    
    // Buses
    city_bus: { vehicleType: 'bus', fuelType: 'diesel', size: 'large' },
    intercity_bus: { vehicleType: 'bus', fuelType: 'diesel', size: 'large' },
    electric_bus: { vehicleType: 'bus', fuelType: 'electric', size: 'large' },
    
    // Default mappings
    driving: { vehicleType: 'car', fuelType: 'petrol', size: 'medium' },
    transit: { vehicleType: 'bus', fuelType: 'diesel', size: 'large' },
    bicycling: { vehicleType: 'bicycle', fuelType: 'none', size: 'small' },
    walking: { vehicleType: 'walking', fuelType: 'none', size: 'small' }
  };
  
  return mapping[vehicleType] || mapping[mode] || mapping.driving;
};

// Emission API integration
const calculateWithEmissionAPI = async (distance, mode, vehicleType, origin, destination) => {
  try {
    // Use backend endpoint to avoid CORS issues with direct external API calls
    const response = await axios.post('http://localhost:5000/api/emissions/calculate', {
      distance: distance,  // in meters
      mode: mode,
      vehicleType: vehicleType,
      origin: origin,
      destination: destination
    }, {
      timeout: 8000  // 8 second timeout
    });

    if (response.data && response.data.co2e) {
      return {
        co2e: response.data.co2e,
        co2e_unit: response.data.co2e_unit || "kg",
        source: response.data.source || 'backend_api',
        calculation_method: response.data.calculation_method,
        distance_km: response.data.distance_km,
        vehicle_type: response.data.vehicle_type,
        message: response.data.message
      };
    }
    
    return null;
  } catch (error) {
    console.warn('Emission API error:', error?.message || 'Network error', {
      status: error.response?.status,
      statusText: error.response?.statusText
    });
    return null;
  }
};

// Helper function to timeout a promise
const promiseWithTimeout = (promise, timeoutMs) => {
  let timeoutHandle;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timeoutHandle = setTimeout(() => {
        clearTimeout(timeoutHandle);
        reject(new Error(`Request timeout after ${timeoutMs}ms`));
      }, timeoutMs);
    })
  ]).finally(() => clearTimeout(timeoutHandle));
};

// Calculate emissions using external API
export const calculateEmissionWithExternalAPI = async (distance, mode, vehicleType, origin, destination) => {
  try {
    // Try the provided emission API first with a shorter timeout (5 seconds instead of default)
    const emissionResult = await promiseWithTimeout(
      calculateWithEmissionAPI(distance, mode, vehicleType, origin, destination),
      5000  // 5 second timeout instead of waiting for 10s from axios
    );
    if (emissionResult) return emissionResult;
    
    // If API fails, use local calculation
    return calculateEmissionLocally(distance, mode, vehicleType);
  } catch (error) {
    console.warn('External emission API failed or timed out, using local calculation:', error?.message || error);
    return calculateEmissionLocally(distance, mode, vehicleType);
  }
};

// Local emission calculation with enhanced factors
export const calculateEmissionLocally = (distance, mode, vehicleType) => {
  const distanceKm = distance / 1000;
  const factor = ENHANCED_EMISSION_FACTORS[vehicleType] || ENHANCED_EMISSION_FACTORS[mode] || ENHANCED_EMISSION_FACTORS.petrol_medium;
  
  // Apply additional adjustments
  let adjustedFactor = factor;
  
  // Distance-based adjustments
  if (distanceKm < 5) {
    adjustedFactor *= 1.2; // Cold start penalty
  } else if (distanceKm > 50) {
    adjustedFactor *= 0.9; // Highway efficiency
  }
  
  // Traffic and conditions adjustments
  adjustedFactor *= getTrafficAdjustment(mode, vehicleType);
  
  return {
    co2e: distanceKm * adjustedFactor,
    co2e_unit: "kg",
    source: 'local_calculation',
    calculation_method: 'enhanced_local_factors',
    factor_used: adjustedFactor,
    base_factor: factor
  };
};

// Get traffic adjustment factor
const getTrafficAdjustment = (mode, vehicleType) => {
  switch (mode) {
    case 'driving':
      return 1.1; // Assume some traffic
    case 'transit':
      return 0.7; // Assume 70% occupancy
    case 'electric':
      return 0.8; // Assume some renewable energy
    default:
      return 1.0;
  }
};

// Calculate emission savings between routes
export const calculateEmissionSavings = (routes) => {
  if (routes.length < 2) return routes;
  
  // Normalize emission values to numbers
  const normalizedRoutes = routes.map(r => ({
    ...r,
    emission: typeof r.emission === 'number' ? r.emission : (r.emission?.co2e || 0)
  }));
  
  const highestEmission = Math.max(...normalizedRoutes.map(r => r.emission || 0));
  
  return normalizedRoutes.map(route => {
    const currentEmission = route.emission || 0;
    const savings = highestEmission - currentEmission;
    const savingsPercent = highestEmission > 0 ? (savings / highestEmission * 100) : 0;
    
    return {
      ...route,
      emissionSavings: savings,
      emissionSavingsPercent: parseFloat(savingsPercent.toFixed(1))
    };
  });
};

// Get emission comparison data
export const getEmissionComparison = (routes) => {
  if (routes.length === 0) return null;
  
  // Normalize emission values to numbers
  const normalizedRoutes = routes.map(r => ({
    ...r,
    emission: typeof r.emission === 'number' ? r.emission : (r.emission?.co2e || 0)
  }));
  
  const sortedByEmission = [...normalizedRoutes].sort((a, b) => {
    const aEmission = a.emission || 0;
    const bEmission = b.emission || 0;
    return aEmission - bEmission;
  });
  
  const mostEcoFriendly = sortedByEmission[0];
  const leastEcoFriendly = sortedByEmission[sortedByEmission.length - 1];
  
  const mostEmission = mostEcoFriendly.emission || 0;
  const leastEmission = leastEcoFriendly.emission || 0;
  
  const totalSavings = leastEmission - mostEmission;
  const savingsPercent = leastEmission > 0 ? (totalSavings / leastEmission * 100) : 0;
  
  return {
    mostEcoFriendly,
    leastEcoFriendly,
    totalSavings,
    savingsPercent: parseFloat(savingsPercent.toFixed(1))
  };
};