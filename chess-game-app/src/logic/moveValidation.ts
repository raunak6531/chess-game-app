import type {
  Board,
  GameState,
  Move,
  Position,
  PieceColor
} from '../types/chess';
import {
  isValidPosition,
  positionsEqual
} from '../types/chess';
import {
  getPieceAt,
  canPieceMoveTo,
  isInCheck,
  findKing
} from './chessGame';

// Create a copy of the board
export const copyBoard = (board: Board): Board => {
  return board.map(row => row.map(piece => piece ? { ...piece } : null));
};

// Make a move on the board (returns new board, doesn't modify original)
export const makeMove = (board: Board, move: Move): Board => {
  const newBoard = copyBoard(board);
  
  // Remove piece from source
  newBoard[move.from.row][move.from.col] = null;
  
  // Place piece at destination
  newBoard[move.to.row][move.to.col] = { ...move.piece, hasMoved: true };
  
  return newBoard;
};

// Check if a move would leave the king in check
export const wouldLeaveKingInCheck = (board: Board, move: Move, playerColor: PieceColor): boolean => {
  const newBoard = makeMove(board, move);
  return isInCheck(newBoard, playerColor);
};

// Validate if a move is legal
export const isValidMove = (gameState: GameState, from: Position, to: Position): boolean => {
  const { board, currentPlayer } = gameState;
  
  // Check basic position validity
  if (!isValidPosition(from) || !isValidPosition(to)) return false;
  if (positionsEqual(from, to)) return false;
  
  // Get the piece being moved
  const piece = getPieceAt(board, from);
  if (!piece) return false;
  
  // Check if it's the current player's piece
  if (piece.color !== currentPlayer) return false;
  
  // Check if the piece can move to the target square
  if (!canPieceMoveTo(board, from, to, piece)) return false;
  
  // Create the move object
  const move: Move = {
    from,
    to,
    piece,
    capturedPiece: getPieceAt(board, to) || undefined
  };
  
  // Check if the move would leave the king in check
  if (wouldLeaveKingInCheck(board, move, currentPlayer)) return false;
  
  return true;
};

// Get all valid moves for a piece at a given position
export const getValidMovesForPiece = (gameState: GameState, from: Position): Position[] => {
  const validMoves: Position[] = [];
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const to = { row, col };
      if (isValidMove(gameState, from, to)) {
        validMoves.push(to);
      }
    }
  }
  
  return validMoves;
};

// Get all valid moves for the current player
export const getAllValidMoves = (gameState: GameState): Move[] => {
  const { board, currentPlayer } = gameState;
  const validMoves: Move[] = [];
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === currentPlayer) {
        const from = { row, col };
        const pieceMoves = getValidMovesForPiece(gameState, from);
        
        pieceMoves.forEach(to => {
          validMoves.push({
            from,
            to,
            piece,
            capturedPiece: getPieceAt(board, to) || undefined
          });
        });
      }
    }
  }
  
  return validMoves;
};

// Check for checkmate or stalemate
export const getGameStatus = (gameState: GameState): 'playing' | 'check' | 'checkmate' | 'stalemate' => {
  const { board, currentPlayer } = gameState;
  const validMoves = getAllValidMoves(gameState);
  const inCheck = isInCheck(board, currentPlayer);
  
  if (validMoves.length === 0) {
    return inCheck ? 'checkmate' : 'stalemate';
  }
  
  return inCheck ? 'check' : 'playing';
};

// Execute a move and return new game state
export const executeMove = (gameState: GameState, from: Position, to: Position): GameState | null => {
  if (!isValidMove(gameState, from, to)) {
    return null; // Invalid move
  }
  
  const piece = getPieceAt(gameState.board, from)!;
  const capturedPiece = getPieceAt(gameState.board, to);
  
  const move: Move = {
    from,
    to,
    piece,
    capturedPiece: capturedPiece || undefined
  };
  
  const newBoard = makeMove(gameState.board, move);
  const nextPlayer = gameState.currentPlayer === 'white' ? 'black' : 'white';
  
  const newGameState: GameState = {
    ...gameState,
    board: newBoard,
    currentPlayer: nextPlayer,
    moveHistory: [...gameState.moveHistory, move]
  };
  
  // Update game status
  newGameState.gameStatus = getGameStatus(newGameState);
  
  return newGameState;
};
