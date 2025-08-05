import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import socket from "../socket";

const WordChooser = () => {
  const [words, setWords] = useState([]);
  const [isDrawer, setIsDrawer] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(1);

  const navigate = useNavigate();
  const location = useLocation();
  const hasJoined = useRef(false);

  const params = new URLSearchParams(location.search);
  const room = params.get("room");
  const username = params.get("username");

  useEffect(() => {
    if (!room) return;
    if (!socket.connected) socket.connect();

    // Don't auto-join if coming from SetRounds (drawer already joined there)
    const isFromSetRounds = document.referrer.includes('/setrounds');
    
    if (!hasJoined.current && !isFromSetRounds) {
      const savedEmail = localStorage.getItem('drawBattleEmail');
      socket.username = username;  // Add this line
      socket.email = savedEmail;   // Add this line
      socket.auth = { username, email: savedEmail };
      console.log('DEBUG: Email being sent:', savedEmail); // Add this
      console.log('DEBUG: Username being sent:', username);
      socket.emit("joinRoom", { room, username, email:savedEmail });
      hasJoined.current = true;
    } else if (isFromSetRounds) {
      // If coming from SetRounds, just request role info
      socket.emit("getRoleInfo", { room, username });
      hasJoined.current = true;
    }

    socket.on("role", ({ isDrawer, currentRound, totalRounds, gameFinished }) => {
      setIsDrawer(isDrawer);
      setCurrentRound(currentRound || 1);
      setTotalRounds(totalRounds || 1);

      if (gameFinished) {
        navigate("/gameroom");
        return;
      }

      if (isDrawer) {
        socket.emit("getWords", room);
      } else {
        socket.emit("checkActiveGame", room);
      }
    });

    socket.on("wordOptions", (wordList) => {
      setWords(wordList);
    });

    socket.on("startGame", (data) => {
      const email = params.get("email") || "";
      navigate(`/canvas?room=${room}&username=${username}&drawer=${data.isDrawer}`);
    });

    socket.on("activeGameFound", (data) => {
      navigate(`/canvas?room=${room}&username=${username}&drawer=${data.isDrawer}`);
    });

    socket.on("showAnswer", ({ correctWord }) => {
      navigate(`/answerreveal?room=${room}&username=${username}&answer=${correctWord}&nextAction=nextTurn&round=${currentRound}&totalRounds=${totalRounds}`);
    });

    socket.on("nextTurn", (data) => {
      setCurrentRound(data.currentRound);
      setTotalRounds(data.totalRounds);
      // Refresh the page to get new drawer status
      window.location.reload();
    });

    socket.on("roundComplete", (data) => {
      navigate(`/answerreveal?room=${room}&username=${username}&answer=${words[0] || 'unknown'}&nextAction=nextRound&round=${data.currentRound}&totalRounds=${data.totalRounds}`);
    });

    socket.on("gameFinished", () => {
      alert("🎉 Game completed! Thanks for playing!");
      navigate("/gameroom");
    });

    return () => {
      socket.off("role");
      socket.off("wordOptions");
      socket.off("startGame");
      socket.off("activeGameFound");
      socket.off("showAnswer");
      socket.off("nextTurn");
      socket.off("roundComplete");
      socket.off("gameFinished");
    };
  }, [room, username, navigate, currentRound, totalRounds]);

  const handleWordSelect = (selectedWord) => {
    socket.emit("wordSelected", { room, word: selectedWord });
    navigate(`/canvas?room=${room}&username=${username}&drawer=true`);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-blue-500 to-purple-600 text-white">
      <div className="mb-4 text-center">
        <p className="text-lg text-yellow-300 font-semibold">
          Room: <span className="text-white">{room}</span> | 
          Round: <span className="text-white">{currentRound}</span> of <span className="text-white">{totalRounds}</span>
        </p>
      </div>

      {isDrawer && (
        <>
          <h1 className="text-3xl font-bold mb-6">🎨 Choose a Word to Draw</h1>

          <div className="flex gap-6 flex-wrap justify-center">
            {words.map((word, index) => (
              <button
                key={index}
                onClick={() => handleWordSelect(word)}
                className="px-6 py-3 bg-green-500 hover:bg-green-600 text-lg font-semibold rounded-lg shadow-md transition duration-300 transform hover:scale-105"
              >
                {word}
              </button>
            ))}
          </div>
        </>
      )}

      {!isDrawer && (
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-6">⏳ Waiting for Drawer...</h1>
          <p className="text-lg opacity-80">
            The drawer is choosing a word to draw
          </p>
        </div>
      )}
    </div>
  );
};

export default WordChooser;