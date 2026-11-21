
import { io } from "socket.io-client";

// আপনার সার্ভারের ঠিকানা (Environment Variable থেকে নেওয়া হবে)
const URL =
  import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

// Localhost অথবা Live Server-এর সাথে Socket.IO Connection তৈরি করা
export const socket = io(URL, {
  transports: ["websocket"], // রিয়েল-টাইম কমিউনিকেশনের জন্য WebSocket ব্যবহার করা
});
