
const User = require("../models/user.model");
const cloudinary = require("../config/cloudinary");
const { Readable } = require("stream");

// 1. Registration Details Save
const registerUserDetails = async (req, res) => {
  try {
    const { uid, email } = req.user;
    const { fullName, mobile, gender, role, roleSpecific } = req.body;

    const existingUser = await User.findOne({ uid });

    if (existingUser) {
      return res.status(400).json({
        message: "User details already exist",
      });
    }

    const newUser = new User({
      uid,
      email,
      fullName,
      mobile,
      gender,
      role,
      roleSpecific,
      fcmTokens: [],
    });

    await newUser.save();

    res.status(201).json({
      message: "User details saved",
      user: newUser,
    });
  } catch (err) {
    res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};

// 2. Get User Profile
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid });

    if (!user) {
      return res.status(404).json({
        message: "User profile not found",
      });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};

// 3. Update User Profile
const updateUserProfile = async (req, res) => {
  try {
    const { fullName, mobile, gender, roleSpecific } = req.body;

    const user = await User.findOneAndUpdate(
      { uid: req.user.uid },
      {
        $set: {
          fullName,
          mobile,
          gender,
          roleSpecific,
        },
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        message: "User profile not found",
      });
    }

    res.json({
      message: "Profile updated successfully",
      user,
    });
  } catch (err) {
    res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};

// 4. Register FCM Token
const registerFcmToken = async (req, res) => {
  try {
    const { token } = req.body;
    const { uid } = req.user;

    if (!token) {
      return res.status(400).json({
        message: "Token is required",
      });
    }

    await User.findOneAndUpdate(
      { uid },
      { $addToSet: { fcmTokens: token } }
    );

    res.status(200).json({
      message: "FCM token registered successfully",
    });
  } catch (err) {
    res.status(500).json({
      message: "Error registering FCM token",
      error: err.message,
    });
  }
};

// 5. Upload University ID Card
const uploadUniversityIdCard = async (req, res) => {
  let uploadedPublicId = "";

  try {
    const user = await User.findOne({ uid: req.user.uid });

    if (!user) {
      return res.status(404).json({
        message: "User profile not found",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "Please select your University ID Card image.",
      });
    }

    if (user.verification.status === "Approved") {
      return res.status(400).json({
        message: "Your verification is already approved.",
      });
    }

    if (user.verification.status === "Pending") {
      return res.status(400).json({
        message: "Your ID Card is already pending review.",
      });
    }

    // Keep previous rejected image ID
    const previousPublicId = user.verification.idCardPublicId;

    // Upload new ID Card privately to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "miu-shuttle/id-cards",
          resource_type: "image",
          type: "authenticated",
          allowed_formats: ["jpg", "jpeg", "png", "webp"],
        },
        (error, result) => {
          if (error) {
            return reject(error);
          }

          resolve(result);
        }
      );

      Readable.from(req.file.buffer).pipe(uploadStream);
    });

    uploadedPublicId = uploadResult.public_id;

    // Update verification information
    user.verification.status = "Pending";
    user.verification.idCardPublicId = uploadedPublicId;
    user.verification.rejectionReason = "";
    user.verification.reviewedAt = null;

    await user.save();

    // Delete previous rejected image after successful save
    if (previousPublicId && previousPublicId !== uploadedPublicId) {
      try {
        await cloudinary.uploader.destroy(previousPublicId, {
          resource_type: "image",
          type: "authenticated",
          invalidate: true,
        });
      } catch (cleanupError) {
        console.error(
          "Previous ID Card cleanup error:",
          cleanupError.message
        );
      }
    }

    res.status(200).json({
      message:
        "University ID Card submitted successfully. Waiting for admin approval.",
      verificationStatus: user.verification.status,
    });
  } catch (err) {
    // Delete newly uploaded image if database save fails
    if (uploadedPublicId) {
      try {
        await cloudinary.uploader.destroy(uploadedPublicId, {
          resource_type: "image",
          type: "authenticated",
          invalidate: true,
        });
      } catch (cleanupError) {
        console.error(
          "Cloudinary cleanup error:",
          cleanupError.message
        );
      }
    }

    console.error("ID Card upload error:", err);

    res.status(500).json({
      message: "Failed to upload University ID Card.",
      error: err.message,
    });
  }
};

module.exports = {
  registerUserDetails,
  getUserProfile,
  updateUserProfile,
  registerFcmToken,
  uploadUniversityIdCard,
};
