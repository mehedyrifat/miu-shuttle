
const express = require("express");
const dotenv = require("dotenv");

// Load environment variables BEFORE importing routes/configs
dotenv.config();

const cors = require("cors");
const morgan = require("morgan");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db.js");

const secureRoutes = require("./routes/secure.routes.js");
const busRoutes = require("./routes/bus.routes.js");
const bookingRoutes = require("./routes/booking.routes.js");

const adminRoutes = require("./routes/admin.routes.js");
const noticeRoutes = require("./routes/notice.routes.js");

// Extra Bus Request Routes
const extraBusRequestRoutes = require("./routes/extraBusRequest.routes.js");

const seatSocket = require("./sockets/seat.socket.js");

const app = express();

connectDB();

// Allowed frontend origins
const allowedOrigins = [
  process.env.CORS_ORIGIN_STUDENT,
  process.env.CORS_ORIGIN_ADMIN,
  "http://localhost:5173",
  "http://localhost:5174",
].filter(Boolean);

// Shared CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
};

// Middlewares
app.use(cors(corsOptions));
app.use(express.json());
app.use(morgan("dev"));

// Routes
app.use("/api/secure", secureRoutes);
app.use("/api/buses", busRoutes);
app.use("/api/bookings", bookingRoutes);

app.use("/api/admin", adminRoutes);
app.use("/api/notices", noticeRoutes);

// Extra Bus Request API
app.use("/api/extra-bus-requests", extraBusRequestRoutes);

app.get("/", (req, res) => {
  res.send("SmartSeat API is running...");
});

// Create HTTP + Socket server
const server = http.createServer(app);

// Socket.IO configuration
const io = new Server(server, {
  cors: corsOptions,
});

// Attach Socket.IO
seatSocket(io);
app.set("socketio", io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
