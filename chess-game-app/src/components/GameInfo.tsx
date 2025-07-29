import React from 'react';
import type { ChessGameHook } from '../hooks/useChessGame';
import './GameInfo.css';

interface GameInfoProps {
  game: ChessGameHook;
  onBackToHome?: () => void;
  difficulty: string;
  backButtonText?: string;
  playerColor?: 'white' | 'black';
}

const GameInfo: React.FC<GameInfoProps> = ({
  game,
  onBackToHome,
  difficulty,
  backButtonText = "← Menu"
}) => {
  const { gameState, resetGame } = game;

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
        <h1>LET'S MATE</h1>
        <div className="header-buttons">
          <button className="compact-button reset-button" onClick={resetGame}>
            New Game
          </button>
          {onBackToHome && (
            <button className="compact-button home-button" onClick={onBackToHome}>
              {backButtonText}
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

      <div className="difficulty-display">
        <span className="stat-label">Difficulty:</span>
        <span className="stat-value difficulty-badge">{difficulty}</span>
      </div>
    </div>
  );


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
