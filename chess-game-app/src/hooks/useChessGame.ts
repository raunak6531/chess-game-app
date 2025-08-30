import { useState, useCallback, useEffect } from 'react';
import type { Socket } from 'socket.io-client';
import type { GameState, Position, PieceType, PieceColor } from '../types/chess'; // Import PieceColor
import { notationToPosition } from '../types/chess';
import { initializeGameState, gameStateToFen } from '../logic/chessGame';
import { executeMove, getValidMovesForPiece, isPromotionMove, getGameStatus } from '../logic/moveValidation';
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
  getFEN: () => string;
  loadFEN: (fen: string) => void;
  getTurn: () => 'white' | 'black';
  isGameOver: () => boolean;
  isCheckmate: () => boolean;
  isStalemate: () => boolean;
  setComputerEnabled: (enabled: boolean) => void;
}

export const useChessGame = (socket: Socket | null, roomCode: string | null): ChessGameHook => {
  const [gameState, setGameState] = useState<GameState>(initializeGameState());
  const [selectedSquare, setSelectedSquare] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Position[]>([]);
  const [, setDifficulty] = useState<Difficulty>('intermediate');
  const [playerColor, setPlayerColorState] = useState<PieceColor>('white');
  const [isComputerThinking, setIsComputerThinking] = useState(false);
  const [isEngineReady, setIsEngineReady] = useState(false);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: Position; to: Position } | null>(null);
  const [computerEnabled, setComputerEnabled] = useState<boolean>(true);

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
    return () => {
      try {
        stockfishService.destroy();
      } catch (error) {
        console.error('Error destroying Stockfish:', error);
      }
    };
  }, []);

  useEffect(() => {
    if (!computerEnabled) return;
    const computerColor = playerColor === 'white' ? 'black' : 'white';
    try {
      if (
        isEngineReady &&
        gameState.currentPlayer === computerColor &&
        (gameState.gameStatus === 'playing' || gameState.gameStatus === 'check') &&
        !isComputerThinking
      ) {
        try {
          const fen = gameStateToFen(gameState);
          stockfishService.setPosition(fen);
        } catch (fenError) {
          console.error('Error generating FEN:', fenError);
          return;
        }
        stockfishService.requestMove(
          (move) => {
            const moveSuccess = makeMove(move.from, move.to);
            if (!moveSuccess.success) {
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
  }, [gameState, isEngineReady, isComputerThinking, playerColor, computerEnabled]);

  const loadFEN = useCallback((fen: string) => {
    try {
      const [boardPart, activeColor, castling, enPassant, halfmove, fullmove] = fen.split(' ');
      const rows = boardPart.split('/');
      const newBoard: GameState['board'] = Array(8)
        .fill(null)
        .map(() => Array(8).fill(null));

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
              k: 'king', q: 'queen', r: 'rook', b: 'bishop', n: 'knight', p: 'pawn',
            };
            const type = typeMap[ch.toLowerCase()];
            const rowIndex = 7 - fenRow;
            newBoard[rowIndex][col] = { type, color } as any;
            col++;
          }
        }
      }

      setGameState((prev) => {
        const updatedGameState = {
          ...prev,
          board: newBoard,
          // ** THIS IS THE FIX **
          // We explicitly tell TypeScript this is a PieceColor
          currentPlayer: (activeColor === 'w' ? 'white' : 'black') as PieceColor,
          canCastle: {
            whiteKingside: castling?.includes('K') || false,
            whiteQueenside: castling?.includes('Q') || false,
            blackKingside: castling?.includes('k') || false,
            blackQueenside: castling?.includes('q') || false,
          },
          enPassantTarget: enPassant && enPassant !== '-' ? notationToPosition(enPassant) : undefined,
          halfMoveClock: parseInt(halfmove || '0', 10),
          fullMoveNumber: parseInt(fullmove || '1', 10),
        };

        const newStatus = getGameStatus(updatedGameState as GameState);

        return {
          ...updatedGameState,
          gameStatus: newStatus,
        };
      });

      setSelectedSquare(null);
      setValidMoves([]);
    } catch (e) {
      console.error('Failed to load FEN:', e);
    }
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleMoveReceived = (data: { fen: string }) => {
      loadFEN(data.fen);
    };
    socket.on('moveReceived', handleMoveReceived);
    return () => {
      socket.off('moveReceived', handleMoveReceived);
    };
  }, [socket, loadFEN]);

  const selectSquare = useCallback((position: Position) => {
    const piece = gameState.board[position.row][position.col];

    if (
      selectedSquare &&
      selectedSquare.row === position.row &&
      selectedSquare.col === position.col
    ) {
      setSelectedSquare(null);
      setValidMoves([]);
      return;
    }

    if (
      selectedSquare &&
      validMoves.some((move) => move.row === position.row && move.col === position.col)
    ) {
      makeMove(selectedSquare, position);
      setSelectedSquare(null);
      setValidMoves([]);
      return;
    }

    if (piece && piece.color === gameState.currentPlayer && piece.color === playerColor) {
      setSelectedSquare(position);
      const moves = getValidMovesForPiece(gameState, position);
      setValidMoves(moves);
    } else {
      setSelectedSquare(null);
      setValidMoves([]);
    }
  }, [gameState, selectedSquare, validMoves, playerColor]);

  const makeMove = useCallback(
    (from: Position, to: Position, promotionPiece?: PieceType): { success: boolean; capture?: boolean; piece?: string } => {
      const piece = gameState.board[from.row][from.col];
      if (piece && isPromotionMove({ from, to, piece })) {
        if (!promotionPiece) {
          setPendingPromotion({ from, to });
          return { success: false };
        }
      }

      const targetPiece = gameState.board[to.row][to.col];
      const isCapture = targetPiece !== null;

      const newGameState = executeMove(gameState, from, to, promotionPiece);
      if (newGameState) {
        setGameState(newGameState);
        setSelectedSquare(null);
        setValidMoves([]);
        setPendingPromotion(null);

        if (socket && roomCode) {
          const fen = gameStateToFen(newGameState);
          socket.emit('makeMove', {
            roomCode,
            from: `${String.fromCharCode(97 + from.col)}${from.row + 1}`,
            to: `${String.fromCharCode(97 + to.col)}${to.row + 1}`,
            fen,
            turn: newGameState.currentPlayer,
          });
        }

        return {
          success: true,
          capture: isCapture,
          piece: piece ? `${piece.color}${piece.type}` : undefined,
        };
      }
      return { success: false };
    },
    [gameState, socket, roomCode]
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

  const handleSetDifficulty = useCallback(
    (newDifficulty: Difficulty) => {
      setDifficulty(newDifficulty);
      if (isEngineReady) {
        stockfishService.setDifficulty(newDifficulty);
      }
    },
    [isEngineReady]
  );

  const handlePromotion = useCallback(
    (pieceType: PieceType) => {
      if (pendingPromotion) {
        makeMove(pendingPromotion.from, pendingPromotion.to, pieceType);
      }
    },
    [pendingPromotion, makeMove]
  );

  const cancelPromotion = useCallback(() => {
    setPendingPromotion(null);
    setSelectedSquare(null);
    setValidMoves([]);
  }, []);

  const setPlayerColor = useCallback((color: 'white' | 'black') => {
    setPlayerColorState(color);
  }, []);

  const getFEN = useCallback(() => {
    return gameStateToFen(gameState);
  }, [gameState]);

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
  
  const setComputerEnabledCallback = useCallback((enabled: boolean) => {
    setComputerEnabled(enabled);
  }, []);

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
    getFEN,
    loadFEN,
    getTurn,
    isGameOver,
    isCheckmate,
    isStalemate,
    setComputerEnabled: setComputerEnabledCallback,
  };
};