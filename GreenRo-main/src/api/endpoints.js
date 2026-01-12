import apiClient from './apiClient.js';

// Authentication endpoints
export const authAPI = {
  // Signup
  signup: async (data) => {
    const response = await apiClient.post('/auth/signup', data);
    return response.data;
  },

  // Login
  login: async (data) => {
    const response = await apiClient.post('/auth/login', data);
    return response.data;
  },

  // Refresh token
  refreshToken: async (refreshToken) => {
    const response = await apiClient.post('/auth/refresh', { refreshToken });
    return response.data;
  },

  // Get current user
  getCurrentUser: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  // Logout
  logout: async (refreshToken) => {
    const response = await apiClient.post('/auth/logout', { refreshToken });
    return response.data;
  },

  // Logout from all devices
  logoutAll: async () => {
    const response = await apiClient.post('/auth/logout-all');
    return response.data;
  }
};

// Trip endpoints
export const tripAPI = {
  // Save a trip
  saveTrip: async (tripData) => {
    const response = await apiClient.post('/trips/save', tripData);
    return response.data;
  },

  // Get user trips
  getUserTrips: async (userId, options = {}) => {
    const params = new URLSearchParams(options);
    const response = await apiClient.get(`/trips/user/${userId}?${params}`);
    return response.data;
  },

  // Get trip by ID
  getTrip: async (tripId) => {
    const response = await apiClient.get(`/trips/${tripId}`);
    return response.data;
  },

  // Update trip
  updateTrip: async (tripId, tripData) => {
    const response = await apiClient.put(`/trips/${tripId}`, tripData);
    return response.data;
  },

  // Update trip status
  updateTripStatus: async (tripId, status) => {
    const response = await apiClient.patch(`/trips/${tripId}/status`, { status });
    return response.data;
  },

  // Delete trip
  deleteTrip: async (tripId) => {
    const response = await apiClient.delete(`/trips/${tripId}`);
    return response.data;
  },

  // Get trip statistics
  getTripStats: async (userId) => {
    const response = await apiClient.get(`/trips/stats/${userId}`);
    return response.data;
  }
};

// Route endpoints
export const routeAPI = {
  // Get routes between origin and destination
  getRoutes: async (origin, destination, mode = 'driving') => {
    const response = await apiClient.get('/routes', {
      params: {
        origin,
        destination,
        mode
      }
    });
    return response.data;
  }
};

// Analytics endpoints
export const analyticsAPI = {
  // Get summary for current user
  getSummary: async () => {
    const response = await apiClient.get('/analytics/summary');
    return response.data;
  },
};

// Health check
export const healthAPI = {
  check: async () => {
    const response = await apiClient.get('/health');
    return response.data;
  }
};

// Error handling helper
export const handleAPIError = (error) => {
  if (error.response) {
    // Server responded with error status
    return {
      status: error.response.status,
      message: error.response.data?.message || 'An error occurred',
      errors: error.response.data?.errors || {}
    };
  } else if (error.request) {
    // Request made but no response received
    return {
      status: null,
      message: 'No response from server. Please check your connection.',
      errors: {}
    };
  } else {
    // Error in request setup
    return {
      status: null,
      message: error.message || 'An error occurred',
      errors: {}
    };
  }
};

// Vehicle endpoints
export const vehicleAPI = {
  // Get vehicle details
  getVehicleDetails: async () => {
    const response = await apiClient.get('/vehicle/details');
    return response.data;
  },

  // Update vehicle details
  updateVehicleDetails: async (data) => {
    const response = await apiClient.put('/vehicle/details', data);
    return response.data;
  },

  // Get verification status
  getVerificationStatus: async () => {
    const response = await apiClient.get('/vehicle/verification-status');
    return response.data;
  },

  // Check document expiry
  checkDocumentExpiry: async () => {
    const response = await apiClient.get('/vehicle/expiry-check');
    return response.data;
  }
};
