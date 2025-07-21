import { useState, useCallback, useEffect } from 'react';
import type { GameState, Position } from '../types/chess';
import { initializeGameState, gameStateToFen } from '../logic/chessGame';
import { executeMove, getValidMovesForPiece } from '../logic/moveValidation';
import { stockfishService, type Difficulty } from '../services/stockfishService';

export interface ChessGameHook {
  gameState: GameState;
  selectedSquare: Position | null;
  validMoves: Position[];
  selectSquare: (position: Position) => void;
  makeMove: (from: Position, to: Position) => boolean;
  resetGame: () => void;
  isSquareSelected: (position: Position) => boolean;
  isValidMoveTarget: (position: Position) => boolean;
  setDifficulty: (difficulty: Difficulty) => void;
  isComputerThinking: boolean;
  isEngineReady: boolean;
}

export const useChessGame = (): ChessGameHook => {
  const [gameState, setGameState] = useState<GameState>(initializeGameState());
  const [selectedSquare, setSelectedSquare] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Position[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>('intermediate');
  const [isComputerThinking, setIsComputerThinking] = useState(false);
  const [isEngineReady, setIsEngineReady] = useState(false);

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
    console.log('Computer move effect triggered:', {
      isEngineReady,
      currentPlayer: gameState.currentPlayer,
      gameStatus: gameState.gameStatus,
      isComputerThinking
    });

    try {
      if (isEngineReady &&
          gameState.currentPlayer === 'black' &&
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
  }, [gameState.currentPlayer, gameState.gameStatus, isEngineReady, isComputerThinking]);

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
    
    // If clicking on a piece of the current player, select it
    if (piece && piece.color === gameState.currentPlayer) {
      setSelectedSquare(position);
      const moves = getValidMovesForPiece(gameState, position);
      setValidMoves(moves);
    } else {
      // Clicking on empty square or opponent piece without selection
      setSelectedSquare(null);
      setValidMoves([]);
    }
  }, [gameState, selectedSquare, validMoves]);

  const makeMove = useCallback((from: Position, to: Position): boolean => {
    const newGameState = executeMove(gameState, from, to);
    if (newGameState) {
      setGameState(newGameState);
      setSelectedSquare(null);
      setValidMoves([]);

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

      return true;
    }
    return false;
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
    isComputerThinking,
    isEngineReady
  };
};
