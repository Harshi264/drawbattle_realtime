// I am making changes here if they don't work remove as i said after line 7 I added email function and after line 40 I added email input and after line 23 I added if(email) thing
import React, { useState,useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function GameRoom() {
  const [username, setUsername] = useState("");
  const [roomName, setRoomName] = useState("");
const [email, setEmail] = useState("");

// Load saved email on component mount
useEffect(() => {
  const savedEmail = localStorage.getItem('drawBattleEmail');
  if (savedEmail) {
    setEmail(savedEmail);
  }
}, []);
  const navigate = useNavigate();

  const handleEnterRoom = () => {
    if (!username || !roomName) {
      alert("Please enter both username and room name");
      return;
    }
      if (email) {
    localStorage.setItem('drawBattleEmail', email);
  }       
    // Navigate to SetRounds for drawer to set rounds first
    navigate(`/setrounds?room=${roomName}&username=${username}`);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-r from-indigo-500 to-pink-500 text-white">
      <h1 className="text-4xl font-bold mb-6">🎨 Who Draws, Who Wins? 🏆</h1>
                 
      <div className="bg-white bg-opacity-20 p-8 rounded-lg backdrop-blur-sm">
        <input
          type="text"
          placeholder="Enter Your Username"
          className="mb-4 px-4 py-2 rounded text-black w-full"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
  type="email"
  placeholder="Enter Your Email (for global leaderboard)"
  className="mb-4 px-4 py-2 rounded text-black w-full"
  value={email}
  onChange={(e) => {
    setEmail(e.target.value);
    // Save to localStorage as user types
    if (e.target.value) {
      localStorage.setItem('drawBattleEmail', e.target.value);
    }
  }}
/>
        <input
          type="text"
          placeholder="Enter a room name to join or create"
          className="mb-4 px-4 py-2 rounded text-black w-full"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
        />
        <button
          className="w-full px-6 py-2 bg-green-500 hover:bg-green-600 rounded font-semibold shadow-md transition-colors"
          onClick={handleEnterRoom}
        >
          🌟 Begin the Battle of Brushes
        </button>
      </div>
                 
      <p className="mt-4 text-sm opacity-80">
        Share the room name with friends so they can join as guessers!
      </p>
    </div>
  );
}