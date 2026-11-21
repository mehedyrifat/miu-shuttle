
const mongoose = require("mongoose");

const busSchema = new mongoose.Schema(
  {
    busName: { type: String, required: true },
    routeFrom: { type: String, required: true },
    routeTo: { type: String, required: true },
    time: { type: String, required: true }, // ডিসপ্লের জন্য (e.g., "1:45 PM")
    
    // ✅ নতুন: টাইম ম্যানেজমেন্ট ও রুট ফিল্টারিংয়ের জন্য
    // 24-ঘণ্টা ফরম্যাটে সেভ হবে, যেমন: "13:45"
    departureTime: { type: String, required: true },

    // ✅ নতুন: Bus Schedule-এর Journey Date
    journeyDate: { type: Date },

    // ✅ নতুন: Journey Date থেকে Day স্বয়ংক্রিয়ভাবে নির্ধারিত হবে
    journeyDay: { type: String },

    totalSeats: { type: Number, default: 40 },
    availableSeats: { type: Number, default: 40 },
    driverName: { type: String },
    driverContact: { type: String },
    busType: {
      type: String,
      enum: ["Male", "Female", "Combined", "Faculty"],
      default: "Combined",
    },
  },
  { timestamps: true }
);

// ✅ Journey Date পরিবর্তন হলে Day স্বয়ংক্রিয়ভাবে Update হবে
busSchema.pre("validate", function () {
  if (this.journeyDate) {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    this.journeyDay = days[this.journeyDate.getUTCDay()];
  }
});

module.exports = mongoose.model("Bus", busSchema);
