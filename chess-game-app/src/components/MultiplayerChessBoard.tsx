import React, { useEffect, useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import ChessBoard from './ChessBoard';
import GameInfo from './GameInfo';
import { useChessGame, ChessGameHook } from '../hooks/useChessGame'; // Make sure ChessGameHook is exported from your hook file
import { soundSystem } from '../utils/soundSystem';
import { notationToPosition } from '../types/chess';
import './MultiplayerChessBoard.css';

interface MultiplayerChessBoardProps {
  socket: Socket;
  roomCode: string;
  playerColor: 'white' | 'black';
  onBackToMenu: () => void;
  boardTheme: string;
  soundEnabled: boolean;
}

interface OpponentInfo {
  connected: boolean;
  name?: string;
}

// NOTE: The local 'GameState' interface has been removed, as we now use the one from the hook.

const MultiplayerChessBoard: React.FC<MultiplayerChessBoardProps> = ({
  socket,
  roomCode,
  playerColor,
  onBackToMenu,
  boardTheme,
  soundEnabled
}) => {
  // 1. The hook is now the single source of truth for game logic and state
  const game = useChessGame(socket, roomCode) as ChessGameHook; // Use the hook
  const { gameState, makeMove, setPlayerColor, resetGame, setComputerEnabled } = game;

  const [opponent, setOpponent] = useState<OpponentInfo>({ connected: true });
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'reconnecting' | 'disconnected'>('connected');
  const [showResignConfirm, setShowResignConfirm] = useState(false);
  const [gameMessage, setGameMessage] = useState('');

  const isMyTurn = gameState.currentPlayer === playerColor;

  // 2. All socket listeners for game logic (like 'moveReceived') have been REMOVED from this component.
  // The useChessGame hook now handles them internally. We only keep listeners for UI/meta-state.
  useEffect(() => {
    if (!socket) return;

    const handleOpponentConnected = (data: OpponentInfo) => {
      setOpponent(data);
      setGameMessage('');
    };
    const handleOpponentDisconnected = () => {
      setOpponent({ connected: false });
      setGameMessage('Opponent disconnected. Waiting for reconnection...');
    };
    const handleGameEnded = (data: { reason: string; winner?: 'white' | 'black' | 'draw' }) => {
      let message = '';
      switch (data.reason) {
        case 'checkmate':
          message = data.winner === playerColor ? 'Checkmate! You win!' : 'Checkmate! You lose.';
          break;
        case 'stalemate':
          message = "Stalemate! It's a draw.";
          break;
        // Add other cases like 'draw', 'resigned'
        default:
           message = "The game has ended.";
      }
      setGameMessage(message);
    };

    socket.on('opponentConnected', handleOpponentConnected);
    socket.on('opponentDisconnected', handleOpponentDisconnected);
    socket.on('gameEnded', handleGameEnded);
    socket.on('opponentResigned', () => {
        setGameMessage('Your opponent resigned. You win!');
    });

    return () => {
      socket.off('opponentConnected', handleOpponentConnected);
      socket.off('opponentDisconnected', handleOpponentDisconnected);
      socket.off('gameEnded', handleGameEnded);
      socket.off('opponentResigned');
    };
  }, [socket, playerColor]);


  // Initialize and setup game
  useEffect(() => {
    setComputerEnabled(false);
    resetGame();
    setPlayerColor(playerColor);
  }, [setComputerEnabled, resetGame, setPlayerColor, playerColor]);


  // 3. The handleMove function is now MUCH simpler.
  // It just calls the 'makeMove' function from the hook. The hook handles the rest.
  const handleMove = useCallback((from: string, to: string) => {
    if (!isMyTurn || gameState.gameStatus !== 'playing') {
      return false;
    }
    
    const fromPos = notationToPosition(from);
    const toPos = notationToPosition(to);

    const moveResult = makeMove(fromPos, toPos);

    if (moveResult.success && soundEnabled) {
      if (moveResult.capture) {
        soundSystem.playCapture();
      } else {
        soundSystem.playMove();
      }
    }
    
    return moveResult.success;
  }, [isMyTurn, gameState.gameStatus, makeMove, soundEnabled]);


  const handleResign = () => {
    if (socket && gameState?.gameStatus === 'playing') {
      socket.emit('resign', { roomCode });
      setShowResignConfirm(false);
      setGameMessage('You resigned.');
    }
  };

  // ... (keep the rest of your component's JSX and other handlers like handleOfferDraw)
  // The rest of the file (return statement with JSX) can remain the same as it was.
  
  if (!gameState) {
    return <div className="multiplayer-loading"><h2>Loading game...</h2></div>;
  }
  
  // PASTE YOUR ORIGINAL JSX RETURN STATEMENT HERE
  return (
    <div className="multiplayer-chess-container">
     {/* ... all your original JSX from the connection bar to the modal */}
    </div>
  );
};

export default MultiplayerChessBoard;