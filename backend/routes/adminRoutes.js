import express from 'express';
const router = express.Router();
import { protect, admin } from '../middleware/authMiddleware.js';
import {
  getDashboardStats,
  getBookings,
  updateBookingStatus,
  assignProviderToBooking,
  getServiceStats,
  getRevenueAnalytics
} from '../controllers/adminController.js';

// Dashboard routes
router.route('/stats').get(protect, admin, getDashboardStats);

// Booking routes
router.route('/bookings')
  .get(protect, admin, getBookings);

router.route('/bookings/:id/status')
  .put(protect, admin, updateBookingStatus);

router.route('/bookings/:id/assign-provider')
  .put(protect, admin, assignProviderToBooking);

// Analytics routes
router.route('/analytics/services')
  .get(protect, admin, getServiceStats);

router.route('/analytics/revenue')
  .get(protect, admin, getRevenueAnalytics);

export default router;
