
const Booking = require("../models/booking.model");
const Bus = require("../models/bus.model");

// Bangladesh local date and time
const getDhakaDateTime = () => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());

  const values = {};

  parts.forEach(({ type, value }) => {
    values[type] = value;
  });

  return {
    date: `${values.year}-${values.month}-${values.day}`,
    time: `${values.hour}:${values.minute}`,
    hour: Number(values.hour),
  };
};

// Stored journeyDate is UTC midnight
const getBusDateKey = (date) => {
  const d = new Date(date);

  return [
    d.getUTCFullYear(),
    String(d.getUTCMonth() + 1).padStart(2, "0"),
    String(d.getUTCDate()).padStart(2, "0"),
  ].join("-");
};

// Get next calendar date
const getNextDate = (dateString) => {
  const date = new Date(`${dateString}T00:00:00.000Z`);

  date.setUTCDate(date.getUTCDate() + 1);

  return date.toISOString().slice(0, 10);
};

// Format journey date for display
const formatJourneyDate = (dateString) => {
  const date = new Date(`${dateString}T00:00:00.000Z`);

  const day = date.getUTCDate();

  const month = date.toLocaleString("en-US", {
    month: "short",
    timeZone: "UTC",
  });

  const year = date.getUTCFullYear();

  const weekday = date.toLocaleString("en-US", {
    weekday: "long",
    timeZone: "UTC",
  });

  const suffix =
    day % 10 === 1 && day !== 11
      ? "st"
      : day % 10 === 2 && day !== 12
      ? "nd"
      : day % 10 === 3 && day !== 13
      ? "rd"
      : "th";

  return `${day}${suffix} - ${month} - ${year} | ${weekday}`;
};

// Convert Bangladesh journey date and departure time to timestamp
const getJourneyTimestamp = (date, departureTime) => {
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = departureTime.split(":").map(Number);

  // Bangladesh is UTC+6
  return new Date(
    Date.UTC(year, month - 1, day, hours - 6, minutes)
  );
};

// Create new booking
const createBooking = async (req, res) => {
  let reservedBusId = null;

  try {
    const { busId, seatNumber } = req.body;
    const userId = req.user.uid;

    if (!busId || seatNumber === undefined || seatNumber === null) {
      return res.status(400).json({
        message: "Bus and seat information are required.",
      });
    }

    const bus = await Bus.findById(busId);

    if (!bus) {
      return res.status(404).json({
        message: "Bus not found.",
      });
    }

    if (!bus.journeyDate || !bus.departureTime) {
      return res.status(400).json({
        message: "This bus does not have a valid journey schedule.",
      });
    }

    // Validate departure time format
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(bus.departureTime)) {
      return res.status(400).json({
        message: "Invalid bus departure time.",
      });
    }

    // Global 5 PM booking window
    const current = getDhakaDateTime();

    const targetDate =
      current.hour >= 17
        ? getNextDate(current.date)
        : current.date;

    const busDate = getBusDateKey(bus.journeyDate);

    if (busDate !== targetDate) {
      return res.status(400).json({
        message: "Booking is not available for this journey date.",
      });
    }

    // Before 5 PM, already departed buses cannot be booked
    if (
      current.hour < 17 &&
      bus.departureTime <= current.time
    ) {
      return res.status(400).json({
        message: "This bus has already departed.",
      });
    }

    const selectedSeat = Number(seatNumber);

    if (
      !Number.isInteger(selectedSeat) ||
      selectedSeat < 1 ||
      selectedSeat > bus.totalSeats
    ) {
      return res.status(400).json({
        message: "Invalid seat number.",
      });
    }

    // Check whether this seat is already booked
    const existing = await Booking.findOne({
      busId,
      seatNumber: selectedSeat,
    });

    if (existing) {
      return res.status(409).json({
        message: "Seat already booked!",
      });
    }

    // Atomically reserve one available seat
    const reservedBus = await Bus.findOneAndUpdate(
      {
        _id: busId,
        availableSeats: { $gt: 0 },
      },
      {
        $inc: { availableSeats: -1 },
      },
      { new: true }
    );

    if (!reservedBus) {
      return res.status(400).json({
        message: "No seats available.",
      });
    }

    reservedBusId = busId;

    const journeyTimestamp = getJourneyTimestamp(
      busDate,
      bus.departureTime
    );

    const booking = await Booking.create({
      userId,
      busId,
      seatNumber: selectedSeat,

      // Use route and date from the actual Bus Schedule
      journeyFrom: bus.routeFrom,
      journeyTo: bus.routeTo,
      journeyDate: formatJourneyDate(busDate),
      journeyTimestamp,
    });

    // Booking successful; no rollback needed
    reservedBusId = null;

    const io = req.app.get("socketio");

    if (io) {
      io.to(busId.toString()).emit("seatStatusUpdate", {
        busId: busId.toString(),
        seatNumber: selectedSeat,
        bookedBy: userId,
      });
    }

    return res.status(201).json({
      message: "Seat booked successfully",
      booking,
    });
  } catch (err) {
    // Restore the seat if booking creation fails
    if (reservedBusId) {
      try {
        await Bus.findByIdAndUpdate(reservedBusId, {
          $inc: { availableSeats: 1 },
        });
      } catch (rollbackError) {
        console.error("Seat rollback failed:", rollbackError);
      }
    }

    console.error("Booking Error:", err);

    // Duplicate seat booking protection
    if (err.code === 11000) {
      return res.status(409).json({
        message: "This seat has already been booked.",
      });
    }

    return res.status(500).json({
      message: "Booking failed",
      error: err.message,
    });
  }
};

