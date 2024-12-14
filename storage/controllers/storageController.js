const cloudinary = require("../cloudinaryConfig");
const Video = require("../models/Storage");

// Upload a video
exports.uploadVideo = async (req, res) => {
  const { name } = req.body; // No longer taking userId directly
  const file = req.file;

  try {
    if (!file) {
      return res.status(400).json({ message: "No video file provided" });
    }

    // Upload video to Cloudinary
    const result = await cloudinary.uploader.upload(file.path, {
      resource_type: "video",
    });

    // Save video details to MongoDB
    const video = new Video({
      userId: req.user.firebaseUserId, // Use authenticated user's ID
      videoUrl: result.secure_url,
      publicId: result.public_id,
      name,
      size: file.size,
    });

    await video.save();

    res.status(200).json({ message: "Video uploaded successfully", video });
  } catch (error) {
    console.error("Error uploading video:", error);
    res.status(500).json({ message: "Error uploading video", error });
  }
};

// Replace a video
exports.replaceVideo = async (req, res) => {
  const { videoId, name } = req.body; // No longer taking userId directly
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
    video.videoUrl = result.secure_url;
    video.publicId = result.public_id;
    video.name = name;
    video.size = file.size;

    await video.save();

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
    await Video.deleteOne({ _id: videoId });

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

    // Delete videos from MongoDB
    await Video.deleteMany({ _id: { $in: videoIds } });

    res.status(200).json({ message: "Videos deleted successfully" });
  } catch (error) {
    console.error("Error bulk deleting videos:", error);
    res.status(500).json({ message: "Error bulk deleting videos", error });
  }
};
