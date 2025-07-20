import React from 'react';
import type { ChessGameHook } from '../hooks/useChessGame';
import MoveHistory from './MoveHistory';
import ChessClock from './ChessClock';
import MoveSuggestions from './MoveSuggestions';
import './GameInfo.css';

interface GameInfoProps {
  game: ChessGameHook;
  onBackToHome?: () => void;
  analysisEnabled?: boolean;
  showClock?: boolean;
  showSuggestions?: boolean;
}

const GameInfo: React.FC<GameInfoProps> = ({
  game,
  onBackToHome,
  analysisEnabled = false,
  showClock = true,
  showSuggestions = false
}) => {
  const { gameState, resetGame } = game;

  const handleTimeUp = (player: 'white' | 'black') => {
    // Handle time up - could trigger game end
    console.log(`Time up for ${player}`);
    // In a real implementation, this would end the game
  };

  const getStatusMessage = () => {
    switch (gameState.gameStatus) {
      case 'check':
        return `${gameState.currentPlayer === 'white' ? 'White' : 'Black'} is in check!`;
      case 'checkmate':
        const winner = gameState.currentPlayer === 'white' ? 'Black' : 'White';
        return `Checkmate! ${winner} wins!`;
      case 'stalemate':
        return 'Stalemate! The game is a draw.';
      case 'draw':
        return 'The game is a draw.';
      default:
        return `${gameState.currentPlayer === 'white' ? 'White' : 'Black'} to move`;
    }
  };

  const getStatusColor = () => {
    switch (gameState.gameStatus) {
      case 'check':
        return 'warning';
      case 'checkmate':
        return 'success';
      case 'stalemate':
      case 'draw':
        return 'info';
      default:
        return 'normal';
    }
  };

  return (
    <div className="game-info">
      <div className="game-header">
        <h1>Chess Game</h1>
        <div className="header-buttons">
          <button className="reset-button" onClick={resetGame}>
            New Game
          </button>
          {onBackToHome && (
            <button className="home-button" onClick={onBackToHome}>
              ← Home
            </button>
          )}
        </div>
      </div>
      
      <div className={`game-status ${getStatusColor()}`}>
        {getStatusMessage()}
      </div>
      
      <div className="game-stats">
        <div className="stat">
          <span className="stat-label">Moves:</span>
          <span className="stat-value">{gameState.moveHistory.length}</span>
        </div>
        
        <div className="current-player">
          <span className="stat-label">Current Player:</span>
          <div className={`player-indicator ${gameState.currentPlayer}`}>
            {gameState.currentPlayer === 'white' ? '♔' : '♚'}
            {gameState.currentPlayer.charAt(0).toUpperCase() + gameState.currentPlayer.slice(1)}
          </div>
        </div>
      </div>
      
      {gameState.moveHistory.length > 0 && (
        <div className="last-move">
          <span className="stat-label">Last Move:</span>
          <span className="move-notation">
            {formatLastMove(gameState.moveHistory[gameState.moveHistory.length - 1])}
          </span>
        </div>
      )}

      {analysisEnabled && (
        <div className="analysis-panel">
          <h3>Game Analysis</h3>
          <div className="analysis-stats">
            <div className="stat">
              <span className="stat-label">Material Balance:</span>
              <span className="stat-value">{calculateMaterialBalance()}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Game Phase:</span>
              <span className="stat-value">{getGamePhase()}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Tempo:</span>
              <span className="stat-value">{gameState.currentPlayer === 'white' ? 'White' : 'Black'}</span>
            </div>
          </div>
        </div>
      )}

      {showClock && (
        <ChessClock
          currentPlayer={gameState.currentPlayer}
          gameStatus={gameState.gameStatus}
          onTimeUp={handleTimeUp}
          initialTime={600} // 10 minutes
        />
      )}

      {showSuggestions && (
        <MoveSuggestions
          game={game}
          enabled={showSuggestions}
        />
      )}

      <MoveHistory moves={gameState.moveHistory} />
    </div>
  );

  function calculateMaterialBalance(): string {
    // Simple material calculation
    const pieceValues = { pawn: 1, knight: 3, bishop: 3, rook: 5, queen: 9, king: 0 };
    let whiteTotal = 0;
    let blackTotal = 0;

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = gameState.board[row][col];
        if (piece) {
          const value = pieceValues[piece.type];
          if (piece.color === 'white') {
            whiteTotal += value;
          } else {
            blackTotal += value;
          }
        }
      }
    }

    const balance = whiteTotal - blackTotal;
    if (balance > 0) return `+${balance} White`;
    if (balance < 0) return `${balance} Black`;
    return 'Equal';
  }

  function getGamePhase(): string {
    const totalPieces = gameState.board.flat().filter(piece => piece !== null).length;
    if (totalPieces > 24) return 'Opening';
    if (totalPieces > 12) return 'Middlegame';
    return 'Endgame';
  }
};

const formatLastMove = (move: any) => {
  const files = 'abcdefgh';
  const fromNotation = `${files[move.from.col]}${move.from.row + 1}`;
  const toNotation = `${files[move.to.col]}${move.to.row + 1}`;
  const pieceSymbol = move.piece.type.charAt(0).toUpperCase();
  const captureSymbol = move.capturedPiece ? 'x' : '-';
  
  return `${pieceSymbol}${fromNotation}${captureSymbol}${toNotation}`;
};

export default GameInfo;
