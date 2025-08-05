import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const RoundTransition = () => {
  const [countdown, setCountdown] = useState(3);
  const navigate = useNavigate();
  const location = useLocation();
  
  const params = new URLSearchParams(location.search);
  const room = params.get("room");
  const username = params.get("username");
  const currentRound = params.get("round");
  const totalRounds = params.get("totalRounds");

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Navigate to word chooser for the new round
          navigate(`/wordchooser?room=${room}&username=${username}`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate, room, username]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-purple-600 via-pink-600 to-red-500 text-white">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4 animate-pulse">
          🎯 Round {currentRound}
        </h1>
        <p className="text-2xl mb-8">
          of {totalRounds} rounds
        </p>
        
        <div className="bg-white/20 backdrop-blur-sm p-8 rounded-xl shadow-2xl">
          <h2 className="text-3xl font-semibold mb-4">
            Get Ready!
          </h2>
          <p className="text-lg mb-6">
            Room: <span className="font-bold text-yellow-300">{room}</span>
          </p>
          
          <div className="text-8xl font-bold text-yellow-300 mb-4 animate-bounce">
            {countdown}
          </div>
          
          <p className="text-sm opacity-80">
            Starting in {countdown} second{countdown !== 1 ? 's' : ''}...
          </p>
        </div>
      </div>
    </div>
  );
};

export default RoundTransition;