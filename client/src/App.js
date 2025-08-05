import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import SetRounds from "./pages/SetRounds";
import GameRoom from "./pages/GameRoom";
import WordChooser from "./pages/WordChooser";
import Canvas from "./pages/Canvas";
import RoundTransition from "./pages/RoundTransition";
import AnswerReveal from "./pages/AnswerReveal";
import WinnerDisplay from "./pages/WinnerDisplay";
//import GlobalLeaderboard from "./pages/GlobalLeaderboard";
import Mongo_leaderboard from "./pages/mongo_leaderboard";
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/setrounds" element={<SetRounds />} />
        <Route path="/gameroom" element={<GameRoom />} />
        <Route path="/wordchooser" element={<WordChooser />} />
        <Route path="/canvas" element={<Canvas />} />
        <Route path="/roundtransition" element={<RoundTransition />} />
        <Route path="/answerreveal" element={<AnswerReveal />} />
        <Route path="/winner" element={<WinnerDisplay />} />
        {/* <Route path="/GlobalLeaderboard" element={<GlobalLeaderboard />} /> */}
        <Route path="/mongo_leaderboard" element={<Mongo_leaderboard />} />

      </Routes>
      <ToastContainer position="top-center" autoClose={2000} hideProgressBar />
    </Router>
  );
}

export default App;