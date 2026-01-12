import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, handleAPIError } from '../api/endpoints.js';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);

  // Initialize auth from localStorage
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const rToken = localStorage.getItem('refreshToken');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        setAccessToken(token);
        setRefreshToken(rToken);
        setIsAuthenticated(true);
        setUser(JSON.parse(userData));
      } catch (err) {
        console.error('Failed to parse user data:', err);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  // Setup token refresh interval
  useEffect(() => {
    if (!accessToken || !refreshToken) return;

    // Check if token is expiring soon and refresh
    const checkAndRefreshToken = async () => {
      try {
        // Refresh tokens before expiry (every 10 minutes)
        await refreshAccessToken();
      } catch (err) {
        console.warn('Token refresh failed:', err);
      }
    };

    const interval = setInterval(checkAndRefreshToken, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, [accessToken, refreshToken]);

  const refreshAccessToken = useCallback(async () => {
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await authAPI.refreshToken(refreshToken);
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      setAccessToken(response.accessToken);
      setRefreshToken(response.refreshToken);
      return response;
    } catch (err) {
      // Refresh failed, logout user
      logout();
      throw err;
    }
  }, [refreshToken]);

  const login = useCallback((userData, token, refreshTok) => {
    localStorage.setItem('accessToken', token);
    localStorage.setItem('refreshToken', refreshTok);
    localStorage.setItem('user', JSON.stringify(userData));
    setAccessToken(token);
    setRefreshToken(refreshTok);
    setIsAuthenticated(true);
    setUser(userData);
    setError(null);
  }, []);

  const logout = useCallback(async () => {
    try {
      if (refreshToken) {
        await authAPI.logout(refreshToken);
      }
    } catch (err) {
      console.warn('Logout API call failed:', err);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setAccessToken(null);
      setRefreshToken(null);
      setIsAuthenticated(false);
      setUser(null);
      setError(null);
    }
  }, [refreshToken]);

  const signup = useCallback(async (name, email, password, userType = 'user', additionalData = {}) => {
    try {
      setError(null);
      const signupPayload = {
        name,
        email,
        password,
        userType
      };

      // Add additional data for drivers (vehicle details, phone number)
      if (additionalData) {
        if (additionalData.phoneNumber) {
          signupPayload.phoneNumber = additionalData.phoneNumber;
        }
        if (userType === 'driver') {
          if (additionalData.vehicleType) {
            signupPayload.vehicleType = additionalData.vehicleType;
          }
          if (additionalData.vehicleDetails) {
            signupPayload.vehicleDetails = additionalData.vehicleDetails;
          }
        }
      }

      const response = await authAPI.signup(signupPayload);
      login(response.user, response.accessToken, response.refreshToken);
      return { success: true, data: response };
    } catch (err) {
      const errorInfo = handleAPIError(err);
      setError(errorInfo.message);
      return { success: false, error: errorInfo };
    }
  }, [login]);

  const loginUser = useCallback(async (email, password) => {
    try {
      setError(null);
      const response = await authAPI.login({ email, password });
      login(response.user, response.accessToken, response.refreshToken);
      return { success: true, data: response };
    } catch (err) {
      const errorInfo = handleAPIError(err);
      setError(errorInfo.message);
      return { success: false, error: errorInfo };
    }
  }, [login]);

  const value = {
    isAuthenticated,
    user,
    login,
    logout,
    signup,
    loginUser,
    loading,
    error,
    accessToken,
    refreshToken,
    refreshAccessToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
