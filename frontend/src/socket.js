import { io } from "socket.io-client";
import { config } from "./config.js";

// Use dedicated collaboration service for sockets
const SOCKET_URL = config.SOCKET_URL;

export const socket = io(SOCKET_URL, {
  transports: ["websocket", "polling"],
  withCredentials: true,
});
