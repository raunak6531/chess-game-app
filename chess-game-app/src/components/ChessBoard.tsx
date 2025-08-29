import React, { useEffect, useState } from 'react';
import type { Position, ChessPiece } from '../types/chess';
import type { ChessGameHook } from '../hooks/useChessGame';
import PromotionDialog from './PromotionDialog';
import { soundSystem } from '../utils/soundSystem';
import { findKing } from '../logic/chessGame'; // Import findKing
import './ChessBoard.css';

interface ChessBoardProps {
  game: ChessGameHook;
  rotated?: boolean;
  soundEnabled?: boolean;
  boardTheme?: string;
  onMove?: (from: string, to: string) => boolean;
  disabled?: boolean;
}

const ChessBoard: React.FC<ChessBoardProps> = ({ 
  game, 
  rotated = false, 
  soundEnabled = true, 
  boardTheme = 'classic',
  onMove,
  disabled = false
}) => {
  const {
    gameState,
    selectSquare,
    isSquareSelected,
    isValidMoveTarget,
    isComputerThinking,
    isEngineReady,
    pendingPromotion,
    handlePromotion,
    cancelPromotion
  } = game;
  const [lastMoveCount, setLastMoveCount] = useState(0);
  const [particles, setParticles] = useState<Array<{id: number, type: string, x: number, y: number}>>([]);

  // Sound effects for game events
  useEffect(() => {
    const currentMoveCount = gameState.moveHistory.length;

    if (currentMoveCount > lastMoveCount && soundEnabled) {
      const lastMove = gameState.moveHistory[currentMove-Count - 1];

      if (lastMove?.isCastling) {
        soundSystem.playCastling();
      } else if (lastMove?.capturedPiece) {
        soundSystem.playCapture();
        // Add capture particles
        addParticles('capture', lastMove.to.col * 65 + 32, (7 - lastMove.to.row) * 65 + 32);
      } else {
        soundSystem.playMove();
      }

      // Check for special game states
      if (gameState.gameStatus === 'check') {
        setTimeout(() => soundSystem.playCheck(), 200);
      } else if (gameState.gameStatus === 'checkmate') {
        setTimeout(() => soundSystem.playCheckmate(), 300);
      }
    }

    setLastMoveCount(currentMoveCount);
  }, [gameState.moveHistory.length, gameState.gameStatus, lastMoveCount, soundEnabled]);

  const addParticles = (type: string, x: number, y: number) => {
    const newParticles = Array.from({ length: 8 }, (_, i) => ({
      id: Date.now() + i,
      type,
      x: x + (Math.random() - 0.5) * 30,
      y: y + (Math.random() - 0.5) * 30
    }));

    setParticles(prev => [...prev, ...newParticles]);

    // Remove particles after animation
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
    }, 1000);
  };

  const renderSquare = (row: number, col: number) => {
    const position: Position = { row, col };
    const piece = gameState.board[row][col];
    const isLight = (row + col) % 2 === 0;
    const isSelected = isSquareSelected(position);
    const isValidTarget = isValidMoveTarget(position);

    const lastMove = gameState.moveHistory[gameState.moveHistory.length - 1];
    const isLastMoveSquare = lastMove &&
      ((lastMove.from.row === row && lastMove.from.col === col) ||
       (lastMove.to.row === row && lastMove.to.col === col));

    // Correctly identify the king in check
    let isKingInCheck = false;
    if (gameState.gameStatus === 'check') {
        const kingPos = findKing(gameState.board, gameState.currentPlayer);
        if (kingPos && kingPos.row === row && kingPos.col === col) {
            isKingInCheck = true;
        }
    }

    const squareClass = [
      'chess-square',
      isLight ? 'light' : 'dark',
      isSelected ? 'selected' : '',
      isValidTarget ? 'valid-move' : '',
      isLastMoveSquare ? 'last-move' : '',
      isKingInCheck ? 'in-check' : '' // Apply the 'in-check' class
    ].filter(Boolean).join(' ');

    const handleSquareClick = () => {
      if (disabled) return;

      const squareElement = document.querySelector(`[data-square="${row}-${col}"]`);
      if (squareElement) {
        squareElement.classList.add('selecting');
        setTimeout(() => {
          squareElement.classList.remove('selecting');
        }, 400);
      }
      
      if (onMove) {
        if (game.selectedSquare && isValidTarget) {
          const fromSquare = `${String.fromCharCode(97 + game.selectedSquare.col)}${8 - game.selectedSquare.row}`;
          const toSquare = `${String.fromCharCode(97 + position.col)}${8 - position.row}`;
          const success = onMove(fromSquare, toSquare);
          if (!success) { return; }
          return;
        }
        selectSquare(position);
        return;
      }
      selectSquare(position);
    };

    return (
      <div
        key={`${row}-${col}`}
        data-square={`${row}-${col}`}
        className={squareClass}
        onClick={handleSquareClick}
      >
        {piece && (
          <ChessPieceComponent
            piece={piece}
            isSelected={isSelected}
            isLifted={isSelected}
          />
        )}
        {isValidTarget && <div className="move-indicator" />}
      </div>
    );
  };

  const renderBoard = () => {
    const squares = [];
    for (let row = 7; row >= 0; row--) {
      for (let col = 0; col < 8; col++) {
        squares.push(renderSquare(row, col));
      }
    }
    return squares;
  };

  return (
    <div className={`chess-board-container theme-${boardTheme}`}>
      <div className="board-with-coordinates">
        <div className={`chess-board ${rotated ? 'rotated' : ''} theme-${boardTheme}`}>
          {renderBoard()}

          <div className="particle-container">
            {particles.map(particle => (
              <div
                key={particle.id}
                className={`particle ${particle.type}`}
                style={{
                  left: particle.x,
                  top: particle.y
                }}
              />
            ))}
          </div>

          {/* The old check indicator has been removed */}

          {!onMove && isComputerThinking && (
            <div className="computer-thinking-overlay">
              <div className="thinking-indicator">
                <div className="thinking-spinner"></div>
                <span>Computer is thinking...</span>
              </div>
            </div>
          )}

          {!onMove && !isEngineReady && (
            <div className="engine-loading-overlay">
              <div className="loading-indicator">
                <div className="loading-spinner"></div>
                <span>Loading chess engine...</span>
              </div>
            </div>
          )}
        </div>

        <div className="coordinates">
          <div className="files">
            {(rotated ? ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'] : ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']).map(file => (
              <div key={file} className="file-label">{file}</div>
            ))}
          </div>
          <div className="ranks">
            {(rotated ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1]).map(rank => (
              <div key={rank} className="rank-label">{rank}</div>
            ))}
          </div>
        </div>
      </div>

      {pendingPromotion && (
        <PromotionDialog
          color={gameState.currentPlayer}
          onSelect={handlePromotion}
          onCancel={cancelPromotion}
        />
      )}
    </div>
  );
};

interface ChessPieceProps {
  piece: ChessPiece;
  isSelected?: boolean;
  isLifted?: boolean;
}

const ChessPieceComponent: React.FC<ChessPieceProps> = ({
  piece,
  isSelected = false,
  isLifted = false
}) => {
  const getPieceSymbol = (piece: ChessPiece): string => {
    const symbols = {
      white: { king: '♔', queen: '♕', rook: '♖', bishop: '♗', knight: '♘', pawn: '♙' },
      black: { king: '♚', queen: '♛', rook: '♜', bishop: '♝', knight: '♞', pawn: '♟' }
    };
    return symbols[piece.color][piece.type];
  };

  const pieceClass = [
    'chess-piece',
    piece.color,
    isSelected ? 'selected' : '',
    isLifted ? 'lifting' : ''
  ].filter(Boolean).join(' ');

  return (
    <div className={pieceClass}>
      {getPieceSymbol(piece)}
    </div>
  );
};

export default ChessBoard;