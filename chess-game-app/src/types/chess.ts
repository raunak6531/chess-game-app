// Chess game types and interfaces

export type PieceColor = 'white' | 'black';
export type PieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';

export interface ChessPiece {
  type: PieceType;
  color: PieceColor;
  hasMoved?: boolean; // For castling and pawn double-move logic
}

export interface Position {
  row: number; // 0-7 (0 = rank 1, 7 = rank 8)
  col: number; // 0-7 (0 = file a, 7 = file h)
}

export interface Move {
  from: Position;
  to: Position;
  piece: ChessPiece;
  capturedPiece?: ChessPiece;
  isEnPassant?: boolean;
  isCastling?: boolean;
  promotionPiece?: PieceType;
}

export type Board = (ChessPiece | null)[][];

export interface GameState {
  board: Board;
  currentPlayer: PieceColor;
  gameStatus: 'playing' | 'check' | 'checkmate' | 'stalemate' | 'draw';
  moveHistory: Move[];
  enPassantTarget?: Position; // For en passant capture
  canCastle: {
    whiteKingside: boolean;
    whiteQueenside: boolean;
    blackKingside: boolean;
    blackQueenside: boolean;
  };
  halfMoveClock?: number; // For 50-move rule
  fullMoveNumber?: number; // Full move counter
}

// Helper function to convert position to chess notation
export const positionToNotation = (pos: Position): string => {
  const files = 'abcdefgh';
  return `${files[pos.col]}${pos.row + 1}`;
};

// Helper function to convert chess notation to position
export const notationToPosition = (notation: string): Position => {
  const files = 'abcdefgh';
  return {
    col: files.indexOf(notation[0]),
    row: parseInt(notation[1]) - 1
  };
};

// Helper function to check if position is valid
export const isValidPosition = (pos: Position): boolean => {
  return pos.row >= 0 && pos.row < 8 && pos.col >= 0 && pos.col < 8;
};

// Helper function to check if two positions are equal
export const positionsEqual = (pos1: Position, pos2: Position): boolean => {
  return pos1.row === pos2.row && pos1.col === pos2.col;
};
