// backend/routes/reportRoutes.js
import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import {
  getBookingStats,
  getProviderMetrics,
  getServiceDistribution,
  getBookingTrends
} from '../controllers/reportController.js';

const router = express.Router();

router.route('/stats')
  .get(protect, admin, getBookingStats);

router.route('/providers')
  .get(protect, admin, getProviderMetrics);

router.route('/services/distribution')
  .get(protect, admin, getServiceDistribution);

router.route('/trends')
  .get(protect, admin, getBookingTrends);

export default router;