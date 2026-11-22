
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    uid: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    mobile: { type: String, required: true },
    gender: { type: String },

    // Profile Picture
    profileImage: {
      type: String,
      default: "",
    },
    profileImagePublicId: {
      type: String,
      default: "",
    },

    // User Role
    role: {
      type: String,
      enum: ["Student", "Faculty", "Stuff"],
      required: true,
    },

    // Role Specific Information
    roleSpecific: {
      studentId: { type: String },
      department: { type: String },
      batch: { type: String },
      facultyId: { type: String },
      designation: { type: String },
      stuffId: { type: String },
    },

    // University ID Card Verification
    verification: {
      status: {
        type: String,
        enum: ["Not Submitted", "Pending", "Approved", "Rejected"],
        default: "Not Submitted",
      },
      idCardPublicId: {
        type: String,
        default: "",
      },
      rejectionReason: {
        type: String,
        default: "",
      },
      reviewedAt: {
        type: Date,
        default: null,
      },
    },

    // Firebase Cloud Messaging Tokens
    fcmTokens: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
