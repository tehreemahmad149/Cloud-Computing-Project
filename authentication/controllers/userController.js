const admin = require("../firebaseAdmin");
const User = require("../models/User");

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

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Error creating user", error });
  }
};

exports.loginUser = async (req, res) => {
  const { email } = req.body; // Extract email from the request
  const firebaseToken = req.headers.authorization?.split(" ")[1]; // Extract Firebase token from Authorization header

  if (!firebaseToken) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  try {
    // Verify Firebase token
    const decodedToken = await admin.auth().verifyIdToken(firebaseToken);

    if (decodedToken.email !== email) {
      return res.status(401).json({ message: "Unauthorized: Email mismatch" });
    }

    // Check if the user exists in MongoDB
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

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
    console.error("Error logging in user:", error);
    res.status(500).json({ message: "Error logging in user", error });
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUserId: req.user.uid });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Error fetching user profile", error });
  }
};

// Update storage usage
exports.updateStorageUsage = async (req, res) => {
  const { userId, storageUsed } = req.body;

  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { storageUsed },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({
      message: "Storage usage updated",
      storageUsed: user.storageUsed,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Reset daily bandwidth
exports.resetDailyBandwidth = async (req, res) => {
  try {
    await User.updateMany({}, { dailyBandwidthUsed: 0 });
    res.status(200).json({ message: "Daily bandwidth reset for all users" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
