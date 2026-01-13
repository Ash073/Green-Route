import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "../components/LoadingSpinner";
import VehicleInformation from "../components/VehicleInformation";
import DriverNotifications from "../components/DriverNotifications";
import axios from "axios";

export default function DriverDashboard() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [respondingTo, setRespondingTo] = useState(null);
  const [availableRides, setAvailableRides] = useState([]);
  const [activeRides, setActiveRides] = useState([]);
  const [isOnline, setIsOnline] = useState(false);
  const [onlineLoading, setOnlineLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState('available'); // 'available', 'active', 'history'
  const [notificationSound, setNotificationSound] = useState(true);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [incomingCount, setIncomingCount] = useState(0);
  const [driverStats, setDriverStats] = useState({
    totalTrips: 0,
    totalEarnings: 0,
    totalDistance: 0,
    averageRating: 0,
    carbonSaved: 0
  });
  
  // Route selection states
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [driverRoute, setDriverRoute] = useState(null);
  const [routeOrigin, setRouteOrigin] = useState('');
  const [routeDestination, setRouteDestination] = useState('');
  const [routePrice, setRoutePrice] = useState('');
  const [routeLoading, setRouteLoading] = useState(false);
  const [originSuggestions, setOriginSuggestions] = useState([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const [selectedOrigin, setSelectedOrigin] = useState(null);
  const [selectedDestination, setSelectedDestination] = useState(null);

  // --- Helpers ---
  const fetchNearbyUsers = async () => {
    if (!user?._id) return;
    try {
      setLoadingUsers(true);
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(
        `https://green-route-3.onrender.com/api/trips/nearby-users/${user._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNearbyUsers(response.data.nearbyUsers || []);
    } catch (error) {
      console.error("Error fetching nearby users:", error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadDriverData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(
        `https://green-route-3.onrender.com/api/trips/driver/status/${user._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const stats = response.data.driver.stats;
      setDriverStats(stats);
    } catch (error) {
      console.error("Error loading driver data:", error);
      setDriverStats({
        totalTrips: 0,
        totalEarnings: 0,
        totalDistance: 0,
        averageRating: 5,
        carbonSaved: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleOnlineStatus = async () => {
    // If going online, check if driver has set their route
    if (!isOnline && !driverRoute) {
      setShowRouteModal(true);
      return;
    }
    
    try {
      setOnlineLoading(true);
      const token = localStorage.getItem('accessToken');
      const newStatus = !isOnline;
      
      // Get current location from geolocation API
      let coordinates = { lat: 0, lng: 0 };
      if (navigator.geolocation) {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
          });
          coordinates = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
        } catch (geoError) {
          alert('Could not get your location. Please enable geolocation permissions.');
          setOnlineLoading(false);
          return;
        }
      }
      
      const location = {
        coordinates,
        address: 'Current Location'
      };
      
      await axios.post(
        `https://green-route-3.onrender.com/api/trips/driver/set-online`,
        { 
          isOnline: newStatus, 
          location,
          route: newStatus ? driverRoute : null // Send route when going online
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsOnline(newStatus);
      // Persist online state and route locally for refresh resilience
      if (newStatus) {
        localStorage.setItem('driverOnline', 'true');
        if (driverRoute) {
          localStorage.setItem('driverRoute', JSON.stringify(driverRoute));
        }
      } else {
        localStorage.removeItem('driverOnline');
        localStorage.removeItem('driverRoute');
      }
      if (newStatus && notificationSound) playNotificationSound();
      
      // Clear route when going offline
      if (!newStatus) {
        setDriverRoute(null);
      }
    } catch (error) {
      alert('Error updating online status: ' + error.message);
    } finally {
      setOnlineLoading(false);
    }
  };

  const playNotificationSound = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const fetchAvailableRides = async () => {
    if (!isOnline) return;
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(
        `https://green-route-3.onrender.com/api/trips/driver/available-rides?radius=10`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAvailableRides(response.data.availableRides || []);
    } catch (error) {
      console.error("Error fetching available rides:", error);
    }
  };

  const fetchIncomingRequests = async () => {
    if (!isOnline) return;
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(
        `https://green-route-3.onrender.com/api/trips/driver/incoming-requests`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const requests = response.data.incomingRequests || [];
      const prevCount = incomingCount;
      setIncomingRequests(requests);
      setIncomingCount(requests.length);
      
      // Play notification if new requests arrived
      if (requests.length > prevCount && notificationSound) {
        playNotificationSound();
      }
    } catch (error) {
      console.error("Error fetching incoming requests:", error);
    }
  };

  const handleAcceptRide = async (tripId) => {
    try {
      setRespondingTo(tripId);
      const token = localStorage.getItem('accessToken');
      await axios.post(
        `https://green-route-3.onrender.com/api/trips/driver/accept-ride/${tripId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (notificationSound) playNotificationSound();
      alert('✅ Ride accepted! Redirecting to live tracking...');
      // Auto-redirect to live tracking after 1 second
      setTimeout(() => {
        navigate(`/live-tracking/${tripId}`);
      }, 1000);
    } catch (error) {
      alert('Error accepting ride: ' + error.message);
    } finally {
      setRespondingTo(null);
    }
  };

  const handleRejectRide = async (tripId) => {
    try {
      setRespondingTo(tripId);
      const token = localStorage.getItem('accessToken');
      await axios.post(
        `https://green-route-3.onrender.com/api/trips/driver/reject-ride/${tripId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAvailableRides(prev => prev.filter(r => r.tripId !== tripId));
    } catch (error) {
      alert('Error rejecting ride: ' + error.message);
    } finally {
      setRespondingTo(null);
    }
  };

  // Geocode location using OpenStreetMap Nominatim
  const geocodeLocation = async (locationName) => {
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationName)}&limit=1`
      );
      if (response.data && response.data.length > 0) {
        const { lat, lon, display_name } = response.data[0];
        return {
          name: display_name,
          coordinates: { lat: parseFloat(lat), lng: parseFloat(lon) }
        };
      }
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  };

  // Fetch place suggestions (OpenStreetMap Nominatim) with debounce in effects
  const fetchSuggestions = async (query) => {
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`
      );
      return (response.data || []).map(item => ({
        label: item.display_name,
        coordinates: { lat: parseFloat(item.lat), lng: parseFloat(item.lon) }
      }));
    } catch (e) {
      return [];
    }
  };

  useEffect(() => {
    const t = setTimeout(async () => {
      if (routeOrigin && routeOrigin.length >= 3) {
        const list = await fetchSuggestions(routeOrigin);
        setOriginSuggestions(list);
        setSelectedOrigin(null);
      } else {
        setOriginSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [routeOrigin]);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (routeDestination && routeDestination.length >= 3) {
        const list = await fetchSuggestions(routeDestination);
        setDestinationSuggestions(list);
        setSelectedDestination(null);
      } else {
        setDestinationSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [routeDestination]);

  const handleSetRoute = async () => {
    if (!routeOrigin || !routeDestination || !routePrice) {
      alert('Please enter origin, destination, and price per ride');
      return;
    }
    
    if (!selectedOrigin || !selectedDestination) {
      alert('Please select from the suggestions provided');
      return;
    }
    
    const price = parseFloat(routePrice);
    if (isNaN(price) || price <= 0) {
      alert('Please enter a valid price');
      return;
    }
    
    setRouteLoading(true);
    try {
      // Use selected coordinates from suggestions
      const origin = selectedOrigin;
      const destination = selectedDestination;
      
      if (!origin || !destination) {
        alert('Could not find one or both locations. Please try again.');
        setRouteLoading(false);
        return;
      }
      
      const route = {
        origin,
        destination,
        price: parseFloat(routePrice),
        waypoints: []
      };
      
      setDriverRoute(route);
      setShowRouteModal(false);
      setRouteLoading(false);
      
      // Now toggle online with the route
      toggleOnlineStatus();
    } catch (error) {
      alert('Error setting route: ' + error.message);
      setRouteLoading(false);
    }
  };

  // Restore online status and route from localStorage on mount
  useEffect(() => {
    const restoreState = async () => {
      try {
        const storedRoute = localStorage.getItem('driverRoute');
        const storedOnline = localStorage.getItem('driverOnline') === 'true';
        if (storedRoute) {
          try {
            const parsed = JSON.parse(storedRoute);
            setDriverRoute(parsed);
          } catch (e) {
            // Invalid JSON, clear
            localStorage.removeItem('driverRoute');
          }
        }
        if (storedOnline) {
          // Re-assert online status on backend
          const token = localStorage.getItem('accessToken');
          const location = {
            coordinates: { lat: 19.0760, lng: 72.8777 },
            address: 'Current Location'
          };
          const body = {
            isOnline: true,
            location,
            route: storedRoute ? JSON.parse(storedRoute) : null
          };
          await axios.post(
            `https://green-route-3.onrender.com/api/trips/driver/set-online`,
            body,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setIsOnline(true);
        }
      } catch (err) {
        console.warn('Restore state failed', err);
      }
    };
    restoreState();
  }, []);

  const updateDriverLocation = async (coordinates) => {
    try {
      const token = localStorage.getItem('accessToken');
      await axios.post(
        `https://green-route-3.onrender.com/api/trips/driver/update-location`,
        { 
          coordinates,
          address: 'Current Location'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.warn('Failed to update driver location:', error);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || user?.userType !== 'driver') {
      navigate('/login');
      return;
    }

    loadDriverData();
    fetchNearbyUsers();
    fetchAvailableRides();
    fetchIncomingRequests();

    // Get initial geolocation if online
    if (isOnline && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          updateDriverLocation({ lat: latitude, lng: longitude });
        },
        (error) => console.warn('Geolocation error:', error)
      );
    }

    const nearbyInterval = setInterval(fetchNearbyUsers, 30000);
    const rideInterval = setInterval(() => {
      if (isOnline) {
        fetchAvailableRides();
        fetchIncomingRequests();
        // Update geolocation every 5 seconds when online
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords;
              updateDriverLocation({ lat: latitude, lng: longitude });
            },
            (error) => console.warn('Geolocation error:', error)
          );
        }
      }
    }, 3000); // Check for incoming requests every 3 seconds

    return () => {
      clearInterval(nearbyInterval);
      clearInterval(rideInterval);
    };
  }, [isAuthenticated, user, navigate, isOnline]);

  // Set driver offline on tab close/navigation with keepalive fetch
  useEffect(() => {
    const setOffline = () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) return;
        const url = 'https://green-route-3.onrender.com/api/trips/driver/set-online';
        const payload = JSON.stringify({ isOnline: false });
        fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: payload,
          keepalive: true
        });
        localStorage.removeItem('driverOnline');
      } catch (e) {
        // best-effort
      }
    };
    // Use pagehide for better reliability across browsers
    window.addEventListener('pagehide', setOffline);
    window.addEventListener('beforeunload', setOffline);
    return () => {
      window.removeEventListener('pagehide', setOffline);
      window.removeEventListener('beforeunload', setOffline);
    };
  }, []);

  if (loading) {
    return <LoadingSpinner message="Loading your driver dashboard..." />;
  }

  return (
    <div
      className="page-container"
      style={{
        maxWidth: "1400px",
        margin: "0 auto",
        padding: "1.5rem",
        width: "100%"
      }}
    >
      {/* Driver Notifications for Trip Cancellations */}
      {user?._id && <DriverNotifications driverId={user._id} />}
      
      {/* Route Selection Modal */}
      {showRouteModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '12px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
          }}>
            <h2 style={{ marginTop: 0, color: '#27ae60' }}>🗺️ Set Your Route</h2>
            <p style={{ color: '#555', marginBottom: '1.5rem' }}>
              You'll only receive ride requests that match your route
            </p>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#333' }}>
                📍 Starting Point
              </label>
              <input
                type="text"
                value={routeOrigin}
                onChange={(e) => setRouteOrigin(e.target.value)}
                placeholder="e.g., Andheri, Mumbai"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              />
              {originSuggestions.length > 0 && (
                <div style={{
                  marginTop: '0.5rem',
                  border: '1px solid #eee',
                  borderRadius: '8px',
                  maxHeight: '160px',
                  overflowY: 'auto',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                }}>
                  {originSuggestions.map((s, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setRouteOrigin(s.label);
                        setSelectedOrigin({ name: s.label, coordinates: s.coordinates });
                        setOriginSuggestions([]);
                      }}
                      style={{
                        padding: '0.5rem 0.75rem',
                        cursor: 'pointer',
                        borderBottom: '1px solid #f5f5f5',
                        background: 'white'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                    >
                      <span style={{ fontSize: '0.9rem', color: '#2c3e50' }}>{s.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#333' }}>
                🎯 Destination
              </label>
              <input
                type="text"
                value={routeDestination}
                onChange={(e) => setRouteDestination(e.target.value)}
                placeholder="e.g., Bandra, Mumbai"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              />
              {destinationSuggestions.length > 0 && (
                <div style={{
                  marginTop: '0.5rem',
                  border: '1px solid #eee',
                  borderRadius: '8px',
                  maxHeight: '160px',
                  overflowY: 'auto',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                }}>
                  {destinationSuggestions.map((s, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setRouteDestination(s.label);
                        setSelectedDestination({ name: s.label, coordinates: s.coordinates });
                        setDestinationSuggestions([]);
                      }}
                      style={{
                        padding: '0.5rem 0.75rem',
                        cursor: 'pointer',
                        borderBottom: '1px solid #f5f5f5',
                        background: 'white'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                    >
                      <span style={{ fontSize: '0.9rem', color: '#2c3e50' }}>{s.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#333' }}>
                💰 Price per Ride (₹)
              </label>
              <input
                type="number"
                value={routePrice}
                onChange={(e) => setRoutePrice(e.target.value)}
                placeholder="e.g., 150"
                min="1"
                step="10"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              />
            </div>
            
            <div style={{ 
              background: '#e8f5e9', 
              padding: '1rem', 
              borderRadius: '8px', 
              marginBottom: '1.5rem',
              border: '1px solid #c8e6c9'
            }}>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#2e7d32' }}>
                ℹ️ You'll be matched with riders whose routes align with yours (within ~2km deviation)
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setShowRouteModal(false)}
                disabled={routeLoading}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  border: '2px solid #ddd',
                  borderRadius: '8px',
                  background: 'white',
                  color: '#666',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSetRoute}
                disabled={routeLoading}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  border: 'none',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #27ae60, #2ecc71)',
                  color: 'white',
                  fontSize: '1rem',
                  cursor: routeLoading ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                  opacity: routeLoading ? 0.6 : 1
                }}
              >
                {routeLoading ? '⏳ Setting Route...' : '✅ Set Route & Go Online'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div style={{ 
        background: "linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)", 
        color: "white", 
        padding: "2rem", 
        borderRadius: "12px", 
        marginBottom: "2rem",
        textAlign: "center"
      }}>
        <h1>🚗 Driver Dashboard</h1>
        <p style={{ margin: "0.5rem 0 0 0", fontSize: "1.1rem", opacity: 0.9 }}>
          Welcome back, {user?.name || user?.email}!
        </p>
      </div>

      {/* Online Status Toggle */}
      <div style={{ 
        background: "white", 
        padding: "1.5rem", 
        borderRadius: "12px", 
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        marginBottom: "2rem"
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: driverRoute ? "1rem" : 0
        }}>
          <div>
            <h3 style={{ margin: 0, color: "#2c3e50", fontSize: "1.1rem" }}>
              {isOnline ? "🟢 Online" : "⚫ Offline"}
            </h3>
            <p style={{ margin: "0.5rem 0 0 0", color: "#7f8c8d", fontSize: "0.9rem" }}>
              {isOnline ? "You're receiving ride requests" : "You're not receiving requests"}
            </p>
          </div>
          <button
            onClick={toggleOnlineStatus}
            disabled={onlineLoading}
            style={{
              background: isOnline ? "#e74c3c" : "#27ae60",
              color: "white",
              border: "none",
              padding: "0.75rem 2rem",
              borderRadius: "8px",
              cursor: onlineLoading ? "not-allowed" : "pointer",
              fontSize: "1rem",
            fontWeight: "600",
            opacity: onlineLoading ? 0.6 : 1,
            transition: "all 0.3s ease"
          }}
        >
          {onlineLoading ? "Updating..." : (isOnline ? "Go Offline" : "Go Online")}
        </button>
        </div>
        
        {/* Display current route if set */}
        {driverRoute && (
          <div style={{
            background: '#e8f5e9',
            padding: '1rem',
            borderRadius: '8px',
            border: '2px solid #27ae60',
            marginTop: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.2rem', marginRight: '0.5rem' }}>🗺️</span>
              <strong style={{ color: '#2e7d32' }}>Your Active Route</strong>
            </div>
            <div style={{ fontSize: '0.9rem', color: '#555' }}>
              <div style={{ marginBottom: '0.25rem' }}>
                📍 <strong>From:</strong> {driverRoute.origin.name}
              </div>
              <div>
                🎯 <strong>To:</strong> {driverRoute.destination.name}
              </div>
            </div>
            {isOnline && (
              <button
                onClick={() => {
                  setDriverRoute(null);
                  setShowRouteModal(true);
                  setIsOnline(false);
                }}
                style={{
                  marginTop: '0.75rem',
                  padding: '0.5rem 1rem',
                  background: 'white',
                  border: '2px solid #27ae60',
                  borderRadius: '6px',
                  color: '#27ae60',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                📝 Change Route
              </button>
            )}
          </div>
        )}
      </div>

      {/* Dashboard Header with Badge */}
      <div style={{
        marginBottom: "2rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "1rem"
      }}>
        <div>
          <h2 style={{
            margin: 0,
            fontSize: "2.2rem",
            fontWeight: 900,
            color: "#0f172a",
            backgroundImage: "linear-gradient(135deg, #10b981 0%, #06b6d4 100%)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}>
            📊 Your Performance
          </h2>
          <p style={{
            margin: "0.5rem 0 0 0",
            color: "#64748b",
            fontSize: "0.95rem",
            fontWeight: 500
          }}>Track your metrics and achievements</p>
        </div>
        <div style={{
          background: "linear-gradient(135deg, #10b981 0%, #06b6d4 100%)",
          padding: "0.75rem 1.5rem",
          borderRadius: "20px",
          color: "white",
          fontWeight: 700,
          fontSize: "0.95rem",
          boxShadow: "0 8px 16px rgba(16, 185, 129, 0.3)"
        }}>
          ✅ Active Duty
        </div>
      </div>

      {/* Premium Driver Stats */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", 
        gap: "1.5rem", 
        marginBottom: "2.5rem" 
      }}>
        {/* Trips Card */}
        <div className="premium-card" style={{
          background: "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)",
          border: "2px solid #10b981",
          textAlign: "center",
          position: "relative",
          overflow: "hidden"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-8px) scale(1.02)";
          e.currentTarget.style.boxShadow = "0 20px 40px rgba(16, 185, 129, 0.2)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "none";
          e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.08)";
        }}
        >
          <div style={{
            position: "absolute",
            top: "8px",
            right: "8px",
            background: "#10b981",
            color: "white",
            padding: "0.35rem 0.75rem",
            borderRadius: "12px",
            fontSize: "0.75rem",
            fontWeight: 700,
            boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)"
          }}>🏆 PRO</div>
          <div style={{ fontSize: "3.5rem", marginBottom: "1rem", animation: "pulse 2s infinite" }}>🚗</div>
          <h3 style={{ margin: "0 0 0.75rem 0", color: "#10b981", fontSize: "2.5rem", fontWeight: 800 }}>{driverStats.totalTrips}</h3>
          <p style={{ margin: 0, color: "#475569", fontSize: "1rem", fontWeight: 600 }}>Total Trips</p>
          <div style={{ marginTop: "0.75rem", fontSize: "0.8rem", color: "#64748b" }}>Completed rides</div>
        </div>

        {/* Earnings Card */}
        <div className="premium-card" style={{
          background: "linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)",
          border: "2px solid #f97316",
          textAlign: "center"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-8px) scale(1.02)";
          e.currentTarget.style.boxShadow = "0 20px 40px rgba(249, 115, 22, 0.2)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "none";
          e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.08)";
        }}
        >
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>💰</div>
          <h3 style={{ margin: "0 0 0.75rem 0", background: "linear-gradient(135deg, #f97316 0%, #ec4899 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontSize: "2.5rem", fontWeight: 800 }}>₹{driverStats.totalEarnings}</h3>
          <p style={{ margin: 0, color: "#475569", fontSize: "1rem", fontWeight: 600 }}>Total Earnings</p>
          <div style={{ marginTop: "0.75rem", fontSize: "0.8rem", color: "#64748b" }}>Revenue earned</div>
        </div>

        {/* Distance Card */}
        <div className="premium-card" style={{
          background: "linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)",
          border: "2px solid #3b82f6",
          textAlign: "center"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-8px) scale(1.02)";
          e.currentTarget.style.boxShadow = "0 20px 40px rgba(59, 130, 246, 0.2)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "none";
          e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.08)";
        }}
        >
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📏</div>
          <h3 style={{ margin: "0 0 0.75rem 0", color: "#3b82f6", fontSize: "2.5rem", fontWeight: 800 }}>{driverStats.totalDistance}</h3>
          <p style={{ margin: 0, color: "#475569", fontSize: "1rem", fontWeight: 600 }}>Distance (km)</p>
          <div style={{ marginTop: "0.75rem", fontSize: "0.8rem", color: "#64748b" }}>Miles traveled</div>
        </div>

        {/* Rating Card */}
        <div className="premium-card" style={{
          background: "linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(234, 179, 8, 0.1) 100%)",
          border: "2px solid #f59e0b",
          textAlign: "center"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-8px) scale(1.02)";
          e.currentTarget.style.boxShadow = "0 20px 40px rgba(245, 158, 11, 0.2)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "none";
          e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.08)";
        }}
        >
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⭐</div>
          <h3 style={{ margin: "0 0 0.75rem 0", color: "#f59e0b", fontSize: "2.5rem", fontWeight: 800 }}>{driverStats.averageRating}/5</h3>
          <p style={{ margin: 0, color: "#475569", fontSize: "1rem", fontWeight: 600 }}>Rating</p>
          <div style={{ marginTop: "0.75rem", fontSize: "0.8rem", color: "#64748b" }}>User satisfaction</div>
        </div>

        {/* Carbon Saved Card */}
        <div className="premium-card" style={{
          background: "linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%)",
          border: "2px solid #22c55e",
          textAlign: "center"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-8px) scale(1.02)";
          e.currentTarget.style.boxShadow = "0 20px 40px rgba(34, 197, 94, 0.2)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "none";
          e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.08)";
        }}
        >
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🌱</div>
          <h3 style={{ margin: "0 0 0.75rem 0", color: "#22c55e", fontSize: "2.5rem", fontWeight: 800 }}>{driverStats.carbonSaved}</h3>
          <p style={{ margin: 0, color: "#475569", fontSize: "1rem", fontWeight: 600 }}>CO₂ Saved (kg)</p>
          <div style={{ marginTop: "0.75rem", fontSize: "0.8rem", color: "#64748b" }}>Environmental impact</div>
        </div>
      </div>

      {/* Premium Quick Actions */}
      <div className="premium-card" style={{ 
        marginBottom: "2rem",
        background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
        borderTop: "3px solid #10b981"
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "2rem",
          paddingBottom: "1.5rem",
          borderBottom: "2px solid #e2e8f0"
        }}>
          <div>
            <h3 style={{ margin: 0, color: "#0f172a", fontSize: "1.5rem", fontWeight: 800 }}>⚡ Quick Actions</h3>
            <p style={{ margin: "0.5rem 0 0 0", color: "#64748b", fontSize: "0.85rem" }}>Get started with your next ride</p>
          </div>
          <div style={{
            background: "linear-gradient(135deg, #10b981 0%, #06b6d4 100%)",
            width: "45px",
            height: "45px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.5rem",
            boxShadow: "0 8px 16px rgba(16, 185, 129, 0.3)"
          }}>⚙️</div>
        </div>
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", 
          gap: "1.25rem" 
        }}>
          <button 
            onClick={() => navigate('/navigation')}
            className="btn-premium-primary"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              justifyContent: "center",
              fontSize: "1rem",
              padding: "1.25rem 1.5rem"
            }}
          >
            <span style={{ fontSize: "1.5rem" }}>🗺️</span>
            Plan New Route
          </button>

          <button 
            onClick={() => navigate('/profile')}
            style={{
              background: "linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)",
              color: "white",
              border: "none",
              padding: "1rem 1.5rem",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "1rem",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              justifyContent: "center"
            }}
          >
            <span>👤</span>
            View Profile
          </button>

          <button 
            onClick={() => alert('Trip history feature coming soon!')}
            style={{
              background: "linear-gradient(135deg, #e67e22 0%, #d35400 100%)",
              color: "white",
              border: "none",
              padding: "1rem 1.5rem",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "1rem",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              justifyContent: "center"
            }}
          >
            <span>📋</span>
            Trip History
          </button>

          <button 
            onClick={() => alert('Earnings report feature coming soon!')}
            style={{
              background: "linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)",
              color: "white",
              border: "none",
              padding: "1rem 1.5rem",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "1rem",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              justifyContent: "center"
            }}
          >
            <span>📊</span>
            Earnings Report
          </button>
        </div>
      </div>

      {/* Ride Management Tabs */}
      <div style={{ 
        background: "white", 
        padding: "2rem", 
        borderRadius: "12px", 
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
      }}>
        <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
          {['incoming', 'available', 'active', 'vehicle', 'history'].map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              style={{
                border: "none",
                padding: "0.75rem 1.5rem",
                borderRadius: "8px",
                cursor: "pointer",
                background: selectedTab === tab ? "#3498db" : "#ecf0f1",
                color: selectedTab === tab ? "white" : "#2c3e50",
                fontWeight: 600,
                minWidth: "110px",
                position: 'relative'
              }}
            >
              {tab === 'incoming' && (
                <>
                  🔔 Incoming
                  {incomingCount > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '-5px',
                      right: '-5px',
                      background: '#e74c3c',
                      color: 'white',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 'bold'
                    }}>
                      {incomingCount}
                    </span>
                  )}
                </>
              )}
              {tab === 'available' && '🔔 Available'}
              {tab === 'active' && '🚘 Active'}
              {tab === 'vehicle' && '🚙 Vehicle'}
              {tab === 'history' && '📜 History'}
            </button>
          ))}
          <div style={{ marginLeft: "auto" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem", color: "#2c3e50" }}>
              <input 
                type="checkbox" 
                checked={notificationSound}
                onChange={(e) => setNotificationSound(e.target.checked)}
              />
              Sound alerts
            </label>
          </div>
        </div>

        {selectedTab === 'incoming' && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ margin: 0, color: "#2c3e50" }}>�️ Matching Your Route ({incomingRequests.length})</h3>
              <button
                onClick={fetchIncomingRequests}
                disabled={!isOnline || !driverRoute}
                style={{
                  background: (isOnline && driverRoute) ? "#27ae60" : "#bdc3c7",
                  color: "white",
                  border: "none",
                  padding: "0.5rem 1rem",
                  borderRadius: "6px",
                  cursor: (isOnline && driverRoute) ? "pointer" : "not-allowed",
                  fontSize: "0.9rem"
                }}
              >
                🔄 Refresh Now
              </button>
            </div>

            {!driverRoute && (
              <div style={{ background: "#fef3c7", border: "1px solid #fde68a", color: "#92400e", padding: "1rem", borderRadius: "8px", marginBottom: "1rem" }}>
                ⚠️ Please set your route to receive ride requests matching your destination.
              </div>
            )}
            
            {!isOnline && driverRoute && (
              <div style={{ background: "#fef3c7", border: "1px solid #fde68a", color: "#92400e", padding: "1rem", borderRadius: "8px", marginBottom: "1rem" }}>
                ⚠️ Go online to receive real-time notifications from users whose routes match yours.
              </div>
            )}

            {isOnline && driverRoute && incomingRequests.length === 0 && (
              <div style={{ 
                color: "#7f8c8d", 
                textAlign: "center", 
                padding: "3rem 2rem",
                background: "linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(6, 182, 212, 0.05) 100%)",
                borderRadius: "12px",
                border: "2px dashed #06b6d4"
              }}>
                <div style={{ fontSize: "4rem", marginBottom: "1.5rem", animation: "pulse 2s infinite" }}>🗺️</div>
                <p style={{ fontSize: "1.1rem", fontWeight: 600, color: "#0f172a", margin: "0 0 0.5rem 0" }}>No matching ride requests yet</p>
                <p style={{ fontSize: "0.95rem", color: "#64748b", margin: 0 }}>You will be notified instantly when a user posts a ride matching your route. Stay online and watch for opportunities!</p>
              </div>
            )}

            {isOnline && driverRoute && incomingRequests.length > 0 && (
              <div
                style={{
                  display: "grid",
                  gap: "1.25rem",
                  gridTemplateColumns: "repeat(auto-fit, minmax(520px, 1fr))",
                  alignItems: "stretch"
                }}
              >
                {incomingRequests.map((request) => (
                  <div key={request.tripId} className="ride-request-premium">
                    <div className="ride-request-left">
                      <div className="ride-request-header">
                        <div className="rider-profile">
                          <div className="rider-avatar">{request.userName.charAt(0).toUpperCase()}</div>
                          <div>
                            <div className="rider-name">{request.userName}</div>
                            <div className="rider-contact">{request.userEmail}</div>
                            {request.userPhone && (
                              <div className="rider-contact">📞 {request.userPhone}</div>
                            )}
                          </div>
                        </div>
                        <span className="match-badge">
                          {request.routeMatchScore ? `${Math.round(request.routeMatchScore)}% Match` : 'Route Match'}
                        </span>
                      </div>

                      <div className="route-details">
                        <div className="route-point">
                          <div className="route-label">📍 Pickup</div>
                          <div className="route-location">{request.origin}</div>
                          {request.originDeviation !== undefined && (
                            <div className="route-deviation">~{request.originDeviation.toFixed(1)} km from your start</div>
                          )}
                        </div>
                        <div className="route-divider" />
                        <div className="route-point">
                          <div className="route-label">🎯 Dropoff</div>
                          <div className="route-location">{request.destination}</div>
                          {request.destinationDeviation !== undefined && (
                            <div className="route-deviation">~{request.destinationDeviation.toFixed(1)} km from your destination</div>
                          )}
                        </div>
                      </div>

                      <div className="ride-stats">
                        <div className="stat-item">
                          <div className="stat-label">Distance</div>
                          <div className="stat-value">{(request.distance / 1000).toFixed(1)} km</div>
                        </div>
                        <div className="stat-item">
                          <div className="stat-label">Duration</div>
                          <div className="stat-value">{Math.round(request.duration / 60)} mins</div>
                        </div>
                        <div className="stat-item">
                          <div className="stat-label">Emissions</div>
                          <div className="stat-value" style={{ color: '#ef4444' }}>{request.emission?.toFixed(2)} kg CO₂</div>
                        </div>
                        <div className="stat-item">
                          <div className="stat-label">Posted</div>
                          <div className="stat-value" style={{ color: '#22c55e' }}>Now</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="ride-request-actions">
                      <button
                        onClick={() => handleAcceptRide(request.tripId)}
                        disabled={respondingTo === request.tripId}
                        className="btn-premium-primary"
                        style={{ opacity: respondingTo === request.tripId ? 0.6 : 1 }}
                      >
                        {respondingTo === request.tripId ? "Processing..." : "✅ Accept"}
                      </button>
                      <button
                        onClick={() => handleRejectRide(request.tripId)}
                        disabled={respondingTo === request.tripId}
                        className="btn-premium-secondary"
                        style={{ opacity: respondingTo === request.tripId ? 0.6 : 1 }}
                      >
                        Skip
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>

        {selectedTab === 'available' && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ margin: 0, color: "#2c3e50" }}>Available Ride Requests ({availableRides.length})</h3>
              <button
                onClick={fetchAvailableRides}
                disabled={!isOnline}
                style={{
                  background: isOnline ? "#3498db" : "#bdc3c7",
                  color: "white",
                  border: "none",
                  padding: "0.5rem 1rem",
                  borderRadius: "6px",
                  cursor: isOnline ? "pointer" : "not-allowed",
                  fontSize: "0.9rem"
                }}
              >
                🔄 Refresh
              </button>
            </div>

            {!isOnline && (
              <div style={{ background: "#fef3c7", border: "1px solid #fde68a", color: "#92400e", padding: "1rem", borderRadius: "8px", marginBottom: "1rem" }}>
                Go online to start receiving ride requests.
              </div>
            )}

            {isOnline && availableRides.length === 0 && (
              <div style={{ color: "#7f8c8d", textAlign: "center", padding: "2rem" }}>
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>👥</div>
                <p>No ride requests near you right now.</p>
                <p style={{ fontSize: "0.9rem" }}>You will be notified when a new request appears.</p>
              </div>
            )}

            {isOnline && availableRides.length > 0 && (
              <div style={{ display: "grid", gap: "1rem" }}>
                {availableRides.map((ride) => (
                  <div 
                    key={ride.tripId}
                    style={{
                      border: "1px solid #ecf0f1",
                      borderRadius: "8px",
                      padding: "1.25rem",
                      background: "#f8f9fa",
                      display: "grid",
                      gridTemplateColumns: "1fr auto",
                      gap: "1rem",
                      alignItems: "center"
                    }}
                  >
                    <div>
                      <div style={{ marginBottom: "0.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h4 style={{ margin: 0, color: "#2c3e50" }}>👤 {ride.userName}</h4>
                        {ride.distanceFromDriver !== undefined && (
                          <span style={{ fontSize: "0.9rem", color: "#7f8c8d" }}>
                            {ride.distanceFromDriver?.toFixed(2)} km away
                          </span>
                        )}
                      </div>
                      <p style={{ margin: "0.25rem 0", color: "#7f8c8d", fontSize: "0.95rem" }}>📧 {ride.userEmail}</p>
                      {ride.userPhone && (
                        <p style={{ margin: "0.25rem 0", color: "#7f8c8d", fontSize: "0.95rem" }}>📞 {ride.userPhone}</p>
                      )}

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", margin: "0.75rem 0" }}>
                        <div>
                          <p style={{ margin: "0 0 0.25rem 0", fontSize: "0.85rem", color: "#7f8c8d" }}>From</p>
                          <p style={{ margin: 0, fontWeight: 600, color: "#2c3e50" }}>{ride.origin}</p>
                        </div>
                        <div>
                          <p style={{ margin: "0 0 0.25rem 0", fontSize: "0.85rem", color: "#7f8c8d" }}>To</p>
                          <p style={{ margin: 0, fontWeight: 600, color: "#2c3e50" }}>{ride.destination}</p>
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
                        <div>
                          <p style={{ margin: 0, fontSize: "0.8rem", color: "#7f8c8d" }}>Distance</p>
                          <p style={{ margin: 0, fontWeight: 600, color: "#3498db" }}>{(ride.distance / 1000).toFixed(1)} km</p>
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: "0.8rem", color: "#7f8c8d" }}>Duration</p>
                          <p style={{ margin: 0, fontWeight: 600, color: "#8e44ad" }}>{Math.round(ride.duration / 60)} mins</p>
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: "0.8rem", color: "#7f8c8d" }}>Emissions</p>
                          <p style={{ margin: 0, fontWeight: 600, color: "#e74c3c" }}>{ride.emission?.toFixed(2)} kg CO₂</p>
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ display: "flex", gap: "0.75rem", flexDirection: "column", minWidth: "140px" }}>
                      <button
                        onClick={() => handleAcceptRide(ride.tripId)}
                        disabled={respondingTo === ride.tripId}
                        style={{
                          background: "#27ae60",
                          color: "white",
                          border: "none",
                          padding: "0.75rem 1rem",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontWeight: "600",
                          opacity: respondingTo === ride.tripId ? 0.6 : 1,
                          whiteSpace: "nowrap"
                        }}
                      >
                        {respondingTo === ride.tripId ? "Processing..." : "✅ Accept"}
                      </button>
                      <button
                        onClick={() => handleRejectRide(ride.tripId)}
                        disabled={respondingTo === ride.tripId}
                        style={{
                          background: "#e74c3c",
                          color: "white",
                          border: "none",
                          padding: "0.75rem 1rem",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontWeight: "600",
                          opacity: respondingTo === ride.tripId ? 0.6 : 1,
                          whiteSpace: "nowrap"
                        }}
                      >
                        ❌ Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {selectedTab === 'active' && (
          <div style={{ color: "#7f8c8d", textAlign: "center", padding: "2rem" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🚘</div>
            <p>Active rides will appear here after acceptance.</p>
            <p style={{ fontSize: "0.9rem" }}>We will add live navigation soon.</p>
          </div>
        )}

        {selectedTab === 'vehicle' && (
          <VehicleInformation />
        )}

        {selectedTab === 'history' && (
          <div style={{ color: "#7f8c8d", textAlign: "center", padding: "2rem" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📜</div>
            <p>Ride history coming soon.</p>
            <p style={{ fontSize: "0.9rem" }}>We'll include earnings and ratings.</p>
          </div>
        )}
      </div>
    </div>
  );
}
