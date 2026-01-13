import React, { useState, useEffect } from "react";
import apiClient from "../api/apiClient";

export default function DriverMatchNotification({ userId, hasActiveTrip = false, pollInterval = 10000, onMatch }) {
  const [driverOffer, setDriverOffer] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [responding, setResponding] = useState(false);
  const [showDriverProfile, setShowDriverProfile] = useState(false);
  const [driverDetails, setDriverDetails] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    // Don't poll if no active trip
    if (!userId || !hasActiveTrip) {
      setDriverOffer(null);
      setShowModal(false);
      return;
    }

    // Poll for driver matches
    const checkForMatches = async () => {
      try {
        const response = await apiClient.get(
          `/trips/check-driver-match/${userId}`
        );

        if (response.data.driverMatch && !driverOffer) {
          setDriverOffer(response.data.driverMatch);
          setShowModal(true);
          if (onMatch) onMatch(response.data.driverMatch);
        }
      } catch (error) {
        console.error("Error checking for driver match:", error);
      }
    };

    const interval = setInterval(checkForMatches, pollInterval);
    checkForMatches(); // Check immediately on mount

    return () => clearInterval(interval);
  }, [userId, hasActiveTrip, pollInterval, onMatch, driverOffer]);

  const handleViewProfile = async () => {
    if (!driverOffer?.driverId && !driverOffer?.matchedDriverId) return;
    
    const profileId = driverOffer.driverId || driverOffer.matchedDriverId;
    
    try {
      setLoadingProfile(true);
      const response = await apiClient.get(`/trips/driver-profile/${profileId}`);
      setDriverDetails(response.data);
      setShowDriverProfile(true);
    } catch (error) {
      console.error("Error loading driver profile:", error);
      alert("Error loading driver profile: " + (error.response?.data?.message || error.message));
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleUserResponse = async (response) => {
    if (!driverOffer) return;

    try {
      setResponding(true);
      
      await apiClient.patch(
        `/trips/${driverOffer.tripId}/user-response`,
        { response }
      );

      if (response === "accepted") {
        // First, load the driver profile to show the user
        try {
          const profileResponse = await apiClient.get(`/trips/driver-profile/${driverOffer.driverId}`);
          setDriverDetails(profileResponse.data);
          setShowDriverProfile(true);
          // Don't navigate yet, let user review profile first
          alert("✅ Great! You accepted the driver. Please review their profile before proceeding to tracking.");
        } catch (error) {
          alert("✅ Trip accepted! Starting live tracking...");
          setShowModal(false);
          setDriverOffer(null);
          // Navigate if profile loading fails
          if (onMatch) onMatch(driverOffer);
        }
      } else {
        alert("❌ You rejected this driver. Looking for other matches...");
        setShowModal(false);
        setDriverOffer(null);
      }
    } catch (error) {
      alert("Error responding to driver: " + error.message);
    } finally {
      setResponding(false);
    }
  };

  if (!showModal || !driverOffer) return null;

  // Driver Profile Modal
  if (showDriverProfile && driverDetails) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.85)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 10000,
          padding: "1rem",
          overflowY: "auto"
        }}
        onClick={() => setShowDriverProfile(false)}
      >
        <div
          style={{
            background: "white",
            borderRadius: "16px",
            padding: "2rem",
            maxWidth: "600px",
            width: "90%",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
            maxHeight: "90vh",
            overflowY: "auto"
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <h2 style={{ margin: "0 0 1.5rem 0", color: "#2c3e50" }}>👤 Driver Profile</h2>
          
        <div style={{ background: "#f8f9fa", borderRadius: "12px", padding: "1.5rem", marginBottom: "1.5rem" }}>
          <h3 style={{ margin: "0 0 1rem 0", color: "#27ae60" }}>{driverDetails.name}</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <p style={{ margin: "0.25rem 0", color: "#7f8c8d", fontSize: "0.85rem" }}>Rating</p>
              <p style={{ margin: "0.25rem 0", color: "#f39c12", fontWeight: "600", fontSize: "1.2rem" }}>
                ⭐ {driverDetails.averageRating || "4.8"}/5
              </p>
            </div>
            <div>
              <p style={{ margin: "0.25rem 0", color: "#7f8c8d", fontSize: "0.85rem" }}>Total Trips</p>
              <p style={{ margin: "0.25rem 0", color: "#3498db", fontWeight: "600", fontSize: "1.2rem" }}>
                🚗 {driverDetails.totalTrips || 0}
              </p>
            </div>
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <p style={{ margin: "0.25rem 0", color: "#7f8c8d", fontSize: "0.85rem" }}>Vehicle Type</p>
            <p style={{ margin: "0.25rem 0", color: "#2c3e50", fontWeight: "500", textTransform: "capitalize" }}>
              {driverDetails.vehicleType || "Economy Car"}
            </p>
          </div>
          {driverDetails.vehicleDetails && (
            <div style={{ background: "white", padding: "0.75rem", borderRadius: "8px", marginBottom: "1rem" }}>
              <p style={{ margin: "0.25rem 0", color: "#7f8c8d", fontSize: "0.85rem" }}>Vehicle Details</p>
              {driverDetails.vehicleDetails.make && (
                <p style={{ margin: "0.25rem 0", color: "#2c3e50", fontSize: "0.9rem" }}>
                  <strong>Make:</strong> {driverDetails.vehicleDetails.make} {driverDetails.vehicleDetails.model}
                </p>
              )}
              {driverDetails.vehicleDetails.registrationNumber && (
                <p style={{ margin: "0.25rem 0", color: "#2c3e50", fontSize: "0.9rem" }}>
                  <strong>Registration:</strong> {driverDetails.vehicleDetails.registrationNumber}
                </p>
              )}
              {driverDetails.vehicleDetails.seatingCapacity && (
                <p style={{ margin: "0.25rem 0", color: "#2c3e50", fontSize: "0.9rem" }}>
                  <strong>Seating:</strong> {driverDetails.vehicleDetails.seatingCapacity} persons
                </p>
              )}
              {driverDetails.vehicleDetails.fuelType && (
                <p style={{ margin: "0.25rem 0", color: "#27ae60", fontSize: "0.9rem" }}>
                  <strong>Fuel Type:</strong> {driverDetails.vehicleDetails.fuelType}
                </p>
              )}
            </div>
          )}
          <div>
            <p style={{ margin: "0.25rem 0", color: "#7f8c8d", fontSize: "0.85rem" }}>Carbon Saved</p>
            <p style={{ margin: "0.25rem 0", color: "#27ae60", fontWeight: "600" }}>
              🌱 {driverDetails.carbonSaved || 0} kg CO₂
            </p>
          </div>
        </div>

          <h4 style={{ margin: "1.5rem 0 1rem 0", color: "#2c3e50" }}>📊 Recent Trip History</h4>
          <div style={{ maxHeight: "300px", overflowY: "auto" }}>
            {driverDetails.recentTrips && driverDetails.recentTrips.length > 0 ? (
              driverDetails.recentTrips.map((trip, idx) => (
                <div 
                  key={idx}
                  style={{
                    background: trip.status === "cancelled" ? "#fff5f5" : "#f0f9ff",
                    border: trip.status === "cancelled" ? "1px solid #feb2b2" : "1px solid #bfdbfe",
                    borderRadius: "8px",
                    padding: "1rem",
                    marginBottom: "0.75rem"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <span style={{ fontWeight: "600", color: trip.status === "cancelled" ? "#e74c3c" : "#27ae60", textTransform: "capitalize" }}>
                      {trip.status === "cancelled" ? "❌ Cancelled" : "✅ " + trip.status}
                    </span>
                    <span style={{ fontSize: "0.8rem", color: "#7f8c8d" }}>
                      {new Date(trip.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p style={{ margin: "0.25rem 0", fontSize: "0.9rem", color: "#2c3e50" }}>
                    <strong>From:</strong> {trip.origin?.name || "N/A"}
                  </p>
                  <p style={{ margin: "0.25rem 0", fontSize: "0.9rem", color: "#2c3e50" }}>
                    <strong>To:</strong> {trip.destination?.name || "N/A"}
                  </p>
                  {trip.status === "cancelled" && trip.cancellationReason && (
                    <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.85rem", color: "#e74c3c", fontStyle: "italic", background: "white", padding: "0.5rem", borderRadius: "4px" }}>
                      <strong>Reason:</strong> {trip.cancellationReason}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <p style={{ color: "#7f8c8d", textAlign: "center", padding: "1rem" }}>No recent trips available</p>
            )}
          </div>

          <button
            onClick={() => {
              setShowDriverProfile(false);
              setShowModal(false);
              setDriverOffer(null);
              setDriverDetails(null);
              if (onMatch) onMatch(driverOffer);
            }}
            style={{
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              color: "white",
              border: "none",
              padding: "1rem",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "1rem",
              fontWeight: "600",
              width: "100%",
              marginTop: "1.5rem",
              boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)"
            }}
          >
            🗺️ Proceed to Live Tracking
          </button>

          <button
            onClick={() => setShowDriverProfile(false)}
            style={{
              background: "#95a5a6",
              color: "white",
              border: "none",
              padding: "0.75rem",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "0.9rem",
              fontWeight: "600",
              width: "100%",
              marginTop: "0.75rem"
            }}
          >
            Back to Offer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.7)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: "16px",
          padding: "2rem",
          maxWidth: "500px",
          width: "90%",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
          textAlign: "center",
          animation: "slideUp 0.3s ease-out",
        }}
      >
        <div style={{ fontSize: "3rem", marginBottom: "1rem", animation: "pulse 1s infinite" }}>
          🎉
        </div>

        <h2 style={{ margin: "1rem 0", color: "#27ae60", fontSize: "1.8rem" }}>
          Driver Found!
        </h2>

        <div style={{ background: "#f8f9fa", borderRadius: "12px", padding: "1.5rem", marginBottom: "1.5rem" }}>
          <div style={{ marginBottom: "1rem" }}>
            <p style={{ margin: "0.5rem 0", color: "#7f8c8d", fontSize: "0.9rem" }}>Driver Name</p>
            <h3 style={{ margin: "0.25rem 0", color: "#2c3e50" }}>
              {driverOffer.driverName || "Professional Driver"}
            </h3>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <p style={{ margin: "0.5rem 0", color: "#7f8c8d", fontSize: "0.9rem" }}>Rating</p>
              <p style={{ margin: "0.25rem 0", color: "#f39c12", fontWeight: "600", fontSize: "1.1rem" }}>
                ⭐ {driverOffer.rating || "4.8"}/5
              </p>
            </div>
            <div>
              <p style={{ margin: "0.5rem 0", color: "#7f8c8d", fontSize: "0.9rem" }}>Vehicle Type</p>
              <p style={{ margin: "0.25rem 0", color: "#3498db", fontWeight: "600", textTransform: "capitalize" }}>
                {driverOffer.vehicleType === "bike" && "🏍️ "}
                {driverOffer.vehicleType === "scooter" && "🛵 "}
                {driverOffer.vehicleType === "auto" && "🚕 "}
                {driverOffer.vehicleType === "car" && "🚗 "}
                {driverOffer.vehicleType === "van" && "🚐 "}
                {driverOffer.vehicleType === "cycle" && "🚲 "}
                {driverOffer.vehicleType || driverOffer.vehicle || "Economy Car"}
              </p>
            </div>
          </div>

          <div>
            <p style={{ margin: "0.5rem 0", color: "#7f8c8d", fontSize: "0.9rem" }}>Contact</p>
            <p style={{ margin: "0.25rem 0", color: "#2c3e50", fontWeight: "500" }}>
              📞 {driverOffer.phone || "Available"}
            </p>
          </div>
        </div>

        <p style={{ color: "#7f8c8d", marginBottom: "1rem", fontSize: "0.95rem" }}>
          Would you like to confirm this driver?
        </p>

        <button
          onClick={handleViewProfile}
          disabled={loadingProfile}
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            border: "none",
            padding: "0.75rem 1.5rem",
            borderRadius: "8px",
            cursor: loadingProfile ? "wait" : "pointer",
            fontSize: "0.9rem",
            fontWeight: "600",
            marginBottom: "1.5rem",
            width: "100%",
            opacity: loadingProfile ? 0.6 : 1
          }}
        >
          {loadingProfile ? "Loading..." : "👤 View Full Profile & Trip History"}
        </button>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <button
            onClick={() => handleUserResponse("rejected")}
            disabled={responding}
            style={{
              background: "#e74c3c",
              color: "white",
              border: "none",
              padding: "1rem",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "1rem",
              fontWeight: "600",
              opacity: responding ? 0.6 : 1,
            }}
          >
            ❌ Reject
          </button>
          <button
            onClick={() => handleUserResponse("accepted")}
            disabled={responding}
            style={{
              background: "#27ae60",
              color: "white",
              border: "none",
              padding: "1rem",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "1rem",
              fontWeight: "600",
              opacity: responding ? 0.6 : 1,
            }}
          >
            {responding ? "Processing..." : "✅ Accept"}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(50px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }
      `}</style>
    </div>
  );
}
