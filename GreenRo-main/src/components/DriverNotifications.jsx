import React, { useState, useEffect } from "react";
import apiClient from "../api/apiClient";

export default function DriverNotifications({ driverId }) {
  const [notifications, setNotifications] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [activeNotification, setActiveNotification] = useState(null);

  useEffect(() => {
    if (!driverId) return;

    const fetchNotifications = async () => {
      try {
        const response = await apiClient.get(`/auth/notifications/${driverId}`);
        const newNotifications = response.data.notifications || [];
        
        // Find unread trip cancellation notifications
        const unreadCancellations = newNotifications.filter(
          n => n.type === 'trip_cancelled' && !n.read
        );

        if (unreadCancellations.length > 0) {
          setNotifications(unreadCancellations);
          setActiveNotification(unreadCancellations[0]);
          setShowModal(true);
        }
      } catch (error) {
        console.warn("Error fetching notifications:", error);
      }
    };

    // Poll every 5 seconds
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, [driverId]);

  const handleDismiss = async () => {
    if (!activeNotification) return;

    try {
      // Mark notification as read
      await apiClient.patch(`/auth/notifications/${activeNotification._id || activeNotification.tripId}/mark-read`);
      
      // Remove from local state
      setNotifications(prev => prev.filter(n => n !== activeNotification));
      
      // Show next notification if any
      if (notifications.length > 1) {
        setActiveNotification(notifications[1]);
      } else {
        setShowModal(false);
        setActiveNotification(null);
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
      setShowModal(false);
    }
  };

  if (!showModal || !activeNotification) return null;

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
        padding: "1rem"
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: "16px",
          padding: "2rem",
          maxWidth: "500px",
          width: "100%",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
          textAlign: "center",
          animation: "slideIn 0.3s ease-out"
        }}
      >
        <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>
          ⚠️
        </div>

        <h2 style={{ margin: "0 0 1rem 0", color: "#e74c3c", fontSize: "1.8rem" }}>
          Trip Cancelled
        </h2>

        <p style={{ fontSize: "1.1rem", color: "#2c3e50", marginBottom: "1.5rem", lineHeight: "1.6" }}>
          {activeNotification.message}
        </p>

        <div
          style={{
            background: "#ffe6e6",
            border: "2px solid #e74c3c",
            borderRadius: "12px",
            padding: "1.25rem",
            marginBottom: "1.5rem",
            textAlign: "left"
          }}
        >
          <p style={{ margin: 0, fontSize: "1rem", color: "#c0392b", fontWeight: "bold" }}>
            📋 Cancellation Reason:
          </p>
          <p style={{ margin: "0.5rem 0 1rem 0", fontSize: "1.05rem", color: "#2c3e50", fontWeight: "500", padding: "0.75rem", background: "white", borderRadius: "6px" }}>
            {activeNotification.reason || "No reason provided"}
          </p>
          <p style={{ margin: 0, fontSize: "0.9rem", color: "#7f8c8d" }}>
            <strong>Trip ID:</strong> {activeNotification.tripId?.toString().slice(-8) || "N/A"}
          </p>
          <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.85rem", color: "#7f8c8d" }}>
            <strong>Cancelled at:</strong> {new Date(activeNotification.createdAt).toLocaleString()}
          </p>
        </div>

        {notifications.length > 1 && (
          <p style={{ fontSize: "0.85rem", color: "#7f8c8d", marginBottom: "1rem" }}>
            {notifications.length - 1} more notification(s) pending
          </p>
        )}

        <button
          onClick={handleDismiss}
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            border: "none",
            padding: "1rem 2rem",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "1rem",
            fontWeight: "600",
            width: "100%",
            boxShadow: "0 4px 12px rgba(102, 126, 234, 0.4)"
          }}
        >
          Acknowledge
        </button>
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            transform: scale(0.8);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
