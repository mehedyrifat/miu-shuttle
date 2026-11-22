
const express = require("express");
const { verifyFirebaseToken } = require("../middlewares/auth.middleware.js");

const {
  uploadIdCard,
  uploadProfileImage,
} = require("../middlewares/upload.middleware.js");

const {
  registerUserDetails,
  getUserProfile,
  updateUserProfile,
  registerFcmToken,
  uploadUniversityIdCard,
  uploadUserProfileImage,
} = require("../controllers/user.controller.js");

const router = express.Router();

// Register User Details
router.post("/register-details", verifyFirebaseToken, registerUserDetails);

// Get and Update Profile
router.get("/profile", verifyFirebaseToken, getUserProfile);
router.put("/profile", verifyFirebaseToken, updateUserProfile);

// Register FCM Token
router.post("/register-fcm-token", verifyFirebaseToken, registerFcmToken);

// Upload University ID Card
router.post(
  "/upload-id-card",
  verifyFirebaseToken,
  uploadIdCard,
  uploadUniversityIdCard
);

// Upload Profile Picture
router.post(
  "/upload-profile-image",
  verifyFirebaseToken,
  uploadProfileImage,
  uploadUserProfileImage
);

module.exports = router;
