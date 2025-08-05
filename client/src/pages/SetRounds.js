import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import socket from "../socket";

const SetRounds = () => {
  const [rounds, setRounds] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isDrawer, setIsDrawer] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const params = new URLSearchParams(location.search);
  const room = params.get("room");
  const username = params.get("username");

  useEffect(() => {
    if (!room || !username) {
      alert("Invalid access. Please join through the proper form.");
      navigate("/gameroom");
      return;
    }

    console.log("🎯 SetRounds: Connecting and checking role...", { room, username });

    // Connect socket if not already connected
    if (!socket.connected) {
      socket.connect();
    }

    // Set username on socket
    
    socket.username = username;

    
      const savedEmail = localStorage.getItem('drawBattleEmail');
      socket.email = savedEmail; 
      socket.auth = { username, email: savedEmail };
      console.log('DEBUG: Email being sent:', savedEmail); // Add this
      console.log('DEBUG: Username being sent:', username);
      socket.emit("joinRoom", { room, username, email: savedEmail });
    // Listen for role assignment
    socket.on("role", (data) => {
      console.log("🎭 SetRounds: Role received:", data);
      
      if (data.gameFinished) {
        alert("This game has already finished. Please join a different room.");
        navigate("/gameroom");
        return;
      }

      if (data.isDrawer) {
        console.log("👨‍🎨 User is drawer - showing rounds selection");
        setIsDrawer(true);
        setIsLoading(false);
        
        // Check if there's already an active game
        socket.emit("checkActiveGame", room);
        socket.once("activeGameFound", (gameData) => {
          console.log("🎮 Active game found, redirecting to canvas");
          navigate(`/canvas?room=${room}&username=${username}&drawer=true`);
        });
      } else {
        console.log("🎨 User is guesser - checking for active game");
        
        // User is a guesser, check if there's an active game to join
        socket.emit("checkActiveGame", room);
        
        const timeout = setTimeout(() => {
          alert("No active game in this room. Please wait for the drawer to start a game, or try a different room.");
          navigate("/gameroom");
        }, 2000);

        socket.once("activeGameFound", (gameData) => {
          clearTimeout(timeout);
          console.log("🎮 Active game found for guesser, joining canvas");
          const email = params.get("email") || "";
          navigate(`/canvas?room=${room}&username=${username}&drawer=false`);
        });
      }
    });

    // Cleanup function
    return () => {
      socket.off("role");
      socket.off("activeGameFound");
    };
  }, [room, username, navigate]);

  const handleProceed = () => {
    if (!isDrawer) return;
    
    console.log(`🎯 Drawer selected ${rounds} rounds`);
    
    // Send rounds to server
    socket.emit("roundsChosen", { room, rounds });
    
    // Navigate to word chooser
    navigate(`/wordchooser?room=${room}&username=${username}`);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-purple-500 to-pink-500 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold mb-2">🔄 Connecting to Room</h2>
          <p className="text-lg opacity-90">Room: <strong>{room}</strong></p>
          <p className="text-sm opacity-75 mt-2">Determining your role...</p>
        </div>
      </div>
    );
  }

  if (!isDrawer) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-purple-500 to-pink-500 text-white">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">🎨 Waiting for Game</h2>
          <p className="text-lg mb-2">You are a <strong>Guesser</strong> in room: <strong>{room}</strong></p>
          <p className="text-sm opacity-75">Looking for active games to join...</p>
          <div className="animate-pulse mt-4">
            <div className="w-8 h-8 bg-white rounded-full mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-purple-500 to-pink-500 text-white">
      <div className="bg-white bg-opacity-20 p-8 rounded-lg backdrop-blur-sm text-center">
        <h1 className="text-3xl font-bold mb-6">🎮 Game Setup</h1>
        
        <div className="mb-6">
          <p className="text-lg mb-2">You are the <strong>Drawer</strong> for room:</p>
          <p className="text-2xl font-bold text-yellow-300">{room}</p>
        </div>
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">How many rounds would you like to play?</h2>
          <div className="flex justify-center items-center gap-4 mb-4">
            <button 
              className="w-12 h-12 bg-white bg-opacity-30 hover:bg-opacity-50 rounded-full text-2xl font-bold transition-all"
              onClick={() => setRounds(Math.max(1, rounds - 1))}
            >
              -
            </button>
            <span className="text-4xl font-bold w-16 text-center">{rounds}</span>
            <button 
              className="w-12 h-12 bg-white bg-opacity-30 hover:bg-opacity-50 rounded-full text-2xl font-bold transition-all"
              onClick={() => setRounds(Math.min(10, rounds + 1))}
            >
              +
            </button>
          </div>
          <p className="text-sm opacity-75">Each round = each player gets to draw once</p>
        </div>
        
        <button
          className="px-8 py-3 bg-green-500 hover:bg-green-600 rounded-lg text-lg font-semibold shadow-lg transition-all duration-200"
          onClick={handleProceed}
        >
          ✅ Proceed to Word Selection
        </button>
      </div>
      
      <p className="mt-4 text-sm opacity-80 text-center max-w-md">
        Other players joining this room will automatically become guessers and join the game when you start drawing!
      </p>
    </div>
  );
};

export default SetRounds;

