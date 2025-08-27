import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { 
  usersAPI, 
  bookingsAPI, 
  servicesAPI, 
  reportsAPI 
} from '../services/api';

const AdminContext = createContext();

const initialState = {
  users: {
    data: [],
    loading: false,
    error: null,
    stats: null,
    pagination: {
      page: 1,
      pages: 1,
      total: 0,
    }
  },
  bookings: {
    data: [],
    loading: false,
    error: null,
    filters: {
      status: '',
      startDate: '',
      endDate: '',
    },
    pagination: {
      page: 1,
      pages: 1,
      total: 0,
    }
  },
  services: {
    data: [],
    loading: false,
    error: null,
    stats: null,
  },
  dashboard: {
    stats: null,
    loading: false,
    error: null,
    revenueData: null,
  }
};

function adminReducer(state, action) {
  switch (action.type) {
    // Users
    case 'FETCH_USERS_START':
      return { ...state, users: { ...state.users, loading: true, error: null }};
    case 'FETCH_USERS_SUCCESS':
      return { 
        ...state, 
        users: { 
          ...state.users, 
          loading: false, 
          data: action.payload.users,
          pagination: {
            page: action.payload.page,
            pages: action.payload.pages,
            total: action.payload.total,
          }
        }
      };
    case 'FETCH_USERS_ERROR':
      return { ...state, users: { ...state.users, loading: false, error: action.payload }};
    
    // Dashboard
    case 'FETCH_DASHBOARD_STATS_START':
      return { ...state, dashboard: { ...state.dashboard, loading: true, error: null }};
    case 'FETCH_DASHBOARD_STATS_SUCCESS':
      return { 
        ...state, 
        dashboard: { 
          ...state.dashboard, 
          loading: false, 
          stats: action.payload,
        }
      };
    case 'FETCH_DASHBOARD_STATS_ERROR':
      return { 
        ...state, 
        dashboard: { 
          ...state.dashboard, 
          loading: false, 
          error: action.payload 
        }
      };
    
    // Bookings
    case 'FETCH_BOOKINGS_START':
      return { ...state, bookings: { ...state.bookings, loading: true, error: null }};
    case 'FETCH_BOOKINGS_SUCCESS':
      return { 
        ...state, 
        bookings: { 
          ...state.bookings, 
          loading: false, 
          data: action.payload.bookings,
          pagination: {
            page: action.payload.page,
            pages: action.payload.pages,
            total: action.payload.total,
          }
        }
      };
    case 'FETCH_BOOKINGS_ERROR':
      return { ...state, bookings: { ...state.bookings, loading: false, error: action.payload }};
    
    // Services
    case 'FETCH_SERVICES_START':
      return { ...state, services: { ...state.services, loading: true, error: null }};
    case 'FETCH_SERVICES_SUCCESS':
      return { 
        ...state, 
        services: { 
          ...state.services, 
          loading: false, 
          data: action.payload.services,
          pagination: {
            page: action.payload.page,
            pages: action.payload.pages,
            total: action.payload.total,
          }
        }
      };
    case 'FETCH_SERVICES_ERROR':
      return { ...state, services: { ...state.services, loading: false, error: action.payload }};
    
    default:
      return state;
  }
}

export const AdminProvider = ({ children }) => {
  const [state, dispatch] = useReducer(adminReducer, initialState);

  // Users
  const fetchUsers = async (params = {}) => {
    try {
      dispatch({ type: 'FETCH_USERS_START' });
      const response = await usersAPI.getUsers(params);
      
      // Ensure we have a valid response with array data
      const users = Array.isArray(response?.data?.users) 
        ? response.data.users 
        : Array.isArray(response?.users) 
          ? response.users 
          : [];
          
      const page = response?.page || 1;
      const pages = response?.pages || 1;
      const total = response?.total || 0;
      
      dispatch({ 
        type: 'FETCH_USERS_SUCCESS', 
        payload: { 
          users,
          page,
          pages,
          total 
        } 
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      dispatch({ 
        type: 'FETCH_USERS_ERROR', 
        payload: error.response?.data?.message || error.message || 'Failed to load users' 
      });
    }
  };

  // Dashboard
  const fetchDashboardStats = async () => {
    try {
      dispatch({ type: 'FETCH_DASHBOARD_STATS_START' });
      const stats = await reportsAPI.getDashboardStats();
      dispatch({ 
        type: 'FETCH_DASHBOARD_STATS_SUCCESS', 
        payload: stats 
      });
    } catch (error) {
      dispatch({ 
        type: 'FETCH_DASHBOARD_STATS_ERROR', 
        payload: error.response?.data?.message || error.message 
      });
    }
  };

  // Bookings
  const fetchBookings = async (params = {}) => {
    try {
      dispatch({ type: 'FETCH_BOOKINGS_START' });
      const { bookings, page, pages, total } = await bookingsAPI.getBookings(params);
      dispatch({ 
        type: 'FETCH_BOOKINGS_SUCCESS', 
        payload: { bookings, page, pages, total } 
      });
    } catch (error) {
      dispatch({ 
        type: 'FETCH_BOOKINGS_ERROR', 
        payload: error.response?.data?.message || error.message 
      });
    }
  };

  // Services
  const fetchServices = async (params = {}) => {
    try {
      dispatch({ type: 'FETCH_SERVICES_START' });
      const { services, page, pages, total } = await servicesAPI.getServices(params);
      dispatch({ 
        type: 'FETCH_SERVICES_SUCCESS', 
        payload: { services, page, pages, total } 
      });
    } catch (error) {
      dispatch({ 
        type: 'FETCH_SERVICES_ERROR', 
        payload: error.response?.data?.message || error.message 
      });
    }
  };

  return (
    <AdminContext.Provider
      value={{
        ...state,
        fetchUsers,
        fetchDashboardStats,
        fetchBookings,
        fetchServices,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};
