import React, { useState, useEffect } from "react";
import axios from "axios";

export default function DriverMatchNotification({ userId, pollInterval = 10000, onMatch }) {
  const [driverOffer, setDriverOffer] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [responding, setResponding] = useState(false);

  useEffect(() => {
    if (!userId) return;

    // Poll for driver matches
    const checkForMatches = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const response = await axios.get(
          `http://localhost:5000/api/trips/check-driver-match/${userId}`,
          { headers: { Authorization: `Bearer ${token}` } }
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
  }, [userId, pollInterval, onMatch, driverOffer]);

  const handleUserResponse = async (response) => {
    if (!driverOffer) return;

    try {
      setResponding(true);
      const token = localStorage.getItem("accessToken");
      
      await axios.patch(
        `http://localhost:5000/api/trips/${driverOffer.tripId}/user-response`,
        { response },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response === "accepted") {
        alert("✅ Great! You accepted the driver match. The driver will be notified.");
      } else {
        alert("❌ You rejected this driver. Looking for other matches...");
      }

      setShowModal(false);
      setDriverOffer(null);
    } catch (error) {
      alert("Error responding to driver: " + error.message);
    } finally {
      setResponding(false);
    }
  };

  if (!showModal || !driverOffer) return null;

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
              <p style={{ margin: "0.5rem 0", color: "#7f8c8d", fontSize: "0.9rem" }}>Vehicle</p>
              <p style={{ margin: "0.25rem 0", color: "#3498db", fontWeight: "600" }}>
                {driverOffer.vehicle || "Economy Car"}
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

        <p style={{ color: "#7f8c8d", marginBottom: "1.5rem", fontSize: "0.95rem" }}>
          Would you like to confirm this driver?
        </p>

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
