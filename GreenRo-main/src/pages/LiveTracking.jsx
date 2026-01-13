import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useLiveTracking } from "../contexts/LiveTrackingContext";
import apiClient from "../api/apiClient";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { SlidingNumber, SlidingNumberBasic } from '../components/ui/SlidingNumberDemo';

const vehicleEmoji = (type) => {
  switch (type) {
    case "bike": return 0x1F6B2; // 🚲
    case "scooter": return 0x1F6F5; // 🛵
    case "auto": return 0x1F695; // 🚕 (placeholder for auto)
    case "car": return 0x1F697; // 🚗
    case "cycle": return 0x1F6B2; // 🚲
    case "van": return 0x1F690; // 🚐
    default: return 0x1F6F5; // 🛵 default
  }
};

const userEmoji = 0x1F9D1; // 👤 default user icon

export default function LiveTracking() {
  const { tripId } = useParams();
  const { isAuthenticated, user } = useAuth();
  const { startTracking } = useLiveTracking();
  const navigate = useNavigate();
  const [info, setInfo] = useState(null);
  const [error, setError] = useState(null);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const userMarkerRef = useRef(null);
  const [isDriver, setIsDriver] = useState(false);
  const [otherPartyLocation, setOtherPartyLocation] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    // Determine if current user is driver or regular user
    if (user?.userType === 'driver') {
      setIsDriver(true);
    }
    
    // Start persistent live tracking for non-drivers
    if (user?.userType !== 'driver' && tripId) {
      startTracking(tripId);
    }
  }, [isAuthenticated, navigate, user, tripId, startTracking]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    mapboxgl.accessToken = "pk.eyJ1IjoieWVzYXN3aW5pMTUwOCIsImEiOiJjbWZjd3l0ZWkwM2FjMmxzYmR1d2liYWsxIn0.hL64DI3xihWFknOwxEa8qA";
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [72.8777, 19.0760],
      zoom: 12,
    });
    mapRef.current = map;
    return () => { map.remove(); };
  }, []);

  // Poll live location based on user role
  useEffect(() => {
    let interval;
    
    const fetchLiveLocation = async () => {
      try {
        let endpoint, keyPath;
        
        if (isDriver) {
          // Driver fetches user's location
          endpoint = `/trips/${tripId}/live-user`;
          keyPath = 'live';
        } else {
          // User fetches driver's location
          endpoint = `/trips/${tripId}/live-driver`;
          keyPath = 'live';
        }
        
        const res = await apiClient.get(endpoint);
        
        const liveData = res.data[keyPath] || {};
        setOtherPartyLocation(liveData);
        
        // Don't set error for expected cases (no match yet, etc)
        if (liveData.hasUser === false || liveData.hasDriver === false) {
          setError(null);
        }
        
        if (mapRef.current && liveData.location) {
          const { lng, lat } = liveData.location;
          
          // Create or update marker based on role
          if (isDriver) {
            // Driver tracking user - use user icon
            if (!userMarkerRef.current) {
              const el = document.createElement("div");
              el.style.width = "44px";
              el.style.height = "44px";
              el.style.borderRadius = "50%";
              el.style.display = "flex";
              el.style.alignItems = "center";
              el.style.justifyContent = "center";
              el.style.fontSize = "24px";
              el.style.background = "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)";
              el.style.color = "white";
              el.style.boxShadow = "0 8px 16px rgba(59, 130, 246, 0.3)";
              el.style.border = "3px solid white";
              el.textContent = String.fromCodePoint(userEmoji);
              userMarkerRef.current = new mapboxgl.Marker(el).setLngLat([lng, lat]).addTo(mapRef.current);
            } else {
              userMarkerRef.current.setLngLat([lng, lat]);
            }
          } else {
            // User tracking driver - use vehicle icon
            if (!markerRef.current) {
              const el = document.createElement("div");
              el.style.width = "44px";
              el.style.height = "44px";
              el.style.borderRadius = "50%";
              el.style.display = "flex";
              el.style.alignItems = "center";
              el.style.justifyContent = "center";
              el.style.fontSize = "24px";
              el.style.background = "linear-gradient(135deg, #10b981 0%, #059669 100%)";
              el.style.color = "white";
              el.style.boxShadow = "0 8px 16px rgba(16, 185, 129, 0.3)";
              el.style.border = "3px solid white";
              el.textContent = String.fromCodePoint(vehicleEmoji(liveData.driver?.vehicleType || "bike"));
              markerRef.current = new mapboxgl.Marker(el).setLngLat([lng, lat]).addTo(mapRef.current);
            } else {
              markerRef.current.setLngLat([lng, lat]);
            }
          }
          
          // Smooth pan to location
          mapRef.current.easeTo({ center: [lng, lat], duration: 500 });
        }
      } catch (e) {
        console.warn('Error fetching live location:', e);
        console.warn('Response status:', e.response?.status);
        console.warn('Response data:', e.response?.data);
        console.warn('Endpoint:', isDriver ? `live-user for trip ${tripId}` : `live-driver for trip ${tripId}`);
        // Only set error if it's not a "no match yet" scenario
        if (e.response?.status !== 404) {
          setError("Unable to fetch live location");
        }
      }
    };
    
    fetchLiveLocation();
    interval = setInterval(fetchLiveLocation, 5000);
    return () => clearInterval(interval);
  }, [tripId, isDriver]);

  return (
    <div style={{ padding: "1.5rem", minHeight: "100vh", background: "linear-gradient(135deg, #f0f9ff 0%, #ecfdf5 100%)" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ margin: 0, fontSize: "2rem", fontWeight: 700, background: "linear-gradient(135deg, #10b981 0%, #3b82f6 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>🗺️ Live Ride Tracking</h2>
        <p style={{ color: "#64748b", marginTop: "0.5rem", fontSize: "0.95rem" }}>Real-time location, updated every 5 seconds</p>
      </div>
      
      {/* Map Container with Premium Styling */}
      <div style={{ position: "relative", height: "70vh", width: "100%", borderRadius: "20px", overflow: "hidden", boxShadow: "0 20px 40px rgba(0,0,0,0.12)", border: "1px solid #e2e8f0" }}>
        <div ref={mapContainerRef} style={{ height: "100%", width: "100%" }} />
        
        {/* Premium Info Panel */}
        <div className="premium-card" style={{ 
          position: "absolute", 
          top: 16, 
          left: 16, 
          maxWidth: "350px", 
          background: "rgba(255,255,255,0.98)", 
          backdropFilter: "blur(10px)",
          zIndex: 10
        }}>
          {!otherPartyLocation?.hasUser && !otherPartyLocation?.hasDriver && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "#f59e0b" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "linear-gradient(135deg, #fef3c7 0%, #fcd34d 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", boxShadow: "0 4px 12px rgba(245, 158, 11, 0.3)" }}>⏳</div>
              <div>
                <div style={{ fontWeight: 700, color: "#1e293b", fontSize: "0.95rem" }}>Waiting for connection</div>
                <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.25rem" }}>
                  {isDriver ? "Waiting for user location..." : "No driver matched yet. Waiting for acceptance..."}
                </div>
              </div>
            </div>
          )}
          
          {isDriver && otherPartyLocation?.hasUser && (
            <div style={{ color: "#1e293b" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontWeight: 700, fontSize: "1rem", marginBottom: "1rem" }}>
                <div className="rider-avatar" style={{ width: "40px", height: "40px", fontSize: "1.25rem" }}>{otherPartyLocation.user?.name?.charAt(0).toUpperCase() || "U"}</div>
                <span>{otherPartyLocation.user?.name}</span>
              </div>
              <div style={{ display: "grid", gap: "0.75rem", fontSize: "0.9rem", paddingTop: "1rem", borderTop: "1px solid #e2e8f0" }}>
                {otherPartyLocation.user?.phoneNumber && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#64748b" }}>
                    <span style={{ width: "24px", textAlign: "center" }}>☎️</span>
                    <span>{otherPartyLocation.user.phoneNumber}</span>
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#10b981", fontSize: "0.85rem" }}>
                  <span style={{ width: "24px", textAlign: "center" }}>🔄</span>
                  <span>Updated: {otherPartyLocation.updatedAt ? new Date(otherPartyLocation.updatedAt).toLocaleTimeString() : '—'}</span>
                </div>
              </div>
            </div>
          )}
          
          {!isDriver && otherPartyLocation?.hasDriver && (
            <div style={{ color: "#1e293b" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontWeight: 700, fontSize: "1rem", marginBottom: "1rem" }}>
                <div className="rider-avatar" style={{ width: "40px", height: "40px", fontSize: "1.25rem", background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}>🚗</div>
                <span>{otherPartyLocation.driver?.name || "Your Driver"}</span>
              </div>
              <div style={{ display: "grid", gap: "0.75rem", fontSize: "0.9rem", paddingTop: "1rem", borderTop: "1px solid #e2e8f0" }}>
                {otherPartyLocation.driver?.phoneNumber && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#64748b" }}>
                    <span style={{ width: "24px", textAlign: "center" }}>☎️</span>
                    <span>{otherPartyLocation.driver.phoneNumber}</span>
                  </div>
                )}
                {otherPartyLocation.driver?.vehicleType && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#64748b" }}>
                    <span style={{ width: "24px", textAlign: "center" }}>🚗</span>
                    <span style={{ textTransform: "capitalize" }}>{otherPartyLocation.driver.vehicleType}</span>
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#10b981", fontSize: "0.85rem" }}>
                  <span style={{ width: "24px", textAlign: "center" }}>🔄</span>
                  <span>Updated: {otherPartyLocation.updatedAt ? new Date(otherPartyLocation.updatedAt).toLocaleTimeString() : '—'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {error && (
        <div style={{ marginTop: "1.5rem", padding: "1rem", background: "#fee2e2", color: "#7f1d1d", borderRadius: "12px", border: "1px solid #fecaca", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ fontSize: "1.2rem" }}>⚠️</span>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
