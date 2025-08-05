import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const GlobalLeaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRank, setCurrentUserRank] = useState(null);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all"); // all, today, week, month
  const navigate = useNavigate();

  // Get saved email from localStorage
  const savedEmail = localStorage.getItem('drawBattleEmail');

  useEffect(() => {
    fetchGlobalLeaderboard();
  }, [filter]);

  const fetchGlobalLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`http://localhost:5000/api/global-leaderboard?filter=${filter}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }

      const data = await response.json();
      setLeaderboard(data.leaderboard || []);
      
      // Find current user's rank if they have an email
      if (savedEmail && data.leaderboard) {
        const userIndex = data.leaderboard.findIndex(player => player.email === savedEmail);
        if (userIndex !== -1) {
          setCurrentUserRank({
            rank: userIndex + 1,
            ...data.leaderboard[userIndex]
          });
        }
      }
      
    } catch (error) {
      console.error('Error fetching global leaderboard:', error);
      setError('Failed to load leaderboard. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getFilterTitle = () => {
    switch (filter) {
      case 'today': return 'Today\'s Top Players';
      case 'week': return 'This Week\'s Champions';
      case 'month': return 'Monthly Legends';
      default: return 'All-Time Champions';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-800 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin text-6xl mb-4">🎨</div>
          <div className="text-2xl font-bold">Loading Global Leaderboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-800 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-6xl mb-4">❌</div>
          <div className="text-2xl font-bold mb-4">Oops! Something went wrong</div>
          <div className="text-lg mb-6">{error}</div>
          <button
            onClick={fetchGlobalLeaderboard}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg font-medium transition-all duration-200"
          >
            🔄 Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-800">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm border-b border-white/20 py-6 px-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="text-center flex-1">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
              🏆 Global Leaderboard
            </h1>
            <p className="text-lg text-blue-200">
              {getFilterTitle()}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Filter Buttons */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {[
            { key: 'all', label: '🌟 All Time', color: 'from-yellow-500 to-orange-500' },
            { key: 'month', label: '📅 This Month', color: 'from-green-500 to-emerald-500' },
            { key: 'week', label: '📊 This Week', color: 'from-blue-500 to-cyan-500' },
            { key: 'today', label: '⚡ Today', color: 'from-purple-500 to-pink-500' }
          ].map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                filter === key
                  ? `bg-gradient-to-r ${color} text-white shadow-lg scale-105`
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Current User Rank (if available) */}
        {currentUserRank && (
          <div className="bg-blue-500/20 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-blue-400/30">
            <div className="text-center text-white">
              <div className="text-2xl font-bold mb-2">Your Global Ranking</div>
              <div className="flex items-center justify-center gap-4">
                <div className="text-4xl font-bold text-yellow-300">#{currentUserRank.rank}</div>
                <div className="text-left">
                  <div className="text-lg font-semibold">{currentUserRank.username}</div>
                  <div className="text-blue-200">{currentUserRank.totalPoints} total points</div>
                  <div className="text-sm text-gray-300">{currentUserRank.gamesPlayed} games played</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard */}
        {leaderboard.length === 0 ? (
          <div className="text-center text-white py-12">
            <div className="text-6xl mb-4">🎨</div>
            <div className="text-2xl font-bold mb-2">No players yet!</div>
            <div className="text-lg text-blue-200 mb-6">
              Be the first to join the global leaderboard
            </div>
            <button
              onClick={() => navigate('/gameroom')}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-lg transition-all duration-200"
            >
              🎮 Start Playing
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {leaderboard.map((player, index) => {
              const isCurrentUser = savedEmail && player.email === savedEmail;
              const isTopThree = index < 3;
              
              return (
                <div
                  key={player.email || index}
                  className={`bg-white/10 backdrop-blur-sm rounded-2xl p-6 border transition-all duration-300 hover:scale-102 hover:bg-white/15 ${
                    isCurrentUser 
                      ? "border-blue-400 ring-2 ring-blue-300 bg-blue-500/20" 
                      : "border-white/20"
                  } ${
                    isTopThree ? "shadow-xl" : "shadow-lg"
                  }`}
                >
                  <div className="flex items-center gap-6">
                    {/* Rank */}
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl ${
                      index === 0 ? "bg-gradient-to-r from-yellow-400 to-yellow-600 text-yellow-900" :
                      index === 1 ? "bg-gradient-to-r from-gray-300 to-gray-500 text-gray-900" :
                      index === 2 ? "bg-gradient-to-r from-orange-400 to-orange-600 text-orange-900" :
                      "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                    }`}>
                      {index === 0 ? "👑" : 
                       index === 1 ? "🥈" : 
                       index === 2 ? "🥉" : 
                       `#${index + 1}`}
                    </div>

                    {/* Player Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className={`text-2xl font-bold ${isCurrentUser ? "text-blue-200" : "text-white"}`}>
                          {player.username}
                        </h3>
                        {isCurrentUser && (
                          <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full font-medium">
                            YOU
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-yellow-300">{player.totalPoints}</div>
                          <div className="text-gray-300">Total Points</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-300">{player.gamesPlayed}</div>
                          <div className="text-gray-300">Games Played</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-300">
                            {player.gamesPlayed > 0 ? Math.round(player.totalPoints / player.gamesPlayed) : 0}
                          </div>
                          <div className="text-gray-300">Avg Score</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium text-purple-300">
                            {formatDate(player.lastPlayed)}
                          </div>
                          <div className="text-gray-300">Last Played</div>
                        </div>
                      </div>
                    </div>

                    {/* Special Effects for Top 3 */}
                    {index === 0 && (
                      <div className="hidden md:block">
                        <div className="text-6xl animate-pulse">👑</div>
                      </div>
                    )}
                    {index === 1 && (
                      <div className="hidden md:block">
                        <div className="text-5xl">🥈</div>
                      </div>
                    )}
                    {index === 2 && (
                      <div className="hidden md:block">
                        <div className="text-5xl">🥉</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
          <button
            onClick={() => navigate('/gameroom')}
            className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold text-lg rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            🎮 Start New Game
          </button>
          
          <button
            onClick={() => navigate('/')}
            className="px-8 py-4 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-bold text-lg rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            🏠 Back to Home
          </button>

          <button
            onClick={fetchGlobalLeaderboard}
            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold text-lg rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            🔄 Refresh
          </button>
        </div>

        {/* Info Footer */}
        <div className="text-center mt-8 text-blue-200 text-sm">
          <p>🎨 Global leaderboard tracks your performance across all games</p>
          <p className="mt-1">Enter your email when joining games to appear on the leaderboard</p>
        </div>
      </div>
    </div>
  );
};

export default GlobalLeaderboard;