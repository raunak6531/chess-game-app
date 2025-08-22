import React, { useEffect, useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import ChessBoard from './ChessBoard';
import GameInfo from './GameInfo';
import { useChessGame, ChessGameHook } from '../hooks/useChessGame';
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

const MultiplayerChessBoard: React.FC<MultiplayerChessBoardProps> = ({
  socket,
  roomCode,
  playerColor,
  onBackToMenu,
  boardTheme,
  soundEnabled
}) => {
  // The hook is the single source of truth for game logic and state
  const game = useChessGame(socket, roomCode) as ChessGameHook;
  const { gameState, makeMove, setPlayerColor, resetGame, setComputerEnabled } = game;

  const [opponent, setOpponent] = useState<OpponentInfo>({ connected: true });
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'reconnecting' | 'disconnected'>('connected');
  const [showResignConfirm, setShowResignConfirm] = useState(false);
  const [gameMessage, setGameMessage] = useState('');

  const isMyTurn = gameState.currentPlayer === playerColor;

  // Listen for UI/meta-state events
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
        case 'draw':
          message = "The game ended in a draw.";
          break;
        default:
           message = "The game has ended.";
      }
      setGameMessage(message);
    };
    const handleOpponentResigned = () => {
        setGameMessage('Your opponent resigned. You win!');
    };

    socket.on('opponentConnected', handleOpponentConnected);
    socket.on('opponentDisconnected', handleOpponentDisconnected);
    socket.on('gameEnded', handleGameEnded);
    socket.on('opponentResigned', handleOpponentResigned);

    return () => {
      socket.off('opponentConnected', handleOpponentConnected);
      socket.off('opponentDisconnected', handleOpponentDisconnected);
      socket.off('gameEnded', handleGameEnded);
      socket.off('opponentResigned', handleOpponentResigned);
    };
  }, [socket, playerColor]);

  // Initialize and setup game
  useEffect(() => {
    setComputerEnabled(false);
    resetGame();
    setPlayerColor(playerColor);
  }, [setComputerEnabled, resetGame, setPlayerColor, playerColor]);

  // Simplified move handler
  const handleMove = useCallback((from: string, to: string) => {
    if (!isMyTurn || gameState.gameStatus !== 'playing') {
      return false;
    }
    const fromPos = notationToPosition(from);
    const toPos = notationToPosition(to);
    const moveResult = makeMove(fromPos, toPos);

    if (moveResult.success && soundEnabled) {
      moveResult.capture ? soundSystem.playCapture() : soundSystem.playMove();
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

  const handleOfferDraw = () => {
    if (socket && gameState?.gameStatus === 'playing') {
      socket.emit('offerDraw', { roomCode });
      setGameMessage('Draw offer sent to opponent...');
    }
  };

  if (!gameState) {
    return <div className="multiplayer-loading"><h2>Loading game...</h2></div>;
  }

  // ** THIS IS THE JSX THAT WAS MISSING **
  return (
    <div className="multiplayer-chess-container">
      <div className={`connection-bar ${connectionStatus}`}>
        <div className="connection-info">
          <span className="status-dot"></span>
          <span>
            {connectionStatus === 'connected' && 'Connected'}
            {connectionStatus === 'reconnecting' && 'Reconnecting...'}
            {connectionStatus === 'disconnected' && 'Disconnected'}
          </span>
        </div>
        <div className="room-info">Room: {roomCode}</div>
        <div className="opponent-status">
          <span className={`opponent-dot ${opponent.connected ? 'connected' : 'disconnected'}`}></span>
          <span>{opponent.connected ? 'Opponent online' : 'Opponent offline'}</span>
        </div>
      </div>

      {gameMessage && <div className="game-message">{gameMessage}</div>}

      <div className="game-container">
        <div className="game-info-section">
          <GameInfo
            game={game}
            onBackToHome={onBackToMenu}
            difficulty="multiplayer"
            playerColor={playerColor}
          />
          <div className="multiplayer-controls">
            <div className="turn-indicator">
              <div className={`turn-badge ${isMyTurn ? 'my-turn' : 'opponent-turn'}`}>
                {isMyTurn ? 'Your Turn' : "Opponent's Turn"}
              </div>
            </div>
            {gameState.gameStatus === 'playing' && (
              <div className="game-actions">
                <button onClick={() => setShowResignConfirm(true)} className="resign-button" disabled={!opponent.connected}>
                  Resign
                </button>
                <button onClick={handleOfferDraw} className="draw-button" disabled={!opponent.connected}>
                  Offer Draw
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="chess-board-section">
          <ChessBoard
            game={game}
            rotated={playerColor === 'black'}
            soundEnabled={soundEnabled}
            boardTheme={boardTheme}
            onMove={handleMove}
            disabled={!isMyTurn || gameState.gameStatus !== 'playing' || !opponent.connected}
          />
        </div>
      </div>

      {showResignConfirm && (
        <div className="modal-backdrop">
          <div className="resign-modal">
            <h3>Resign Game?</h3>
            <p>Are you sure you want to resign? This will end the game and your opponent will win.</p>
            <div className="modal-actions">
              <button onClick={handleResign} className="confirm-resign">Yes, Resign</button>
              <button onClick={() => setShowResignConfirm(false)} className="cancel-resign">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiplayerChessBoard;