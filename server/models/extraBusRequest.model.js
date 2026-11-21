
const mongoose = require("mongoose");

const extraBusRequestSchema = new mongoose.Schema(
  {
    uid: {
      type: String,
      required: true,
      index: true,
    },
    studentName: {
      type: String,
      required: true,
    },
    studentId: {
      type: String,
      required: true,
    },
    department: {
      type: String,
      default: "",
    },
    batch: {
      type: String,
      default: "",
    },
    journeyType: {
      type: String,
      enum: ["Arrive", "Leave"],
      required: true,
    },
    from: {
      type: String,
      required: true,
    },
    to: {
      type: String,
      required: true,
    },
    journeyDate: {
      type: String,
      required: true,
    },
    journeyDay: {
      type: String,
      required: true,
    },
    preferredTime: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["Pending"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "ExtraBusRequest",
  extraBusRequestSchema
);
