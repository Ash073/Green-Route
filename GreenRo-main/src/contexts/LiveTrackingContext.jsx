import React, { createContext, useContext, useState } from "react";

const LiveTrackingContext = createContext();

export const useLiveTracking = () => useContext(LiveTrackingContext);

export const LiveTrackingProvider = ({ children }) => {
  const [activeTripId, setActiveTripId] = useState(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [tripData, setTripData] = useState(null);

  const startTracking = (tripId) => {
    setActiveTripId(tripId);
    setIsMinimized(false);
  };

  const stopTracking = () => {
    setActiveTripId(null);
    setTripData(null);
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <LiveTrackingContext.Provider value={{ 
      activeTripId, 
      startTracking, 
      stopTracking, 
      isMinimized, 
      toggleMinimize,
      tripData,
      setTripData
    }}>
      {children}
    </LiveTrackingContext.Provider>
  );
};

const vehicleEmoji = (type) => {
  switch (type) {
    case "bike": return "🏍️";
    case "scooter": return "🛵";
    case "auto": return "🚕";
    case "car": return "🚗";
    case "cycle": return "🚲";
    case "van": return "🚐";
    default: return "🛵";
  }
};

function PersistentLiveTracker({ tripId, isMinimized, onToggleMinimize, onClose }) {
  const navigate = useNavigate();
  const [driverLocation, setDriverLocation] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [tripInfo, setTripInfo] = useState(null);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  // Initialize map when expanded
  useEffect(() => {
    if (isMinimized || !mapContainerRef.current) return;
    
    if (!mapRef.current) {
      mapboxgl.accessToken = "pk.eyJ1IjoieWVzYXN3aW5pMTUwOCIsImEiOiJjbWZjd3l0ZWkwM2FjMmxzYmR1d2liYWsxIn0.hL64DI3xihWFknOwxEa8qA";
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [72.8777, 19.0760],
        zoom: 12,
      });
      mapRef.current = map;
    }

    return () => {
      if (mapRef.current && isMinimized) {
        // Don't remove map when minimizing, just when unmounting
      }
    };
  }, [isMinimized]);

  // Poll driver location
  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const res = await apiClient.get(`/trips/${tripId}/live-driver`);
        const liveData = res.data.live || {};
        
        setDriverLocation(liveData.location);
        setTripInfo(liveData.driver);

        if (mapRef.current && liveData.location && !isMinimized) {
          const { lng, lat } = liveData.location;

          if (!markerRef.current) {
            const el = document.createElement("div");
            el.style.width = "40px";
            el.style.height = "40px";
            el.style.borderRadius = "50%";
            el.style.display = "flex";
            el.style.alignItems = "center";
            el.style.justifyContent = "center";
            el.style.fontSize = "24px";
            el.style.background = "linear-gradient(135deg, #10b981 0%, #059669 100%)";
            el.style.boxShadow = "0 8px 16px rgba(16, 185, 129, 0.3)";
            el.style.border = "3px solid white";
            el.textContent = vehicleEmoji(liveData.driver?.vehicleType || "bike");
            markerRef.current = new mapboxgl.Marker(el).setLngLat([lng, lat]).addTo(mapRef.current);
          } else {
            markerRef.current.setLngLat([lng, lat]);
          }

          mapRef.current.easeTo({ center: [lng, lat], duration: 500 });
        }
      } catch (error) {
        console.warn("Error fetching driver location:", error);
      }
    };

    fetchLocation();
    const interval = setInterval(fetchLocation, 5000);
    return () => clearInterval(interval);
  }, [tripId, isMinimized]);

  const handleCancelTrip = async (reason) => {
    setShowCancelModal(false);
    alert(`Trip cancelled: ${reason}\nThe driver has been notified.`);
    onClose();
    navigate("/");
  };

  // Minimized view
  if (isMinimized) {
    return (
      <div
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          width: "280px",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          borderRadius: "16px",
          padding: "1rem",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
          zIndex: 9998,
          cursor: "pointer",
          transition: "all 0.3s ease"
        }}
        onClick={onToggleMinimize}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "0.85rem", opacity: 0.9 }}>Active Trip</div>
            <div style={{ fontSize: "1.1rem", fontWeight: "600", marginTop: "0.25rem" }}>
              {vehicleEmoji(tripInfo?.vehicleType || "bike")} Tracking Driver
            </div>
          </div>
          <div style={{ fontSize: "1.5rem", animation: "pulse 2s infinite" }}>
            📍
          </div>
        </div>
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </div>
    );
  }

  // Expanded view
  return (
    <>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "white",
          zIndex: 9997,
          display: "flex",
          flexDirection: "column"
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            padding: "1rem 1.5rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)"
          }}
        >
          <div>
            <div style={{ fontSize: "0.9rem", opacity: 0.9 }}>Live Tracking</div>
            <div style={{ fontSize: "1.3rem", fontWeight: "600", marginTop: "0.25rem" }}>
              {vehicleEmoji(tripInfo?.vehicleType || "bike")} {tripInfo?.name || "Your Driver"}
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={onToggleMinimize}
              style={{
                background: "rgba(255, 255, 255, 0.2)",
                border: "none",
                borderRadius: "8px",
                color: "white",
                padding: "0.5rem 1rem",
                cursor: "pointer",
                fontSize: "1rem"
              }}
            >
              ➖ Minimize
            </button>
            <button
              onClick={() => setShowCancelModal(true)}
              style={{
                background: "#e74c3c",
                border: "none",
                borderRadius: "8px",
                color: "white",
                padding: "0.5rem 1rem",
                cursor: "pointer",
                fontSize: "1rem",
                fontWeight: "600"
              }}
            >
              ✕ Cancel Trip
            </button>
          </div>
        </div>

        {/* Map */}
        <div ref={mapContainerRef} style={{ flex: 1 }} />

        {/* Info Footer */}
        {driverLocation && (
          <div
            style={{
              background: "#f8f9fa",
              padding: "1rem 1.5rem",
              borderTop: "1px solid #dee2e6",
              display: "flex",
              justifyContent: "space-around"
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "0.85rem", color: "#7f8c8d" }}>Location</div>
              <div style={{ fontSize: "1rem", fontWeight: "600", color: "#2c3e50", marginTop: "0.25rem" }}>
                Tracking Live
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "0.85rem", color: "#7f8c8d" }}>Vehicle</div>
              <div style={{ fontSize: "1rem", fontWeight: "600", color: "#2c3e50", marginTop: "0.25rem", textTransform: "capitalize" }}>
                {tripInfo?.vehicleType || "N/A"}
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "0.85rem", color: "#7f8c8d" }}>Status</div>
              <div style={{ fontSize: "1rem", fontWeight: "600", color: "#27ae60", marginTop: "0.25rem" }}>
                En Route
              </div>
            </div>
          </div>
        )}
      </div>

      {showCancelModal && (
        <TripCancellationModal
          tripId={tripId}
          onCancel={handleCancelTrip}
          onClose={() => setShowCancelModal(false)}
        />
      )}
    </>
  );
}
