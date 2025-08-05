const express = require("express"); // in line 5 I added some and also in line 206 I added another function, from 150 to 159 I have commented and wrote another thing below that, extra thing in line 333
const http = require("http"); // in line 267 I added api endpoints
const cors = require("cors");
const { Server } = require("socket.io");
const fs = require('fs').promises;
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();
const app = express();             // ✅ Moved up before using `app`
app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 30000, // 30 seconds
  socketTimeoutMS: 45000           // 45 seconds
});

.then(() => console.log("✅ MongoDB connected"))
.catch((err) => console.log("❌ MongoDB connection error:", err));
const playerSchema = new mongoose.Schema({
  email: { type: String, required: true },
  username: String,
  score: Number,
  date: { type: Date, default: Date.now }
});
app.use(express.json());

app.get('/leaderboard', async (req, res) => {
  try {
    const topPlayers = await Player.find().sort({ score: -1 }).limit(10);
    console.log("Fetched players:", topPlayers);
    res.json(topPlayers);
  } catch (err) {
    console.error("Leaderboard error:", err);
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});
// app.get("/insertDummy", async (req, res) => {
//   try {
//     await Player.create({ username: "TestUser", score: 42 });
//     res.send("Dummy player added.");
//   } catch (e) {
//     res.status(500).send("Error inserting dummy.");
//   }
// });

const Player = mongoose.model('Player', playerSchema);
// Global leaderboard file path
const LEADERBOARD_FILE = path.join(__dirname, 'globalLeaderboard.json');


const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const rooms = {};
const lockfile = require('proper-lockfile');
const words = [ "apple", "banana", "car", "house", "dog", "tree", "book", "phone",
  "chair", "bottle", "river", "mountain", "cat", "sun", "moon", "star",
  "fish", "bridge", "cloud", "table", "ball", "shoes", "train", "bus",
  "flower", "pencil", "icecream", "clock", "watch", "guitar", "road",
  "computer", "laptop", "keyboard", "mouse", "elephant", "lion", "tiger",
  "zebra", "umbrella", "rocket", "spaceship", "plane", "ship", "camera",
  "television", "radio", "lamp", "bicycle", "motorcycle", "helmet",
  "bracelet", "necklace", "sand", "desert", "ocean", "beach",
  "volcano", "cave", "forest", "treehouse", "castle", "stadium",
  "football", "cricket", "tennis", "basketball", "hockey", "kite",
  "drum", "piano", "violin", "microphone", "singer", "dancer", "actor",
  "doctor", "teacher", "engineer", "robot", "alien", "satellite",
  "pyramid", "anchor", "snowman", "hotairballoon", "windmill",
  "parachute", "submarine", "rollercoaster", "tractor", "firetruck",
  "skateboard", "treasure", "penguin", "octopus", "dolphin", "kangaroo",
  "harbor", "fountain", "island", "lighthouse", "suitcase", "paintbrush",
  "hat", "cup", "pen", "bag", "box", "bed", "fan", "leaf", "ring", "spoon",
  "fork", "plate", "pot", "cap", "shoe", "sock", "ballpen", "egg", "door",
  "key", "stick", "bench", "rope", "busstop", "flag", "treeleaf", "ladder",
  "bucket", "mug", "tablefan"];

function maskWord(word) {
  return word.replace(/[a-zA-Z]/g, "_");
}

// Function to get 3 random unique words
function getRandomWords() {
  const selectedWords = [];
  while (selectedWords.length < 3) {
    const randomIndex = Math.floor(Math.random() * words.length);
    const randomWord = words[randomIndex];
    if (!selectedWords.includes(randomWord)) {
      selectedWords.push(randomWord);
    }
  }
  return selectedWords;
}

// Helper function to get participant list with usernames and scores
function getParticipantsList(room) {
  if (!rooms[room]) return [];
  
  return rooms[room].players.map(player => ({
    username: player.username,
    socketId: player.socketId,
    isDrawer: player.socketId === rooms[room].drawer,
    score: player.score || 0
  }));
}

// Helper function to add points to a player
function addPoints(room, socketId, points, reason = "") {
  if (!rooms[room]) return;
  
  const player = rooms[room].players.find(p => p.socketId === socketId);
  if (player) {
    player.score = (player.score || 0) + points;
    console.log(`🏆 ${player.username} earned ${points} points for ${reason}. Total: ${player.score}`);
  }
}

// Helper function to get leaderboard
function getLeaderboard(room) {
  if (!rooms[room]) return [];
  
  return rooms[room].players
    .map(player => ({
      username: player.username,
      score: player.score || 0,
      socketId: player.socketId
    }))
    .sort((a, b) => b.score - a.score);
}

// Helper function to get next drawer in order
function getNextDrawer(room) {
  if (!rooms[room] || !rooms[room].drawingOrder) return null;
  
  const currentDrawerIndex = rooms[room].drawingOrder.findIndex(
    playerId => playerId === rooms[room].drawer
  );
  
  if (currentDrawerIndex === -1) return rooms[room].drawingOrder[0];
  
  const nextIndex = (currentDrawerIndex + 1) % rooms[room].drawingOrder.length;
  return rooms[room].drawingOrder[nextIndex];
}

// Helper function to check if round is complete
function isRoundComplete(room) {
  if (!rooms[room] || !rooms[room].drawingOrder) return false;
  
  const currentDrawerIndex = rooms[room].drawingOrder.findIndex(
    playerId => playerId === rooms[room].drawer
  );
  
  // Round is complete if we've cycled through all players
  return currentDrawerIndex === rooms[room].drawingOrder.length - 1;
}

// Helper function to end current turn and move to next
async function endCurrentTurn(room) {
  if (!rooms[room] || !rooms[room].gameInProgress) return;
  
  console.log(`🔚 Ending turn for ${rooms[room].drawer} in room ${room}`);
  
  // Check if this is the final turn of the final round BEFORE showing answer
  const isLastTurn = isRoundComplete(room);
  const isLastRound = rooms[room].currentRound >= rooms[room].totalRounds;
  const isGameComplete = isLastTurn && isLastRound;
  
  console.log(`🎯 Turn status: isLastTurn=${isLastTurn}, isLastRound=${isLastRound}, isGameComplete=${isGameComplete}`);
  console.log(`🎯 Current round: ${rooms[room].currentRound}, Total rounds: ${rooms[room].totalRounds}`);
  
  if (isGameComplete) {
    // Game is completely finished - go directly to winner page
    console.log(`🏁 Game finished in room ${room}`);
    rooms[room].gameInProgress = false;
    rooms[room].gameFinished = true;
    
    const finalLeaderboard = getLeaderboard(room);
    const winner = finalLeaderboard[0];
    
    console.log("🏆 Final results:", { leaderboard: finalLeaderboard, winner: winner });
    
    // Update BOTH MongoDB and global stats for all players
    for (const player of rooms[room].players) {
      try {
        // Save to MongoDB
        // Replace Player.create() with:
          await Player.findOneAndUpdate(
          { username: player.username },
            { 
              $inc: { score: player.score },  // Add to existing score
              $set: { date: new Date() }    // Update last played
            },
              { upsert: true, new: true }     // Create if doesn't exist
            );
        console.log(`📥 Saved to MongoDB - ${player.username}: ${player.score || 0}`);
        
        // Update global leaderboard if player has email
        if (player.email) {
          console.log("DEBUG: Updating global stats for:", player.email, "with username:", player.username);
          await updateGlobalStats(player.email, player.username, player.score || 0);
        } else {
          console.log("DEBUG: No email found for player:", player.username);
        }
      } catch (err) {
        console.error("❌ Error saving player data:", err);
      }
      
      console.log(`📤 Sending gameFinished to ${player.username} (${player.socketId})`);
      io.to(player.socketId).emit("gameFinished", { 
        leaderboard: finalLeaderboard,
        winner: winner,
        room: room,
        username: player.username
      });
    }
    return;
  }
  
  // Not the final game - show answer first
  console.log(`📋 Showing answer: ${rooms[room].selectedWord}`);
  io.to(room).emit("showAnswer", {
    correctWord: rooms[room].selectedWord
  });
  
  // Send updated scores
  const participants = getParticipantsList(room);
  io.to(room).emit("updateParticipants", participants);
  
  // Wait 3 seconds then proceed to next drawer or round
  setTimeout(() => {
    if (isRoundComplete(room)) {
      // Round is complete but game continues
      rooms[room].currentRound++;
      console.log(`🎯 Round ${rooms[room].currentRound - 1} complete in room ${room}. Moving to round ${rooms[room].currentRound}`);
      
      // Move to next round
      rooms[room].drawer = rooms[room].drawingOrder[0];
      rooms[room].gameInProgress = false;
      rooms[room].selectedWord = null;
      
      const leaderboard = getLeaderboard(room);
      io.to(room).emit("roundComplete", {
        currentRound: rooms[room].currentRound,
        totalRounds: rooms[room].totalRounds,
        leaderboard: leaderboard
      });
    } else {
      // Move to next drawer in current round
      rooms[room].drawer = getNextDrawer(room);
      rooms[room].gameInProgress = false;
      rooms[room].selectedWord = null;
      
      console.log(`➡️ Next drawer: ${rooms[room].drawer} in room ${room}`);
      
      io.to(room).emit("nextTurn", {
        nextDrawer: rooms[room].drawer,
        currentRound: rooms[room].currentRound,
        totalRounds: rooms[room].totalRounds
      });
    }
  }, 1000);
}
// Helper function to load global leaderboard
async function loadGlobalLeaderboard() {
  try {
    const data = await fs.readFile(LEADERBOARD_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.log('📊 Creating new global leaderboard file');
    return {};
  }
}

// Helper function to save global leaderboard
async function saveGlobalLeaderboard(leaderboard) {
  try {
    await fs.writeFile(LEADERBOARD_FILE, JSON.stringify(leaderboard, null, 2));
    console.log('💾 Global leaderboard saved');
  } catch (error) {
    console.error('❌ Error saving global leaderboard:', error);
  }
}

// Helper function to update global player stats
async function updateGlobalStats(email, username, gameScore) {
  if (!email) return; // Skip if no email provided
  const release = await lockfile.lock(LEADERBOARD_FILE).catch(() => null);
  
  try {
    
  
  const leaderboard = await loadGlobalLeaderboard();
    console.log(`DEBUG: Updating stats for email: ${email}, username: ${username}, score: ${gameScore}`);
    console.log(`DEBUG: Existing user data:`, leaderboard[email]);
  
  if (!leaderboard[email]) {
    console.log(`DEBUG: Creating new user entry for ${email}`);
    leaderboard[email] = {
      email: email,
      username: username,
      totalPoints: 0,
      gamesPlayed: 0,
      lastPlayed: new Date().toISOString()
    };
  }
    const oldUsername = leaderboard[email].username;
  // Update stats
  leaderboard[email].username = username; // Update to latest username
  leaderboard[email].totalPoints += gameScore;
  leaderboard[email].gamesPlayed += 1;
  leaderboard[email].lastPlayed = new Date().toISOString();
  console.log(`DEBUG: Updated from username "${oldUsername}" to "${username}"`);
  console.log(`DEBUG: New total points: ${leaderboard[email].totalPoints}`);
  
  await saveGlobalLeaderboard(leaderboard);

  console.log(`🏆 Updated global stats for ${username} (${email}): +${gameScore} points`);
}finally {
    if (release) await release();
  }
}
// API endpoint for global leaderboard
app.get('/api/global-leaderboard', async (req, res) => {
  try {
    const { filter = 'all' } = req.query;
    const leaderboard = await loadGlobalLeaderboard();
    
    // Convert object to array and sort by totalPoints
    let players = Object.values(leaderboard).sort((a, b) => b.totalPoints - a.totalPoints);
    
    // Apply filter
    const now = new Date();
    if (filter === 'today') {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      players = players.filter(player => new Date(player.lastPlayed) >= today);
    } else if (filter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      players = players.filter(player => new Date(player.lastPlayed) >= weekAgo);
    } else if (filter === 'month') {
      const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      players = players.filter(player => new Date(player.lastPlayed) >= monthAgo);
    }
    
    res.json({ leaderboard: players });
  } catch (error) {
    console.error('❌ Error fetching global leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});
app.get('/api/combined-leaderboard', async (req, res) => {
  try {
    // Get top 20 from MongoDB
    const mongoPlayers = await Player.find()
      .sort({ score: -1 })
      .limit(20)
      .lean();
    
    // Get global leaderboard data
    const globalData = await loadGlobalLeaderboard();
    const globalPlayers = Object.values(globalData)
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, 20);
    
    res.json({
      recentGames: mongoPlayers,
      allTimeLeaders: globalPlayers
    });
  } catch (error) {
    console.error('❌ Error fetching combined leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard data' });
  }
});
io.on("connection", (socket) => {
  console.log("🔌 A user connected:", socket.id);
  socket.on("gameOver", async (data) => {
  try {
    await Player.create({
      username: data.username,
      score: data.score
    });
    console.log(`📥 Saved score for ${data.username}: ${data.score}`);
  } catch (err) {
    console.error("❌ Error saving score:", err);
  }
});

  // Handle joining room with username
  socket.on("joinRoom", (data) => {
    console.log("DEBUG: Received joinRoom data:", JSON.stringify(data)); // Enhanced logging
  console.log("DEBUG: Email received:", data.email);
  console.log("DEBUG: Username received:", data.username);
    let room, username;
    
    // Handle both old format (string) and new format (object)
    if (typeof data === 'string') {
      room = data;
      username = socket.handshake.auth?.username || `User_${socket.id.slice(-4)}`;
    } else {
      room = data.room;
      username = data.username || socket.handshake.auth?.username || `User_${socket.id.slice(-4)}`;
    }

    console.log(`👥 ${socket.id} attempting to join room: ${room} with username: "${username}"`);
    
    socket.join(room);
    socket.username = username;
    
    // Initialize room if it doesn't exist
    if (!rooms[room]) {
      rooms[room] = {
        players: [],
        selectedWord: null,
        drawer: null,
        gameStartTime: null,
        ratings: { likes: 0, dislikes: 0 },
        gameInProgress: false,
        creator: null,
        totalRounds: 1,
        currentRound: 1,
        drawingOrder: [],
        gameFinished: false,
        correctGuessers: [] // Track who guessed correctly in current turn
      };
    }

    // Remove socket from other rooms first
    for (const roomName in rooms) {
      const roomData = rooms[roomName];
      const existingIndex = roomData.players.findIndex(p => p.socketId === socket.id);
      if (existingIndex !== -1 && roomName !== room) {
        console.log(`🔧 Removing ${socket.id} from previous room ${roomName}`);
        roomData.players.splice(existingIndex, 1);
        // Also remove from drawing order
        const orderIndex = roomData.drawingOrder.indexOf(socket.id);
        if (orderIndex !== -1) {
          roomData.drawingOrder.splice(orderIndex, 1);
        }
        io.to(roomName).emit("updateParticipants", getParticipantsList(roomName));
      }
    }

    // Handle current room
    const existingPlayerIndex = rooms[room].players.findIndex(p => p.socketId === socket.id);
    
    if (existingPlayerIndex !== -1) {
      // Player already exists - update username
      rooms[room].players[existingPlayerIndex].username = username;
    } else {
      // Add as new player with initial score
      rooms[room].players.push({
        socketId: socket.id,
        username: username,
        email: data.email || null,
        score: 0
      });
      
      // Add to drawing order if not already there
      if (!rooms[room].drawingOrder.includes(socket.id)) {
        rooms[room].drawingOrder.push(socket.id);
        console.log(`📝 Added ${socket.id} to drawing order for room ${room}`);
      }
    }
    
    // Send updated participant list
    const participantList = getParticipantsList(room);
    io.to(room).emit("updateParticipants", participantList);

    // Set creator (first player)
    if (!rooms[room].creator) {
      rooms[room].creator = socket.id;
    }

    // Assign drawer if none exists
    if (!rooms[room].drawer && rooms[room].drawingOrder.length > 0) {
      rooms[room].drawer = rooms[room].drawingOrder[0];
      console.log(`🎨 Drawer assigned: ${socket.id} ("${username}")`);
    }

    // Send role to the player
    const isDrawer = socket.id === rooms[room].drawer;
    const isCreator = socket.id === rooms[room].creator;
    
    socket.emit("role", { 
      isDrawer, 
      isCreator,
      currentRound: rooms[room].currentRound,
      totalRounds: rooms[room].totalRounds,
      gameFinished: rooms[room].gameFinished
    });
  });

  // Handle check for active game
  socket.on("checkActiveGame", (room) => {
    console.log(`🔍 ${socket.id} checking for active game in room: ${room}`);
    
    if (!rooms[room]) {
      return;
    }

    if (rooms[room].selectedWord && rooms[room].gameInProgress) {
      const isDrawer = socket.id === rooms[room].drawer;
      socket.emit("activeGameFound", {
        isDrawer: isDrawer,
        currentRound: rooms[room].currentRound,
        totalRounds: rooms[room].totalRounds
      });
    }
  });

  // Handle rounds selection
  socket.on("roundsChosen", ({ room, rounds }) => {
    console.log(`🔄 ${socket.id} chose ${rounds} rounds for room: ${room}`);
    if (rooms[room]) {
      rooms[room].totalRounds = rounds;
    }
  });

  // Handle word request from drawer
  socket.on("getWords", (room) => {
    console.log(`📝 ${socket.id} requesting words for room: ${room}`);
    
    if (!rooms[room] || socket.id !== rooms[room].drawer) {
      return;
    }

    const wordOptions = getRandomWords();
    socket.emit("wordOptions", wordOptions);
  });

  // Handle word selection
  socket.on("wordSelected", ({ room, word }) => {
    console.log(`🎯 Word selected: "${word}" by ${socket.id} for room: ${room}`);
    
    if (!rooms[room] || socket.id !== rooms[room].drawer) {
      return;
    }
    
    rooms[room].selectedWord = word;
    rooms[room].gameStartTime = Date.now();
    rooms[room].gameInProgress = true;
    rooms[room].ratings = { likes: 0, dislikes: 0 };
    rooms[room].correctGuessers = []; // Reset correct guessers for new turn

    console.log(`✅ Turn started in room ${room} with word: "${word}"`);

    // Send game start event to all players
    rooms[room].players.forEach((player) => {
      const isDrawer = player.socketId === rooms[room].drawer;
      const wordToSend = isDrawer ? word : maskWord(word);
      
      io.to(player.socketId).emit("startGame", {
        word: wordToSend,
        isDrawer: isDrawer,
        currentRound: rooms[room].currentRound,
        totalRounds: rooms[room].totalRounds
      });
    });

    // Start the timer for 90 seconds
    io.to(room).emit("startTimer", {
      startTime: rooms[room].gameStartTime,
      duration: 90
    });

    // Set timeout to end turn automatically after 90 seconds
    setTimeout(() => {
      if (rooms[room] && rooms[room].gameInProgress && rooms[room].selectedWord === word) {
        console.log(`⏰ Time up for ${rooms[room].drawer} in room ${room}`);
        endCurrentTurn(room);
      }
    }, 90000);

    // Reset votes for new turn
    io.to(room).emit("vote", {
      likes: 0,
      dislikes: 0
    });
  });

  // Handle Canvas requesting current game state
  socket.on("getCanvasGameState", ({ room }, callback) => {
    console.log(`🎨 Canvas requesting game state for room: ${room} by ${socket.id}`);
    
    if (!rooms[room]) {
      return callback({});
    }

    const participantList = getParticipantsList(room);
    io.to(room).emit("updateParticipants", participantList);
    
    if (!rooms[room].selectedWord || !rooms[room].gameInProgress) {
      return callback({
        currentRound: rooms[room].currentRound,
        totalRounds: rooms[room].totalRounds
      });
    }
    
    const isDrawer = socket.id === rooms[room].drawer;
    const gameData = {
      word: isDrawer ? rooms[room].selectedWord : maskWord(rooms[room].selectedWord),
      isDrawer: isDrawer,
      votes: rooms[room].ratings,
      currentRound: rooms[room].currentRound,
      totalRounds: rooms[room].totalRounds
    };
    
    callback(gameData);

    // Send timer if game is running
    if (rooms[room].gameStartTime) {
      socket.emit("startTimer", {
        startTime: rooms[room].gameStartTime,
        duration: 90
      });
    }
  });

  // Handle guesses
  socket.on("checkGuess", ({ room, guess, username }) => {
    if (!rooms[room] || !rooms[room].selectedWord || !rooms[room].gameInProgress) {
      return;
    }
    
    const isCorrect = guess.trim().toLowerCase() === rooms[room].selectedWord.toLowerCase();
    const guesserName = username || socket.username || socket.id;
    
    console.log(`📝 Guess: "${guess}" by ${guesserName} => ${isCorrect ? "✅ Correct" : "❌ Wrong"}`);

    // Send guess result to all players in the room
    io.to(room).emit("guessResult", {
      guesser: guesserName,
      guessText: guess,
      isCorrect: isCorrect,
    });

    if (isCorrect && !rooms[room].correctGuessers.includes(socket.id)) {
      console.log(`🎉 ${guesserName} guessed the word correctly!`);
      
      // Add to correct guessers list
      rooms[room].correctGuessers.push(socket.id);
      
      // Award points based on how quickly they guessed
      const timeElapsed = Date.now() - rooms[room].gameStartTime;
      const secondsElapsed = Math.floor(timeElapsed / 1000);
      let points = 0;
      
      if (secondsElapsed <= 15) points = 10; // Very fast
      else if (secondsElapsed <= 30) points = 8; // Fast
      else if (secondsElapsed <= 45) points = 6; // Medium
      else if (secondsElapsed <= 60) points = 4; // Slow
      else points = 2; // Very slow but still correct
      
      // Bonus points for being first to guess
      if (rooms[room].correctGuessers.length === 1) {
        points += 3; // First correct guess bonus
      }
      
      addPoints(room, socket.id, points*10, `correct guess (${secondsElapsed}s x10)`);
      
      // Send updated scores
      const participants = getParticipantsList(room);
      io.to(room).emit("updateParticipants", participants);
      
      // Check if everyone has guessed correctly
      const totalGuessers = rooms[room].players.length - 1; // excluding drawer
      if (rooms[room].correctGuessers.length >= Math.min(totalGuessers, 1)) {
        // End turn when at least one person guesses correctly (you can modify this logic)
        setTimeout(() => {
          if (rooms[room] && rooms[room].gameInProgress) {
            endCurrentTurn(room);
          }
        }, 2000); // Give 2 seconds to see the correct guess message
      }
    }
  });

  // Handle drawing ratings
  socket.on("drawingRated", ({ room, liked, username }) => {
    if (!rooms[room] || !rooms[room].gameInProgress) {
      return;
    }

    if (liked) {
      rooms[room].ratings.likes += 1;
    } else {
      rooms[room].ratings.dislikes += 1;
    }

    console.log(`🗳️ Drawing rated in room ${room}: ${liked ? "👍" : "👎"} by "${username}"`);

    io.to(room).emit("vote", {
      likes: rooms[room].ratings.likes,
      dislikes: rooms[room].ratings.dislikes
    });

    io.to(room).emit("drawingRatedFeedback", {
      user: socket.id,
      username: username || socket.username || socket.id,
      liked: liked,
    });
  });

  // Handle drawing
  socket.on('drawing', (data) => {
    if (!data || !data.room || !rooms[data.room]) {
      return;
    }

    if (socket.id !== rooms[data.room].drawer) {
      return;
    }
    
    socket.to(data.room).emit('drawing', {
      x0: data.x0,
      y0: data.y0,
      x1: data.x1,
      y1: data.y1,
      tool: data.tool || "pencil",
      size: data.size || 3
    });
  });

  // Handle canvas clear
  socket.on('clearCanvas', (room) => {
    if (!rooms[room] || socket.id !== rooms[room].drawer) {
      return;
    }
    
    console.log(`🧹 Canvas cleared in room ${room} by drawer ${socket.id}`);
    socket.to(room).emit('clearCanvas');
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("❌ A user disconnected:", socket.id);
    
    for (const room in rooms) {
      const roomData = rooms[room];
      const playerIndex = roomData.players.findIndex(p => p.socketId === socket.id);
      
      if (playerIndex !== -1) {
        const disconnectedPlayer = roomData.players[playerIndex];
        roomData.players.splice(playerIndex, 1);
        
        // Remove from drawing order
        const orderIndex = roomData.drawingOrder.indexOf(socket.id);
        if (orderIndex !== -1) {
          roomData.drawingOrder.splice(orderIndex, 1);
        }
        
        // Remove from correct guessers if present
        const correctIndex = roomData.correctGuessers.indexOf(socket.id);
        if (correctIndex !== -1) {
          roomData.correctGuessers.splice(correctIndex, 1);
        }
        
        const participantList = getParticipantsList(room);
        io.to(room).emit("updateParticipants", participantList);

        // If the current drawer left during their turn
        if (roomData.drawer === socket.id && roomData.gameInProgress) {
          endCurrentTurn(room);
        }
        
        // Reassign drawer if needed
        if (roomData.drawer === socket.id && roomData.drawingOrder.length > 0) {
          roomData.drawer = roomData.drawingOrder[0];
          
          roomData.players.forEach(player => {
            const isDrawer = player.socketId === roomData.drawer;
            const isCreator = player.socketId === roomData.creator;
            io.to(player.socketId).emit("role", { 
              isDrawer, 
              isCreator,
              currentRound: roomData.currentRound,
              totalRounds: roomData.totalRounds 
            });
          });
        }
        
        // Reset creator if needed
        if (roomData.creator === socket.id && roomData.players.length > 0) {
          roomData.creator = roomData.players[0].socketId;
        }
        
        // Clean up empty rooms
        if (roomData.players.length === 0) {
          delete rooms[room];
          console.log(`🗑️ Room ${room} deleted (no players left)`);
        }
      }
    }
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
