import { useState, useEffect } from 'react';
import HomePage from './components/HomePage';
import GameMenu from './components/GameMenu';
import ChessBoard from './components/ChessBoard';
import GameInfo from './components/GameInfo';
import ColorSelectionModal from './components/ColorSelectionModal';
import { useChessGame } from './hooks/useChessGame';
import { soundSystem } from './utils/soundSystem';
import './App.css';

type AppPage = 'home' | 'menu' | 'game';
type BoardTheme = 'classic' | 'green' | 'brown' | 'marble' | 'roman';
type Difficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert';
type PlayerColor = 'white' | 'black';

function App() {
  const [currentPage, setCurrentPage] = useState<AppPage>('home');

  const [boardTheme, setBoardTheme] = useState<BoardTheme>(() => {
    const saved = localStorage.getItem('chess-board-theme');
    return (saved as BoardTheme) || 'classic';
  });

  const [difficulty, setDifficulty] = useState<Difficulty>(() => {
    const saved = localStorage.getItem('chess-difficulty');
    // Validate saved difficulty against new difficulty types
    const validDifficulties: Difficulty[] = ['beginner', 'intermediate', 'advanced', 'expert'];
    if (saved && validDifficulties.includes(saved as Difficulty)) {
      return saved as Difficulty;
    }
    // Clear invalid difficulty from localStorage and return default
    localStorage.removeItem('chess-difficulty');
    return 'intermediate';
  });

  const [boardRotated, setBoardRotated] = useState(() => {
    const saved = localStorage.getItem('chess-board-rotated');
    return saved === 'true';
  });

  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('chess-sound-enabled');
    return saved !== 'false'; // Default to true
  });

  const [playerColor, setPlayerColor] = useState<PlayerColor>(() => {
    const saved = localStorage.getItem('chess-player-color');
    return (saved as PlayerColor) || 'white';
  });

  const [showColorModal, setShowColorModal] = useState(false);

  const game = useChessGame();

  // Add error boundary
  if (!game) {
    return (
      <div style={{ color: 'white', padding: '20px', textAlign: 'center' }}>
        <h1>Loading Chess Game...</h1>
        <p>Initializing game engine...</p>
      </div>
    );
  }

  // Update game settings when they change
  useEffect(() => {
    game.setDifficulty(difficulty);
  }, [difficulty, game]);

  useEffect(() => {
    game.setPlayerColor(playerColor);
  }, [playerColor, game]);

  // Note: We don't persist current page to localStorage to ensure home page always loads first

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
    localStorage.setItem('chess-player-color', playerColor);
  }, [playerColor]);

  // Navigation handlers
  const handleStartGame = () => {
    setCurrentPage('menu');
    soundSystem.playGameStart();
  };

  const handleBackToHome = () => {
    setCurrentPage('home');
    game.resetGame();
  };

  const handleBackToMenu = () => {
    setCurrentPage('menu');
  };

  // Game mode handlers
  const handlePlayVsComputer = () => {
    console.log('handlePlayVsComputer called, setting showColorModal to true');
    setShowColorModal(true);
    soundSystem.playMove();
  };

  const handleColorSelection = (color: PlayerColor) => {
    console.log('handleColorSelection called with color:', color);
    setPlayerColor(color);
    game.setPlayerColor(color);
    game.resetGame();
    setBoardRotated(color === 'black');
    setCurrentPage('game');
    soundSystem.playGameStart();
  };

  const handleCloseColorModal = () => {
    console.log('handleCloseColorModal called, setting showColorModal to false');
    setShowColorModal(false);
  };

  const handleBoardTheme = () => {
    // Cycle through themes
    const themes: BoardTheme[] = ['classic', 'green', 'brown', 'marble', 'roman'];
    const currentIndex = themes.indexOf(boardTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setBoardTheme(themes[nextIndex]);
    soundSystem.playMove();
  };

  const handleDifficulty = () => {
    // Cycle through difficulties
    const difficulties: Difficulty[] = ['beginner', 'intermediate', 'advanced', 'expert'];
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



  // Debug logging (can be removed in production)
  // console.log('Current page:', currentPage);
  // console.log('Difficulty:', difficulty);



  // Render different pages based on current page
  if (currentPage === 'home') {
    console.log('Rendering HomePage');
    return (
      <>
        <HomePage onStartGame={handleStartGame} />
        <ColorSelectionModal
          isOpen={showColorModal}
          onSelectColor={handleColorSelection}
          onClose={handleCloseColorModal}
        />
      </>
    );
  }

  if (currentPage === 'menu') {
    console.log('Rendering GameMenu');
    return (
      <>
        <GameMenu
          onPlayVsComputer={handlePlayVsComputer}
          onBoardTheme={handleBoardTheme}
          onDifficulty={handleDifficulty}
          onBackToHome={handleBackToHome}
          difficulty={difficulty}
          boardTheme={boardTheme}
        />
        <ColorSelectionModal
          isOpen={showColorModal}
          onSelectColor={handleColorSelection}
          onClose={handleCloseColorModal}
        />
      </>
    );
  }

  console.log('Rendering game page');

  // Game page
  try {
    return (
      <div className="app">
        <div className="game-container">
          <div className="game-info-section">
            <GameInfo
              game={game}
              onBackToHome={handleBackToMenu}
              difficulty={difficulty}
              playerColor={playerColor}
            />
          </div>
          <div className="chess-board-section">
            <ChessBoard
              game={game}
              rotated={boardRotated}
              soundEnabled={soundEnabled}
              boardTheme={boardTheme}
            />
          </div>
        </div>

        {/* Simple floating action buttons */}
        <div className="floating-actions">
          <button
            className="fab-item"
            onClick={handleRotateBoard}
            title="Rotate Board"
          >
            🔄
          </button>

          <button
            className={`fab-item ${soundEnabled ? 'active' : ''}`}
            onClick={handleToggleSound}
            title={soundEnabled ? 'Disable Sound' : 'Enable Sound'}
          >
            {soundEnabled ? '🔊' : '🔇'}
          </button>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error rendering game page:', error);
    return (
      <div style={{ color: 'white', padding: '20px' }}>
        <h1>Error rendering game</h1>
        <p>Current page: {currentPage}</p>
        <p>Error: {String(error)}</p>
        <button onClick={handleBackToHome}>Back to Home</button>
      </div>
    );
  }
}

export default App
