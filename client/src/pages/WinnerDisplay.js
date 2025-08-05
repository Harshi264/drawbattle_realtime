import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const WinnerDisplay = () => {
  const [showConfetti, setShowConfetti] = useState(true);
  const [countdown, setCountdown] = useState(10);
  const location = useLocation();
  const navigate = useNavigate();

  const params = new URLSearchParams(location.search);
  const room = params.get("room") || "Unknown Room";
  const username = params.get("username") || "Player";
  
  // Get leaderboard data from URL params (passed from server)
  const leaderboardParam = params.get("leaderboard");
  const winnerParam = params.get("winner");
  
  let leaderboard = [];
  let winner = null;
  
  try {
    if (leaderboardParam) {
      leaderboard = JSON.parse(decodeURIComponent(leaderboardParam));
      console.log("📊 Parsed leaderboard:", leaderboard);
    }
    if (winnerParam) {
      winner = JSON.parse(decodeURIComponent(winnerParam));
      console.log("🏆 Parsed winner:", winner);
    }
  } catch (error) {
    console.error("❌ Error parsing game results:", error);
    console.log("Raw params:", { leaderboard: leaderboardParam, winner: winnerParam });
  }

  
  // Handle ties - check if current user has the highest score
const highestScore = leaderboard.length > 0 ? leaderboard[0].score : 0;
const isWinner = leaderboard.some(player => player.username === username && player.score === highestScore);
const winners = leaderboard.filter(player => player.score === highestScore);
const isTie = winners.length > 1;

  useEffect(() => {
    console.log("🎉 WinnerDisplay mounted:", { room, username, leaderboard, winner, isWinner });
    
    
    const confettiTimer = setTimeout(() => {
      setShowConfetti(false);
    }, 5000);

    return () => {
      //clearTimeout(countdownTimer);
      clearTimeout(confettiTimer);
    };
  }, [navigate, room, username, leaderboard, winner, isWinner]);

  const handlePlayAgain = () => {
    console.log("🎮 Play again clicked, navigating to gameroom");
    navigate("/gameroom");
  };

  // If no data was provided, show a fallback message
  if (!leaderboard.length && !winner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-800 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-6xl mb-4">🎨</div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Game Complete!
          </h1>
          <div className="text-xl text-blue-200 mb-8">
            Thanks for playing Draw Battle!
          </div>
          <button
            onClick={handlePlayAgain}
            className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold text-lg rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            🎮 Play Another Game
          </button>
          {/* <div className="mt-4 text-sm text-gray-300">
            Returning to lobby in: <span className="font-bold text-yellow-300">{countdown}s</span>
          </div> */}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-800 flex items-center justify-center relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {showConfetti && (
          <>
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-bounce"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random() * 2}s`
                }}
              >
                {['🎉', '🎊', '⭐', '✨', '🏆', '👑'][Math.floor(Math.random() * 6)]}
              </div>
            ))}
          </>
        )}
        
        {/* Floating circles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={`circle-${i}`}
            className="absolute rounded-full bg-white/10 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${20 + Math.random() * 60}px`,
              height: `${20 + Math.random() * 60}px`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-6">
        {/* Winner Announcement */}
        <div className="mb-8">
          {winner ? (
            <>
              <div className="text-6xl mb-4 animate-bounce">
                {isWinner ? "🎉" : "👑"}
              </div>
              {/* <h1 className="text-5xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 bg-clip-text text-transparent animate-pulse">
  {isTie ? (isWinner ? "IT'S A TIE! YOU WON!" : "IT'S A TIE!") : (isWinner ? "YOU WON!" : `${winner.username} WINS!`)}
</h1> */}
<h1 className="text-5xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 bg-clip-text text-transparent animate-pulse">
  {isTie
    ? "IT'S A TIE!"
    : isWinner
    ? "YOU WON!"
    : `${winner.username} WINS!`}
</h1>

<div className="text-2xl md:text-3xl font-semibold mb-2">
  🏆 Final Score: <span className="text-yellow-300">{highestScore} points</span>
</div>
{isTie ? (
  <div className="text-lg md:text-xl text-green-300 font-medium animate-pulse">
    🤝 {winners.map(w => w.username).join(", ")} - Multiple Champions! 🤝
  </div>
) : (
  isWinner && (
    <div className="text-lg md:text-xl text-green-300 font-medium animate-pulse">
      🎊 Congratulations! You are the Draw Battle Champion! 🎊
    </div>
  )
)}
            </>
          ) : (
            <>
              <div className="text-6xl mb-4">🎨</div>
              <h1 className="text-4xl md:text-6xl font-bold mb-4">
                Game Complete!
              </h1>
              <div className="text-xl text-blue-200">
                Thanks for playing Draw Battle!
              </div>
            </>
          )}
        </div>

        {/* Final Leaderboard */}
        {leaderboard.length > 0 && (
          <div className="bg-white/15 backdrop-blur-md rounded-2xl p-8 mb-8 shadow-2xl border border-white/20">
            <h2 className="text-3xl font-bold mb-6 flex items-center justify-center">
              🏆 Final Leaderboard
            </h2>
            
            <div className="space-y-4">
              {leaderboard.map((player, index) => {
                const isCurrentPlayer = player.username === username;
                const isTopThree = index < 3;
                
                return (
                  <div
                    key={index}
                    className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-300 ${
                      isCurrentPlayer 
                        ? "bg-blue-500/30 ring-2 ring-blue-400 scale-105" 
                        : "bg-white/10"
                    } ${
                      isTopThree ? "shadow-lg" : ""
                    }`}
                  >
                    {/* Rank */}
                    
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                    player.score === highestScore ? "bg-gradient-to-r from-yellow-400 to-yellow-600 text-yellow-900" :
                    index === winners.length ? "bg-gradient-to-r from-gray-300 to-gray-500 text-gray-900" :
                    index === winners.length + 1 ? "bg-gradient-to-r from-orange-400 to-orange-600 text-orange-900" :
                    "bg-gradient-to-r from-purple-400 to-purple-600 text-white"
                    }`}>
                    {player.score === highestScore ? "👑" : 
                    index === winners.length ? "🥈" : 
                    index === winners.length + 1 ? "🥉" : 
                    `#${index + 1}`}
                    </div>

                    {/* Player Info */}
                    <div className="flex-1 text-left">
                      <div className={`font-bold text-xl ${isCurrentPlayer ? "text-blue-200" : "text-white"}`}>
                        {player.username}
                        {isCurrentPlayer && <span className="ml-2 text-sm text-blue-300">(You)</span>}
                      </div>
                      <div className="text-sm text-gray-300">
                        {player.score} points
                      </div>
                    </div>

                    {/* Score with Medal Effect */}
                    <div className={`text-right ${
                      index === 0 ? "text-yellow-300" : 
                      isTopThree ? "text-white" : "text-gray-300"
                    }`}>
                      <div className="text-2xl font-bold">
                        {player.score}
                      </div>
                      <div className="text-xs text-gray-400">
                        points
                      </div>
                    </div>

                    {/* Special Effects for Top 3 */}
                    {index === 0 && (
                      <div className="absolute -top-1 -right-1">
                        <div className="w-6 h-6 bg-yellow-400 rounded-full animate-ping"></div>
                        <div className="absolute top-0 right-0 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                          <span className="text-xs">👑</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Game Stats Section */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-8 shadow-xl">
          <h3 className="text-2xl font-bold mb-4 text-center">📊 Game Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="bg-white/10 rounded-xl p-4">
              <div className="text-3xl font-bold text-blue-300">{leaderboard.length}</div>
              <div className="text-sm text-gray-300">Total Players</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <div className="text-3xl font-bold text-green-300">{room}</div>
              <div className="text-sm text-gray-300">Room Name</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <div className="text-3xl font-bold text-purple-300">
                {winner ? winner.score : '0'}
              </div>
              <div className="text-sm text-gray-300">Winning Score</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={handlePlayAgain}
            className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold text-lg rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
          >
            🎮 Play Another Game
          </button>
          
          <button
            onClick={() => navigate("/")}
            className="px-8 py-4 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-bold text-lg rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
          >
            🏠 Return to Home
          </button>
        </div>

        

        {/* Thank You Message */}
        <div className="mt-8 text-center">
          <div className="text-lg text-blue-200 opacity-80">
            🎨 Thanks for playing Draw Battle! 🎨
          </div>
          <div className="text-sm text-gray-400 mt-2">
            Share with friends and challenge them to beat your score!
          </div>
        </div>
      </div>

      {/* Custom CSS for animations (you might want to add this to your global CSS) */}
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(180deg);
          }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        @keyframes glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
          }
          50% {
            box-shadow: 0 0 40px rgba(255, 255, 255, 0.6);
          }
        }
        
        .animate-glow {
          animation: glow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default WinnerDisplay;