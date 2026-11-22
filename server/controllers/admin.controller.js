
const Bus = require("../models/bus.model.js");
const Booking = require("../models/booking.model.js");
const Notice = require("../models/notice.model.js");
const User = require("../models/user.model.js");
const ExtraBusRequest = require("../models/extraBusRequest.model.js");
const admin = require("../config/firebaseAdmin");
const cloudinary = require("../config/cloudinary");

// Journey Date যাচাই ও UTC Date তৈরি
const parseJourneyDate = (value) => {
  if (!value) return null;

  const dateString =
    value instanceof Date
      ? value.toISOString().substring(0, 10)
      : value;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return null;
  }

  const date = new Date(`${dateString}T00:00:00.000Z`);

  if (date.toISOString().substring(0, 10) !== dateString) {
    return null;
  }

  return date;
};

// Push Notification Helper
async function sendPushNotification(title, body) {
  try {
    console.log("[FCM DEBUG] Starting sendPushNotification...");

    const usersWithTokens = await User.find({
      fcmTokens: { $exists: true, $ne: [] },
    });

    const tokens = [];

    usersWithTokens.forEach((user) => {
      tokens.push(...user.fcmTokens);
    });

    if (tokens.length === 0) {
      console.log("[FCM DEBUG] No tokens found.");
      return;
    }

    const message = {
      notification: {
        title,
        body,
      },
      tokens,
    };

    const response = await admin.messaging().sendEachForMulticast(message);

    console.log("[FCM DEBUG] Firebase response:", response);

    if (response.failureCount > 0) {
      response.responses.forEach((resp) => {
        if (!resp.success) {
          console.error("[FCM ERROR]", resp.error);
        }
      });
    }
  } catch (error) {
    console.error("[FCM FATAL ERROR]", error);
  }
}

// ==============================
// BUS CONTROLLERS
// ==============================

// Create Bus
const createBus = async (req, res) => {
  try {
    const journeyDate = parseJourneyDate(req.body.journeyDate);

    if (!journeyDate) {
      return res.status(400).json({
        message: "Valid Journey Date is required (YYYY-MM-DD)",
      });
    }

    const totalSeats = Number(req.body.totalSeats ?? 40);

    if (!Number.isInteger(totalSeats) || totalSeats < 1) {
      return res.status(400).json({
        message: "Total seats must be a positive number.",
      });
    }

    const bus = new Bus({
      ...req.body,
      totalSeats,
      availableSeats: totalSeats,
      journeyDate,
    });

    await bus.save();

    await sendPushNotification(
      "New Bus Added",
      `${bus.busName} (${bus.routeFrom} to ${bus.routeTo}) is now available.`
    );

    return res.status(201).json({
      message: "Bus added successfully",
      bus,
    });
  } catch (err) {
    return res.status(400).json({
      message: "Error adding bus",
      error: err.message,
    });
  }
};

// Get All Buses
const getAllBuses = async (req, res) => {
  try {
    const buses = await Bus.find();

    return res.status(200).json(buses);
  } catch (err) {
    return res.status(500).json({
      message: "Error fetching buses",
      error: err.message,
    });
  }
};

// Update Bus
const updateBus = async (req, res) => {
  try {
    const { id } = req.params;

    const updatedBus = await Bus.findById(id);

    if (!updatedBus) {
      return res.status(404).json({
        message: "Bus not found",
      });
    }

    // Update Total Seats and Available Seats
    if (req.body.totalSeats !== undefined) {
      const newTotalSeats = Number(req.body.totalSeats);

      if (
        !Number.isInteger(newTotalSeats) ||
        newTotalSeats < 1
      ) {
        return res.status(400).json({
          message: "Total seats must be a positive number.",
        });
      }

      const bookedBookings = await Booking.find({
        busId: id,
      }).select("seatNumber");

      const bookedSeatNumbers = bookedBookings.map((booking) =>
        Number(booking.seatNumber)
      );

      const invalidBookedSeats = bookedSeatNumbers.filter(
        (seat) => seat > newTotalSeats
      );

      if (invalidBookedSeats.length > 0) {
        return res.status(400).json({
          message: `Cannot reduce total seats. Already booked seat(s): ${invalidBookedSeats.join(", ")}`,
        });
      }

      updatedBus.totalSeats = newTotalSeats;
      updatedBus.availableSeats =
        newTotalSeats - bookedBookings.length;
    }

    // Update Journey Date
    if (req.body.journeyDate !== undefined) {
      const journeyDate = parseJourneyDate(req.body.journeyDate);

      if (!journeyDate) {
        return res.status(400).json({
          message: "Valid Journey Date is required (YYYY-MM-DD)",
        });
      }

      updatedBus.journeyDate = journeyDate;
    }

    // Update Other Bus Fields
    Object.keys(req.body).forEach((key) => {
      if (
        key !== "journeyDate" &&
        key !== "journeyDay" &&
        key !== "totalSeats" &&
        key !== "availableSeats"
      ) {
        updatedBus[key] = req.body[key];
      }
    });

    await updatedBus.save();

    await sendPushNotification(
      "Bus Route Updated",
      `${updatedBus.busName} route details have been updated.`
    );

    return res.status(200).json({
      message: "Bus updated successfully",
      bus: updatedBus,
    });
  } catch (err) {
    console.error("Update bus error:", err);

    return res.status(400).json({
      message: "Error updating bus",
      error: err.message,
    });
  }
};

