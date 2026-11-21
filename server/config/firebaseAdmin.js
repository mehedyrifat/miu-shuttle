
const admin = require("firebase-admin");
const serviceAccount = require("../firebase-service-account.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  console.log("✅ Firebase Admin SDK initialized successfully.");
}

module.exports = admin;
