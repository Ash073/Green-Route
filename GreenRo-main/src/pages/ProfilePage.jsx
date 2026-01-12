import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { 
  getUserTrips, 
  getCarbonSummary, 
  updateTripStatus, 
  deleteTrip,
  formatDistance,
  formatEmission,
  formatDuration,
  getEnvironmentalInsights,
  getAverageEcoScore
} from "../services/carbonTrackingService";

// Helper function to group trips by mode
const getTripsByMode = (trips) => {
  return trips.reduce((acc, trip) => {
    const mode = trip.selectedRoute?.mode || 'unknown';
    acc[mode] = (acc[mode] || 0) + 1;
    return acc;
  }, {});
};

export default function ProfilePage() {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [carbonSummary, setCarbonSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchUserData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if user has valid ID
      const userId = user?._id || user?.id;
      console.log("User object:", user);
      console.log("User ID for trips fetch:", userId);
      
      if (!userId) {
        console.warn('No user ID available, using mock data');
        setTrips([]);
        setCarbonSummary({
          totalEmissionSavings: 0,
          totalTrips: 0,
          totalDistance: 0,
          averageEcoScore: 0,
          tripsByMode: {}
        });
        setLoading(false);
        return;
      }
      
      const [tripsData, summaryData] = await Promise.all([
        getUserTrips(userId, { limit: 20 }),
        getCarbonSummary(userId)
      ]);
      
      const trips = tripsData.trips || [];
      setTrips(trips);
      
      // Calculate additional summary data from trips
      const calculatedSummary = {
        ...summaryData,
        averageEcoScore: getAverageEcoScore(trips),
        tripsByMode: getTripsByMode(trips)
      };
      
      setCarbonSummary(calculatedSummary);
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Failed to load your data. Please try again.');
      // Set empty data on error
      setTrips([]);
      setCarbonSummary({
        totalEmissionSavings: 0,
        totalTrips: 0,
        totalDistance: 0,
        averageEcoScore: 0,
        tripsByMode: {}
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user?._id, user?.id, fetchUserData]);

  const handleTripStatusUpdate = async (tripId, newStatus) => {
    try {
      await updateTripStatus(tripId, newStatus);
      await fetchUserData(); // Refresh data
    } catch (err) {
      console.error('Error updating trip status:', err);
      alert('Failed to update trip status');
    }
  };

  const handleDeleteTrip = async (tripId) => {
    if (!window.confirm('Are you sure you want to delete this trip?')) return;
    
    try {
      await deleteTrip(tripId);
      await fetchUserData(); // Refresh data
    } catch (err) {
      console.error('Error deleting trip:', err);
      alert('Failed to delete trip');
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <h2>Your Profile</h2>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #27ae60',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }} />
          <p>Loading your carbon footprint data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <h2>Your Profile</h2>
        <div style={{ 
          background: '#fdf2f2', 
          color: '#e74c3c', 
          padding: '1rem', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <p>{error}</p>
          <button onClick={fetchUserData} style={{ 
            background: '#27ae60', 
            color: 'white', 
            border: 'none', 
            padding: '0.5rem 1rem', 
            borderRadius: '8px',
            cursor: 'pointer'
          }}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const insights = carbonSummary ? getEnvironmentalInsights(carbonSummary) : [];

  return (
    <div className="page-container">
      <h2>🌱 Your Carbon Footprint Profile</h2>
      
      {user ? (
        <>
          {/* User Info */}
          <div style={{ 
            background: 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)', 
            color: 'white', 
            padding: '1.5rem', 
            borderRadius: '12px', 
            marginBottom: '2rem',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 0.5rem 0' }}>Welcome, {user.name || user.email}!</h3>
            <p style={{ margin: 0, opacity: 0.9 }}>Track your environmental impact and carbon savings</p>
          </div>

          {/* Tabs */}
          <div style={{ 
            display: 'flex', 
            gap: '1rem', 
            marginBottom: '2rem',
            borderBottom: '2px solid #ecf0f1'
          }}>
            <button 
              onClick={() => setActiveTab('overview')}
              style={{
                background: activeTab === 'overview' ? '#27ae60' : 'transparent',
                color: activeTab === 'overview' ? 'white' : '#2c3e50',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px 8px 0 0',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Overview
            </button>
            <button 
              onClick={() => setActiveTab('trips')}
              style={{
                background: activeTab === 'trips' ? '#27ae60' : 'transparent',
                color: activeTab === 'trips' ? 'white' : '#2c3e50',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px 8px 0 0',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              My Trips ({trips.length})
            </button>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && carbonSummary && (
            <div>
              {/* Carbon Savings Summary */}
              <div style={{ 
                background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)', 
                color: 'white', 
                padding: '2rem', 
                borderRadius: '12px', 
                marginBottom: '2rem',
                textAlign: 'center'
              }}>
                <h3 style={{ margin: '0 0 1rem 0' }}>🌍 Your Environmental Impact</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem' }}>
                      {carbonSummary.totalEmissionSavings.toFixed(2)} kg
                    </h4>
                    <p style={{ margin: 0, opacity: 0.9 }}>CO₂ Saved</p>
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem' }}>
                      {carbonSummary.totalTrips}
                    </h4>
                    <p style={{ margin: 0, opacity: 0.9 }}>Trips Planned</p>
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem' }}>
                      {formatDistance(carbonSummary.totalDistance)}
                    </h4>
                    <p style={{ margin: 0, opacity: 0.9 }}>Total Distance</p>
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem' }}>
                      {carbonSummary.averageEcoScore}/100
                    </h4>
                    <p style={{ margin: 0, opacity: 0.9 }}>Avg Eco-Score</p>
                  </div>
                </div>
              </div>

              {/* Environmental Insights */}
              {insights.length > 0 && (
                <div>
                  <h4 style={{ margin: '0 0 1rem 0', color: '#2c3e50' }}>💡 Environmental Insights</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {insights.map((insight, index) => (
                      <div key={index} style={{ 
                        padding: '1rem', 
                        borderRadius: '8px',
                        background: insight.type === 'success' ? '#d4edda' : 
                                   insight.type === 'warning' ? '#fff3cd' : '#d1ecf1',
                        border: `1px solid ${insight.type === 'success' ? '#c3e6cb' : 
                                         insight.type === 'warning' ? '#ffeaa7' : '#bee5eb'}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem'
                      }}>
                        <span style={{ fontSize: '1.5rem' }}>{insight.icon}</span>
                        <div>
                          <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>{insight.title}</div>
                          <div style={{ color: '#7f8c8d' }}>{insight.message}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Trips Tab */}
          {activeTab === 'trips' && (
            <div>
              {trips.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '3rem', 
                  color: '#7f8c8d',
                  background: '#f8f9fa',
                  borderRadius: '12px'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🗺️</div>
                  <h3>No trips yet</h3>
                  <p>Start planning eco-friendly routes to track your carbon savings!</p>
                  <button 
                    onClick={() => window.location.href = '/navigation'}
                    style={{
                      background: '#27ae60',
                      color: 'white',
                      border: 'none',
                      padding: '1rem 2rem',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      fontWeight: '600',
                      marginTop: '1rem'
                    }}
                  >
                    Plan Your First Trip
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {trips.map((trip, index) => (
                    <div key={trip._id || index} style={{ 
                      background: 'white',
                      border: '1px solid #e9ecef',
                      borderRadius: '12px',
                      padding: '1.5rem',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div>
                          <h4 style={{ margin: '0 0 0.5rem 0', color: '#2c3e50' }}>
                            {trip.origin.name} → {trip.destination.name}
                          </h4>
                          <div style={{ color: '#7f8c8d', fontSize: '0.9rem' }}>
                            {new Date(trip.date).toLocaleDateString()} • {trip.selectedRoute.mode}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <select 
                            value={trip.status}
                            onChange={(e) => handleTripStatusUpdate(trip._id, e.target.value)}
                            style={{
                              padding: '0.25rem 0.5rem',
                              borderRadius: '4px',
                              border: '1px solid #ddd',
                              fontSize: '0.8rem'
                            }}
                          >
                            <option value="planned">Planned</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                          <button 
                            onClick={() => handleDeleteTrip(trip._id)}
                            style={{
                              background: '#e74c3c',
                              color: 'white',
                              border: 'none',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.8rem'
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#27ae60' }}>
                            {formatDistance(trip.selectedRoute.distance)}
                          </div>
                          <div style={{ color: '#7f8c8d', fontSize: '0.8rem' }}>Distance</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#27ae60' }}>
                            {formatDuration(trip.selectedRoute.duration)}
                          </div>
                          <div style={{ color: '#7f8c8d', fontSize: '0.8rem' }}>Duration</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#27ae60' }}>
                            {formatEmission(trip.selectedRoute.emission)}
                          </div>
                          <div style={{ color: '#7f8c8d', fontSize: '0.8rem' }}>Emission</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#27ae60' }}>
                            {trip.selectedRoute.ecoScore}/100
                          </div>
                          <div style={{ color: '#7f8c8d', fontSize: '0.8rem' }}>Eco-Score</div>
                        </div>
                      </div>

                      {trip.emissionSavings.amount > 0 && (
                        <div style={{ 
                          background: '#d4edda', 
                          color: '#155724', 
                          padding: '0.75rem', 
                          borderRadius: '8px',
                          textAlign: 'center',
                          border: '1px solid #c3e6cb'
                        }}>
                          🌱 Saved {formatEmission(trip.emissionSavings.amount)} CO₂ ({trip.emissionSavings.percentage}% less emissions)
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div style={{ 
          textAlign: 'center', 
          padding: '3rem', 
          color: '#7f8c8d',
          background: '#f8f9fa',
          borderRadius: '12px'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔐</div>
          <h3>Please log in to view your profile</h3>
          <p>Track your carbon savings and environmental impact</p>
          <button 
            onClick={() => window.location.href = '/login'}
            style={{
              background: '#27ae60',
              color: 'white',
              border: 'none',
              padding: '1rem 2rem',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
              marginTop: '1rem'
            }}
          >
            Login
          </button>
        </div>
      )}
    </div>
  );
}