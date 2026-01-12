import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ProfilePage from "./pages/ProfilePage";
import MapPage from "./pages/MapPage";
import NavigationPage from "./pages/NavigationPage";
import DriverDashboard from "./pages/DriverDashboard";
import AnalyticsPage from "./pages/AnalyticsPage";
import LiveTracking from "./pages/LiveTracking";
import Navbar from "./components/NavBar";
import ProtectedRoute from "./components/ProtectedRoute";
import "./styles/modern-ui.css";
import "./styles/premium-rideshare.css";

function AppContent() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '1.2rem',
        color: '#7f8c8d'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <Router>
      <Navbar />
      <Routes>
        <Route 
          path="/" 
          element={isAuthenticated ? <Navigate to="/map" replace /> : <LandingPage />} 
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/map" 
          element={
            <ProtectedRoute>
              <MapPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/navigation" 
          element={
            <ProtectedRoute>
              <NavigationPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/driver-dashboard" 
          element={
            <ProtectedRoute>
              <DriverDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/analytics" 
          element={
            <ProtectedRoute>
              <AnalyticsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/live-tracking/:tripId" 
          element={
            <ProtectedRoute>
              <LiveTracking />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
