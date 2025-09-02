import React, { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import ChessBoard from './ChessBoard';
import GameInfo from './GameInfo';
import { useChessGame } from '../hooks/useChessGame';
import type { ChessGameHook } from '../hooks/useChessGame';
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
  const game = useChessGame(socket, roomCode) as ChessGameHook;
  const { gameState, setPlayerColor, resetGame, setComputerEnabled } = game;

  const [opponent, setOpponent] = useState<OpponentInfo>({ connected: true });
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'reconnecting' | 'disconnected'>('connected');
  const [showResignConfirm, setShowResignConfirm] = useState(false);
  const [gameMessage, setGameMessage] = useState('');

  const isMyTurn = gameState.currentPlayer === playerColor;

  useEffect(() => {
    if (!socket) return;
    
    const handleConnect = () => setConnectionStatus('connected');
    const handleDisconnect = () => setConnectionStatus('disconnected');
    const handleReconnecting = () => setConnectionStatus('reconnecting');
    const handleOpponentConnected = (data: OpponentInfo) => setOpponent(data);
    const handleOpponentDisconnected = () => {
      setOpponent({ connected: false });
      setGameMessage('Opponent disconnected.');
    };
    const handleGameEnded = (data: { reason: string; winner?: 'white' | 'black' | 'draw' }) => {
      let message = 'The game has ended.';
      if (data.reason === 'checkmate') {
        message = data.winner === playerColor ? 'Checkmate! You win!' : 'Checkmate! You lose.';
      } else if (data.reason === 'stalemate' || data.reason === 'draw') {
        message = "It's a draw.";
      }
      setGameMessage(message);
    };
    const handleOpponentResigned = () => setGameMessage('Your opponent resigned. You win!');

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('reconnecting', handleReconnecting);
    socket.on('opponentConnected', handleOpponentConnected);
    socket.on('opponentDisconnected', handleOpponentDisconnected);
    socket.on('gameEnded', handleGameEnded);
    socket.on('opponentResigned', handleOpponentResigned);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('reconnecting', handleReconnecting);
      socket.off('opponentConnected', handleOpponentConnected);
      socket.off('opponentDisconnected', handleOpponentDisconnected);
      socket.off('gameEnded', handleGameEnded);
      socket.off('opponentResigned', handleOpponentResigned);
    };
  }, [socket, playerColor]);

  useEffect(() => {
    setComputerEnabled(false);
    resetGame();
    setPlayerColor(playerColor);
  }, [setComputerEnabled, resetGame, setPlayerColor, playerColor]);

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

      {/* --- UPDATED JSX STRUCTURE FOR 3-COLUMN LAYOUT --- */}
      <div className="game-layout-grid">
        <div className="game-info-section">
          <GameInfo game={game} onBackToHome={onBackToMenu} difficulty="multiplayer" playerColor={playerColor} />
        </div>

        <div className="chess-board-section">
          <ChessBoard
            game={game}
            rotated={playerColor === 'black'}
            soundEnabled={soundEnabled}
            boardTheme={boardTheme}
            disabled={!isMyTurn || (gameState.gameStatus !== 'playing' && gameState.gameStatus !== 'check') || !opponent.connected}
          />
        </div>

        <div className="multiplayer-controls-section">
          <div className="multiplayer-controls">
            <div className="turn-indicator">
              <div className={`turn-badge ${isMyTurn ? 'my-turn' : 'opponent-turn'}`}>
                {isMyTurn ? 'Your Turn' : "Opponent's Turn"}
              </div>
            </div>
            {gameState.gameStatus === 'playing' && (
              <div className="game-actions">
                <button onClick={() => setShowResignConfirm(true)} className="resign-button" disabled={!opponent.connected}>Resign</button>
                <button onClick={handleOfferDraw} className="draw-button" disabled={!opponent.connected}>Offer Draw</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showResignConfirm && (
        <div className="modal-backdrop">
          <div className="resign-modal">
            <h3>Resign Game?</h3>
            <p>Are you sure you want to resign?</p>
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
