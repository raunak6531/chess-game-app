import { useState, useCallback, useEffect } from 'react';
import type { GameState, Position, PieceType } from '../types/chess';
import { notationToPosition } from '../types/chess';
import { initializeGameState, gameStateToFen } from '../logic/chessGame';
import { executeMove, getValidMovesForPiece, isPromotionMove } from '../logic/moveValidation';
import { stockfishService, type Difficulty } from '../services/stockfishService';

export interface ChessGameHook {
  gameState: GameState;
  selectedSquare: Position | null;
  validMoves: Position[];
  selectSquare: (position: Position) => void;
  makeMove: (from: Position, to: Position, promotionPiece?: PieceType) => { success: boolean; capture?: boolean; piece?: string };
  resetGame: () => void;
  isSquareSelected: (position: Position) => boolean;
  isValidMoveTarget: (position: Position) => boolean;
  setDifficulty: (difficulty: Difficulty) => void;
  setPlayerColor: (color: 'white' | 'black') => void;
  isComputerThinking: boolean;
  isEngineReady: boolean;
  pendingPromotion: { from: Position; to: Position } | null;
  handlePromotion: (pieceType: PieceType) => void;
  cancelPromotion: () => void;
  // Multiplayer support methods
  getFEN: () => string;
  loadFEN: (fen: string) => void;
  getTurn: () => 'white' | 'black';
  isGameOver: () => boolean;
  isCheckmate: () => boolean;
  isStalemate: () => boolean;
  // Control AI usage (disable in multiplayer)
  setComputerEnabled: (enabled: boolean) => void;
}

