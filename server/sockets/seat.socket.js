

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("🟢 User connected:", socket.id);

    // ✅ নতুন ইভেন্ট: বাসের রুমে জয়েন করা
    socket.on("joinBusRoom", (busId) => {
      socket.join(busId);
      console.log(`Socket ${socket.id} joined room ${busId}`);
    });

    socket.on("disconnect", () => {
      console.log("🔴 User disconnected:", socket.id);
    });
  });
};