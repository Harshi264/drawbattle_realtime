import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const AnswerReveal = () => {
  const [countdown, setCountdown] = useState(3);
  const navigate = useNavigate();
  const location = useLocation();
  
  const params = new URLSearchParams(location.search);
  const room = params.get("room");
  const username = params.get("username");
  const answer = params.get("answer");
  const nextAction = params.get("nextAction"); // "nextTurn" or "nextRound" or "gameEnd"
  const currentRound = params.get("round");
  const totalRounds = params.get("totalRounds");

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          
          // Navigate based on next action
          if (nextAction === "nextRound") {
            navigate(`/roundtransition?room=${room}&username=${username}&round=${currentRound}&totalRounds=${totalRounds}`);
          } else if (nextAction === "gameEnd") {
            navigate(`/gameroom`); // Or create a game finished page
          } else {
            // Next turn - go to word chooser
            navigate(`/wordchooser?room=${room}&username=${username}`);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate, room, username, nextAction, currentRound, totalRounds]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-green-500 via-blue-500 to-purple-600 text-white">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-6">
          🎉 The Answer Was:
        </h1>
        
        <div className="bg-white/20 backdrop-blur-sm p-8 rounded-xl shadow-2xl mb-8">
          <div className="text-6xl font-bold text-yellow-300 mb-4 animate-pulse">
            "{answer}"
          </div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg">
          <p className="text-lg mb-2">
            Room: <span className="font-bold text-yellow-300">{room}</span>
          </p>
          <p className="text-lg mb-4">
            Round: <span className="font-bold text-green-300">{currentRound}</span> of {totalRounds}
          </p>
          
          <div className="text-4xl font-bold text-red-300 mb-2">
            {countdown}
          </div>
          
          <p className="text-sm opacity-80">
            {nextAction === "nextRound" 
              ? `Moving to next round in ${countdown}...`
              : nextAction === "gameEnd"
              ? `Game finished! Redirecting in ${countdown}...`
              : `Next player's turn in ${countdown}...`
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default AnswerReveal;