// Delete Bus
const deleteBus = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedBus = await Bus.findByIdAndDelete(id);

    if (!deletedBus) {
      return res.status(404).json({
        message: "Bus not found",
      });
    }

    await sendPushNotification(
      "Bus Removed",
      `${deletedBus.busName} is no longer available.`
    );

    return res.status(200).json({
      message: "Bus deleted",
    });
  } catch (err) {
    return res.status(500).json({
      message: "Error deleting bus",
      error: err.message,
    });
  }
};

// ==============================
// NOTICE CONTROLLERS
// ==============================

const createNotice = async (req, res) => {
  try {
    const { title, content } = req.body;

    const newNotice = new Notice({
      title,
      content,
      author: req.user.uid,
    });

    await newNotice.save();

    const io = req.app.get("socketio");

    if (io) {
      io.emit("newNotice", newNotice);
    }

    await sendPushNotification(
      `New Announcement: ${title}`,
      content.substring(0, 100) + "..."
    );

    return res.status(201).json({
      message: "Notice posted",
      notice: newNotice,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Failed to post notice",
      error: err.message,
    });
  }
};

const getAllNotices = async (req, res) => {
  try {
    const notices = await Notice.find().sort({
      createdAt: -1,
    });

    return res.status(200).json(notices);
  } catch (err) {
    return res.status(500).json({
      message: "Error fetching notices",
      error: err.message,
    });
  }
};

// ==============================
// EXTRA BUS REQUEST CONTROLLER
// ==============================

const getAllExtraBusRequests = async (req, res) => {
  try {
    const requests = await ExtraBusRequest.find().sort({
      createdAt: -1,
    });

    return res.status(200).json(requests);
  } catch (err) {
    console.error("Error fetching extra bus requests:", err);

    return res.status(500).json({
      message: "Error fetching extra bus requests",
      error: err.message,
    });
  }
};

// ==============================
// UNIVERSITY ID VERIFICATION
// ==============================

// Get Pending Verification Requests
const getPendingVerifications = async (req, res) => {
  try {
    const users = await User.find({
      "verification.status": "Pending",
    })
      .select(
        "fullName email mobile role roleSpecific verification.status verification.rejectionReason createdAt"
      )
      .sort({ createdAt: 1 });

    const requests = users.map((user) => {
      let universityId = "";

      if (user.role === "Student") {
        universityId = user.roleSpecific?.studentId || "";
      } else if (user.role === "Faculty") {
        universityId = user.roleSpecific?.facultyId || "";
      } else if (user.role === "Stuff") {
        universityId = user.roleSpecific?.stuffId || "";
      }

      return {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        universityId,
        department: user.roleSpecific?.department || "",
        batch: user.roleSpecific?.batch || "",
        designation: user.roleSpecific?.designation || "",
        verificationStatus: user.verification?.status,
        createdAt: user.createdAt,
      };
    });

    return res.status(200).json({
      total: requests.length,
      requests,
    });
  } catch (err) {
    console.error("Pending verification error:", err);

    return res.status(500).json({
      message: "Failed to fetch verification requests.",
    });
  }
};

// Get Temporary Secure ID Card URL
const getVerificationIdCard = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    if (!user.verification?.idCardPublicId) {
      return res.status(404).json({
        message: "University ID Card not found.",
      });
    }

    if (user.verification.status !== "Pending") {
      return res.status(400).json({
        message: "This verification request is not pending.",
      });
    }

    const publicId = user.verification.idCardPublicId;

    const asset = await cloudinary.api.resource(publicId, {
      resource_type: "image",
      type: "authenticated",
    });

    const expiresAt = Math.floor(Date.now() / 1000) + 300;

    const imageUrl = cloudinary.utils.private_download_url(
      publicId,
      asset.format,
      {
        resource_type: "image",
        type: "authenticated",
        expires_at: expiresAt,
        attachment: false,
      }
    );

    return res.status(200).json({
      imageUrl,
      expiresAt,
    });
  } catch (err) {
    console.error("ID Card access error:", err);

    return res.status(500).json({
      message: "Failed to access University ID Card.",
    });
  }
};

// Approve University ID Verification
const approveUserVerification = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    if (!user.verification || user.verification.status !== "Pending") {
      return res.status(400).json({
        message: "Only pending verification requests can be approved.",
      });
    }

    if (!user.verification.idCardPublicId) {
      return res.status(400).json({
        message: "University ID Card is missing.",
      });
    }

    user.verification.status = "Approved";
    user.verification.rejectionReason = "";
    user.verification.reviewedAt = new Date();

    await user.save();

    return res.status(200).json({
      message: "University ID verification approved successfully.",
      verificationStatus: user.verification.status,
    });
  } catch (err) {
    console.error("Approve verification error:", err);

    return res.status(500).json({
      message: "Failed to approve verification.",
    });
  }
};

// Reject University ID Verification
const rejectUserVerification = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        message: "Rejection reason is required.",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    if (!user.verification || user.verification.status !== "Pending") {
      return res.status(400).json({
        message: "Only pending verification requests can be rejected.",
      });
    }

    user.verification.status = "Rejected";
    user.verification.rejectionReason = reason.trim();
    user.verification.reviewedAt = new Date();

    await user.save();

    return res.status(200).json({
      message: "University ID verification rejected",
      verificationStatus: user.verification.status,
      rejectionReason: user.verification.rejectionReason,
    });
  } catch (err) {
    console.error("Reject verification error:", err);

    return res.status(500).json({
      message: "Failed to reject verification.",
    });
  }
};

// ==============================
// EXPORTS
// ==============================

module.exports = {
  createBus,
  getAllBuses,
  updateBus,
  deleteBus,
  createNotice,
  getAllNotices,
  getAllExtraBusRequests,
  getPendingVerifications,
  getVerificationIdCard,
  approveUserVerification,
  rejectUserVerification,
};
