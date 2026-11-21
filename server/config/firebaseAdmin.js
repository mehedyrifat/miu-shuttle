
const admin = require("firebase-admin");

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

if (!serviceAccountJson) {
  throw new Error(
    "FIREBASE_SERVICE_ACCOUNT is missing from environment variables."
  );
}

let serviceAccount;

try {
  serviceAccount = JSON.parse(serviceAccountJson);
} catch (error) {
  throw new Error(
    "FIREBASE_SERVICE_ACCOUNT contains invalid JSON."
  );
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  console.log("Firebase Admin SDK initialized successfully.");
}

module.exports = admin;
