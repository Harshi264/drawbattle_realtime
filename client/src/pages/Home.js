import React from "react";  // changed in line 22 feature coming soon to the present
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();
  
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
      <h1 className="text-4xl font-bold mb-6">🎨 Welcome to Draw Battle</h1>
      <p className="text-lg mb-8 text-center max-w-md">
        Join a room and start drawing with your friends in real-time!
      </p>
      <div className="flex gap-4">
        <button
          className="px-6 py-3 bg-green-500 hover:bg-green-600 rounded-lg text-lg font-medium shadow-md transition-all duration-200"
          onClick={() => navigate("/gameroom")}
        >
          🖌 Start Drawing
        </button>
        <button
          className="px-6 py-3 bg-gray-800 hover:bg-gray-900 rounded-lg text-lg font-medium shadow-md transition-all duration-200"
          onClick={() => navigate("/mongo_leaderboard")}
        >
           🏆 Global Leaderboard
        </button>
      </div>
    </div>
  );
};

export default Home;