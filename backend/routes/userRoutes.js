import express from "express";
import { 
  registerUser, 
  loginUser, 
  getAllUsers,
  updateUserSkills,
  getUserSkills,
  getServiceProviders
} from "../controllers/userController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/", protect, admin, getAllUsers);

// Skill management for service providers
router.route('/skills')
  .get(protect, getUserSkills)         // Get user's skills
  .put(protect, updateUserSkills);     // Update user's skills

// Public endpoint to get service providers
router.get('/providers', getServiceProviders);

export default router;
