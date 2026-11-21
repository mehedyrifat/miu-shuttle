
const Bus = require("../models/bus.model.js");

// Bangladesh date and time
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
  };
};

// Escape special regex characters
const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Find buses according to route and 5 PM booking window
const findBuses = async (req, res) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({
        message: "Route (from & to) is required",
      });
    }

    const current = getDhakaDateTime();

    // Before 5 PM: Today
    // At or after 5 PM: Tomorrow
    const isAfterFive = current.time >= "17:00";

    const targetDate = new Date(
      `${current.date}T00:00:00.000Z`
    );

    if (isAfterFive) {
      targetDate.setUTCDate(targetDate.getUTCDate() + 1);
    }

    const startOfDay = targetDate;

    const endOfDay = new Date(startOfDay);
    endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);

    const busQuery = {
      routeFrom: {
        $regex: escapeRegex(from.trim()),
        $options: "i",
      },
      routeTo: {
        $regex: escapeRegex(to.trim()),
        $options: "i",
      },
      journeyDate: {
        $gte: startOfDay,
        $lt: endOfDay,
      },
    };

    // Before 5 PM, exclude buses that have already departed
    if (!isAfterFive) {
      busQuery.departureTime = {
        $gt: current.time,
      };
    }

    const buses = await Bus.find(busQuery).sort({
      departureTime: 1,
    });

    return res.status(200).json(buses);
  } catch (err) {
    console.error("Find Buses Error:", err);

    return res.status(500).json({
      message: "Error fetching buses",
      error: err.message,
    });
  }
};

// Get all routes for autocomplete
const getBusRoutes = async (req, res) => {
  try {
    const fromRoutes = await Bus.distinct("routeFrom");
    const toRoutes = await Bus.distinct("routeTo");

    const allRoutes = [
      ...new Set([...fromRoutes, ...toRoutes]),
    ];

    const filteredRoutes = allRoutes.filter(
      (route) =>
        route &&
        route.toLowerCase() !== "campus"
    );

    return res.status(200).json(filteredRoutes);
  } catch (err) {
    return res.status(500).json({
      message: "Error fetching routes",
      error: err.message,
    });
  }
};

module.exports = {
  findBuses,
  getBusRoutes,
};
