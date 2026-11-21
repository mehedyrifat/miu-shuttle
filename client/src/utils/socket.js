
import { io } from "socket.io-client";

const URL =
  import.meta.env.VITE_SOCKET_URL ||
  "https://miu-shuttle-api.onrender.com";

export const socket = io(URL, {
  transports: ["websocket"],
});
