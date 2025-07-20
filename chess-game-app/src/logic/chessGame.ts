import type {
  Board,
  ChessPiece,
  GameState,
  PieceColor,
  PieceType,
  Position
} from '../types/chess';
import {
  isValidPosition,
  positionsEqual
} from '../types/chess';

// Initialize a standard chess board
export const initializeBoard = (): Board => {
  const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));
  
  // Place white pieces
  const whiteBackRank: PieceType[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
  whiteBackRank.forEach((type, col) => {
    board[0][col] = { type, color: 'white' };
  });
  
  // White pawns
  for (let col = 0; col < 8; col++) {
    board[1][col] = { type: 'pawn', color: 'white' };
  }
  
  // Place black pieces
  const blackBackRank: PieceType[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
  blackBackRank.forEach((type, col) => {
    board[7][col] = { type, color: 'black' };
  });
  
  // Black pawns
  for (let col = 0; col < 8; col++) {
    board[6][col] = { type: 'pawn', color: 'black' };
  }
  
  return board;
};

// Initialize game state
export const initializeGameState = (): GameState => {
  return {
    board: initializeBoard(),
    currentPlayer: 'white',
    gameStatus: 'playing',
    moveHistory: [],
    canCastle: {
      whiteKingside: true,
      whiteQueenside: true,
      blackKingside: true,
      blackQueenside: true,
    },
    halfMoveClock: 0,
    fullMoveNumber: 1
  };
};

// Get piece at position
export const getPieceAt = (board: Board, pos: Position): ChessPiece | null => {
  if (!isValidPosition(pos)) return null;
  return board[pos.row][pos.col];
};

// Check if a square is attacked by the opponent
export const isSquareAttacked = (board: Board, pos: Position, byColor: PieceColor): boolean => {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === byColor) {
        const from = { row, col };
        if (canPieceMoveTo(board, from, pos, piece)) {
          return true;
        }
      }
    }
  }
  return false;
};

// Find king position
export const findKing = (board: Board, color: PieceColor): Position | null => {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.type === 'king' && piece.color === color) {
        return { row, col };
      }
    }
  }
  return null;
};

// Check if king is in check
export const isInCheck = (board: Board, color: PieceColor): boolean => {
  const kingPos = findKing(board, color);
  if (!kingPos) return false;
  
  const opponentColor = color === 'white' ? 'black' : 'white';
  return isSquareAttacked(board, kingPos, opponentColor);
};

// Basic piece movement patterns (without considering check)
export const canPieceMoveTo = (board: Board, from: Position, to: Position, piece: ChessPiece): boolean => {
  if (!isValidPosition(from) || !isValidPosition(to)) return false;
  if (positionsEqual(from, to)) return false;
  
  const targetPiece = getPieceAt(board, to);
  if (targetPiece && targetPiece.color === piece.color) return false;
  
  const rowDiff = to.row - from.row;
  const colDiff = to.col - from.col;
  const absRowDiff = Math.abs(rowDiff);
  const absColDiff = Math.abs(colDiff);
  
  switch (piece.type) {
    case 'pawn':
      return canPawnMoveTo(board, from, to, piece, rowDiff, colDiff);
    case 'rook':
      return (rowDiff === 0 || colDiff === 0) && isPathClear(board, from, to);
    case 'bishop':
      return absRowDiff === absColDiff && isPathClear(board, from, to);
    case 'queen':
      return (rowDiff === 0 || colDiff === 0 || absRowDiff === absColDiff) && isPathClear(board, from, to);
    case 'king':
      return absRowDiff <= 1 && absColDiff <= 1;
    case 'knight':
      return (absRowDiff === 2 && absColDiff === 1) || (absRowDiff === 1 && absColDiff === 2);
    default:
      return false;
  }
};

// Pawn movement logic
const canPawnMoveTo = (board: Board, from: Position, to: Position, piece: ChessPiece, rowDiff: number, colDiff: number): boolean => {
  const direction = piece.color === 'white' ? 1 : -1;
  const startRow = piece.color === 'white' ? 1 : 6;
  const targetPiece = getPieceAt(board, to);
  
  // Forward move
  if (colDiff === 0) {
    if (targetPiece) return false; // Can't capture forward
    if (rowDiff === direction) return true; // One square forward
    if (from.row === startRow && rowDiff === 2 * direction) return true; // Two squares from start
  }
  
  // Diagonal capture
  if (Math.abs(colDiff) === 1 && rowDiff === direction) {
    return targetPiece !== null; // Must capture a piece
  }
  
  return false;
};

// Check if path is clear between two positions
const isPathClear = (board: Board, from: Position, to: Position): boolean => {
  const rowStep = Math.sign(to.row - from.row);
  const colStep = Math.sign(to.col - from.col);
  
  let currentRow = from.row + rowStep;
  let currentCol = from.col + colStep;
  
  while (currentRow !== to.row || currentCol !== to.col) {
    if (board[currentRow][currentCol] !== null) {
      return false;
    }
    currentRow += rowStep;
    currentCol += colStep;
  }

  return true;
};

// Convert game state to FEN notation for Stockfish
export const gameStateToFen = (gameState: GameState): string => {
  const { board, currentPlayer, canCastle, enPassantTarget, halfMoveClock, fullMoveNumber } = gameState;

  // 1. Piece placement
  let fenBoard = '';
  for (let row = 7; row >= 0; row--) { // FEN starts from rank 8 (row 7)
    let emptyCount = 0;
    let rankStr = '';

    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece) {
        if (emptyCount > 0) {
          rankStr += emptyCount.toString();
          emptyCount = 0;
        }

        const pieceChar = getPieceChar(piece);
        rankStr += pieceChar;
      } else {
        emptyCount++;
      }
    }

    if (emptyCount > 0) {
      rankStr += emptyCount.toString();
    }

    fenBoard += rankStr;
    if (row > 0) fenBoard += '/';
  }

  // 2. Active color
  const activeColor = currentPlayer === 'white' ? 'w' : 'b';

  // 3. Castling availability
  let castling = '';
  if (canCastle.whiteKingside) castling += 'K';
  if (canCastle.whiteQueenside) castling += 'Q';
  if (canCastle.blackKingside) castling += 'k';
  if (canCastle.blackQueenside) castling += 'q';
  if (castling === '') castling = '-';

  // 4. En passant target square
  const enPassant = enPassantTarget ?
    `${String.fromCharCode(97 + enPassantTarget.col)}${enPassantTarget.row + 1}` : '-';

  // 5. Halfmove clock (for 50-move rule)
  const halfmove = halfMoveClock || 0;

  // 6. Fullmove number
  const fullmove = fullMoveNumber || 1;

  return `${fenBoard} ${activeColor} ${castling} ${enPassant} ${halfmove} ${fullmove}`;
};

// Helper function to get FEN character for a piece
const getPieceChar = (piece: ChessPiece): string => {
  const chars = {
    white: { king: 'K', queen: 'Q', rook: 'R', bishop: 'B', knight: 'N', pawn: 'P' },
    black: { king: 'k', queen: 'q', rook: 'r', bishop: 'b', knight: 'n', pawn: 'p' }
  };
  return chars[piece.color][piece.type];
};
