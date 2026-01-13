import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import mapboxgl from "mapbox-gl";
import MapboxDirections from "@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions.css";
import RouteLegend from "../components/RouteLegend";

export default function MapPage() {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const directionsRef = useRef(null);
  const location = useLocation();
  const stateOrigin = location.state?.origin;
  const stateDestination = location.state?.destination;

  useEffect(() => {
    if (!mapContainerRef.current) return;

    mapboxgl.accessToken = "pk.eyJ1IjoieWVzYXN3aW5pMTUwOCIsImEiOiJjbWZjd3l0ZWkwM2FjMmxzYmR1d2liYWsxIn0.hL64DI3xihWFknOwxEa8qA";

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [72.8777, 19.0760], // Mumbai [lng, lat]
      zoom: 6.5,
    });

    mapRef.current = map;

    const directions = new MapboxDirections({
      accessToken: mapboxgl.accessToken,
      unit: "metric",
      profile: "mapbox/driving",
      alternatives: true,
      controls: { 
        inputs: true, 
        instructions: true,
        banner: true
      },
      styles: [
        {
          'id': 'directions-route-line-primary',
          'type': 'line',
          'source': 'directions',
          'layout': {
            'line-join': 'round',
            'line-cap': 'round'
          },
          'paint': {
            'line-color': '#27ae60',
            'line-width': 6,
            'line-opacity': 1
          },
          'filter': ['==', 'route', 'primary']
        },
        {
          'id': 'directions-route-line-alternate',
          'type': 'line',
          'source': 'directions',
          'layout': {
            'line-join': 'round',
            'line-cap': 'round'
          },
          'paint': {
            'line-color': '#3498db',
            'line-width': 4,
            'line-opacity': 0.8
          },
          'filter': ['==', 'route', 'alternate']
        },
        {
          'id': 'directions-route-line-alternate-2',
          'type': 'line',
          'source': 'directions',
          'layout': {
            'line-join': 'round',
            'line-cap': 'round'
          },
          'paint': {
            'line-color': '#e74c3c',
            'line-width': 4,
            'line-opacity': 0.8
          },
          'filter': ['==', 'route', 'alternate-2']
        },
        {
          'id': 'directions-route-line-alternate-3',
          'type': 'line',
          'source': 'directions',
          'layout': {
            'line-join': 'round',
            'line-cap': 'round'
          },
          'paint': {
            'line-color': '#f39c12',
            'line-width': 4,
            'line-opacity': 0.8
          },
          'filter': ['==', 'route', 'alternate-3']
        }
      ]
    });

    map.addControl(directions, "top-left");
    directionsRef.current = directions;

    // If navigated with pre-filled origin/destination, set them
    if (stateOrigin) directions.setOrigin(stateOrigin);
    if (stateDestination) directions.setDestination(stateDestination);

    return () => {
      try {
        // IMPORTANT: Remove custom layers FIRST before removing the source
        const layerIds = [
          'directions-route-line-primary',
          'directions-route-line-alternate',
          'directions-route-line-alternate-2',
          'directions-route-line-alternate-3'
        ];
        
        // Remove all layers that depend on the 'directions' source
        layerIds.forEach(layerId => {
          try {
            if (map.getLayer(layerId)) {
              map.removeLayer(layerId);
            }
          } catch (e) {
            console.warn(`Error removing layer ${layerId}:`, e?.message || e);
          }
        });

        // Now remove the directions control (which removes the source)
        if (directionsRef.current && map.hasControl(directionsRef.current)) {
          try {
            map.removeControl(directionsRef.current);
          } catch (e) {
            console.warn('Error removing directions control:', e?.message || e);
          }
        }

        // Remove the source only if it still exists and wasn't cleaned up by the control
        try {
          if (map.getSource('directions')) {
            map.removeSource('directions');
          }
        } catch (e) {
          // Source may already be removed, that's fine
          console.warn('Source already removed:', e?.message || e);
        }

        // Finally remove the map instance
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }
      } catch (error) {
        console.warn('Error cleaning up map:', error);
      }
    };
  }, []);

  // Update directions when navigation state changes (if map already mounted)
  useEffect(() => {
    if (!directionsRef.current) return;
    if (stateOrigin) directionsRef.current.setOrigin(stateOrigin);
    if (stateDestination) directionsRef.current.setDestination(stateDestination);
  }, [stateOrigin, stateDestination]);

  return (
    <div style={{ position: 'relative', height: "80vh", width: "100%" }}>
      <div className="map-container" style={{ height: "100%", width: "100%" }} ref={mapContainerRef} />
      <RouteLegend />
    </div>
  );
}
