// frontend/src/services/api.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add authentication token to requests
api.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('userInfo'));
    if (user?.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('userInfo');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/users/login', { email, password }),
  register: (userData) => api.post('/users/register', userData),
  getProfile: () => api.get('/users/me'),
};

// Users API
export const usersAPI = {
  getUsers: (params = {}) => api.get('/admin/users', { params }),
  getUser: (id) => api.get(`/admin/users/${id}`),
  updateUser: (id, userData) => api.put(`/admin/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getUserStats: () => api.get('/admin/users/stats'),
};

// Bookings API
export const bookingsAPI = {
  getBookings: (params = {}) => api.get('/admin/bookings', { params }),
  getBooking: (id) => api.get(`/bookings/${id}`),
  updateBookingStatus: (id, status) => 
    api.put(`/admin/bookings/${id}/status`, { status }),
  assignProvider: (bookingId, providerId) => 
    api.put(`/admin/bookings/${bookingId}/assign-provider`, { providerId }),
};

// Services API
export const servicesAPI = {
  getServices: (params = {}) => api.get('/services', { params }),
  getService: (id) => api.get(`/services/${id}`),
  createService: (serviceData) => api.post('/services', serviceData),
  updateService: (id, serviceData) => api.put(`/services/${id}`, serviceData),
  deleteService: (id) => api.delete(`/services/${id}`),
  getServiceStats: () => api.get('/admin/analytics/services'),
};

// Reports API
export const reportsAPI = {
  getDashboardStats: () => api.get('/admin/stats'),
  getBookingStats: (period = 'week') => api.get(`/reports/stats?period=${period}`),
  getProviderMetrics: () => api.get('/reports/providers'),
  getServiceDistribution: () => api.get('/reports/services/distribution'),
  getBookingTrends: (period = 'week') => api.get(`/reports/trends?period=${period}`),
  getRevenueAnalytics: (params = {}) => api.get('/admin/analytics/revenue', { params }),
};

export default api;