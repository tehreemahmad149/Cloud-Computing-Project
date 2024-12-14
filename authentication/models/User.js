const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const UserSchema = new mongoose.Schema({
  firebaseUserId: { type: String, required: true, unique: true }, // Firebase's unique ID
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Encrypted password
  name: { type: String, required: true },
  storageUsed: { type: Number, default: 0 }, // In bytes
  dailyBandwidthUsed: { type: Number, default: 0 }, // Daily usage
  createdAt: { type: Date, default: Date.now },
});

// Hash password before saving the user
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next(); // Skip if password is not modified

  try {
    const salt = await bcrypt.genSalt(10); // Generate salt
    this.password = await bcrypt.hash(this.password, salt); // Hash password
    next();
  } catch (error) {
    next(error); // Pass error to Mongoose
  }
});

module.exports = mongoose.model("User", UserSchema);
