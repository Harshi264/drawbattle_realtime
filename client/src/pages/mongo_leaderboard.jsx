import React, { useEffect, useState } from "react";

const MongoLeaderboard = () => {
  const [leaderboardData, setLeaderboardData] = useState({ recentGames: [], allTimeLeaders: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('recent'); // 'recent' or 'alltime'

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await fetch("https://drawbattle-realtime.onrender.com/api/combined-leaderboard");
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Fetched leaderboard data:", data);
      setLeaderboardData(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    // Refresh every 30 seconds
    const interval = setInterval(fetchLeaderboard, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>🔄 Loading Leaderboard...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>❌ Error Loading Leaderboard</h2>
        <p>Error: {error}</p>
        <button onClick={fetchLeaderboard}>Retry</button>
      </div>
    );
  }

  // Get the current leaderboard based on active tab
  const currentLeaderboard = activeTab === 'recent' 
    ? leaderboardData.recentGames || [] 
    : leaderboardData.allTimeLeaders || [];

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>
        🏆 Global Leaderboard
      </h2>
      
      {/* Tab Navigation */}
      <div style={{ display: 'flex', marginBottom: '20px', borderBottom: '1px solid #ddd' }}>
        <button 
          onClick={() => setActiveTab('recent')}
          style={{
            flex: 1,
            padding: '10px',
            border: 'none',
            backgroundColor: activeTab === 'recent' ? '#4CAF50' : 'transparent',
            color: activeTab === 'recent' ? 'white' : '#333',
            borderBottom: activeTab === 'recent' ? '2px solid #4CAF50' : 'none',
            cursor: 'pointer'
          }}
        >
          📈 Recent Games
        </button>
        <button 
          onClick={() => setActiveTab('alltime')}
          style={{
            flex: 1,
            padding: '10px',
            border: 'none',
            backgroundColor: activeTab === 'alltime' ? '#4CAF50' : 'transparent',
            color: activeTab === 'alltime' ? 'white' : '#333',
            borderBottom: activeTab === 'alltime' ? '2px solid #4CAF50' : 'none',
            cursor: 'pointer'
          }}
        >
          🎯 All-Time Leaders
        </button>
      </div>

      <button 
        onClick={fetchLeaderboard}
        style={{ 
          marginBottom: '20px', 
          padding: '10px 20px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        🔄 Refresh
      </button>

      {currentLeaderboard.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <h3>No scores recorded yet!</h3>
          <p>Play some games to see scores here.</p>
        </div>
      ) : (
        <div>
          {currentLeaderboard.map((player, index) => (
            <div 
              key={player._id || player.email || index}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '15px',
                margin: '10px 0',
                backgroundColor: index === 0 ? '#FFD700' : '#f5f5f5',
                borderRadius: '8px',
                border: index === 0 ? '2px solid #FFA500' : '1px solid #ddd'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ 
                  fontWeight: 'bold', 
                  marginRight: '15px',
                  fontSize: '18px'
                }}>
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                </span>
                <span style={{ fontSize: '16px' }}>{player.username}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
                  {activeTab === 'recent' ? `${player.score} pts` : `${player.totalPoints} pts`}
                </span>
                {activeTab === 'recent' && player.date && (
                  <span style={{ fontSize: '12px', color: '#666' }}>
                    {new Date(player.date).toLocaleDateString()}
                  </span>
                )}
                {activeTab === 'alltime' && (
                  <div style={{ fontSize: '12px', color: '#666', textAlign: 'right' }}>
                    <div>{player.gamesPlayed} games</div>
                    {player.lastPlayed && (
                      <div>{new Date(player.lastPlayed).toLocaleDateString()}</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div style={{ textAlign: 'center', marginTop: '30px', color: '#666' }}>
        <small>
          {activeTab === 'recent' 
            ? 'Showing top 20 recent game scores • Data refreshes every 30 seconds'
            : 'Showing top 20 all-time leaders • Data refreshes every 30 seconds'
          }
        </small>
      </div>
    </div>
  );
};

export default MongoLeaderboard;