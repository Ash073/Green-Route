import React, { useState } from "react";
import apiClient from "../api/apiClient";

const cancellationReasons = [
  "Driver is taking too long",
  "Found alternative transport",
  "Change of plans",
  "Driver not responding",
  "Incorrect pickup location",
  "Emergency situation",
  "Other"
];

export default function TripCancellationModal({ tripId, onCancel, onClose }) {
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async () => {
    const reason = selectedReason === "Other" ? customReason : selectedReason;
    
    if (!reason || reason.trim() === "") {
      alert("Please select or provide a reason for cancellation");
      return;
    }

    try {
      setCancelling(true);
      await apiClient.patch(`/trips/${tripId}/cancel`, {
        reason: reason,
        cancelledBy: "user"
      });

      if (onCancel) onCancel(reason);
    } catch (error) {
      alert("Failed to cancel trip: " + (error.message || "Unknown error"));
      setCancelling(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.75)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 10000,
        padding: "1rem"
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "white",
          borderRadius: "16px",
          padding: "2rem",
          maxWidth: "500px",
          width: "100%",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
          maxHeight: "90vh",
          overflowY: "auto"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: "0 0 1rem 0", color: "#e74c3c", fontSize: "1.5rem" }}>
          ⚠️ Cancel Trip
        </h2>

        <p style={{ color: "#7f8c8d", marginBottom: "1.5rem" }}>
          Please select a reason for cancellation. The driver will be notified immediately.
        </p>

        <div style={{ marginBottom: "1.5rem" }}>
          {cancellationReasons.map((reason) => (
            <label
              key={reason}
              style={{
                display: "block",
                padding: "0.75rem",
                marginBottom: "0.5rem",
                background: selectedReason === reason ? "#e8f5e9" : "#f8f9fa",
                border: selectedReason === reason ? "2px solid #27ae60" : "1px solid #dee2e6",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              <input
                type="radio"
                name="cancellation-reason"
                value={reason}
                checked={selectedReason === reason}
                onChange={(e) => setSelectedReason(e.target.value)}
                style={{ marginRight: "0.5rem" }}
              />
              {reason}
            </label>
          ))}
        </div>

        {selectedReason === "Other" && (
          <textarea
            placeholder="Please provide details..."
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
            style={{
              width: "100%",
              padding: "0.75rem",
              borderRadius: "8px",
              border: "1px solid #dee2e6",
              marginBottom: "1.5rem",
              fontFamily: "inherit",
              fontSize: "1rem",
              minHeight: "80px"
            }}
          />
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <button
            onClick={onClose}
            disabled={cancelling}
            style={{
              background: "#95a5a6",
              color: "white",
              border: "none",
              padding: "1rem",
              borderRadius: "8px",
              cursor: cancelling ? "not-allowed" : "pointer",
              fontSize: "1rem",
              fontWeight: "600",
              opacity: cancelling ? 0.6 : 1
            }}
          >
            Keep Trip
          </button>
          <button
            onClick={handleCancel}
            disabled={cancelling || !selectedReason}
            style={{
              background: "#e74c3c",
              color: "white",
              border: "none",
              padding: "1rem",
              borderRadius: "8px",
              cursor: cancelling || !selectedReason ? "not-allowed" : "pointer",
              fontSize: "1rem",
              fontWeight: "600",
              opacity: cancelling || !selectedReason ? 0.6 : 1
            }}
          >
            {cancelling ? "Cancelling..." : "Cancel Trip"}
          </button>
        </div>
      </div>
    </div>
  );
}
