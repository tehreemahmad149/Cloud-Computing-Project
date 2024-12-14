const admin = require("firebase-admin");

// Load Firebase service account key
const serviceAccount = require("./firebase-access.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

module.exports = admin;
