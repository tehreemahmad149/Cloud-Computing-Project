const express = require("express");
const {
  createUser,
  loginUser,
  getUserProfile,
  updateStorageUsage,
  resetDailyBandwidth,
  validateToken,
  getUserStorage,
} = require("../controllers/userController");
const requireAuth = require("../middleware/auth");

const router = express.Router();

// User APIs
router.post("/register", createUser); // Register a user
router.post("/login", loginUser); // Log in a user
router.get("/profile", requireAuth, getUserProfile); // Get user profile
router.put("/updateStorageUsage", requireAuth, updateStorageUsage); // Update storage usage
router.put("/reset-bandwidth", resetDailyBandwidth);
router.post("/validate-token", validateToken);
router.get("/storage", requireAuth, getUserStorage);

module.exports = router;
