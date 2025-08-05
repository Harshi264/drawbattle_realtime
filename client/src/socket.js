import { io } from "socket.io-client";

// Get username from localStorage
const username = localStorage.getItem("username");

const socket = io("https://drawbattle-realtime.onrender.com", {
  auth: { username },           // Send username to backend
  autoConnect: false,           // Connect manually in components
  transports: ["websocket"],    // Use WebSocket directly
});

export default socket;

