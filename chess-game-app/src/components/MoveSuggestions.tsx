import React, { useState, useEffect } from 'react';
import type { Position, ChessPiece } from '../types/chess';
import type { ChessGameHook } from '../hooks/useChessGame';
import './MoveSuggestions.css';

interface MoveSuggestionsProps {
  game: ChessGameHook;
  enabled: boolean;
}

interface Suggestion {
  from: Position;
  to: Position;
  piece: ChessPiece;
  score: number;
  type: 'attack' | 'defense' | 'development' | 'tactical';
  description: string;
}

const MoveSuggestions: React.FC<MoveSuggestionsProps> = ({ game, enabled }) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (enabled && game.gameState.gameStatus === 'playing') {
      analyzeMoves();
    } else {
      setSuggestions([]);
    }
  }, [enabled, game.gameState.board, game.gameState.currentPlayer]);

  const analyzeMoves = async () => {
    setIsAnalyzing(true);
    
    // Simulate analysis delay for realism
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newSuggestions = generateSuggestions();
    setSuggestions(newSuggestions.slice(0, 3)); // Show top 3 suggestions
    setIsAnalyzing(false);
  };

  const generateSuggestions = (): Suggestion[] => {
    const suggestions: Suggestion[] = [];
    const { board, currentPlayer } = game.gameState;

    // Find all possible moves for current player
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece && piece.color === currentPlayer) {
          const from: Position = { row, col };
          
          // Simulate getting valid moves (simplified)
          for (let toRow = 0; toRow < 8; toRow++) {
            for (let toCol = 0; toCol < 8; toCol++) {
              const to: Position = { row: toRow, col: toCol };

              // Basic move validation (simplified for suggestions)
              if (isBasicValidMove(from, to, piece, board)) {
                const suggestion = evaluateMove(from, to, piece, board);
                if (suggestion) {
                  suggestions.push(suggestion);
                }
              }
            }
          }
        }
      }
    }

    // Sort by score (highest first)
    return suggestions.sort((a, b) => b.score - a.score);
  };

  const evaluateMove = (from: Position, to: Position, piece: ChessPiece, board: (ChessPiece | null)[][]): Suggestion | null => {
    let score = 0;
    let type: Suggestion['type'] = 'development';
    let description = '';

    const targetPiece = board[to.row][to.col];

    // Capture evaluation
    if (targetPiece) {
      const pieceValues = { pawn: 1, knight: 3, bishop: 3, rook: 5, queen: 9, king: 0 };
      score += pieceValues[targetPiece.type] * 10;
      type = 'attack';
      description = `Capture ${targetPiece.type}`;
    }

    // Center control
    if ((to.row >= 3 && to.row <= 4) && (to.col >= 3 && to.col <= 4)) {
      score += 5;
      if (!description) description = 'Control center';
    }

    // Piece development (moving from back rank)
    if (piece.color === 'white' && from.row === 0 && to.row > 0) {
      score += 3;
      if (!description) description = 'Develop piece';
    } else if (piece.color === 'black' && from.row === 7 && to.row < 7) {
      score += 3;
      if (!description) description = 'Develop piece';
    }

    // King safety (castling area)
    if (piece.type === 'king') {
      if (Math.abs(to.col - from.col) === 2) {
        score += 8;
        type = 'tactical';
        description = 'Castling';
      }
    }

    // Pawn promotion
    if (piece.type === 'pawn') {
      if ((piece.color === 'white' && to.row === 7) || (piece.color === 'black' && to.row === 0)) {
        score += 15;
        type = 'tactical';
        description = 'Pawn promotion';
      }
    }

    if (score > 0) {
      return {
        from,
        to,
        piece,
        score,
        type,
        description: description || 'Good move'
      };
    }

    return null;
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    // Select the piece and then the target square
    game.selectSquare(suggestion.from);
    setTimeout(() => {
      game.selectSquare(suggestion.to);
    }, 100);
  };

  if (!enabled) return null;

  return (
    <div className="move-suggestions">
      <div className="suggestions-header">
        <h3>Move Suggestions</h3>
        {isAnalyzing && <div className="analyzing-indicator">🧠</div>}
      </div>
      
      {isAnalyzing ? (
        <div className="analyzing-message">
          <div className="spinner"></div>
          <span>Analyzing position...</span>
        </div>
      ) : (
        <div className="suggestions-list">
          {suggestions.length > 0 ? (
            suggestions.map((suggestion, index) => (
              <div
                key={index}
                className={`suggestion-item ${suggestion.type}`}
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <div className="suggestion-move">
                  <span className="piece-symbol">
                    {getPieceSymbol(suggestion.piece)}
                  </span>
                  <span className="move-notation">
                    {formatMove(suggestion.from, suggestion.to)}
                  </span>
                </div>
                <div className="suggestion-info">
                  <span className="suggestion-description">{suggestion.description}</span>
                  <span className="suggestion-score">+{suggestion.score}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="no-suggestions">
              No strong moves found
            </div>
          )}
        </div>
      )}
    </div>
  );

  function getPieceSymbol(piece: ChessPiece): string {
    const symbols = {
      white: { king: '♔', queen: '♕', rook: '♖', bishop: '♗', knight: '♘', pawn: '♙' },
      black: { king: '♚', queen: '♛', rook: '♜', bishop: '♝', knight: '♞', pawn: '♟' }
    };
    return symbols[piece.color][piece.type];
  }

  function formatMove(from: Position, to: Position): string {
    const files = 'abcdefgh';
    const fromNotation = `${files[from.col]}${from.row + 1}`;
    const toNotation = `${files[to.col]}${to.row + 1}`;
    return `${fromNotation}-${toNotation}`;
  }

  function isBasicValidMove(from: Position, to: Position, piece: ChessPiece, board: (ChessPiece | null)[][]): boolean {
    // Basic validation - not moving to same square and not capturing own piece
    if (from.row === to.row && from.col === to.col) return false;

    const targetPiece = board[to.row][to.col];
    if (targetPiece && targetPiece.color === piece.color) return false;

    // Basic piece movement patterns (simplified)
    const rowDiff = Math.abs(to.row - from.row);
    const colDiff = Math.abs(to.col - from.col);

    switch (piece.type) {
      case 'pawn':
        const direction = piece.color === 'white' ? 1 : -1;
        const startRow = piece.color === 'white' ? 1 : 6;

        if (colDiff === 0) {
          // Forward move
          if (to.row === from.row + direction && !targetPiece) return true;
          if (from.row === startRow && to.row === from.row + 2 * direction && !targetPiece) return true;
        } else if (colDiff === 1 && to.row === from.row + direction && targetPiece) {
          // Capture
          return true;
        }
        return false;

      case 'rook':
        return (rowDiff === 0 || colDiff === 0);

      case 'bishop':
        return (rowDiff === colDiff);

      case 'queen':
        return (rowDiff === 0 || colDiff === 0 || rowDiff === colDiff);

      case 'king':
        return (rowDiff <= 1 && colDiff <= 1);

      case 'knight':
        return ((rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2));

      default:
        return false;
    }
  }
};

export default MoveSuggestions;
