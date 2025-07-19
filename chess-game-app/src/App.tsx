import React from 'react';
import ChessBoard from './components/ChessBoard';
import GameInfo from './components/GameInfo';
import { useChessGame } from './hooks/useChessGame';
import './App.css';

function App() {
  const game = useChessGame();

  return (
    <div className="app">
      <div className="game-container">
        <div className="game-info-section">
          <GameInfo game={game} />
        </div>
        <div className="chess-board-section">
          <ChessBoard game={game} />
        </div>
      </div>
    </div>
  );
}

export default App
