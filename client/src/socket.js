import { io } from "socket.io-client";

// Get username from localStorage
const username = localStorage.getItem("username");

const socket = io("http://localhost:5000", {
  auth: { username },           // Send username to backend
  autoConnect: false,           // Connect manually in components
  transports: ["websocket"],    // Use WebSocket directly
});

export default socket;

