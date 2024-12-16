const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firebaseUserId: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    storageUsed: { type: Number, default: 0 },
    dailyBandwidthUsed: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
}, { collection: 'users' });

module.exports = mongoose.model('User', userSchema);
