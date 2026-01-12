// Route Service for fetching alternative routes and calculating emissions
import axios from 'axios';

const MAPBOX_ACCESS_TOKEN = "pk.eyJ1IjoieWVzYXN3aW5pMTUwOCIsImEiOiJjbWZjd3l0ZWkwM2FjMmxzYmR1d2liYWsxIn0.hL64DI3xihWFknOwxEa8qA";

// OpenRouteService API Key for distance calculations
const OPENROUTE_SERVICE_API_KEY = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjFlOWJkY2U1MzYzODQ5ZDk4ZDEzY2Q1YWEzMGM2MzBhIiwiaCI6Im11cm11cjY0In0=";
const OPENROUTE_SERVICE_BASE_URL = "https://api.openrouteservice.org";

// Carbon emission factors (kg CO2 per km) for different transport modes
// These are more accurate values based on real-world data
const EMISSION_FACTORS = {
  driving: 0.192, // Average car (petrol)
  transit: 0.041, // Public transport (bus/train average)
  bicycling: 0.004, // Bicycle (minimal, mainly from food production)
  walking: 0.002, // Walking (minimal, mainly from food production)
  electric: 0.053, // Electric car (considering electricity mix)
  hybrid: 0.120, // Hybrid car
  motorcycle: 0.103, // Motorcycle
  bus: 0.089, // Bus
  train: 0.041, // Train
  plane: 0.285, // Domestic flight
  scooter: 0.045, // Electric scooter
  carpool: 0.096, // Car with 2+ passengers
  taxi: 0.192, // Taxi/ride-hailing
  uber: 0.192, // Ride-hailing service
  metro: 0.035, // Metro/subway
  tram: 0.038 // Tram/streetcar
};

// Enhanced emission calculation with external API integration
export const calculateEmissionWithAPI = async (distance, mode, vehicleType = null) => {
  try {
    // Try to use external emission calculation API first
    const apiResult = await fetchEmissionFromAPI(distance, mode, vehicleType);
    if (apiResult) {
      return apiResult;
    }
  } catch (error) {
    console.warn('External emission API failed, using local calculation:', error);
  }
  
  // Fallback to local calculation
  return calculateEmission(distance, mode);
};

// External emission calculation API integration
const fetchEmissionFromAPI = async (distance, mode, vehicleType) => {
  // This is a placeholder for external emission calculation APIs
  // You can integrate with APIs like:
  // - Carbon Interface API
  // - Climatiq API
  // - Google Maps Distance Matrix API with emission data
  // - Custom emission calculation service
  
  // For now, we'll use a more sophisticated local calculation
  const distanceKm = distance / 1000;
  const baseFactor = EMISSION_FACTORS[mode] || EMISSION_FACTORS.driving;
  
  // Apply additional factors based on distance and mode
  let adjustedFactor = baseFactor;
  
  // Distance-based adjustments
  if (distanceKm < 5) {
    // Short trips are less efficient due to cold starts
    adjustedFactor *= 1.2;
  } else if (distanceKm > 50) {
    // Long trips are more efficient
    adjustedFactor *= 0.9;
  }
  
  // Mode-specific adjustments
  switch (mode) {
    case 'driving':
      // Consider traffic conditions (simplified)
      adjustedFactor *= 1.1; // Assume some traffic
      break;
    case 'transit':
      // Consider occupancy rates
      adjustedFactor *= 0.7; // Assume 70% occupancy
      break;
    case 'electric':
      // Consider electricity source (simplified)
      adjustedFactor *= 0.8; // Assume some renewable energy
      break;
    default:
      // No additional adjustments for other modes
      break;
  }
  
  return distanceKm * adjustedFactor;
};

// Transport mode mapping
const MODE_MAPPING = {
  driving: 'mapbox/driving',
  transit: 'mapbox/walking', // Mapbox doesn't have transit, use walking as fallback
  bicycling: 'mapbox/cycling',
  walking: 'mapbox/walking'
};

