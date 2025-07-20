import React, { useState } from 'react';
import HomePage from './components/HomePage';
import ChessBoard from './components/ChessBoard';
import GameInfo from './components/GameInfo';
import FloatingActions from './components/FloatingActions';
import { useChessGame } from './hooks/useChessGame';
import { soundSystem } from './utils/soundSystem';
import './App.css';

function App() {
  const [showGame, setShowGame] = useState(false);
  const [boardRotated, setBoardRotated] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [analysisEnabled, setAnalysisEnabled] = useState(false);
  const [showClock, setShowClock] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const game = useChessGame();

  const handleStartGame = () => {
    setShowGame(true);
    soundSystem.playGameStart();
  };

  const handleBackToHome = () => {
    setShowGame(false);
    game.resetGame();
  };

  const handleRotateBoard = () => {
    setBoardRotated(!boardRotated);
    soundSystem.playMove();
  };

  const handleToggleSound = () => {
    const newSoundState = !soundEnabled;
    setSoundEnabled(newSoundState);
    soundSystem.setEnabled(newSoundState);
    if (newSoundState) {
      soundSystem.playMove();
    }
  };

  const handleToggleAnalysis = () => {
    const newAnalysisState = !analysisEnabled;
    setAnalysisEnabled(newAnalysisState);
    setShowSuggestions(newAnalysisState); // Enable suggestions with analysis
    soundSystem.playMove();
  };

  const handleExportGame = () => {
    // Export game logic will be implemented later
    const gameData = {
      moves: game.gameState.moveHistory,
      result: game.gameState.gameStatus,
      timestamp: new Date().toISOString()
    };

    const dataStr = JSON.stringify(gameData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `chess-game-${Date.now()}.json`;
    link.click();

    URL.revokeObjectURL(url);
    soundSystem.playMove();
  };

  if (!showGame) {
    return <HomePage onStartGame={handleStartGame} />;
  }

  return (
    <div className="app">
      <div className="game-container">
        <div className="game-info-section">
          <GameInfo
            game={game}
            onBackToHome={handleBackToHome}
            analysisEnabled={analysisEnabled}
            showClock={showClock}
            showSuggestions={showSuggestions}
          />
        </div>
        <div className="chess-board-section">
          <ChessBoard
            game={game}
            rotated={boardRotated}
            soundEnabled={soundEnabled}
          />
        </div>
      </div>

      <FloatingActions
        onRotateBoard={handleRotateBoard}
        onToggleSound={handleToggleSound}
        onToggleAnalysis={handleToggleAnalysis}
        onExportGame={handleExportGame}
        soundEnabled={soundEnabled}
        analysisEnabled={analysisEnabled}
      />
    </div>
  );
}

export default App
