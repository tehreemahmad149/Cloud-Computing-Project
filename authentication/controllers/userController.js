const admin = require("../firebaseAdmin");
const User = require("../models/User");
const axios = require('axios');

const sendLogRequest = async (logMessage) => {
    try {
        const response = await axios.post('http://localhost:5000/log', {
            logMessage,
        });
        console.log('Log saved successfully:', response.data);
    } catch (error) {
        console.error('Error sending log request:', error.response ? error.response.data : error.message);
    }
};

exports.createUser = async (req, res) => {
  const { email, password, name } = req.body;

  try {
    // Create a Firebase user
    const firebaseUser = await admin.auth().createUser({
      email,
      password,
      displayName: name,
    });

    // Save the user to MongoDB (password will be hashed automatically)
    const user = new User({
      firebaseUserId: firebaseUser.uid,
      email,
      password, // This will be hashed by the pre-save hook in User.js
      name,
    });

    await user.save();
    sendLogRequest(`User registered: for ${user.firebaseUserId} on ${new Date().toLocaleString()}`);
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    sendLogRequest(`Error creating user: on ${new Date().toLocaleString()} Error: ${error}`);
    //console.error("Error creating user:", error);
    res.status(500).json({ message: "Error creating user", error });
  }
};

exports.loginUser = async (req, res) => {
  const { email } = req.body; // Extract email from the request
  const firebaseToken = req.headers.authorization?.split(" ")[1]; // Extract Firebase token from Authorization header

  if (!firebaseToken) {
    sendLogRequest(`Unauthorized access in Login:No token provided on ${new Date().toLocaleString()}`);
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  try {
    // Verify Firebase token
    const decodedToken = await admin.auth().verifyIdToken(firebaseToken);

    if (decodedToken.email !== email) {
      sendLogRequest(`Unauthorized access in Login:Email mismatch for ${email} on ${new Date().toLocaleString()}`);
      return res.status(401).json({ message: "Unauthorized: Email mismatch" });
    }

    // Check if the user exists in MongoDB
    const user = await User.findOne({ email });
    if (!user) {
      sendLogRequest(`Unauthorized access in Login: User not found for ${email} on ${new Date().toLocaleString()}`);
      return res.status(404).json({ message: "User not found" });
    }
    sendLogRequest(`Login successful for ${user.firebaseUserId} on ${new Date().toLocaleString()}`);
    res.status(200).json({
      message: "Login successful",
      user: {
        email: user.email,
        name: user.name,
        storageUsed: user.storageUsed,
        dailyBandwidthUsed: user.dailyBandwidthUsed,
      },
    });
  } catch (error) {
    sendLogRequest(`Login error ${error} for in user on ${new Date().toLocaleString()}`);
    //console.error("Error logging in user:", error);
    res.status(500).json({ message: "Error logging in user", error });
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUserId: req.user.uid });
    if (!user) {
      sendLogRequest(`User not found for ${user.firebaseUserId} on ${new Date().toLocaleString()}`);
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    sendLogRequest(`Error fetching user profile ${error} on ${new Date().toLocaleString()}`);
    //console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Error fetching user profile", error });
  }
};

exports.updateStorageUsage = async (req, res) => {
  const { userId, usageDelta } = req.body; // usageDelta is the size to add or subtract (can be positive or negative)
  const MAX_STORAGE = 50 * 1024 * 1024; // 50 MB in bytes

  try {
    // Fetch the user by firebaseUserId
    const user = await User.findOne({ firebaseUserId: userId });
    if (!user) {
      sendLogRequest(`User not found for ${user.firebaseUserId} on ${new Date().toLocaleString()}`);
      return res.status(404).json({ message: "User not found" });
    }

    // Calculate new storage usage
    const newStorageUsed = user.storageUsed + usageDelta;

    // Check if the new storage exceeds the limit
    if (newStorageUsed > MAX_STORAGE) {
      sendLogRequest(`Storage limit exceeded ${user.firebaseUserId} on ${new Date().toLocaleString()}`);
      return res.status(400).json({
        message:
          "Storage limit exceeded. Please delete some videos to free up space.",
        storageUsed: user.storageUsed,
        maxStorage: MAX_STORAGE,
      });
    }

    // Check if storage exceeds 80% threshold
    const storageThreshold = 0.8 * MAX_STORAGE;
    const thresholdExceeded = newStorageUsed > storageThreshold;

    // Update the storage usage in the database
    user.storageUsed = Math.max(newStorageUsed, 0); // Ensure storageUsed doesn't go below zero
    await user.save();

    // Return success response with storage usage details
    sendLogRequest(`Storage update successfully for ${user.firebaseUserId} on ${new Date().toLocaleString()}
    Storage used: ${user.storageUsed}
    `);
    res.status(200).json({
      message: "Storage usage updated successfully",
      storageUsed: user.storageUsed,
      maxStorage: MAX_STORAGE,
      thresholdExceeded,
    });
  } catch (error) {
    sendLogRequest(`Storage update error ${error} for ${user.firebaseUserId} on ${new Date().toLocaleString()}`);
    //console.error("Error updating storage usage:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

exports.getUserStorage = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUserId: req.user.uid });

    if (!user) {
      sendLogRequest(`User not found for ${user.firebaseUserId} on ${new Date().toLocaleString()}`);
      return res.status(404).json({ message: "User not found" });
    }

    const MAX_STORAGE = 50 * 1024 * 1024; // 50 MB in bytes

    res.status(200).json({
      storageUsed: user.storageUsed,
      maxStorage: MAX_STORAGE,
      remainingStorage: Math.max(MAX_STORAGE - user.storageUsed, 0),
      isThresholdExceeded: user.storageUsed > 0.8 * MAX_STORAGE,
    });
  } catch (error) {
    sendLogRequest(`Error fetching user storage details for ${user.firebaseUserId} on ${new Date().toLocaleString()}`);
    //console.error("Error fetching user storage details:", error);
    res
      .status(500)
      .json({ message: "Error fetching user storage details", error });
  }
};

// Reset daily bandwidth
exports.resetDailyBandwidth = async (req, res) => {
  try {
    await User.updateMany({}, { dailyBandwidthUsed: 0 });
    sendLogRequest(`Daily bandwidth reset for all`);
    res.status(200).json({ message: "Daily bandwidth reset for all users" });
  } catch (error) {
    sendLogRequest(`Server Error. File userController.js exports.resetDailyBandwidth. ${error}`);
    res.status(500).json({ message: "Server error", error });
  }
};

exports.validateToken = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    sendLogRequest(`Missing or invalid token for ${authHeader}`);
    return res.status(401).json({ message: "Missing or invalid token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    // Verify the token with Firebase Admin SDK
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Optionally, ensure the user exists in your MongoDB
    const user = await User.findOne({ firebaseUserId: decodedToken.uid });
    if (!user) {
      sendLogRequest(`User not found for token: ${decodedToken}`);
      return res.status(404).json({ message: "User not found" });
    }

    // Return decoded token and user info
    res.status(200).json({
      valid: true,
      user: {
        firebaseUserId: decodedToken.uid,
        email: decodedToken.email,
        name: user.name,
      },
    });
  } catch (error) {
    sendLogRequest(`Error verifying token. ${error}`);
    //console.error("Error verifying token:", error);
    res.status(401).json({ valid: false, message: "Invalid token" });
  }
};
