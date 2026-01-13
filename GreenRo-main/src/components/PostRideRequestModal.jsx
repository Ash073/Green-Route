import React, { useState } from 'react';
import axios from 'axios';

export default function PostRideRequestModal({ tripId, onClose, onSuccess }) {
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');

  const handlePostRideRequest = async () => {
    try {
      setPosting(true);
      setError('');
      const token = localStorage.getItem('accessToken');
      
      // Capture geolocation before posting
      let coordinates = { lat: 19.0760, lng: 72.8777 }; // Default to Mumbai
      if (navigator.geolocation) {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
          });
          coordinates = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          // Update user's location immediately
          await axios.post(
            `https://green-route-3.onrender.com/api/trips/user/update-location`,
            { 
              coordinates,
              address: 'Current Location'
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        } catch (geoError) {
          console.warn('Geolocation error:', geoError);
        }
      }
      
      const response = await axios.post(
        `https://green-route-3.onrender.com/api/trips/user/post-ride-request/${tripId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Play success sound
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.value = 1000;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);

      onSuccess(response.data.trip);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post ride request');
    } finally {
      setPosting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '2rem',
        maxWidth: '500px',
        width: '90%',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
      }}>
        <h2 style={{ margin: '0 0 1rem 0', color: '#2c3e50' }}>
          📍 Post Your Ride Request
        </h2>

        <div style={{
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          color: '#065f46',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          fontSize: '0.95rem'
        }}>
          <p style={{ margin: 0 }}>
            <strong>✅ Nearby drivers will be notified instantly!</strong>
          </p>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem' }}>
            Drivers within 1km of your location will receive a real-time notification of your ride request.
          </p>
        </div>

        {error && (
          <div style={{
            background: '#fef3c7',
            border: '1px solid #fde68a',
            color: '#92400e',
            padding: '0.75rem',
            borderRadius: '6px',
            marginBottom: '1rem',
            fontSize: '0.9rem'
          }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{
          display: 'flex',
          gap: '1rem',
          marginTop: '2rem'
        }}>
          <button
            onClick={onClose}
            disabled={posting}
            style={{
              flex: 1,
              background: '#ecf0f1',
              color: '#2c3e50',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              opacity: posting ? 0.6 : 1
            }}
          >
            Cancel
          </button>
          <button
            onClick={handlePostRideRequest}
            disabled={posting}
            style={{
              flex: 1,
              background: 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              opacity: posting ? 0.6 : 1
            }}
          >
            {posting ? 'Posting...' : '✅ Post Ride Request'}
          </button>
        </div>
      </div>
    </div>
  );
}
