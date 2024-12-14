const express = require("express");
const {
  createUser,
  loginUser,
  getUserProfile,
  updateStorageUsage,
  resetDailyBandwidth,
  validateToken,
} = require("../controllers/userController");
const requireAuth = require("../middleware/auth");

const router = express.Router();

// User APIs
router.post("/register", createUser); // Register a user
router.post("/login", loginUser); // Log in a user
router.get("/profile", requireAuth, getUserProfile); // Get user profile
router.put("/storage", requireAuth, updateStorageUsage); // Update storage usage
router.put("/reset-bandwidth", resetDailyBandwidth);
router.post("/validate-token", validateToken);

module.exports = router;
