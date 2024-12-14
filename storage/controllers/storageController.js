const cloudinary = require("../cloudinaryConfig");
const Video = require("../models/Storage");
const fetch = require("node-fetch");

const AUTH_SERVICE_URL = "http://localhost:5000/api/users";

const getUserStorage = async (userId, token) => {
  try {
    const response = await fetch(`${AUTH_SERVICE_URL}/storage`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: token, // Pass the token from the request
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Failed to fetch user storage details:", error);
      throw new Error("Failed to fetch user storage details");
    }

    return await response.json();
  } catch (error) {
    console.error("Error calling getUserStorage API:", error);
    throw error;
  }
};

// Helper function to update storage usage
const updateStorageUsage = async (userId, usageDelta, token) => {
  try {
    const response = await fetch(`${AUTH_SERVICE_URL}/updateStorageUsage`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: token, // Pass the token from the request
      },
      body: JSON.stringify({ userId, usageDelta }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Failed to update storage usage:", error);
    }
  } catch (error) {
    console.error("Error calling updateStorageUsage API:", error);
  }
};

// Upload a video
exports.uploadVideo = async (req, res) => {
  const { name } = req.body;
  const file = req.file;

  try {
    if (!file) {
      return res.status(400).json({ message: "No video file provided" });
    }

    // Fetch user storage details
    const userStorage = await getUserStorage(
      req.user.firebaseUserId,
      req.headers.authorization
    );

    // Check if the upload exceeds the remaining storage
    if (userStorage.remainingStorage < file.size) {
      return res.status(400).json({
        message: "Not enough storage available. Please free up space.",
      });
    }

    // Upload video to Cloudinary
    const result = await cloudinary.uploader.upload(file.path, {
      resource_type: "video",
    });

    // Save video details to MongoDB
    const video = new Video({
      userId: req.user.firebaseUserId,
      videoUrl: result.secure_url,
      publicId: result.public_id,
      name,
      size: file.size,
    });

    await video.save();

    // Update storage usage
    await updateStorageUsage(
      req.user.firebaseUserId,
      file.size,
      req.headers.authorization
    );

    res.status(200).json({ message: "Video uploaded successfully", video });
  } catch (error) {
    console.error("Error uploading video:", error);
    res.status(500).json({ message: "Error uploading video", error });
  }
};

// Replace a video
exports.replaceVideo = async (req, res) => {
  const { videoId, name } = req.body;
  const file = req.file;

  try {
    if (!file) {
      return res.status(400).json({ message: "No video file provided" });
    }

    const video = await Video.findById(videoId);

    if (!video || video.userId !== req.user.firebaseUserId) {
      return res
        .status(404)
        .json({ message: "Video not found or unauthorized" });
    }

    // Delete the old video from Cloudinary
    await cloudinary.uploader.destroy(video.publicId, {
      resource_type: "video",
    });

    // Upload the new video to Cloudinary
    const result = await cloudinary.uploader.upload(file.path, {
      resource_type: "video",
    });

    // Update video details in MongoDB
    const oldSize = video.size; // Track the size of the old video
    video.videoUrl = result.secure_url;
    video.publicId = result.public_id;
    video.name = name;
    video.size = file.size;

    await video.save();

    // Update storage usage
    const usageDelta = file.size - oldSize;
    await updateStorageUsage(
      req.user.firebaseUserId,
      usageDelta,
      req.headers.authorization
    );

    res.status(200).json({ message: "Video replaced successfully", video });
  } catch (error) {
    console.error("Error replacing video:", error);
    res.status(500).json({ message: "Error replacing video", error });
  }
};

// Get all videos for a user
exports.getVideos = async (req, res) => {
  try {
    const videos = await Video.find({ userId: req.user.firebaseUserId });

    res.status(200).json({ videos });
  } catch (error) {
    console.error("Error fetching videos:", error);
    res.status(500).json({ message: "Error fetching videos", error });
  }
};

// Get a single video
exports.getVideoById = async (req, res) => {
  const { videoId } = req.params;

  try {
    const video = await Video.findById(videoId);

    if (!video || video.userId !== req.user.firebaseUserId) {
      return res
        .status(404)
        .json({ message: "Video not found or unauthorized" });
    }

    res.status(200).json({ video });
  } catch (error) {
    console.error("Error fetching video:", error);
    res.status(500).json({ message: "Error fetching video", error });
  }
};

// Delete a single video
exports.deleteVideo = async (req, res) => {
  const { videoId } = req.body;

  try {
    const video = await Video.findById(videoId);

    if (!video || video.userId !== req.user.firebaseUserId) {
      return res
        .status(404)
        .json({ message: "Video not found or unauthorized" });
    }

    // Delete video from Cloudinary
    await cloudinary.uploader.destroy(video.publicId, {
      resource_type: "video",
    });

    // Delete video from MongoDB using deleteOne
    const size = video.size; // Track size for updating storage
    await Video.deleteOne({ _id: videoId });

    // Update storage usage
    await updateStorageUsage(
      req.user.firebaseUserId,
      -size,
      req.headers.authorization
    );

    res.status(200).json({ message: "Video deleted successfully" });
  } catch (error) {
    console.error("Error deleting video:", error);
    res.status(500).json({ message: "Error deleting video", error });
  }
};

// Bulk delete videos
exports.bulkDeleteVideos = async (req, res) => {
  const { videoIds } = req.body;

  try {
    const videos = await Video.find({
      _id: { $in: videoIds },
      userId: req.user.firebaseUserId,
    });

    if (videos.length === 0) {
      return res
        .status(404)
        .json({ message: "No videos found or unauthorized" });
    }

    // Delete videos from Cloudinary
    const publicIds = videos.map((video) => video.publicId);
    await cloudinary.api.delete_resources(publicIds, {
      resource_type: "video",
    });

    // Calculate total storage to free
    const totalSize = videos.reduce((acc, video) => acc + video.size, 0);

    // Delete videos from MongoDB
    await Video.deleteMany({ _id: { $in: videoIds } });

    // Update storage usage
    await updateStorageUsage(
      req.user.firebaseUserId,
      -totalSize,
      req.headers.authorization
    );

    res.status(200).json({ message: "Videos deleted successfully" });
  } catch (error) {
    console.error("Error bulk deleting videos:", error);
    res.status(500).json({ message: "Error bulk deleting videos", error });
  }
};
