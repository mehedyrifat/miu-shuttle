
const express = require("express");
const { verifyFirebaseToken } = require("../middlewares/auth.middleware.js");
const { uploadIdCard } = require("../middlewares/upload.middleware.js");

const {
  registerUserDetails,
  getUserProfile,
  updateUserProfile,
  registerFcmToken,
  uploadUniversityIdCard,
} = require("../controllers/user.controller.js");

const router = express.Router();

router.post("/register-details", verifyFirebaseToken, registerUserDetails);

router.get("/profile", verifyFirebaseToken, getUserProfile);
router.put("/profile", verifyFirebaseToken, updateUserProfile);

router.post("/register-fcm-token", verifyFirebaseToken, registerFcmToken);

router.post(
  "/upload-id-card",
  verifyFirebaseToken,
  uploadIdCard,
  uploadUniversityIdCard
);

module.exports = router;
