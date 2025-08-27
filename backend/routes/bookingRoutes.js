import express from "express";
import { 
  createBooking, 
  getMyBookings, 
  updateBookingStatus, 
  getAllBookings, 
  getProviderBookings,
  getUnassignedBookings,
  assignProviderToBooking
} from "../controllers/bookingController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Customer routes
router.post("/", protect, createBooking);
router.get("/my", protect, getMyBookings);

// Admin routes
router.get("/unassigned", protect, admin, getUnassignedBookings);
router.put("/:id/assign-provider", protect, admin, assignProviderToBooking);
router.put("/:id", protect, admin, updateBookingStatus);
router.get("/", protect, admin, getAllBookings);

// Provider routes
router.get("/provider", protect, getProviderBookings);
router.put("/:id/status", protect, updateBookingStatus);

export default router;
