const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const UserSchema = new mongoose.Schema({
  firebaseUserId: { type: String, required: true, unique: true }, // Firebase's unique ID
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Optional for backend use
  name: { type: String, required: true },
  storageUsed: { type: Number, default: 0 }, // In bytes
  dailyBandwidthUsed: { type: Number, default: 0 }, // Daily usage
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", UserSchema);
