import React, { useState, useEffect } from 'react';
import HomePage from './components/HomePage';
import GameMenu from './components/GameMenu';
import ChessBoard from './components/ChessBoard';
import GameInfo from './components/GameInfo';
import FloatingActions from './components/FloatingActions';
import { useChessGame } from './hooks/useChessGame';
import { soundSystem } from './utils/soundSystem';
import './App.css';

type AppPage = 'home' | 'menu' | 'game';
type GameMode = 'vs-computer' | 'vs-friend';
type BoardTheme = 'classic' | 'modern' | 'wood';
type Difficulty = 'easy' | 'medium' | 'hard';

function App() {
  const [currentPage, setCurrentPage] = useState<AppPage>(() => {
    // Check localStorage for current page on initial load
    const savedPage = localStorage.getItem('chess-current-page');
    return (savedPage as AppPage) || 'home';
  });

  const [gameMode, setGameMode] = useState<GameMode>(() => {
    const saved = localStorage.getItem('chess-game-mode');
    return (saved as GameMode) || 'vs-friend';
  });

  const [boardTheme, setBoardTheme] = useState<BoardTheme>(() => {
    const saved = localStorage.getItem('chess-board-theme');
    return (saved as BoardTheme) || 'classic';
  });

  const [difficulty, setDifficulty] = useState<Difficulty>(() => {
    const saved = localStorage.getItem('chess-difficulty');
    return (saved as Difficulty) || 'medium';
  });

  const [boardRotated, setBoardRotated] = useState(() => {
    const saved = localStorage.getItem('chess-board-rotated');
    return saved === 'true';
  });
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('chess-sound-enabled');
    return saved !== 'false'; // Default to true
  });
  const [analysisEnabled, setAnalysisEnabled] = useState(() => {
    const saved = localStorage.getItem('chess-analysis-enabled');
    return saved === 'true';
  });
  const [showClock, setShowClock] = useState(() => {
    const saved = localStorage.getItem('chess-show-clock');
    return saved !== 'false'; // Default to true
  });
  const [showSuggestions, setShowSuggestions] = useState(() => {
    const saved = localStorage.getItem('chess-show-suggestions');
    return saved === 'true';
  });
  const game = useChessGame();

  // Update game settings when they change
  useEffect(() => {
    game.setGameMode(gameMode);
  }, [gameMode, game]);

  useEffect(() => {
    game.setDifficulty(difficulty);
  }, [difficulty, game]);

  // Persist state changes to localStorage
  useEffect(() => {
    localStorage.setItem('chess-current-page', currentPage);
  }, [currentPage]);

  useEffect(() => {
    localStorage.setItem('chess-game-mode', gameMode);
  }, [gameMode]);

  useEffect(() => {
    localStorage.setItem('chess-board-theme', boardTheme);
  }, [boardTheme]);

  useEffect(() => {
    localStorage.setItem('chess-difficulty', difficulty);
  }, [difficulty]);

  useEffect(() => {
    localStorage.setItem('chess-board-rotated', boardRotated.toString());
  }, [boardRotated]);

  useEffect(() => {
    localStorage.setItem('chess-sound-enabled', soundEnabled.toString());
    soundSystem.setEnabled(soundEnabled);
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem('chess-analysis-enabled', analysisEnabled.toString());
  }, [analysisEnabled]);

  useEffect(() => {
    localStorage.setItem('chess-show-clock', showClock.toString());
  }, [showClock]);

  useEffect(() => {
    localStorage.setItem('chess-show-suggestions', showSuggestions.toString());
  }, [showSuggestions]);

  // Navigation handlers
  const handleStartGame = () => {
    setCurrentPage('menu');
    soundSystem.playGameStart();
  };

  const handleBackToHome = () => {
    setCurrentPage('home');
    game.resetGame();
    // Clear current page from localStorage when going back to home
    localStorage.removeItem('chess-current-page');
  };

  const handleBackToMenu = () => {
    setCurrentPage('menu');
  };

  // Game mode handlers
  const handlePlayVsComputer = () => {
    setGameMode('vs-computer');
    setCurrentPage('game');
    soundSystem.playGameStart();
  };

  const handlePlayVsFriend = () => {
    setGameMode('vs-friend');
    setCurrentPage('game');
    soundSystem.playGameStart();
  };

  const handleBoardTheme = () => {
    // Cycle through themes
    const themes: BoardTheme[] = ['classic', 'modern', 'wood'];
    const currentIndex = themes.indexOf(boardTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setBoardTheme(themes[nextIndex]);
    soundSystem.playMove();
  };

  const handleDifficulty = () => {
    // Cycle through difficulties
    const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];
    const currentIndex = difficulties.indexOf(difficulty);
    const nextIndex = (currentIndex + 1) % difficulties.length;
    setDifficulty(difficulties[nextIndex]);
    soundSystem.playMove();
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

  // Render different pages based on current page
  if (currentPage === 'home') {
    return <HomePage onStartGame={handleStartGame} />;
  }

  if (currentPage === 'menu') {
    return (
      <GameMenu
        onPlayVsComputer={handlePlayVsComputer}
        onPlayVsFriend={handlePlayVsFriend}
        onBoardTheme={handleBoardTheme}
        onDifficulty={handleDifficulty}
        onBackToHome={handleBackToHome}
      />
    );
  }

  // Game page
  return (
    <div className="app">
      <div className="game-container">
        <div className="game-info-section">
          <GameInfo
            game={game}
            onBackToHome={handleBackToMenu}
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
