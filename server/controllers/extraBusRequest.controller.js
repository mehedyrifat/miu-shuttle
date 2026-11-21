
const User = require("../models/user.model.js");
const ExtraBusRequest = require("../models/extraBusRequest.model.js");

// Student: Submit Extra Bus Request
const createExtraBusRequest = async (req, res) => {
  try {
    const { uid } = req.user;

    const {
      journeyType,
      from,
      to,
      journeyDate,
      journeyDay,
      preferredTime,
      message,
    } = req.body;

    // Student-এর MongoDB profile খুঁজে বের করা
    const user = await User.findOne({ uid });

    if (!user) {
      return res.status(404).json({
        message: "User profile not found",
      });
    }

    // শুধু Student Request করতে পারবে
    if (user.role !== "Student") {
      return res.status(403).json({
        message: "Only students can submit extra bus requests",
      });
    }

    // Required fields validation
    if (
      !journeyType ||
      !from ||
      !to ||
      !journeyDate ||
      !journeyDay ||
      !preferredTime
    ) {
      return res.status(400).json({
        message: "Please provide all required information",
      });
    }

    // Journey Type validation
    if (!["Arrive", "Leave"].includes(journeyType)) {
      return res.status(400).json({
        message: "Invalid journey type",
      });
    }

    // Student information validation
    if (!user.roleSpecific?.studentId) {
      return res.status(400).json({
        message: "Student ID not found in your profile",
      });
    }

    // Date validation
    if (!/^\d{4}-\d{2}-\d{2}$/.test(journeyDate)) {
      return res.status(400).json({
        message: "Invalid journey date format",
      });
    }

    const parsedDate = new Date(`${journeyDate}T00:00:00.000Z`);

    if (
      Number.isNaN(parsedDate.getTime()) ||
      parsedDate.toISOString().substring(0, 10) !== journeyDate
    ) {
      return res.status(400).json({
        message: "Invalid journey date",
      });
    }

    // Date অনুযায়ী Weekday যাচাই
    const actualDay = new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      timeZone: "UTC",
    }).format(parsedDate);

    if (journeyDay !== actualDay) {
      return res.status(400).json({
        message: "Journey day does not match the selected date",
      });
    }

    // Preferred time validation
    const allowedTimes =
      journeyType === "Arrive"
        ? ["8:00 AM", "10:00 AM"]
        : ["1:45 PM", "5:00 PM"];

    if (!allowedTimes.includes(preferredTime)) {
      return res.status(400).json({
        message: "Invalid preferred bus time",
      });
    }

    // From এবং To validation
    if (
      typeof from !== "string" ||
      typeof to !== "string" ||
      !from.trim() ||
      !to.trim()
    ) {
      return res.status(400).json({
        message: "Valid From and To locations are required",
      });
    }

    if (from.trim() === to.trim()) {
      return res.status(400).json({
        message: "From and To locations cannot be the same",
      });
    }

    // Request save
    const newRequest = new ExtraBusRequest({
      uid: user.uid,
      studentName: user.fullName,
      studentId: user.roleSpecific.studentId,
      department: user.roleSpecific.department || "",
      batch: user.roleSpecific.batch || "",
      journeyType,
      from: from.trim(),
      to: to.trim(),
      journeyDate,
      journeyDay,
      preferredTime,
      message: typeof message === "string" ? message.trim() : "",
      status: "Pending",
    });

    await newRequest.save();

    return res.status(201).json({
      message: "Extra bus request submitted successfully",
      request: newRequest,
    });
  } catch (err) {
    console.error("Error submitting extra bus request:", err);

    return res.status(500).json({
      message: "Failed to submit extra bus request",
      error: err.message,
    });
  }
};

module.exports = {
  createExtraBusRequest,
};