export const fetchAlternativeRoutes = async (origin, destination, mode = 'driving') => {
  try {
    console.log('[RouteService] Starting fetchAlternativeRoutes with:', { origin, destination, mode });
    
    // Call backend endpoint instead of directly calling external APIs
    // This avoids CORS issues and keeps API keys secure
    const response = await axios.post(
      'http://localhost:5000/api/routes/alternatives',
      {
        origin,
        destination,
        mode
      }
    );

    console.log('[RouteService] Backend response:', response.data);

    if (response.data && response.data.routes && response.data.routes.length > 0) {
      return response.data;
    }

    throw new Error('No routes returned from backend');

  } catch (error) {
    console.error('[RouteService] Error fetching alternative routes:', error);
    console.error('[RouteService] Error details:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    // Return mock data as fallback
    return getMockRoutes(origin, destination, mode);
  }
};

const geocodeAddress = async (address) => {
  try {
    console.log('[Geocoding] Starting geocoding for:', address);
    const response = await axios.get(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json`,
      {
        params: {
          access_token: MAPBOX_ACCESS_TOKEN,
          country: 'IN', // Focus on India
          limit: 1
        }
      }
    );

    console.log('[Geocoding] Response received for', address, ':', response.data);

    if (response.data.features && response.data.features.length > 0) {
      const [lng, lat] = response.data.features[0].center;
      const result = { lng, lat, address: response.data.features[0].place_name };
      console.log('[Geocoding] Geocoded result:', result);
      return result;
    }
    console.warn('[Geocoding] No features found for:', address);
    return null;
  } catch (error) {
    console.error('[Geocoding] Error geocoding address:', address, error);
    return null;
  }
};

const fetchRoute = async (origin, destination, profile, mode) => {
  try {
    console.log(`[FetchRoute] Fetching route for profile: ${profile}`);
    
    // Try OpenRouteService first for better distance accuracy
    const orsRoute = await fetchRouteFromOpenRouteService(origin, destination, profile, mode);
    if (orsRoute) {
      console.log(`[FetchRoute] Successfully got route from ORS for profile: ${profile}`, orsRoute);
      return orsRoute;
    }

    console.log(`[FetchRoute] ORS failed, falling back to Mapbox for profile: ${profile}`);
    
    // Fallback to Mapbox if ORS fails
    const response = await axios.get(
      `https://api.mapbox.com/directions/v5/${profile}/${origin.lng},${origin.lat};${destination.lng},${destination.lat}`,
      {
        params: {
          access_token: MAPBOX_ACCESS_TOKEN,
          alternatives: true,
          geometries: 'geojson',
          overview: 'full',
          steps: true
        }
      }
    );

    console.log(`[FetchRoute] Mapbox response for ${profile}:`, response.data);

    if (response.data.routes && response.data.routes.length > 0) {
      const route = response.data.routes[0]; // Get the first (best) route
      return {
        distance: route.distance, // in meters
        duration: route.duration, // in seconds
        geometry: route.geometry,
        instructions: route.legs[0].steps || [],
        profile: profile
      };
    }
    console.warn(`[FetchRoute] No routes found for ${profile}`);
    return null;
  } catch (error) {
    console.error(`[FetchRoute] Error fetching route for ${profile}:`, error);
    return null;
  }
};

// Validate coordinates are within valid ranges
const validateCoordinates = (coords) => {
  if (!coords || typeof coords.lat !== 'number' || typeof coords.lng !== 'number') {
    return false;
  }
  // Latitude: -90 to 90, Longitude: -180 to 180
  return coords.lat >= -90 && coords.lat <= 90 && coords.lng >= -180 && coords.lng <= 180;
};

// Fetch route using OpenRouteService API
const fetchRouteFromOpenRouteService = async (origin, destination, profile, mode) => {
  try {
    // Validate coordinates first
    if (!validateCoordinates(origin) || !validateCoordinates(destination)) {
      console.warn(`[ORS] Invalid coordinates provided:`, { origin, destination });
      return null;
    }

    // Map Mapbox profiles to OpenRouteService profiles
    const orsProfile = mapToOpenRouteServiceProfile(profile, mode);
    
    console.log(`[ORS] Attempting to fetch route from ORS with profile: ${orsProfile}`);
    console.log(`[ORS] Coordinates:`, { origin, destination });
    console.log(`[ORS] API Key being used:`, OPENROUTE_SERVICE_API_KEY.substring(0, 10) + '...');
    
    const response = await axios.post(
      `${OPENROUTE_SERVICE_BASE_URL}/v2/directions/${orsProfile}`,
      {
        coordinates: [
          [origin.lng, origin.lat],
          [destination.lng, destination.lat]
        ]
      },
      {
        headers: {
          'Authorization': OPENROUTE_SERVICE_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`[ORS] Successfully received response:`, response.data);

    if (response.data.routes && response.data.routes.length > 0) {
      const route = response.data.routes[0];
      return {
        distance: route.summary.distance, // in meters
        duration: route.summary.duration, // in seconds
        geometry: route.geometry,
        instructions: route.segments[0]?.steps || [],
        profile: profile,
        source: 'openrouteservice'
      };
    }
    console.warn('[ORS] No routes in response');
    return null;
  } catch (error) {
    // Handle routable point not found error (404)
    if (error.response?.status === 404 && error.response?.data?.error?.code === 2010) {
      console.debug('[ORS] No routable point found - will fallback to Mapbox', {
        status: error.response?.status,
        errorCode: error.response?.data?.error?.code
      });
    } else {
      console.warn('[ORS] OpenRouteService request failed:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
    }
    return null;
  }
};

// Map incoming profile/mode to OpenRouteService profiles in a simple, stable way
const mapToOpenRouteServiceProfile = (profile, mode) => {
  const normalized = (mode || profile || '').toLowerCase();

  // Treat every car-like mode the same
  if (normalized.includes('drive') ||
      normalized.includes('car') ||
      normalized.includes('taxi') ||
      normalized.includes('uber') ||
      normalized.includes('hybrid') ||
      normalized.includes('electric') ||
      normalized.includes('motor') ||
      normalized.includes('mapbox/driving')) {
    return 'driving-car';
  }

  // Bikes and micromobility
  if (normalized.includes('cycle') || normalized.includes('bike')) {
    return 'cycling-regular';
  }

  // Walking / on-foot
  if (normalized.includes('walk') || normalized.includes('foot')) {
    return 'foot-walking';
  }

  // Default to driving
  return 'driving-car';
};

// Get distance between two coordinates using OpenRouteService
export const getDistance = async (origin, destination) => {
  try {
    const response = await axios.post(
      `${OPENROUTE_SERVICE_BASE_URL}/v2/directions/driving-car`,
      {
        coordinates: [
          [origin.lng, origin.lat],
          [destination.lng, destination.lat]
        ]
      },
      {
        headers: {
          'Authorization': OPENROUTE_SERVICE_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.routes && response.data.routes.length > 0) {
      const route = response.data.routes[0];
      return {
        distance: route.summary.distance, // in meters
        duration: route.summary.duration, // in seconds
        distanceKm: route.summary.distance / 1000,
        durationMinutes: route.summary.duration / 60
      };
    }
    return null;
  } catch (error) {
    console.error('Error calculating distance:', error);
    return null;
  }
};

const getProfilesForMode = (mode) => {
  const baseMode = MODE_MAPPING[mode] || 'mapbox/driving';
  
  // Return different profiles to get route alternatives
  switch (mode) {
    case 'driving':
      return [
        'mapbox/driving',
        'mapbox/driving-traffic', // Traffic-aware routing
        'mapbox/driving' // Same profile but will give different results
      ];
    case 'transit':
      return [
        'mapbox/walking',
        'mapbox/cycling',
        'mapbox/driving'
      ];
    case 'bicycling':
      return [
        'mapbox/cycling',
        'mapbox/walking',
        'mapbox/driving'
      ];
    case 'walking':
      return [
        'mapbox/walking',
        'mapbox/cycling',
        'mapbox/driving'
      ];
    default:
      return [baseMode, baseMode, baseMode];
  }
};

const calculateEmission = (distanceKm, mode) => {
  const distanceInKm = distanceKm / 1000; // Convert meters to km
  const factor = EMISSION_FACTORS[mode] || EMISSION_FACTORS.driving;
  return distanceInKm * factor;
};

const calculateEcoScore = (distance, duration, mode) => {
  const distanceKm = distance / 1000;
  const durationHours = duration / 3600;
  
  // Base score starts at 100
  let score = 100;
  
  // Penalize longer distances
  score -= Math.min(distanceKm * 0.5, 30);
  
  // Penalize longer durations
  score -= Math.min(durationHours * 10, 20);
  
  // Bonus for eco-friendly modes
  const modeBonuses = {
    walking: 20,
    bicycling: 15,
    transit: 10,
    electric: 5,
    hybrid: 2,
    driving: 0
  };
  
  score += modeBonuses[mode] || 0;
  
  // Ensure score is between 0 and 100
  return Math.max(0, Math.min(100, Math.round(score)));
};

const getMockRoutes = (origin, destination, mode) => {
  const baseDistance = Math.random() * 50 + 10; // 10-60 km
  const routes = [
    {
      id: 'route_1',
      distance: baseDistance * 1000,
      duration: (baseDistance * 1.2) * 60,
      mode: mode,
      profile: mode,
      emission: calculateEmission(baseDistance * 1000, mode),
      ecoScore: calculateEcoScore(baseDistance * 1000, (baseDistance * 1.2) * 60, mode),
      instructions: []
    },
    {
      id: 'route_2',
      distance: (baseDistance + Math.random() * 8 + 2) * 1000,
      duration: (baseDistance * 1.5) * 60,
      mode: mode,
      profile: mode,
      emission: calculateEmission((baseDistance + 5) * 1000, mode),
      ecoScore: calculateEcoScore((baseDistance + 5) * 1000, (baseDistance * 1.5) * 60, mode),
      instructions: []
    },
    {
      id: 'route_3',
      distance: (baseDistance + Math.random() * 12 + 5) * 1000,
      duration: (baseDistance * 1.8) * 60,
      mode: mode,
      profile: mode,
      emission: calculateEmission((baseDistance + 8) * 1000, mode),
      ecoScore: calculateEcoScore((baseDistance + 8) * 1000, (baseDistance * 1.8) * 60, mode),
      instructions: []
    }
  ];

  return {
    origin: { lng: 72.8777, lat: 19.0760, address: origin },
    destination: { lng: 73.8567, lat: 18.5204, address: destination },
    routes: routes.sort((a, b) => a.distance - b.distance),
    mode: mode
  };
};

export const calculateEmissionSavings = (routes) => {
  if (routes.length < 2) return [];
  
  const highestEmission = Math.max(...routes.map(r => r.emission));
  
  return routes.map(route => ({
    ...route,
    emissionSavings: highestEmission - route.emission,
    emissionSavingsPercent: ((highestEmission - route.emission) / highestEmission * 100).toFixed(1)
  }));
};

export const getEmissionComparison = (routes) => {
  if (routes.length === 0) return null;
  
  const sortedByEmission = [...routes].sort((a, b) => a.emission - b.emission);
  const mostEcoFriendly = sortedByEmission[0];
  const leastEcoFriendly = sortedByEmission[sortedByEmission.length - 1];
  
  return {
    mostEcoFriendly,
    leastEcoFriendly,
    totalSavings: leastEcoFriendly.emission - mostEcoFriendly.emission,
    savingsPercent: ((leastEcoFriendly.emission - mostEcoFriendly.emission) / leastEcoFriendly.emission * 100).toFixed(1)
  };
};
