import express from "express";
import { protect, admin } from "../middleware/authMiddleware.js";
import {
  getSkills,
  createSkill,
  updateSkill,
  deleteSkill,
} from "../controllers/skillController.js";

const router = express.Router();

// Public routes
router.route("/").get(getSkills);

// Protected Admin routes
router.route("/").post(protect, admin, createSkill);
router
  .route("/:id")
  .put(protect, admin, updateSkill)
  .delete(protect, admin, deleteSkill);

export default router;
