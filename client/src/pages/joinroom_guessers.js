import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function JoinRoom() {
  const [username, setUsername] = useState(
    localStorage.getItem("username") || ""
  );
  const [roomName, setRoomName] = useState("");
  const navigate = useNavigate();

  const handleJoinRoom = () => {
    if (!username || !roomName) {
      alert("Please enter both username and room name");
      return;
    }
    
    localStorage.setItem("username", username);
    
    // Navigate directly to canvas with username in URL
    navigate(`/canvas?room=${roomName}&username=${username}&drawer=false`);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-r from-purple-500 to-cyan-500 text-white">
      <h1 className="text-4xl font-bold mb-6">🎯 Join Game Room</h1>
      
      <div className="bg-white bg-opacity-20 p-8 rounded-lg backdrop-blur-sm">
        <input
          type="text"
          placeholder="Enter Your Username"
          className="mb-4 px-4 py-2 rounded text-black w-full"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="text"
          placeholder="Enter Room Name"
          className="mb-4 px-4 py-2 rounded text-black w-full"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
        />
        <button
          className="w-full px-6 py-2 bg-green-500 hover:bg-green-600 rounded font-semibold shadow-md transition-colors"
          onClick={handleJoinRoom}
        >
          Join as Guesser 🎯
        </button>
      </div>
      
      <p className="mt-4 text-sm opacity-80">
        Enter the room name shared by the drawer to join the game!
      </p>
    </div>
  );
}