export const useChessGame = (): ChessGameHook => {
  const [gameState, setGameState] = useState<GameState>(initializeGameState());
  const [selectedSquare, setSelectedSquare] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Position[]>([]);
  const [, setDifficulty] = useState<Difficulty>('intermediate');
  const [playerColor, setPlayerColorState] = useState<'white' | 'black'>('white');
  const [isComputerThinking, setIsComputerThinking] = useState(false);
  const [isEngineReady, setIsEngineReady] = useState(false);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: Position; to: Position } | null>(null);
  const [computerEnabled, setComputerEnabled] = useState<boolean>(true);

  // Initialize Stockfish engine
  useEffect(() => {
    const initEngine = async () => {
      try {
        await stockfishService.initialize();
        setIsEngineReady(true);
      } catch (error) {
        console.error('Failed to initialize Stockfish:', error);
        setIsEngineReady(false);
      }
    };

    initEngine();

    // Cleanup on unmount
    return () => {
      try {
        stockfishService.destroy();
      } catch (error) {
        console.error('Error destroying Stockfish:', error);
      }
    };
  }, []);

  // Computer move effect - now using Stockfish
  useEffect(() => {
    // Do not run AI logic when computer is disabled (multiplayer)
    if (!computerEnabled) return;

    const computerColor = playerColor === 'white' ? 'black' : 'white';

    try {
      if (
        isEngineReady &&
        gameState.currentPlayer === computerColor &&
        (gameState.gameStatus === 'playing' || gameState.gameStatus === 'check') &&
        !isComputerThinking
      ) {
        // Set position in Stockfish
        try {
          const fen = gameStateToFen(gameState);
          stockfishService.setPosition(fen);
        } catch (fenError) {
          console.error('Error generating FEN:', fenError);
          return;
        }

        // Request computer move
        stockfishService.requestMove(
          (move) => {
            // Convert Stockfish move to our format and execute
            const moveSuccess = makeMove(move.from, move.to);
            if (!moveSuccess) {
              console.error('Computer move was invalid:', move);
              setIsComputerThinking(false);
            }
          },
          (thinking) => {
            setIsComputerThinking(thinking);
          }
        );
      }
    } catch (error) {
      console.error('Error in computer move effect:', error);
    }
  }, [gameState.currentPlayer, gameState.gameStatus, isEngineReady, isComputerThinking, playerColor, computerEnabled]);

  const selectSquare = useCallback((position: Position) => {
    const piece = gameState.board[position.row][position.col];

    // If clicking on the same square, deselect
    if (
      selectedSquare &&
      selectedSquare.row === position.row &&
      selectedSquare.col === position.col
    ) {
      setSelectedSquare(null);
      setValidMoves([]);
      return;
    }

    // If there's a selected square and this is a valid move target, make the move
    if (
      selectedSquare &&
      validMoves.some((move) => move.row === position.row && move.col === position.col)
    ) {
      makeMove(selectedSquare, position);
      setSelectedSquare(null);
      setValidMoves([]);
      return;
    }

    // If clicking on a piece of the current player AND it's the player's turn, select it
    if (piece && piece.color === gameState.currentPlayer && piece.color === playerColor) {
      setSelectedSquare(position);
      const moves = getValidMovesForPiece(gameState, position);
      setValidMoves(moves);
    } else {
      // Clicking on empty square or opponent piece without selection
      setSelectedSquare(null);
      setValidMoves([]);
    }
  }, [gameState, selectedSquare, validMoves, playerColor]);

  const makeMove = useCallback(
    (from: Position, to: Position, promotionPiece?: PieceType): { success: boolean; capture?: boolean; piece?: string } => {
      // Check if this move would result in promotion
      const piece = gameState.board[from.row][from.col];
      if (piece && isPromotionMove({ from, to, piece })) {
        if (!promotionPiece) {
          // Set pending promotion and wait for user selection
          setPendingPromotion({ from, to });
          return { success: false }; // Don't execute the move yet
        }
      }

      // Check if this is a capture move
      const targetPiece = gameState.board[to.row][to.col];
      const isCapture = targetPiece !== null;

      // Execute the move with promotion piece if provided
      const newGameState = executeMove(gameState, from, to, promotionPiece);
      if (newGameState) {
        setGameState(newGameState);
        setSelectedSquare(null);
        setValidMoves([]);
        setPendingPromotion(null);

        // Play simple move sound
        try {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();

          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);

          oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.1);
        } catch (error) {
          // Ignore audio errors
        }

        return {
          success: true,
          capture: isCapture,
          piece: piece ? `${piece.color}${piece.type}` : undefined,
        };
      }
      return { success: false };
    },
    [gameState]
  );

  const resetGame = useCallback(() => {
    setGameState(initializeGameState());
    setSelectedSquare(null);
    setValidMoves([]);
  }, []);

  const isSquareSelected = useCallback(
    (position: Position): boolean => {
      return (
        selectedSquare !== null &&
        selectedSquare.row === position.row &&
        selectedSquare.col === position.col
      );
    },
    [selectedSquare]
  );

  const isValidMoveTarget = useCallback(
    (position: Position): boolean => {
      return validMoves.some((move) => move.row === position.row && move.col === position.col);
    },
    [validMoves]
  );

  // Update difficulty in Stockfish service
  const handleSetDifficulty = useCallback(
    (newDifficulty: Difficulty) => {
      setDifficulty(newDifficulty);
      if (isEngineReady) {
        stockfishService.setDifficulty(newDifficulty);
      }
    },
    [isEngineReady]
  );

  // Handle promotion selection
  const handlePromotion = useCallback(
    (pieceType: PieceType) => {
      if (pendingPromotion) {
        makeMove(pendingPromotion.from, pendingPromotion.to, pieceType);
      }
    },
    [pendingPromotion, makeMove]
  );

  // Cancel promotion
  const cancelPromotion = useCallback(() => {
    setPendingPromotion(null);
    setSelectedSquare(null);
    setValidMoves([]);
  }, []);

  // Set player color
  const setPlayerColor = useCallback((color: 'white' | 'black') => {
    setPlayerColorState(color);
  }, []);

  // Multiplayer support methods
  const getFEN = useCallback(() => {
    return gameStateToFen(gameState);
  }, [gameState]);

  const loadFEN = useCallback((fen: string) => {
    try {
      const [boardPart, activeColor, castling, enPassant, halfmove, fullmove] = fen.split(' ');
      const rows = boardPart.split('/');
      const newBoard: GameState['board'] = Array(8)
        .fill(null)
        .map(() => Array(8).fill(null));

      // FEN rows go rank 8 -> 1; our board indexes 7->0 are top to bottom
      for (let fenRow = 0; fenRow < 8; fenRow++) {
        const rowStr = rows[fenRow];
        let col = 0;
        for (const ch of rowStr) {
          if (/\d/.test(ch)) {
            col += parseInt(ch, 10);
          } else {
            const isUpper = ch === ch.toUpperCase();
            const color = isUpper ? 'white' : 'black';
            const typeMap: Record<string, any> = {
              k: 'king',
              q: 'queen',
              r: 'rook',
              b: 'bishop',
              n: 'knight',
              p: 'pawn',
            };
            const type = typeMap[ch.toLowerCase()];
            const rowIndex = 7 - fenRow; // map FEN rank to our row index
            newBoard[rowIndex][col] = { type, color } as any;
            col++;
          }
        }
      }

      setGameState((prev) => ({
        ...prev,
        board: newBoard,
        currentPlayer: activeColor === 'w' ? 'white' : 'black',
        // very basic castling info
        canCastle: {
          whiteKingside: castling?.includes('K') || false,
          whiteQueenside: castling?.includes('Q') || false,
          blackKingside: castling?.includes('k') || false,
          blackQueenside: castling?.includes('q') || false,
        },
        // en passant target from FEN (e.g., 'e3' or '-')
        enPassantTarget: enPassant && enPassant !== '-' ? notationToPosition(enPassant) : undefined,
        // minimal timing info
        halfMoveClock: parseInt(halfmove || '0', 10),
        fullMoveNumber: parseInt(fullmove || '1', 10),
      }));

      setSelectedSquare(null);
      setValidMoves([]);
    } catch (e) {
      console.error('Failed to load FEN:', e);
    }
  }, []);

  const getTurn = useCallback(() => {
    return gameState.currentPlayer;
  }, [gameState]);

  const isGameOver = useCallback(() => {
    return (
      gameState.gameStatus === 'checkmate' ||
      gameState.gameStatus === 'stalemate' ||
      gameState.gameStatus === 'draw'
    );
  }, [gameState]);

  const isCheckmate = useCallback(() => {
    return gameState.gameStatus === 'checkmate';
  }, [gameState]);

  const isStalemate = useCallback(() => {
    return gameState.gameStatus === 'stalemate';
  }, [gameState]);

  return {
    gameState,
    selectedSquare,
    validMoves,
    selectSquare,
    makeMove,
    resetGame,
    isSquareSelected,
    isValidMoveTarget,
    setDifficulty: handleSetDifficulty,
    setPlayerColor,
    isComputerThinking,
    isEngineReady,
    pendingPromotion,
    handlePromotion,
    cancelPromotion,
    // Multiplayer methods
    getFEN,
    loadFEN,
    getTurn,
    isGameOver,
    isCheckmate,
    isStalemate,
    // Control AI usage
    setComputerEnabled,
  };
};