
const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    busId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bus",
      required: true,
    },
    seatNumber: { type: Number, required: true },
    date: { type: Date, default: Date.now },

    // Journey information
    journeyFrom: { type: String },
    journeyTo: { type: String },
    journeyDate: { type: String },

    // Journey timestamp for upcoming and past bookings
    journeyTimestamp: { type: Date, required: true },
  },
  { timestamps: true }
);

// Prevent duplicate seat bookings for the same bus schedule
bookingSchema.index(
  { busId: 1, seatNumber: 1 },
  { unique: true }
);

module.exports = mongoose.model("Booking", bookingSchema);
