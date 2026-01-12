// src/components/MapComponent.jsx
import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import MapboxDirections from "@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions.css";
import RouteLegend from "./RouteLegend";

// Validate and sanitize GeoJSON geometry
const validateGeometry = (geometry) => {
  if (!geometry) return null;
  
  // Check if it's already valid
  if (geometry.type === 'LineString' && Array.isArray(geometry.coordinates)) {
    // Ensure coordinates are valid [lng, lat] pairs
    const validCoords = geometry.coordinates.filter(coord => 
      Array.isArray(coord) && 
      coord.length === 2 && 
      typeof coord[0] === 'number' && 
      typeof coord[1] === 'number' &&
      coord[0] >= -180 && coord[0] <= 180 &&
      coord[1] >= -90 && coord[1] <= 90
    );
    
    if (validCoords.length > 0) {
      return {
        type: 'LineString',
        coordinates: validCoords
      };
    }
  }
  
  return null;
};

// Custom CSS for better visibility
const customStyles = `
  .mapbox-directions-instructions {
    background: rgba(255, 255, 255, 0.95) !important;
    color: #2c3e50 !important;
    border-radius: 12px !important;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15) !important;
    border: 2px solid #27ae60 !important;
    backdrop-filter: blur(10px) !important;
    max-height: 60vh !important;
    overflow-y: auto !important;
  }
  
  .mapbox-directions-instructions .mapbox-directions-step {
    background: rgba(255, 255, 255, 1) !important;
    color: #2c3e50 !important;
    border-radius: 8px !important;
    margin: 6px 8px !important;
    padding: 12px 16px !important;
    border-left: 5px solid #27ae60 !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
    font-size: 14px !important;
    line-height: 1.4 !important;
  }
  
  .mapbox-directions-instructions .mapbox-directions-step:hover {
    background: rgba(39, 174, 96, 0.05) !important;
    transform: translateX(4px) !important;
    transition: all 0.3s ease !important;
    box-shadow: 0 4px 12px rgba(39, 174, 96, 0.2) !important;
  }
  
  .mapbox-directions-instructions .mapbox-directions-step .mapbox-directions-step-maneuver {
    color: #27ae60 !important;
    font-weight: 700 !important;
    font-size: 16px !important;
    margin-right: 8px !important;
  }
  
  .mapbox-directions-instructions .mapbox-directions-step .mapbox-directions-step-distance {
    color: #7f8c8d !important;
    font-size: 12px !important;
    font-weight: 600 !important;
    background: rgba(39, 174, 96, 0.1) !important;
    padding: 2px 6px !important;
    border-radius: 4px !important;
    margin-left: 8px !important;
  }
  
  .mapbox-directions-instructions .mapbox-directions-route-summary {
    background: linear-gradient(135deg, #27ae60, #2ecc71) !important;
    color: white !important;
    border-radius: 8px !important;
    padding: 16px !important;
    margin: 8px !important;
    font-weight: 700 !important;
    font-size: 16px !important;
    text-align: center !important;
    box-shadow: 0 4px 12px rgba(39, 174, 96, 0.3) !important;
  }
  
  .mapbox-directions-instructions .mapbox-directions-route-summary .mapbox-directions-route-summary-duration {
    font-size: 18px !important;
    font-weight: 800 !important;
  }
  
  .mapbox-directions-instructions .mapbox-directions-route-summary .mapbox-directions-route-summary-distance {
    font-size: 14px !important;
    opacity: 0.9 !important;
  }
  
  /* Scrollbar styling */
  .mapbox-directions-instructions::-webkit-scrollbar {
    width: 6px !important;
  }
  
  .mapbox-directions-instructions::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.1) !important;
    border-radius: 3px !important;
  }
  
  .mapbox-directions-instructions::-webkit-scrollbar-thumb {
    background: #27ae60 !important;
    border-radius: 3px !important;
  }
  
  .mapbox-directions-instructions::-webkit-scrollbar-thumb:hover {
    background: #2ecc71 !important;
  }
`;

// Inject custom styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = customStyles;
  document.head.appendChild(styleSheet);
}

export default function MapComponent({ origin, destination, routes = [] }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    mapboxgl.accessToken = "pk.eyJ1IjoieWVzYXN3aW5pMTUwOCIsImEiOiJjbWZjd3l0ZWkwM2FjMmxzYmR1d2liYWsxIn0.hL64DI3xihWFknOwxEa8qA";

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [72.8777, 19.0760],
      zoom: 6.5,
    });

    mapRef.current = map;

    // Wait for map to load
    map.on('load', () => {
      // Add route sources and layers for each route (when we have valid geometries)
      const enrichedRoutes = (routes || []).map((route, index) => {
        let geometry = route?.geometry;
        if (route?.geometry?.geometry) {
          geometry = route.geometry.geometry;
        }
        const validGeometry = validateGeometry(geometry);
        return { route, index, validGeometry };
      });

      const routesWithGeometry = enrichedRoutes.filter(r => r.validGeometry);

      if (routesWithGeometry.length > 0) {
        console.log('[MapComponent] Rendering routes with geometry:', routesWithGeometry.length);
        routesWithGeometry.forEach(({ route, index, validGeometry }) => {
          try {
            const colors = ['#27ae60', '#3498db', '#e74c3c', '#f39c12'];
            const color = colors[index] || '#95a5a6';

            map.addSource(`route-${index}`, {
              type: 'geojson',
              data: {
                type: 'Feature',
                properties: {},
                geometry: validGeometry
              }
            });

            map.addLayer({
              id: `route-${index}`,
              type: 'line',
              source: `route-${index}`,
              layout: {
                'line-join': 'round',
                'line-cap': 'round'
              },
              paint: {
                'line-color': color,
                'line-width': index === 0 ? 6 : 4,
                'line-opacity': 0.8
              }
            });
          } catch (error) {
            console.log(`Error adding route ${index} to map:`, error);
          }
        });

        // Fit map bounds to the first valid route
        const firstGeom = routesWithGeometry[0].validGeometry;
        if (firstGeom?.coordinates && firstGeom.coordinates.length > 0) {
          try {
            const bounds = firstGeom.coordinates.reduce((b, coord) => b.extend(coord), new mapboxgl.LngLatBounds(firstGeom.coordinates[0], firstGeom.coordinates[0]));
            map.fitBounds(bounds, { padding: 50 });
          } catch (error) {
            console.warn('Could not fit bounds:', error);
          }
        }
      } else {
        // Fallback to standard directions control when no geometry is present
        const directions = new MapboxDirections({
          accessToken: mapboxgl.accessToken,
          unit: "metric",
          profile: "mapbox/driving",
          alternatives: true,
          controls: { 
            inputs: true, 
            instructions: true,
            banner: true
          }
        });

        map.addControl(directions, "top-left");

        if (origin) directions.setOrigin(origin);
        if (destination) directions.setDestination(destination);
      }
    });

    return () => {
      map.remove();
    };
  }, [origin, destination, routes]);

  return (
    <div style={{ position: 'relative', height: "80vh", width: "100%" }}>
      <div className="map-container" style={{ height: "100%", width: "100%" }} ref={mapContainerRef} />
      <RouteLegend />
    </div>
  );
}
