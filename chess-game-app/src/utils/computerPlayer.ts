import type { GameState, Position, Piece } from '../types/chess';
import { getValidMovesForPiece } from '../logic/moveValidation';

export type Difficulty = 'easy' | 'medium' | 'hard';

interface Move {
  from: Position;
  to: Position;
  score: number;
}

// Piece values for evaluation
const PIECE_VALUES = {
  'pawn': 1,
  'knight': 3,
  'bishop': 3,
  'rook': 5,
  'queen': 9,
  'king': 100
};

// Get all possible moves for a player
export function getAllPossibleMoves(gameState: GameState, color: 'white' | 'black'): Move[] {
  const moves: Move[] = [];
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = gameState.board[row][col];
      if (piece && piece.color === color) {
        const from = { row, col };
        const validMoves = getValidMovesForPiece(gameState, from);
        
        for (const to of validMoves) {
          moves.push({
            from,
            to,
            score: evaluateMove(gameState, from, to)
          });
        }
      }
    }
  }
  
  return moves;
}

// Simple move evaluation
function evaluateMove(gameState: GameState, from: Position, to: Position): number {
  let score = 0;
  
  // Capture bonus
  const targetPiece = gameState.board[to.row][to.col];
  if (targetPiece) {
    score += PIECE_VALUES[targetPiece.type] * 10;
  }
  
  // Center control bonus
  const centerDistance = Math.abs(to.row - 3.5) + Math.abs(to.col - 3.5);
  score += (7 - centerDistance) * 0.1;
  
  // Random factor for variety
  score += Math.random() * 0.5;
  
  return score;
}

// Get computer move based on difficulty
export function getComputerMove(gameState: GameState, difficulty: Difficulty): Move | null {
  const moves = getAllPossibleMoves(gameState, 'black'); // Assuming computer plays black
  
  if (moves.length === 0) {
    return null;
  }
  
  switch (difficulty) {
    case 'easy':
      // Random move with slight preference for captures
      const captureMovesEasy = moves.filter(move => 
        gameState.board[move.to.row][move.to.col] !== null
      );
      if (captureMovesEasy.length > 0 && Math.random() < 0.3) {
        return captureMovesEasy[Math.floor(Math.random() * captureMovesEasy.length)];
      }
      return moves[Math.floor(Math.random() * moves.length)];
      
    case 'medium':
      // Choose from top 30% of moves
      moves.sort((a, b) => b.score - a.score);
      const topMovesMedium = moves.slice(0, Math.max(1, Math.floor(moves.length * 0.3)));
      return topMovesMedium[Math.floor(Math.random() * topMovesMedium.length)];
      
    case 'hard':
      // Choose from top 10% of moves, with preference for best move
      moves.sort((a, b) => b.score - a.score);
      const topMovesHard = moves.slice(0, Math.max(1, Math.floor(moves.length * 0.1)));
      // 70% chance to pick the best move, 30% chance for variety
      if (Math.random() < 0.7) {
        return topMovesHard[0];
      }
      return topMovesHard[Math.floor(Math.random() * topMovesHard.length)];
      
    default:
      return moves[0];
  }
}

// Delay for computer move (for better UX)
export function makeComputerMoveWithDelay(
  gameState: GameState, 
  difficulty: Difficulty, 
  onMove: (from: Position, to: Position) => void
): void {
  const delay = difficulty === 'easy' ? 500 : difficulty === 'medium' ? 1000 : 1500;
  
  setTimeout(() => {
    const move = getComputerMove(gameState, difficulty);
    if (move) {
      onMove(move.from, move.to);
    }
  }, delay);
}
