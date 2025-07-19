import { useState, useCallback } from 'react';
import type { GameState, Position } from '../types/chess';
import { initializeGameState } from '../logic/chessGame';
import { executeMove, getValidMovesForPiece } from '../logic/moveValidation';

export interface ChessGameHook {
  gameState: GameState;
  selectedSquare: Position | null;
  validMoves: Position[];
  selectSquare: (position: Position) => void;
  makeMove: (from: Position, to: Position) => boolean;
  resetGame: () => void;
  isSquareSelected: (position: Position) => boolean;
  isValidMoveTarget: (position: Position) => boolean;
}

export const useChessGame = (): ChessGameHook => {
  const [gameState, setGameState] = useState<GameState>(initializeGameState());
  const [selectedSquare, setSelectedSquare] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Position[]>([]);

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

  return {
    gameState,
    selectedSquare,
    validMoves,
    selectSquare,
    makeMove,
    resetGame,
    isSquareSelected,
    isValidMoveTarget
  };
};
