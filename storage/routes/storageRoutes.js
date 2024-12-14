const express = require("express");
const multer = require("multer");
const {
  uploadVideo,
  replaceVideo,
  getVideos,
  getVideoById,
  deleteVideo,
  bulkDeleteVideos,
} = require("../controllers/storageController");
const validateToken = require("../middleware/auth"); // Import the middleware

const router = express.Router();
const upload = multer({ dest: "uploads/" }); // Multer configuration

// Video Routes
router.post("/upload", validateToken, upload.single("video"), uploadVideo); // Upload video
router.put("/replace", validateToken, upload.single("video"), replaceVideo); // Replace video
router.get("/:userId/videos", validateToken, getVideos); // Get all videos for a user
router.get("/video/:videoId", validateToken, getVideoById); // Get a single video
router.delete("/delete", validateToken, deleteVideo); // Delete a single video
router.delete("/bulk-delete", validateToken, bulkDeleteVideos); // Bulk delete videos

module.exports = router;
