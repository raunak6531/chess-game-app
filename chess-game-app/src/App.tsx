import React, { useState } from 'react';
import HomePage from './components/HomePage';
import ChessBoard from './components/ChessBoard';
import GameInfo from './components/GameInfo';
import { useChessGame } from './hooks/useChessGame';
import './App.css';

function App() {
  const [showGame, setShowGame] = useState(false);
  const game = useChessGame();

  const handleStartGame = () => {
    setShowGame(true);
  };

  const handleBackToHome = () => {
    setShowGame(false);
    game.resetGame();
  };

  if (!showGame) {
    return <HomePage onStartGame={handleStartGame} />;
  }

  return (
    <div className="app">
      <div className="game-container">
        <div className="game-info-section">
          <GameInfo game={game} onBackToHome={handleBackToHome} />
        </div>
        <div className="chess-board-section">
          <ChessBoard game={game} />
        </div>
      </div>
    </div>
  );
}

export default App
