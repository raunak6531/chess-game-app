import { useState, useCallback, useEffect } from 'react';
import type { GameState, Position, PieceType } from '../types/chess';
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

  // Initialize Stockfish engine
  useEffect(() => {
    const initEngine = async () => {
      try {
        console.log('Starting Stockfish initialization...');
        await stockfishService.initialize();
        setIsEngineReady(true);
        console.log('Stockfish engine initialized successfully');
      } catch (error) {
        console.error('Failed to initialize Stockfish:', error);
        
        // Check if it's a SharedArrayBuffer issue
        if (error instanceof Error && error.message.includes('SharedArrayBuffer')) {
          console.error('SharedArrayBuffer is not available. This is likely due to missing security headers.');
          console.error('The site needs to be served with:');
          console.error('- Cross-Origin-Embedder-Policy: require-corp');
          console.error('- Cross-Origin-Opener-Policy: same-origin');
        }
        
        // Don't block the UI if Stockfish fails to initialize
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
    const computerColor = playerColor === 'white' ? 'black' : 'white';

    console.log('Computer move effect triggered:', {
      isEngineReady,
      currentPlayer: gameState.currentPlayer,
      gameStatus: gameState.gameStatus,
      isComputerThinking,
      playerColor,
      computerColor
    });

    try {
      if (isEngineReady &&
          gameState.currentPlayer === computerColor &&
          (gameState.gameStatus === 'playing' || gameState.gameStatus === 'check') &&
          !isComputerThinking) {

        console.log('Requesting computer move...');

        // Set position in Stockfish
        try {
          const fen = gameStateToFen(gameState);
          console.log('Generated FEN:', fen);
          stockfishService.setPosition(fen);
        } catch (fenError) {
          console.error('Error generating FEN:', fenError);
          return;
        }

        // Request computer move
        stockfishService.requestMove(
          (move) => {
            console.log('Received computer move:', move);
            console.log('Computer thinking state before move:', isComputerThinking);

            // Convert Stockfish move to our format and execute
            const moveSuccess = makeMove(move.from, move.to);
            console.log('Move executed successfully:', moveSuccess);

            if (!moveSuccess) {
              console.error('Computer move was invalid:', move);
              // Reset thinking state if move failed
              setIsComputerThinking(false);
            }
          },
          (thinking) => {
            console.log('Computer thinking state changed to:', thinking);
            setIsComputerThinking(thinking);
          }
        );
      }
    } catch (error) {
      console.error('Error in computer move effect:', error);
    }
  }, [gameState.currentPlayer, gameState.gameStatus, isEngineReady, isComputerThinking, playerColor]);

  const selectSquare = useCallback((position: Position) => {
    const piece = gameState.board[position.row][position.col];
    
    // If clicking on the same square, deselect
    if (selectedSquare && 
        selectedSquare.row === position.row && 
        selectedSquare.col === position.col) {
      setSelectedSquare(null);
      setValidMoves([]);
      return;
    }
    
    // If there's a selected square and this is a valid move target, make the move
    if (selectedSquare && validMoves.some(move => 
      move.row === position.row && move.col === position.col)) {
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
  }, [gameState, selectedSquare, validMoves]);

  const makeMove = useCallback((from: Position, to: Position, promotionPiece?: PieceType): { success: boolean; capture?: boolean; piece?: string } => {
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

      // Play move sound (simple beep using Web Audio API)
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
        piece: piece ? `${piece.color}${piece.type}` : undefined
      };
    }
    return { success: false };
  }, [gameState]);

  const resetGame = useCallback(() => {
    setGameState(initializeGameState());
    setSelectedSquare(null);
    setValidMoves([]);
  }, []);

  const isSquareSelected = useCallback((position: Position): boolean => {
    return selectedSquare !== null && 
           selectedSquare.row === position.row && 
           selectedSquare.col === position.col;
  }, [selectedSquare]);

  const isValidMoveTarget = useCallback((position: Position): boolean => {
    return validMoves.some(move => 
      move.row === position.row && move.col === position.col);
  }, [validMoves]);

  // Update difficulty in Stockfish service
  const handleSetDifficulty = useCallback((newDifficulty: Difficulty) => {
    setDifficulty(newDifficulty);
    if (isEngineReady) {
      stockfishService.setDifficulty(newDifficulty);
    }
  }, [isEngineReady]);

  // Handle promotion selection
  const handlePromotion = useCallback((pieceType: PieceType) => {
    if (pendingPromotion) {
      makeMove(pendingPromotion.from, pendingPromotion.to, pieceType);
    }
  }, [pendingPromotion, makeMove]);

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
    // This is a simplified FEN loader - in a real implementation you'd parse the FEN properly
    // For now, we'll just reset and let the multiplayer system handle the state
    console.log('Loading FEN:', fen);
    // You would implement proper FEN parsing here
  }, []);

  const getTurn = useCallback(() => {
    return gameState.currentPlayer;
  }, [gameState]);

  const isGameOver = useCallback(() => {
    return gameState.gameStatus === 'checkmate' || gameState.gameStatus === 'stalemate' || gameState.gameStatus === 'draw';
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
    isStalemate
  };
};
