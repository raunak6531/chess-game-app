import React from 'react';
import type { Position, ChessPiece } from '../types/chess';
import type { ChessGameHook } from '../hooks/useChessGame';
import './ChessBoard.css';

interface ChessBoardProps {
  game: ChessGameHook;
}

const ChessBoard: React.FC<ChessBoardProps> = ({ game }) => {
  const { gameState, selectSquare, isSquareSelected, isValidMoveTarget } = game;

  const renderSquare = (row: number, col: number) => {
    const position: Position = { row, col };
    const piece = gameState.board[row][col];
    const isLight = (row + col) % 2 === 0;
    const isSelected = isSquareSelected(position);
    const isValidTarget = isValidMoveTarget(position);

    const squareClass = [
      'chess-square',
      isLight ? 'light' : 'dark',
      isSelected ? 'selected' : '',
      isValidTarget ? 'valid-move' : ''
    ].filter(Boolean).join(' ');

    return (
      <div
        key={`${row}-${col}`}
        className={squareClass}
        onClick={() => selectSquare(position)}
      >
        {piece && <ChessPieceComponent piece={piece} />}
        {isValidTarget && <div className="move-indicator" />}
      </div>
    );
  };

  const renderBoard = () => {
    const squares = [];
    // Render from top to bottom (row 7 to 0) for proper chess board orientation
    for (let row = 7; row >= 0; row--) {
      for (let col = 0; col < 8; col++) {
        squares.push(renderSquare(row, col));
      }
    }
    return squares;
  };

  return (
    <div className="chess-board-container">
      <div className="board-with-coordinates">
        <div className="chess-board">
          {renderBoard()}
        </div>
        <div className="coordinates">
          <div className="files">
            {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map(file => (
              <div key={file} className="file-label">{file}</div>
            ))}
          </div>
          <div className="ranks">
            {[8, 7, 6, 5, 4, 3, 2, 1].map(rank => (
              <div key={rank} className="rank-label">{rank}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

interface ChessPieceProps {
  piece: ChessPiece;
}

const ChessPieceComponent: React.FC<ChessPieceProps> = ({ piece }) => {
  const getPieceSymbol = (piece: ChessPiece): string => {
    const symbols = {
      white: {
        king: '♔',
        queen: '♕',
        rook: '♖',
        bishop: '♗',
        knight: '♘',
        pawn: '♙'
      },
      black: {
        king: '♚',
        queen: '♛',
        rook: '♜',
        bishop: '♝',
        knight: '♞',
        pawn: '♟'
      }
    };
    
    return symbols[piece.color][piece.type];
  };

  return (
    <div className={`chess-piece ${piece.color}`}>
      {getPieceSymbol(piece)}
    </div>
  );
};

export default ChessBoard;
