import axios from 'axios';
import { createLogger } from './utils/logger.js';

const logger = createLogger('RouteService');

const MAPBOX_ACCESS_TOKEN = "pk.eyJ1IjoieWVzYXN3aW5pMTUwOCIsImEiOiJjbWZjd3l0ZWkwM2FjMmxzYmR1d2liYWsxIn0.hL64DI3xihWFknOwxEa8qA";
const OPENROUTE_SERVICE_API_KEY = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjFlOWJkY2U1MzYzODQ5ZDk4ZDEzY2Q1YWEzMGM2MzBhIiwiaCI6Im11cm11cjY0In0=";
const OPENROUTE_SERVICE_BASE_URL = "https://api.openrouteservice.org";

// Carbon emission factors (kg CO2 per km) for different transport modes
const EMISSION_FACTORS = {
  driving: 0.192,
  transit: 0.041,
  bicycling: 0.004,
  walking: 0.002,
  electric: 0.053,
  hybrid: 0.120,
  motorcycle: 0.103,
  bus: 0.089,
  train: 0.041,
  plane: 0.285,
  scooter: 0.045,
  carpool: 0.096,
  taxi: 0.192,
  uber: 0.192,
  metro: 0.035,
  tram: 0.038
};

// Geocode an address using Mapbox
export const geocodeAddress = async (address) => {
  try {
    logger.debug('Geocoding address:', address);
    
    const response = await axios.get(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json`,
      {
        params: {
          access_token: MAPBOX_ACCESS_TOKEN,
          country: 'IN',
          limit: 1
        }
      }
    );

    logger.debug('Geocoding response for', address, ':', response.data);

    if (response.data.features && response.data.features.length > 0) {
      const [lng, lat] = response.data.features[0].center;
      const result = { lng, lat, address: response.data.features[0].place_name };
      logger.debug('Geocoded result:', result);
      return result;
    }
    
    logger.warn('No features found for:', address);
    return null;
  } catch (error) {
    logger.error('Geocoding error for', address, ':', error.message);
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

// Fetch route from OpenRouteService
const fetchRouteFromOpenRouteService = async (origin, destination, profile, mode) => {
  try {
    // Validate coordinates first
    if (!validateCoordinates(origin) || !validateCoordinates(destination)) {
      logger.warn('Invalid coordinates provided to ORS:', { origin, destination });
      return null;
    }

    const orsProfile = mapToOpenRouteServiceProfile(profile, mode);
    
    logger.debug('Fetching route from ORS with profile:', orsProfile);
    logger.debug('Coordinates:', { origin, destination });
    
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
        },
        params: {
          geometry_format: 'geojson' // ensure geometry is returned as GeoJSON for Mapbox rendering
        }
      }
    );

    logger.debug('ORS response received:', response.data);

    if (response.data.routes && response.data.routes.length > 0) {
      const route = response.data.routes[0];
      return {
        distance: route.summary.distance,
        duration: route.summary.duration,
        geometry: route.geometry,
        instructions: route.segments?.[0]?.steps || [],
        profile: profile,
        source: 'openrouteservice'
      };
    }
    
    logger.warn('No routes in ORS response');
    return null;
  } catch (error) {
    // Handle routable point not found error (404)
    if (error.response?.status === 404 && error.response?.data?.error?.code === 2010) {
      logger.debug('ORS: No routable point found for these coordinates - will fallback to Mapbox', {
        status: error.response?.status,
        errorCode: error.response?.data?.error?.code
      });
    } else {
      logger.warn('OpenRouteService request failed:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
    }
    return null;
  }
};

// Fetch one or more routes from Mapbox (fallback, supports alternatives)
const fetchRouteFromMapbox = async (origin, destination, profile, mode) => {
  try {
    logger.debug('Fetching route from Mapbox with profile:', profile);
    logger.debug('Origin:', origin, 'Destination:', destination);
    
    const url = `https://api.mapbox.com/directions/v5/${profile}/${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
    logger.debug('Mapbox URL:', url);
    
    const response = await axios.get(url, {
      params: {
        access_token: MAPBOX_ACCESS_TOKEN,
        alternatives: true,
        geometries: 'geojson',
        overview: 'full',
        steps: true
      }
    });

    logger.debug('Mapbox response status:', response.status);
    logger.debug('Mapbox response routes count:', response.data.routes?.length || 0);

    if (response.data.routes && response.data.routes.length > 0) {
      const normalizedRoutes = response.data.routes.slice(0, 4).map((route, idx) => ({
        distance: route.distance,
        duration: route.duration,
        geometry: route.geometry,
        instructions: route.legs?.[0]?.steps || [],
        profile: profile,
        source: 'mapbox',
        alternativeIndex: idx
      }));

      logger.debug('Mapbox alternatives returned:', normalizedRoutes.length);
      return normalizedRoutes;
    }
    
    logger.warn('No routes found in Mapbox response for', profile, '. Full response:', response.data);
    return [];
  } catch (error) {
    logger.error('Mapbox request failed for', profile, ':', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
    return [];
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

// Fetch routes with fallback and alternatives
const fetchRoutesForProfile = async (origin, destination, profile, mode) => {
  try {
    logger.debug('Fetching routes for profile:', profile);
    const collectedRoutes = [];

    // Try OpenRouteService first (usually one route)
    const orsRoute = await fetchRouteFromOpenRouteService(origin, destination, profile, mode);
    if (orsRoute) {
      collectedRoutes.push(orsRoute);
    }

    // Always ask Mapbox for alternatives to diversify choices
    const mapboxRoutes = await fetchRouteFromMapbox(origin, destination, profile, mode);
    if (Array.isArray(mapboxRoutes) && mapboxRoutes.length > 0) {
      collectedRoutes.push(...mapboxRoutes);
    }

    if (collectedRoutes.length === 0) {
      logger.warn('No routes fetched for profile:', profile);
    }

    return collectedRoutes;
  } catch (error) {
    logger.error('Error fetching routes for', profile, ':', error.message);
    return [];
  }
};

// Get profiles for mode
const getProfilesForMode = (mode) => {
  switch (mode) {
    case 'driving':
      return [
        'mapbox/driving',
        'mapbox/driving-traffic',
        'mapbox/driving'
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
      return ['mapbox/driving', 'mapbox/driving', 'mapbox/driving'];
  }
};

// Calculate emission
const calculateEmission = (distanceMeters, mode) => {
  const distanceKm = distanceMeters / 1000;
  const factor = EMISSION_FACTORS[mode] || EMISSION_FACTORS.driving;
  return distanceKm * factor;
};

// Calculate eco score
const calculateEcoScore = (distance, duration, mode) => {
  const distanceKm = distance / 1000;
  const durationHours = duration / 3600;
  
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
  
  return Math.max(0, Math.min(100, Math.round(score)));
};

// Remove near-duplicate routes using rounded distance-duration key
const dedupeRoutes = (routes) => {
  const seen = new Set();
  return routes.filter(route => {
    const key = `${Math.round(route.distance)}-${Math.round(route.duration)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

// Main function to fetch alternative routes
export const getAlternativeRoutes = async (origin, destination, mode = 'driving') => {
  try {
    logger.debug('Getting alternative routes:', { origin, destination, mode });
    
    // Geocode origin and destination
    logger.debug('Geocoding origin:', origin);
    const originCoords = await geocodeAddress(origin);
    if (!originCoords) {
      throw new Error('Could not geocode origin: ' + origin);
    }

    logger.debug('Geocoding destination:', destination);
    const destCoords = await geocodeAddress(destination);
    if (!destCoords) {
      throw new Error('Could not geocode destination: ' + destination);
    }

    // Get profiles for the mode
    const profiles = getProfilesForMode(mode);
    logger.debug('Fetching routes with profiles:', profiles);
    
    // Fetch routes for each profile (each may return multiple alternatives)
    const routePromises = profiles.map(profile => 
      fetchRoutesForProfile(originCoords, destCoords, profile, mode)
    );

    const routeGroups = await Promise.all(routePromises);
    const rawRoutes = routeGroups.flat();

    logger.debug('Total raw routes fetched:', rawRoutes.length);
    rawRoutes.forEach((route, i) => {
      if (route) {
        logger.debug(`Route ${i}:`, { distance: route.distance, duration: route.duration, source: route.source });
      } else {
        logger.debug(`Route ${i}: null/undefined`);
      }
    });
    
    const nonNullRoutes = rawRoutes.filter(r => r && r.distance && r.duration);
    if (nonNullRoutes.length === 0) {
      logger.warn('NO VALID ROUTES FOUND FROM ANY PROFILE! Routes array:', rawRoutes);
      throw new Error('No routes found from any profile. Check Mapbox API key and coordinates.');
    }
    
    // Remove duplicates and normalize
    const uniqueRoutes = dedupeRoutes(nonNullRoutes);

    const validRoutes = uniqueRoutes.map((route, index) => {
      const processedRoute = {
        ...route,
        id: `route_${index + 1}`,
        mode: mode,
        emission: calculateEmission(route.distance, mode),
        ecoScore: calculateEcoScore(route.distance, route.duration, mode),
        profile: route.profile || profiles[0] || mode,
        geometry: route.geometry ? { type: 'Feature', geometry: route.geometry } : null
      };
      logger.debug(`Processed route ${index}:`, { 
        distance: processedRoute.distance,
        duration: processedRoute.duration,
        emission: processedRoute.emission,
        ecoScore: processedRoute.ecoScore,
        hasGeometry: !!processedRoute.geometry
      });
      return processedRoute;
    });

    logger.debug('Valid routes count after dedupe:', validRoutes.length);
    
    if (validRoutes.length === 0) {
      logger.error('NO ROUTES AFTER FILTERING!');
      throw new Error('No valid routes found after filtering');
    }

    // Sort by distance
    validRoutes.sort((a, b) => a.distance - b.distance);

    return {
      origin: originCoords,
      destination: destCoords,
      routes: validRoutes,
      mode: mode,
      success: true
    };
  } catch (error) {
    logger.error('Error getting alternative routes:', error.message);
    throw error;
  }
};

// Get distance between two coordinates
export const getDistance = async (origin, destination) => {
  try {
    logger.debug('Getting distance between:', { origin, destination });
    
    const originCoords = await geocodeAddress(origin);
    if (!originCoords) {
      throw new Error('Could not geocode origin: ' + origin);
    }

    const destCoords = await geocodeAddress(destination);
    if (!destCoords) {
      throw new Error('Could not geocode destination: ' + destination);
    }

    const response = await axios.post(
      `${OPENROUTE_SERVICE_BASE_URL}/v2/directions/driving-car`,
      {
        coordinates: [
          [originCoords.lng, originCoords.lat],
          [destCoords.lng, destCoords.lat]
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
        distance: route.summary.distance,
        duration: route.summary.duration,
        distanceKm: route.summary.distance / 1000,
        durationMinutes: route.summary.duration / 60
      };
    }
    
    throw new Error('No routes found');
  } catch (error) {
    logger.error('Error calculating distance:', error.message);
    throw error;
  }
};
