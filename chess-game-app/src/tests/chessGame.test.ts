import { describe, it, expect } from 'vitest';
import { 
  initializeBoard, 
  initializeGameState, 
  getPieceAt, 
  isInCheck, 
  findKing
} from '../logic/chessGame';
import { 
  isValidMove, 
  executeMove
} from '../logic/moveValidation';


describe('Chess Game Logic', () => {
  describe('Board Initialization', () => {
    it('should initialize a standard chess board', () => {
      const board = initializeBoard();
      
      // Check white pieces
      expect(getPieceAt(board, { row: 0, col: 0 })?.type).toBe('rook');
      expect(getPieceAt(board, { row: 0, col: 0 })?.color).toBe('white');
      expect(getPieceAt(board, { row: 0, col: 4 })?.type).toBe('king');
      expect(getPieceAt(board, { row: 1, col: 0 })?.type).toBe('pawn');
      
      // Check black pieces
      expect(getPieceAt(board, { row: 7, col: 0 })?.type).toBe('rook');
      expect(getPieceAt(board, { row: 7, col: 0 })?.color).toBe('black');
      expect(getPieceAt(board, { row: 7, col: 4 })?.type).toBe('king');
      expect(getPieceAt(board, { row: 6, col: 0 })?.type).toBe('pawn');
      
      // Check empty squares
      expect(getPieceAt(board, { row: 2, col: 0 })).toBeNull();
      expect(getPieceAt(board, { row: 5, col: 0 })).toBeNull();
    });

    it('should initialize game state correctly', () => {
      const gameState = initializeGameState();
      
      expect(gameState.currentPlayer).toBe('white');
      expect(gameState.gameStatus).toBe('playing');
      expect(gameState.moveHistory).toHaveLength(0);
      expect(gameState.canCastle.whiteKingside).toBe(true);
      expect(gameState.canCastle.blackQueenside).toBe(true);
    });
  });

  describe('Piece Movement', () => {
    it('should validate pawn moves correctly', () => {
      const gameState = initializeGameState();
      
      // Valid pawn moves
      expect(isValidMove(gameState, { row: 1, col: 0 }, { row: 2, col: 0 })).toBe(true); // One square
      expect(isValidMove(gameState, { row: 1, col: 0 }, { row: 3, col: 0 })).toBe(true); // Two squares from start
      
      // Invalid pawn moves
      expect(isValidMove(gameState, { row: 1, col: 0 }, { row: 4, col: 0 })).toBe(false); // Three squares
      expect(isValidMove(gameState, { row: 1, col: 0 }, { row: 2, col: 1 })).toBe(false); // Diagonal without capture
    });

    it('should validate rook moves correctly', () => {
      const gameState = initializeGameState();

      // Move pawn to clear path for rook
      let currentState = executeMove(gameState, { row: 1, col: 0 }, { row: 3, col: 0 });
      expect(currentState).not.toBeNull();

      // Make a black move to get back to white's turn
      currentState = executeMove(currentState!, { row: 6, col: 7 }, { row: 5, col: 7 });
      expect(currentState).not.toBeNull();

      if (currentState) {
        // Valid rook moves (now it's white's turn again)
        expect(isValidMove(currentState, { row: 0, col: 0 }, { row: 1, col: 0 })).toBe(true); // Vertical
        expect(isValidMove(currentState, { row: 0, col: 0 }, { row: 2, col: 0 })).toBe(true); // Vertical further

        // Invalid rook moves
        expect(isValidMove(currentState, { row: 0, col: 0 }, { row: 1, col: 1 })).toBe(false); // Diagonal
      }
    });

    it('should validate knight moves correctly', () => {
      const gameState = initializeGameState();
      
      // Valid knight moves
      expect(isValidMove(gameState, { row: 0, col: 1 }, { row: 2, col: 0 })).toBe(true);
      expect(isValidMove(gameState, { row: 0, col: 1 }, { row: 2, col: 2 })).toBe(true);
      
      // Invalid knight moves
      expect(isValidMove(gameState, { row: 0, col: 1 }, { row: 1, col: 1 })).toBe(false);
      expect(isValidMove(gameState, { row: 0, col: 1 }, { row: 2, col: 1 })).toBe(false);
    });
  });

  describe('Game State Management', () => {
    it('should execute moves and update game state', () => {
      const gameState = initializeGameState();
      
      // Execute a pawn move
      const newState = executeMove(gameState, { row: 1, col: 4 }, { row: 3, col: 4 });
      expect(newState).not.toBeNull();
      
      if (newState) {
        expect(newState.currentPlayer).toBe('black');
        expect(newState.moveHistory).toHaveLength(1);
        expect(getPieceAt(newState.board, { row: 3, col: 4 })?.type).toBe('pawn');
        expect(getPieceAt(newState.board, { row: 1, col: 4 })).toBeNull();
      }
    });

    it('should detect check correctly', () => {
      const gameState = initializeGameState();
      
      // Create a simple check scenario
      const board = gameState.board;
      
      // Clear some pieces and place a rook to give check
      board[1][4] = null; // Remove pawn in front of king
      board[7][0] = null; // Remove black rook
      board[4][4] = { type: 'rook', color: 'black' }; // Place black rook attacking white king
      
      const modifiedState = { ...gameState, board };
      expect(isInCheck(modifiedState.board, 'white')).toBe(true);
    });

    it('should find king position correctly', () => {
      const board = initializeBoard();
      
      const whiteKing = findKing(board, 'white');
      const blackKing = findKing(board, 'black');
      
      expect(whiteKing).toEqual({ row: 0, col: 4 });
      expect(blackKing).toEqual({ row: 7, col: 4 });
    });
  });

  describe('Move Validation', () => {
    it('should prevent moves that leave king in check', () => {
      const gameState = initializeGameState();
      const board = gameState.board;
      
      // Create a pinned piece scenario
      board[1][4] = null; // Remove pawn in front of king
      board[2][4] = { type: 'bishop', color: 'white' }; // Place white bishop
      board[4][4] = { type: 'rook', color: 'black' }; // Place black rook attacking through bishop
      
      const modifiedState = { ...gameState, board };
      
      // Bishop cannot move because it would expose the king to check
      expect(isValidMove(modifiedState, { row: 2, col: 4 }, { row: 3, col: 5 })).toBe(false);
    });

    it('should only allow moves by the current player', () => {
      const gameState = initializeGameState();
      
      // White's turn - cannot move black pieces
      expect(isValidMove(gameState, { row: 6, col: 0 }, { row: 5, col: 0 })).toBe(false);
      expect(isValidMove(gameState, { row: 1, col: 0 }, { row: 2, col: 0 })).toBe(true);
    });
  });
});