// User's upcoming bookings
const getUserBookings = async (req, res) => {
  try {
    const userId = req.user.uid;
    const now = new Date();

    const bookings = await Booking.find({
      userId,
      journeyTimestamp: { $gte: now },
    })
      .populate("busId")
      .sort({ journeyTimestamp: 1 });

    return res.json(bookings);
  } catch (err) {
    console.error("Get User Bookings Error:", err);

    return res.status(500).json({
      message: "Error fetching bookings",
    });
  }
};

// User's past bookings
const getUserHistory = async (req, res) => {
  try {
    const userId = req.user.uid;
    const now = new Date();

    const history = await Booking.find({
      userId,
      journeyTimestamp: { $lt: now },
    })
      .populate("busId")
      .sort({ journeyTimestamp: -1 });

    return res.json(history);
  } catch (err) {
    console.error("Get User History Error:", err);

    return res.status(500).json({
      message: "Error fetching history",
    });
  }
};

// Get booked seats for a particular bus schedule
const getBookingsByBus = async (req, res) => {
  try {
    const { busId } = req.params;

    const bookings = await Booking.find({ busId });

    const seatNumbers = bookings.map(
      (booking) => booking.seatNumber
    );

    return res.json(seatNumbers);
  } catch (err) {
    console.error("Get Bookings By Bus Error:", err);

    return res.status(500).json({
      message: "Error fetching bus bookings",
    });
  }
};

// Cancel booking
const cancelBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user.uid;

    // A user can cancel only their own booking
    const booking = await Booking.findOneAndDelete({
      _id: bookingId,
      userId,
    });

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found or you are not authorized to cancel it.",
      });
    }

    // Restore available seat
    await Bus.findByIdAndUpdate(booking.busId, {
      $inc: { availableSeats: 1 },
    });

    const io = req.app.get("socketio");

    if (io) {
      io.to(booking.busId.toString()).emit(
        "seatCancelledUpdate",
        {
          busId: booking.busId.toString(),
          seatNumber: booking.seatNumber,
        }
      );
    }

    return res.json({
      message: "Booking cancelled successfully",
    });
  } catch (err) {
    console.error("Cancel Booking Error:", err);

    return res.status(500).json({
      message: "Cancel failed",
      error: err.message,
    });
  }
};

module.exports = {
  createBooking,
  getUserBookings,
  getUserHistory,
  getBookingsByBus,
  cancelBooking,
};
