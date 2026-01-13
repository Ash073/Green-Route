// NavigationPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Stepper from "../pages/Stepper";
import VehicleSelector from "../components/VehicleSelector";
import DriverMatchNotification from "../components/DriverMatchNotification";
import PostRideRequestModal from "../components/PostRideRequestModal";
import axios from "axios";
import { fetchAlternativeRoutes, calculateEmissionSavings, getEmissionComparison } from "../services/routeService";
import { calculateEmissionWithExternalAPI, calculateEmissionLocally, calculateEmissionSavings as calculateEnhancedSavings, getEmissionComparison as getEnhancedComparison } from "../services/emissionCalculationService";

export default function NavigationPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const steps = ["Input", "Compare Routes", "Confirm"];
  const [step, setStep] = useState(0);

  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [mode, setMode] = useState("driving");
  const [selectedVehicle, setSelectedVehicle] = useState("petrol_medium");

  const [routes, setRoutes] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [shortestRoute, setShortestRoute] = useState(null);
  const [sortBy, setSortBy] = useState("distance"); // distance, duration, emission
  
  const [showPostRideModal, setShowPostRideModal] = useState(false);
  const [savedTripId, setSavedTripId] = useState(null);
  const [isRidePosted, setIsRidePosted] = useState(false);
  
  // Autocomplete suggestions
  const [originSuggestions, setOriginSuggestions] = useState([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [selectedOriginCoords, setSelectedOriginCoords] = useState(null);
  const [selectedDestinationCoords, setSelectedDestinationCoords] = useState(null);

  // Fetch location suggestions from Mapbox Geocoding API
  const fetchLocationSuggestions = async (query, setSuggestions) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    setSuggestionLoading(true);
    try {
      const MAPBOX_TOKEN = "pk.eyJ1IjoieWVzYXN3aW5pMTUwOCIsImEiOiJjbWZjd3l0ZWkwM2FjMmxzYmR1d2liYWsxIn0.hL64DI3xihWFknOwxEa8qA";
      const response = await axios.get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`,
        {
          params: {
            access_token: MAPBOX_TOKEN,
            country: 'IN',
            limit: 5,
            types: 'place,address,region'
          }
        }
      );

      if (response.data.features && response.data.features.length > 0) {
        const suggestions = response.data.features.map(feature => ({
          name: feature.place_name,
          coordinates: { lng: feature.center[0], lat: feature.center[1] },
          id: feature.id
        }));
        setSuggestions(suggestions);
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    } finally {
      setSuggestionLoading(false);
    }
  };

  // Handle origin input with debounce
  const handleOriginChange = (e) => {
    const value = e.target.value;
    setOrigin(value);
    setShowOriginSuggestions(true);
    if (value.length >= 2) {
      fetchLocationSuggestions(value, setOriginSuggestions);
    } else {
      setOriginSuggestions([]);
    }
  };

  // Handle destination input with debounce
  const handleDestinationChange = (e) => {
    const value = e.target.value;
    setDestination(value);
    setShowDestinationSuggestions(true);
    if (value.length >= 2) {
      fetchLocationSuggestions(value, setDestinationSuggestions);
    } else {
      setDestinationSuggestions([]);
    }
  };

  // Select a suggestion
  const selectOriginSuggestion = (suggestion) => {
    setOrigin(suggestion.name);
    setSelectedOriginCoords(suggestion.coordinates);
    setOriginSuggestions([]);
    setShowOriginSuggestions(false);
  };

  const selectDestinationSuggestion = (suggestion) => {
    setDestination(suggestion.name);
    setSelectedDestinationCoords(suggestion.coordinates);
    setDestinationSuggestions([]);
    setShowDestinationSuggestions(false);
  };

  // Calculate eco score based on distance, duration, mode, and vehicle type
  const calculateEcoScore = (distance, duration, mode, vehicleType) => {
    const distanceKm = distance / 1000;
    const durationHours = duration / 3600;
    
    let score = 100;
    
    // Penalize longer distances
    score -= Math.min(distanceKm * 0.5, 30);
    
    // Penalize longer durations
    score -= Math.min(durationHours * 10, 20);
    
    // Vehicle type bonuses/penalties
    const vehicleBonuses = {
      electric: 20,
      hybrid: 15,
      petrol_small: 10,
      diesel_small: 8,
      petrol_medium: 5,
      diesel_medium: 3,
      petrol_large: 0,
      diesel_large: -2,
      electric_scooter: 25,
      petrol_scooter: 12,
      petrol_motorcycle: 8,
      city_bus: 15,
      intercity_bus: 12,
      electric_bus: 20
    };
    
    score += vehicleBonuses[vehicleType] || 0;
    
    // Mode bonuses
    const modeBonuses = {
      walking: 20,
      bicycling: 15,
      transit: 10,
      driving: 0
    };
    
    score += modeBonuses[mode] || 0;
    
    return Math.max(0, Math.min(100, Math.round(score)));
  };

  // Mock data for testing when backend is not available
  const getMockRoutes = () => {
    const baseDistance = Math.random() * 50 + 10; // 10-60 km
    return [
      {
        distance: baseDistance * 1000, // Convert to meters
        duration: (baseDistance * 1.5) * 60, // Convert to seconds
        emission: baseDistance * 0.12, // kg CO2 per km
        ecoScore: Math.floor(Math.random() * 30) + 70, // 70-100
        mode: mode
      },
      {
        distance: (baseDistance + Math.random() * 10) * 1000,
        duration: (baseDistance * 1.8) * 60,
        emission: (baseDistance + 5) * 0.15,
        ecoScore: Math.floor(Math.random() * 25) + 60,
        mode: mode
      },
      {
        distance: (baseDistance + Math.random() * 15) * 1000,
        duration: (baseDistance * 2.2) * 60,
        emission: (baseDistance + 8) * 0.18,
        ecoScore: Math.floor(Math.random() * 20) + 50,
        mode: mode
      }
    ];
  };

  const fetchRoutes = async () => {
    if (!origin || !destination) return alert("Enter origin and destination");
    setLoading(true);
    try {
      console.log("Fetching alternative routes with params:", { origin, destination, mode, selectedVehicle });
      
      // Use the new route service to get real alternative routes
      const routeData = await fetchAlternativeRoutes(origin, destination, mode);
      
      console.log("Route Service Response:", routeData);
      
      if (!routeData.routes || routeData.routes.length === 0) {
        console.warn("No routes found - coordinates may be in unmapped area or invalid");
        alert("No routes found. Please check:\n• Origin and destination are in mapped areas\n• Coordinates are valid\n• Try different locations nearby");
        setLoading(false);
        return;
      }
      
      // Calculate enhanced emissions for each route using external API
      // Use a faster approach: fetch routes first, show them, then calculate emissions in background
      const routesWithEmissions = routeData.routes.map(route => {
        const emissionResult = calculateEmissionLocally(route.distance, mode, selectedVehicle);
        return {
          ...route,
          emission: typeof emissionResult === 'number' ? emissionResult : (emissionResult?.co2e || 0),
          emissionData: typeof emissionResult === 'object' ? emissionResult : null,
          ecoScore: calculateEcoScore(route.distance, route.duration, mode, selectedVehicle)
        };
      });
      
      // Calculate emission savings for all routes
      const routesWithSavings = calculateEnhancedSavings(routesWithEmissions);
      
      // Sort routes by distance to find shortest
      const sortedRoutes = [...routesWithSavings].sort((a, b) => a.distance - b.distance);
      setRoutes(sortedRoutes);
      setShortestRoute(sortedRoutes[0] || null);
      setStep(1);
      
      // Fetch external emission data in the background (non-blocking)
      if (routeData.routes) {
        Promise.all(
          routeData.routes.map(async (route, idx) => {
            const emissionData = await calculateEmissionWithExternalAPI(
              route.distance, 
              mode, 
              selectedVehicle, 
              origin, 
              destination
            );
            
            setRoutes(prevRoutes => {
              const updated = [...prevRoutes];
              if (updated[idx]) {
                updated[idx].emission = typeof emissionData === 'number' ? emissionData : (emissionData?.co2e || updated[idx].emission);
                updated[idx].emissionData = typeof emissionData === 'object' ? emissionData : null;
              }
              return updated;
            });
          })
        ).catch(err => console.warn('Background emission calculation failed:', err));
      }
    } catch (err) {
      console.error("Error fetching routes:", err);
      
      // Fallback to mock data
      console.log("Using fallback mock data");
      const mockRoutes = getMockRoutes();
      const routesWithSavings = calculateEmissionSavings(mockRoutes);
      const sortedRoutes = [...routesWithSavings].sort((a, b) => a.distance - b.distance);
      setRoutes(sortedRoutes);
      setShortestRoute(sortedRoutes[0] || null);
      setStep(1);
      alert("Using demo routes for testing purposes.");
    } finally { 
      setLoading(false); 
    }
  };

  const sortRoutes = (sortType) => {
    setSortBy(sortType);
    const sorted = [...routes].sort((a, b) => {
      switch (sortType) {
        case "distance":
          return a.distance - b.distance;
        case "duration":
          return a.duration - b.duration;
        case "emission":
          return a.emission - b.emission;
        default:
          return 0;
      }
    });
    setRoutes(sorted);
  };

  const confirmRoute = async () => {
    if (!selected) return alert("Select a route first");
    if (!selectedOriginCoords || !selectedDestinationCoords) {
      return alert("Please select origin and destination from the suggestions");
    }
    
    try {
      const token = localStorage.getItem("accessToken");
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      
      console.log("Token:", token ? "exists" : "missing");
      console.log("User:", user);
      
      // Extract userId from user object or decode from JWT token
      let userId = user._id || user.id;
      
      // If userId not in user object, decode from JWT token
      if (!userId && token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          userId = payload.userId;
          console.log("User ID extracted from token:", userId);
        } catch (e) {
          console.warn("Failed to decode token:", e);
        }
      }
      
      console.log("Final User ID:", userId);
      
      if (!token || !userId) {
        console.warn("Authentication check failed - token or userId missing");
        alert("Please log in to save your trip and track your carbon savings!");
        setStep(2); // Allow demo even if not logged in
        return;
      }

      // Calculate emission savings
      const highestEmission = Math.max(...routes.map(r => r.emission));
      const emissionSavings = {
        amount: highestEmission - selected.emission,
        percentage: ((highestEmission - selected.emission) / highestEmission * 100).toFixed(1)
      };

      // Prepare trip data
      const tripData = {
        userId: userId,
        origin: {
          name: origin,
          coordinates: selectedOriginCoords && selectedOriginCoords.lng && selectedOriginCoords.lat ? selectedOriginCoords : null
        },
        destination: {
          name: destination,
          coordinates: selectedDestinationCoords && selectedDestinationCoords.lng && selectedDestinationCoords.lat ? selectedDestinationCoords : null
        },
        selectedRoute: {
          id: selected.id,
          distance: selected.distance,
          duration: selected.duration,
          emission: selected.emission,
          ecoScore: selected.ecoScore,
          mode: selected.mode,
          vehicleType: selectedVehicle,
          profile: selected.profile || selected.mode,
          geometry: selected.geometry || null,
          instructions: selected.instructions || [],
          emissionData: selected.emissionData || null
        },
        alternativeRoutes: routes.filter(r => r.id !== selected.id).map(route => ({
          id: route.id,
          distance: route.distance,
          duration: route.duration,
          emission: route.emission,
          ecoScore: route.ecoScore,
          mode: route.mode,
          profile: route.profile || route.mode
        })),
        emissionSavings: emissionSavings,
        status: 'in-progress'
      };

      console.log("Saving trip:", tripData);

      const response = await axios.post("https://green-route-3.onrender.com/api/trips/save", tripData, { 
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log("✅ Trip saved to database:", response.data);
      const tripId = response.data.trip._id;
      setSavedTripId(tripId);
      alert(`✅ Trip saved successfully! You saved ${emissionSavings.amount.toFixed(3)} kg CO₂ (${emissionSavings.percentage}%). Post a ride request to get matched with drivers.`);
      setStep(2);
    } catch (err) {
      console.error("❌ Error saving trip:", err);
      console.error("Error details:", err.response?.data);
      
      if (err.response?.status === 401) {
        alert("Please log in to save your trip and track your carbon savings!");
      } else if (err.response?.status === 400) {
        alert(`Validation error: ${JSON.stringify(err.response?.data?.message || 'Invalid trip data')}`);
      } else {
        alert("Could not save trip. You can still continue with the demo. Please wait 10 mins for the driver to discover.");
      }
      setStep(2); // Allow demo even if save fails
    }
  };

  // Poll for driver acceptance and auto-redirect
  useEffect(() => {
    if (!isRidePosted || !savedTripId) return;
    
    let interval;
    const token = localStorage.getItem('accessToken');
    
    const pollForAcceptance = async () => {
      try {
        const res = await axios.get(
          `https://green-route-3.onrender.com/api/trips/${savedTripId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        const trip = res.data.trip || res.data;
        
        // Check if driver has matched and accepted
        if (trip.matchedDriverId && trip.driverResponse === 'accepted') {
          // Driver accepted! Notify and redirect
          const driverName = trip.driver?.name || 'Driver';
          alert(`🎉 ${driverName} accepted your ride! Redirecting to live tracking...`);
          
          // Play notification sound
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          oscillator.frequency.value = 1200;
          oscillator.type = 'sine';
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.5);
          
          // Redirect after 1.5 seconds
          setTimeout(() => {
            navigate(`/live-tracking/${savedTripId}`);
          }, 1500);
          
          // Clean up
          setIsRidePosted(false);
        }
      } catch (err) {
        console.warn('Error polling for acceptance:', err);
      }
    };
    
    // Poll every 2 seconds
    interval = setInterval(pollForAcceptance, 2000);
    
    return () => clearInterval(interval);
  }, [isRidePosted, savedTripId, navigate]);

  return (
    <div className="page-container" style={{ maxWidth: "600px" }}>
      <DriverMatchNotification 
        userId={user?._id || user?.id} 
        hasActiveTrip={isRidePosted && !!savedTripId}
      />
      
      <div style={{ marginBottom: "2rem", textAlign: "center" }}>
        <h2 style={{ margin: "0 0 0.5rem 0", background: "linear-gradient(135deg, #10b981 0%, #3b82f6 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>🧭 GreenRoute Navigator</h2>
        <p style={{ color: "#64748b", margin: 0 }}>Plan your eco-friendly journey</p>
      </div>
      
      <Stepper steps={steps} current={step} />

      {step === 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ position: 'relative' }}>
            <label style={{ fontWeight: 600, color: "#1e293b", marginBottom: "0.75rem", display: "block" }}>📍 Where are you starting from?</label>
            <input 
              value={origin} 
              onChange={handleOriginChange}
              onFocus={() => origin && setShowOriginSuggestions(true)}
              onBlur={() => setTimeout(() => setShowOriginSuggestions(false), 200)}
              placeholder="Enter origin location" 
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                border: '2px solid #e2e8f0',
                borderRadius: '12px',
                fontSize: '1rem',
                background: "#f8fafc",
                transition: "all 0.3s",
                outline: "none"
              }}
              onFocus={(e) => { e.target.style.borderColor = "#10b981"; e.target.style.background = "white"; }}
              onBlur={(e) => { e.target.style.borderColor = "#e2e8f0"; e.target.style.background = "#f8fafc"; }}
            />
            {showOriginSuggestions && originSuggestions.length > 0 && (
              <ul style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: 'white',
                border: '1px solid #ddd',
                borderTop: 'none',
                listStyle: 'none',
                margin: 0,
                padding: 0,
                zIndex: 1000,
                maxHeight: '200px',
                overflowY: 'auto'
              }}>
                {originSuggestions.map((suggestion) => (
                  <li
                    key={suggestion.id}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      selectOriginSuggestion(suggestion);
                    }}
                    style={{
                      padding: '0.75rem',
                      cursor: 'pointer',
                      borderBottom: '1px solid #eee',
                      backgroundColor: '#f9f9f9',
                      transition: 'backgroundColor 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f9f9f9'}
                  >
                    📍 {suggestion.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <div style={{ position: 'relative', marginBottom: '1rem' }}>
            <label>Destination</label>
            <input 
              value={destination} 
              onChange={handleDestinationChange}
              onFocus={() => destination && setShowDestinationSuggestions(true)}
              onBlur={() => setTimeout(() => setShowDestinationSuggestions(false), 200)}
              placeholder="e.g. Pune" 
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
            />
            {showDestinationSuggestions && destinationSuggestions.length > 0 && (
              <ul style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: 'white',
                border: '1px solid #ddd',
                borderTop: 'none',
                listStyle: 'none',
                margin: 0,
                padding: 0,
                zIndex: 1000,
                maxHeight: '200px',
                overflowY: 'auto'
              }}>
                {destinationSuggestions.map((suggestion) => (
                  <li
                    key={suggestion.id}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      selectDestinationSuggestion(suggestion);
                    }}
                    style={{
                      padding: '0.75rem',
                      cursor: 'pointer',
                      borderBottom: '1px solid #eee',
                      backgroundColor: '#f9f9f9',
                      transition: 'backgroundColor 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f9f9f9'}
                  >
                    📍 {suggestion.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <label>Mode</label>
          <select value={mode} onChange={e => {
            setMode(e.target.value);
            // Reset vehicle selection when mode changes
            if (e.target.value === 'driving') {
              setSelectedVehicle('petrol_medium');
            } else if (e.target.value === 'motorcycle') {
              setSelectedVehicle('petrol_scooter');
            } else if (e.target.value === 'bus') {
              setSelectedVehicle('city_bus');
            }
          }}>
            <option value="driving">Car</option>
            <option value="motorcycle">Motorcycle</option>
            <option value="bus">Bus</option>
            <option value="transit">Transit</option>
            <option value="bicycling">Bicycle</option>
            <option value="walking">Walking</option>
          </select>
          
          <VehicleSelector 
            mode={mode}
            selectedVehicle={selectedVehicle}
            onVehicleChange={(vehicle) => setSelectedVehicle(vehicle.id)}
          />
          <div style={{ marginTop: 12, display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
            <button onClick={fetchRoutes} disabled={loading}>
              {loading ? "Loading..." : "Find Routes"}
            </button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div>
          <h3>Compare Routes</h3>
          
          {shortestRoute && (
            <div style={{ 
              background: "linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)", 
              color: "white", 
              padding: "1rem", 
              borderRadius: "12px", 
              marginBottom: "1rem",
              textAlign: "center"
            }}>
              <h4>🏆 Shortest Distance Route</h4>
              <p><strong>{(shortestRoute.distance/1000).toFixed(2)} km</strong> • {Math.round(shortestRoute.duration/60)} mins • {(shortestRoute.emission || 0).toFixed(3)} kg CO₂</p>
              <p>EcoScore: {shortestRoute.ecoScore}/100 • Mode: {shortestRoute.mode} • Vehicle: {shortestRoute.vehicleType || 'N/A'}</p>
              {shortestRoute.emissionData && (
                <p style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                  Source: {shortestRoute.emissionData.source} • Method: {shortestRoute.emissionData.calculation_method}
                </p>
              )}
            </div>
          )}

          {routes.length > 1 && (
            <div style={{ 
              background: "linear-gradient(135deg, #3498db 0%, #2980b9 100%)", 
              color: "white", 
              padding: "1rem", 
              borderRadius: "12px", 
              marginBottom: "1rem",
              textAlign: "center"
            }}>
              <h4>🌱 Emission Comparison</h4>
              {(() => {
                const comparison = getEmissionComparison(routes);
                return comparison ? (
                  <div>
                    <p><strong>Most Eco-Friendly:</strong> {(comparison.mostEcoFriendly.emission || 0).toFixed(3)} kg CO₂</p>
                    <p><strong>Least Eco-Friendly:</strong> {(comparison.leastEcoFriendly.emission || 0).toFixed(3)} kg CO₂</p>
                    <p><strong>Potential Savings:</strong> {(comparison.totalSavings || 0).toFixed(3)} kg CO₂ ({comparison.savingsPercent || 0}%)</p>
                  </div>
                ) : null;
              })()}
            </div>
          )}

          <div style={{ marginBottom: "1rem", display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
            <label>Sort by:</label>
            <button 
              onClick={() => sortRoutes("distance")} 
              style={{ 
                background: sortBy === "distance" ? "#27ae60" : "#ecf0f1", 
                color: sortBy === "distance" ? "white" : "#2c3e50",
                padding: "0.5rem 1rem",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer"
              }}
            >
              Distance
            </button>
            <button 
              onClick={() => sortRoutes("duration")} 
              style={{ 
                background: sortBy === "duration" ? "#27ae60" : "#ecf0f1", 
                color: sortBy === "duration" ? "white" : "#2c3e50",
                padding: "0.5rem 1rem",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer"
              }}
            >
              Duration
            </button>
            <button 
              onClick={() => sortRoutes("emission")} 
              style={{ 
                background: sortBy === "emission" ? "#27ae60" : "#ecf0f1", 
                color: sortBy === "emission" ? "white" : "#2c3e50",
                padding: "0.5rem 1rem",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer"
              }}
            >
              Emissions
            </button>
          </div>

          {routes.length === 0 && <p>No routes found</p>}
          <ul>
            {routes.map((r, idx) => {
              const isShortest = r === shortestRoute;
              const isSelected = selected === r;
              return (
                <li key={idx} style={{ 
                  border: isShortest ? "2px solid #27ae60" : isSelected ? "2px solid #3498db" : "1px solid #eee", 
                  padding: "1rem", 
                  marginBottom: "1rem",
                  borderRadius: "12px",
                  background: isShortest ? "#f8fff8" : isSelected ? "#f0f8ff" : "#fafbfc",
                  position: "relative"
                }}>
                  {isShortest && (
                    <div style={{
                      position: "absolute",
                      top: "-8px",
                      right: "1rem",
                      background: "#27ae60",
                      color: "white",
                      padding: "0.25rem 0.75rem",
                      borderRadius: "12px",
                      fontSize: "0.8rem",
                      fontWeight: "bold"
                    }}>
                      SHORTEST
                    </div>
                  )}
                  <div><strong>Route {idx+1}</strong> — Distance: <strong>{(r.distance/1000).toFixed(2)} km</strong>, Duration: {Math.round(r.duration/60)} mins</div>
                  <div>Emissions: <strong>{(r.emission || 0).toFixed(3)} kg CO₂</strong> — EcoScore: <strong>{r.ecoScore}/100</strong> — Mode: <strong>{r.mode}</strong> — Vehicle: <strong>{r.vehicleType || 'N/A'}</strong></div>
                  {r.emissionData && (
                    <div style={{ fontSize: '0.85rem', color: '#7f8c8d', marginTop: '0.25rem' }}>
                      Source: {r.emissionData.source} • Method: {r.emissionData.calculation_method}
                    </div>
                  )}
                  {(r.emissionSavings || 0) > 0 && (
                    <div style={{ color: "#27ae60", fontWeight: "bold", marginTop: "0.5rem" }}>
                      🌱 Saves {(r.emissionSavings || 0).toFixed(3)} kg CO₂ ({r.emissionSavingsPercent || 0}% less emissions)
                    </div>
                  )}
                  {isShortest && (
                    <div style={{ color: "#27ae60", fontWeight: "bold", marginTop: "0.5rem" }}>
                      ⭐ This is the shortest distance route!
                    </div>
                  )}
                  <div style={{ marginTop: "1rem" }}>
                    <button 
                      onClick={() => setSelected(r)}
                      style={{
                        background: isSelected ? "#3498db" : "#27ae60",
                        color: "white",
                        border: "none",
                        padding: "0.5rem 1rem",
                        borderRadius: "8px",
                        cursor: "pointer",
                        marginRight: "0.5rem"
                      }}
                    >
                      {isSelected ? "Selected" : "Select"}
                    </button>
                    <button onClick={() => {
                      setSelected(r);
                      navigate("/map", { state: { origin, destination } });
                    }} style={{
                      background: "transparent",
                      color: "#27ae60",
                      border: "1px solid #27ae60",
                      padding: "0.5rem 1rem",
                      borderRadius: "8px",
                      cursor: "pointer"
                    }}>View on Map</button>
                  </div>
                </li>
              );
            })}
          </ul>

          <div style={{ marginTop: 12 }}>
            <button onClick={() => setStep(0)}>Back</button>
            <button onClick={() => {
              if (!selected) return alert("Select a route to continue");
              confirmRoute();
            }}>Confirm & Save</button>
          </div>

          {/* Map view moved to dedicated Map page; use "View on Map" to open full map experience. */}
        </div>
      )}

      {step === 2 && (
        <div>
          <h3>Route Confirmed! 🎉</h3>
          {selected ? (
            <>
              <div style={{ 
                background: selected === shortestRoute ? "linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)" : "#f8f9fa",
                color: selected === shortestRoute ? "white" : "#2c3e50",
                padding: "1.5rem", 
                borderRadius: "12px", 
                marginBottom: "1rem",
                textAlign: "center"
              }}>
                {selected === shortestRoute ? (
                  <h4>🏆 You selected the SHORTEST DISTANCE route!</h4>
                ) : (
                  <h4>Route Selected</h4>
                )}
                <p><strong>Distance: {(selected.distance/1000).toFixed(2)} km</strong></p>
                <p>Duration: {Math.round(selected.duration/60)} minutes</p>
                <p>Estimated Emissions: {selected.emission.toFixed(3)} kg CO₂</p>
                <p>EcoScore: {selected.ecoScore}</p>
              </div>

              {selected !== shortestRoute && shortestRoute && (
                <div style={{ 
                  background: "#fff3cd", 
                  border: "1px solid #ffeaa7", 
                  padding: "1rem", 
                  borderRadius: "8px", 
                  marginBottom: "1rem" 
                }}>
                  <p><strong>💡 Shortest Distance Available:</strong> {(shortestRoute.distance/1000).toFixed(2)} km</p>
                  <p>You could save <strong>{((selected.distance - shortestRoute.distance)/1000).toFixed(2)} km</strong> by choosing the shortest route!</p>
                </div>
              )}

              <p style={{ color: "#28a745", textAlign: "center" }}>
                🌱 You saved { ( (routes[0]?.emission || selected.emission) - selected.emission ).toFixed(3) } kg CO₂ vs default route
              </p>
            </>
          ) : <p>No route detail available.</p>}
          <div style={{ marginTop: "1.5rem", display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <button 
              onClick={() => { setStep(0); setRoutes([]); setSelected(null); setShortestRoute(null); }}
              style={{
                background: "#ecf0f1",
                color: "#2c3e50",
                border: "none",
                padding: "0.75rem 1.5rem",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "600"
              }}
            >
              New Search
            </button>
            
            {user?.userType === 'user' && (
              <button 
                onClick={() => setShowPostRideModal(true)}
                style={{
                  background: "linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)",
                  color: "white",
                  border: "none",
                  padding: "0.75rem 1.5rem",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "600"
                }}
              >
                📍 Post Ride Request
              </button>
            )}

            {savedTripId && (
              <button 
                onClick={() => { window.location.href = `/live-tracking/${savedTripId}`; }}
                style={{
                  background: "#8e44ad",
                  color: "white",
                  border: "none",
                  padding: "0.75rem 1.5rem",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "600"
                }}
              >
                🚀 Open Live Tracking
              </button>
            )}
            
            <button 
              onClick={() => { window.location.href = "/profile"; }}
              style={{
                background: "#3498db",
                color: "white",
                border: "none",
                padding: "0.75rem 1.5rem",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "600"
              }}
            >
              Go to Profile
            </button>
          </div>
        </div>
      )}

      {showPostRideModal && (
        <PostRideRequestModal 
          tripId={savedTripId}
          onClose={() => {
            setShowPostRideModal(false);
            setStep(0);
            setRoutes([]);
            setSelected(null);
          }}
          onSuccess={(trip) => {
            // Ride request posted! Start polling for driver acceptance
            setShowPostRideModal(false);
            setIsRidePosted(true);
            // Stay on step 2 (confirmation) while waiting for driver
          }}
        />
      )}
    </div>
  );
}
