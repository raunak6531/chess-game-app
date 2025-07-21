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
  findKing,
  isSquareAttacked
} from './chessGame';

// Create a copy of the board
export const copyBoard = (board: Board): Board => {
  return board.map(row => row.map(piece => piece ? { ...piece } : null));
};

// Check if a move is castling
export const isCastlingMove = (move: Move): boolean => {
  return move.piece.type === 'king' && Math.abs(move.to.col - move.from.col) === 2;
};

// Make a move on the board (returns new board, doesn't modify original)
export const makeMove = (board: Board, move: Move): Board => {
  const newBoard = copyBoard(board);

  // Handle castling
  if (isCastlingMove(move)) {
    // Move the king
    newBoard[move.from.row][move.from.col] = null;
    newBoard[move.to.row][move.to.col] = { ...move.piece, hasMoved: true };

    // Move the rook
    const isKingside = move.to.col === 6;
    const rookFromCol = isKingside ? 7 : 0;
    const rookToCol = isKingside ? 5 : 3;
    const rook = newBoard[move.from.row][rookFromCol];

    if (rook) {
      newBoard[move.from.row][rookFromCol] = null;
      newBoard[move.from.row][rookToCol] = { ...rook, hasMoved: true };
    }
  } else {
    // Normal move
    // Remove piece from source
    newBoard[move.from.row][move.from.col] = null;

    // Place piece at destination
    newBoard[move.to.row][move.to.col] = { ...move.piece, hasMoved: true };
  }

  return newBoard;
};

// Check if castling is possible with game state
export const canCastleWithGameState = (gameState: GameState, from: Position, to: Position, piece: ChessPiece): boolean => {
  const { board, canCastle } = gameState;

  // Must be on the back rank
  const backRank = piece.color === 'white' ? 0 : 7;
  if (from.row !== backRank) return false;

  // King must be on e-file (column 4)
  if (from.col !== 4) return false;

  // Determine if kingside or queenside castling
  const isKingside = to.col === 6;
  const isQueenside = to.col === 2;

  if (!isKingside && !isQueenside) return false;

  // Check castling rights
  if (piece.color === 'white') {
    if (isKingside && !canCastle.whiteKingside) return false;
    if (isQueenside && !canCastle.whiteQueenside) return false;
  } else {
    if (isKingside && !canCastle.blackKingside) return false;
    if (isQueenside && !canCastle.blackQueenside) return false;
  }

  // Check rook position
  const rookCol = isKingside ? 7 : 0;
  const rook = getPieceAt(board, { row: backRank, col: rookCol });

  if (!rook || rook.type !== 'rook' || rook.color !== piece.color) {
    return false;
  }

  // Check if path is clear between king and rook
  const startCol = Math.min(from.col, rookCol);
  const endCol = Math.max(from.col, rookCol);

  for (let col = startCol + 1; col < endCol; col++) {
    if (getPieceAt(board, { row: backRank, col }) !== null) {
      return false;
    }
  }

  // King must not be in check
  if (isInCheck(board, piece.color)) return false;

  // King must not pass through or end up in check
  const kingPath = isKingside ? [5, 6] : [3, 2];
  for (const col of kingPath) {
    const testPos = { row: backRank, col };
    if (isSquareAttacked(board, testPos, piece.color === 'white' ? 'black' : 'white')) {
      return false;
    }
  }

  return true;
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
  if (!canPieceMoveTo(board, from, to, piece)) {
    // For king moves, also check castling with game state
    if (piece.type === 'king' && Math.abs(to.col - from.col) === 2) {
      if (!canCastleWithGameState(gameState, from, to, piece)) return false;
    } else {
      return false;
    }
  }
  
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

// Update castling rights based on the move
export const updateCastlingRights = (currentRights: GameState['canCastle'], move: Move): GameState['canCastle'] => {
  const newRights = { ...currentRights };

  // If king moves, lose all castling rights for that color
  if (move.piece.type === 'king') {
    if (move.piece.color === 'white') {
      newRights.whiteKingside = false;
      newRights.whiteQueenside = false;
    } else {
      newRights.blackKingside = false;
      newRights.blackQueenside = false;
    }
  }

  // If rook moves, lose castling rights for that side
  if (move.piece.type === 'rook') {
    if (move.piece.color === 'white') {
      if (move.from.row === 0 && move.from.col === 0) {
        newRights.whiteQueenside = false;
      } else if (move.from.row === 0 && move.from.col === 7) {
        newRights.whiteKingside = false;
      }
    } else {
      if (move.from.row === 7 && move.from.col === 0) {
        newRights.blackQueenside = false;
      } else if (move.from.row === 7 && move.from.col === 7) {
        newRights.blackKingside = false;
      }
    }
  }

  // If rook is captured, lose castling rights for that side
  if (move.capturedPiece && move.capturedPiece.type === 'rook') {
    if (move.capturedPiece.color === 'white') {
      if (move.to.row === 0 && move.to.col === 0) {
        newRights.whiteQueenside = false;
      } else if (move.to.row === 0 && move.to.col === 7) {
        newRights.whiteKingside = false;
      }
    } else {
      if (move.to.row === 7 && move.to.col === 0) {
        newRights.blackQueenside = false;
      } else if (move.to.row === 7 && move.to.col === 7) {
        newRights.blackKingside = false;
      }
    }
  }

  return newRights;
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
    capturedPiece: capturedPiece || undefined,
    isCastling: isCastlingMove({ from, to, piece, capturedPiece })
  };

  const newBoard = makeMove(gameState.board, move);
  const nextPlayer = gameState.currentPlayer === 'white' ? 'black' : 'white';

  // Update castling rights
  const newCastlingRights = updateCastlingRights(gameState.canCastle, move);

  const newGameState: GameState = {
    ...gameState,
    board: newBoard,
    currentPlayer: nextPlayer,
    moveHistory: [...gameState.moveHistory, move],
    canCastle: newCastlingRights
  };

  // Update game status
  newGameState.gameStatus = getGameStatus(newGameState);
  
  return newGameState;
};
