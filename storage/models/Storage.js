const mongoose = require("mongoose");

const VideoSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // User's unique ID
  videoUrl: { type: String, required: true }, // Cloudinary video URL
  publicId: { type: String, required: true }, // Cloudinary public ID
  name: { type: String, required: true }, // Video name
  size: { type: Number, required: true }, // Video size in bytes
  createdAt: { type: Date, default: Date.now }, // Upload timestamp
});

module.exports = mongoose.model("Video", VideoSchema);
