import React, { useRef, useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import socket from "../socket";
import { toast } from "react-toastify";
const canvasStyles = `
  .pencil-cursor {
    cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><circle cx="10" cy="10" r="8" fill="none" stroke="black" stroke-width="2"/></svg>') 10 10, crosshair;
  }
  .eraser-cursor {
    cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><rect x="6" y="6" width="8" height="8" fill="none" stroke="red" stroke-width="2"/></svg>') 10 10, crosshair;
  }
`;
const Canvas = () => {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const hasListeners = useRef(false);
  const navigate = useNavigate();

  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const room = params.get("room") || "defaultRoom";
  const drawerParam = params.get("drawer") === "true";
  
  // Get username from URL params
  const username = params.get("username") || `Anonymous_${Date.now()}`;
  // Get email from URL params
  const email = params.get("email") || "";
  const [isDrawing, setIsDrawing] = useState(false);
  const [gameWord, setGameWord] = useState("");
  const [isDrawer, setIsDrawer] = useState(drawerParam);
  const [guess, setGuess] = useState("");
  const [guessHistory, setGuessHistory] = useState([]);
  const [timeLeft, setTimeLeft] = useState(null);
  const timerRef = useRef(null);
  const [currentRound, setCurrentRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(1);

  const [votes, setVotes] = useState({ likes: 0, dislikes: 0 });
  const [userVote, setUserVote] = useState(null);

  const [participants, setParticipants] = useState([]);
  
  // Drawing tools state
  const [currentTool, setCurrentTool] = useState("pencil");
  const [brushSize, setBrushSize] = useState(3);

  const drawLine = useCallback((x0, y0, x1, y1, tool = "pencil", size = 3, emit = false) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    
    ctx.lineWidth = size;
    
    if (tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle =  "#000000";
    }
    
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    ctx.closePath();
    
    if (emit) {
      socket.emit("drawing", { 
        x0, y0, x1, y1, room, 
        tool: tool,
        size: size
      });
    }
  }, [room]);

  useEffect(() => {
    console.log("🎨 Canvas component mounted:", { room, username, drawerParam });

    // Validation
    if (!username || username === "Anonymous" || !room) {
      console.error("❌ Missing required params:", { username, room });
      alert("Invalid access. Please join through the proper form.");
      return;
    }

    if (!socket.connected) {
      socket.connect();
    }

    // Set username on socket and join room
    socket.auth = { username,email };
    socket.username = username;
    socket.email = email;
    console.log(`🔗 Joining room "${room}" as "${username}"`);
    console.log('DEBUG: Email being sent:', email); // Add this
    console.log('DEBUG: Username being sent:', username);
    socket.emit("joinRoom", { room, username, email });

    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.strokeStyle = "black";
    ctx.lineWidth = brushSize;
    ctxRef.current = ctx;

    const clearCanvas = () => {
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    if (!hasListeners.current) {
      socket.on("drawing", (data) => {
        if (data && typeof data.x0 === 'number') {
          drawLine(data.x0, data.y0, data.x1, data.y1, data.tool || "pencil", data.size || 3);
        }
      });

      socket.on("clearCanvas", clearCanvas);

      socket.on("startGame", (data) => {
        console.log("🎮 Game started in Canvas with data:", data);
        if (data) {
          setIsDrawer(data.isDrawer);
          setGameWord(data.word || "");
          setGuessHistory([]);
          setUserVote(null);
          setVotes({ likes: 0, dislikes: 0 });
          setCurrentRound(data.currentRound || 1);
          setTotalRounds(data.totalRounds || 1);
        }
      });

      socket.on("guessResult", (data) => {
        if (!data) return;
        const { guesser, isCorrect, guessText } = data;
        
        const message = isCorrect
          ? `🎉 ${guesser} guessed correctly!`
          : `❌ ${guesser} guessed "${guessText}" and it was wrong.`;
        
        toast(message, {
          type: isCorrect ? "success" : "error",
          position: "top-center",
          autoClose: 3000,
        });
        
        setGuessHistory(prev => [...prev, { message, isCorrect }]);
      });

      socket.on("vote", (data) => {
        console.log("🗳️ Vote update:", data);
        if (data && typeof data.likes === 'number' && typeof data.dislikes === 'number') {
          setVotes({ likes: data.likes, dislikes: data.dislikes });
        }
      });

      socket.on("drawingRatedFeedback", (data) => {
        if (!data) return;
        const msg = `🗳️ ${data.username} ${data.liked ? "liked 👍" : "disliked 👎"} the drawing.`;
        toast(msg, {
          type: data.liked ? "info" : "warning",
          position: "top-center",
          autoClose: 2000,
        });
      });

      socket.on("startTimer", (data) => {
        if (!data || typeof data.startTime !== 'number' || typeof data.duration !== 'number') return;
        clearInterval(timerRef.current);
        const tick = () => {
          const now = Date.now();
          const secondsElapsed = Math.floor((now - data.startTime) / 1000);
          const remaining = Math.max(data.duration - secondsElapsed, 0);
          setTimeLeft(remaining);
          if (remaining <= 0) clearInterval(timerRef.current);
        };
        tick();
        timerRef.current = setInterval(tick, 1000);
      });

      socket.on("updateParticipants", (playersData) => {
        console.log("👥 Participants update received:", playersData);
        setParticipants(playersData || []);
      });

      socket.on("showAnswer", ({ correctWord }) => {
        navigate(`/answerreveal?room=${room}&username=${username}&answer=${correctWord}&nextAction=nextTurn&round=${currentRound}&totalRounds=${totalRounds}`);
      });

      socket.on("nextTurn", (data) => {
        navigate(`/wordchooser?room=${room}&username=${username}`);
      });

      socket.on("roundComplete", (data) => {
        navigate(`/answerreveal?room=${room}&username=${username}&answer=${gameWord}&nextAction=nextRound&round=${data.currentRound}&totalRounds=${data.totalRounds}`);
      });

      // Fixed gameFinished handler
      socket.on("gameFinished", (data) => {
        console.log("🏁 Game finished with data:", data);
        
        // Clear any running timers
        clearInterval(timerRef.current);
        
        // Show completion toast
        toast("🎉 Game completed! Thanks for playing!", {
          type: "success",
          position: "top-center",
          autoClose: 2000,
        });

        // Navigate to winner display with proper error handling
        setTimeout(() => {
          try {
            if (data && data.leaderboard && data.winner) {
              const leaderboardParam = encodeURIComponent(JSON.stringify(data.leaderboard));
              const winnerParam = encodeURIComponent(JSON.stringify(data.winner));
              console.log("🎯 Navigating to winner page with data:", { leaderboard: data.leaderboard, winner: data.winner });
              navigate(`/winner?room=${room}&username=${username}&leaderboard=${leaderboardParam}&winner=${winnerParam}`);
            } else {
              // Fallback - still go to winner page but without detailed data
              console.log("⚠️ No game data provided, navigating to winner page without detailed results");
              navigate(`/winner?room=${room}&username=${username}`);
            }
          } catch (error) {
            console.error("❌ Error navigating to winner page:", error);
            // Final fallback - go to gameroom
            navigate("/gameroom");
          }
        }, 1000);
      });

      hasListeners.current = true;
    }

    // Request game state
    socket.emit("getCanvasGameState", { room }, (data) => {
      console.log("🔄 Received canvas game state:", data);
      if (data) {
        if (data.word) {
          setIsDrawer(data.isDrawer);
          setGameWord(data.word);
          if (data.votes) setVotes(data.votes);
        }
        setCurrentRound(data.currentRound || 1);
        setTotalRounds(data.totalRounds || 1);
      }
    });

    return () => {
      socket.off("drawing");
      socket.off("clearCanvas");
      socket.off("startGame");
      socket.off("guessResult");
      socket.off("startTimer");
      socket.off("vote");
      socket.off("drawingRatedFeedback");
      socket.off("updateParticipants");
      socket.off("showAnswer");
      socket.off("nextTurn");
      socket.off("roundComplete");
      socket.off("gameFinished");
      clearInterval(timerRef.current);
      hasListeners.current = false;
    };
  }, [room, drawLine, username, brushSize, navigate, currentRound, totalRounds, gameWord]);

  const handleMouseDown = (e) => {
    if (!isDrawer || !e.nativeEvent) return;
    setIsDrawing(true);
    ctxRef.current.lastX = e.nativeEvent.offsetX;
    ctxRef.current.lastY = e.nativeEvent.offsetY;
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || !isDrawer || !e.nativeEvent) return;
    const currentX = e.nativeEvent.offsetX;
    const currentY = e.nativeEvent.offsetY;
    drawLine(
      ctxRef.current.lastX, 
      ctxRef.current.lastY, 
      currentX, 
      currentY, 
      currentTool,
      brushSize,
      true
    );
    ctxRef.current.lastX = currentX;
    ctxRef.current.lastY = currentY;
  };

  const handleMouseUp = () => setIsDrawing(false);

  const clearCanvasButton = () => {
    if (!isDrawer) return;
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      socket.emit("clearCanvas", room);
    }
  };

  const submitGuess = () => {
    if (!guess.trim()) return;
    socket.emit("checkGuess", { room, guess: guess.trim(), username });
    setGuess("");
  };

  const handleVote = (type) => {
    if (userVote === type) return;
    setUserVote(type);
    const liked = type === "like";
    socket.emit("drawingRated", { room, liked, username });
  };

  const formatTimeLeft = (seconds) => {
    if (seconds === null || seconds < 0) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const formatWordDisplay = (word) => {
    if (!word) return "Waiting for word...";
    if (isDrawer) return ` ${word}`;
    return " " + word.split("").map(ch => ch === " " ? " " : "_").join(" ");
  };

  return (
    <>
    <style>{canvasStyles}</style>
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 py-4 px-6 text-center shadow-sm">
        <div className="flex justify-center items-center gap-6 mb-2">
          <span className="text-sm text-gray-600">
            You are: <strong className="text-indigo-600">{username}</strong> | Role: <strong className="text-purple-600">{isDrawer ? "Drawer" : "Guesser"}</strong>
          </span>
          <span className="text-lg font-semibold text-gray-800">
            Room: <span className="text-blue-600">{room}</span> | 
            Round: <span className="text-green-600">{currentRound}</span> of <span className="text-green-600">{totalRounds}</span> | 
            Word:<span className="text-green-600">{formatWordDisplay(gameWord)}</span>
          </span>
          {timeLeft !== null && (
            <span className="text-lg font-semibold text-red-600">
              ⏰ Time Left: {formatTimeLeft(timeLeft)}
            </span>
          )}
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Sidebar - Guess History */}
        <div className="w-80 bg-white/90 backdrop-blur-sm border-r border-gray-200/50 flex flex-col shadow-lg">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-3 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-white flex items-center">
              💬 Guess History
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {guessHistory.length === 0 ? (
              <div className="text-gray-500 italic text-center py-8">
                Game started! Start drawing...
              </div>
            ) : (
              guessHistory.map((entry, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg text-sm shadow-sm ${
                    entry.isCorrect 
                      ? "bg-green-100 text-green-800 border border-green-200" 
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {entry.message}
                </div>
              ))
            )}
          </div>

          {!isDrawer && (
            <div className="border-t border-gray-200 p-4 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                  placeholder="Enter your guess..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-black focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
                  onKeyPress={(e) => e.key === 'Enter' && submitGuess()}
                />
                <button
                  onClick={submitGuess}
                  className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Send
                </button>
              </div>
              
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => handleVote("like")}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm ${
                    userVote === "like"
                      ? "bg-green-500 text-white shadow-md"
                      : "bg-green-100 hover:bg-green-200 text-green-800 hover:shadow-md"
                  }`}
                >
                  👍 {votes.likes}
                </button>
                <button
                  onClick={() => handleVote("dislike")}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm ${
                    userVote === "dislike"
                      ? "bg-red-500 text-white shadow-md"
                      : "bg-red-100 hover:bg-red-200 text-red-800 hover:shadow-md"
                  }`}
                >
                  👎 {votes.dislikes}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Center - Canvas Section */}
        <div className="flex-1 flex flex-col bg-white/90 backdrop-blur-sm shadow-lg">
          <div className="flex-1 p-6 flex justify-center items-center bg-gradient-to-br from-gray-50 to-blue-50">
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              className={`border-2 border-gray-300 bg-white rounded-lg shadow-lg ${
                !isDrawer ? "cursor-not-allowed" : 
                currentTool === "pencil" ? "pencil-cursor" : "eraser-cursor"
              }`}
              style={{ touchAction: 'none' }}
            />
          </div>

          {/* Drawing Tools */}
          <div className="border-t border-gray-200 bg-gradient-to-r from-gray-50 to-indigo-50 p-4 shadow-inner">
            <div className="flex justify-center items-center gap-4">
              {isDrawer && (
                <>
                  <button
                    onClick={() => setCurrentTool("pencil")}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-md ${
                      currentTool === "pencil"
                        ? "bg-blue-500 text-white shadow-lg"
                        : "bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 hover:shadow-lg"
                    }`}
                  >
                    ✏️ Pencil
                  </button>
                  <button
                    onClick={() => setCurrentTool("eraser")}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-md ${
                      currentTool === "eraser"
                        ? "bg-orange-500 text-white shadow-lg"
                        : "bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 hover:shadow-lg"
                    }`}
                  >
                    🧹 Eraser
                  </button>
                  
                  <div className="flex items-center gap-2 mx-4 bg-white px-3 py-2 rounded-lg shadow-md border border-gray-200">
                    <label className="text-sm font-medium text-gray-700">Size:</label>
                    <input
                      type="range"
                      min="1"
                      max="20"
                      value={brushSize}
                      onChange={(e) => setBrushSize(parseInt(e.target.value))}
                      className="w-20"
                    />
                    <span className="text-sm text-gray-600 w-6 font-semibold">{brushSize}</span>
                  </div>

                  <button
                    className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                    onClick={clearCanvasButton}
                  >
                    Clear Canvas
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar - Participants */}
        <div className="w-80 bg-white/90 backdrop-blur-sm border-l border-gray-200/50 flex flex-col shadow-lg">
          <div className="bg-gradient-to-r from-purple-500 to-pink-600 px-4 py-3 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-white flex items-center">
              🏆 Leaderboard ({participants.length})
            </h3>
          </div>
          
          <div className="flex-1 p-4 space-y-3 bg-gradient-to-b from-purple-50 to-pink-50">
            {participants.length === 0 ? (
              <p className="text-gray-500 italic text-center py-8">No participants yet.</p>
            ) : (
              participants
                .sort((a, b) => (b.score || 0) - (a.score || 0)) // Sort by score descending
                .map((participant, idx) => {
                  const isFirst = idx === 0 && participant.score > 0;
                  const isCurrentUser = participant.username === username;
                  
                  return (
                    <div 
                      key={idx} 
                      className={`flex items-center gap-3 p-3 rounded-lg border shadow-sm hover:shadow-md transition-all duration-200 ${
                        isCurrentUser 
                          ? "bg-blue-100 border-blue-300 ring-2 ring-blue-200" 
                          : "bg-white/80 backdrop-blur-sm border-gray-200"
                      } ${
                        isFirst ? "ring-2 ring-yellow-400 bg-gradient-to-r from-yellow-50 to-amber-50" : ""
                      }`}
                    >
                      {/* Rank */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                        isFirst ? "bg-gradient-to-r from-yellow-500 to-amber-500" :
                        idx === 1 ? "bg-gradient-to-r from-gray-400 to-gray-500" :
                        idx === 2 ? "bg-gradient-to-r from-orange-400 to-orange-500" :
                        "bg-gradient-to-r from-purple-500 to-pink-500"
                      }`}>
                        {isFirst ? "👑" : `#${idx + 1}`}
                      </div>
                      
                      {/* User Info */}
                      <div className="flex-1">
                        <div className={`font-semibold ${isCurrentUser ? "text-blue-900" : "text-gray-800"}`}>
                          {participant.username}
                          {isCurrentUser && <span className="text-xs ml-1 text-blue-600">(You)</span>}
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          {participant.isDrawer && (
                            <span className="text-green-600 font-medium flex items-center">
                              🎨 Drawing
                            </span>
                          )}
                          <span className={`font-bold ${
                            isFirst ? "text-yellow-700" : "text-gray-600"
                          }`}>
                            🏆 {participant.score || 0} pts
                          </span>
                        </div>
                      </div>
                      
                      {/* Online Indicator */}
                      <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm animate-pulse"></div>
                    </div>
                  );
                })
            )}
          </div>
          
          {/* Score Legend */}
          <div className="border-t border-gray-200 p-3 bg-gradient-to-r from-gray-50 to-indigo-50">
            <div className="text-xs text-gray-600 space-y-1">
              <div className="font-semibold text-center mb-2">🎯 Scoring System</div>
              <div>✅ Correct guess: 20-100 pts (speed bonus)</div>
              <div>🥇 First correct: +30 pts</div>
              {/* <div>🎨 Drawing rating: +2 pts per net like</div> */}
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default Canvas;