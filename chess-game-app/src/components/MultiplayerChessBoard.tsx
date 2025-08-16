import React, { useEffect, useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import ChessBoard from './ChessBoard';
import GameInfo from './GameInfo';
import { useChessGame } from '../hooks/useChessGame';
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

interface GameState {
  fen: string;
  turn: 'white' | 'black';
  gameStatus: 'playing' | 'checkmate' | 'stalemate' | 'draw' | 'resigned';
  winner?: 'white' | 'black' | 'draw';
  lastMove?: {
    from: string;
    to: string;
    piece: string;
  };
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
  const game = useChessGame();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [opponent, setOpponent] = useState<OpponentInfo>({ connected: true });
  const [isMyTurn, setIsMyTurn] = useState(playerColor === 'white');
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'reconnecting' | 'disconnected'>('connected');
  const [showResignConfirm, setShowResignConfirm] = useState(false);
  const [gameMessage, setGameMessage] = useState('');

  // Initialize game state
  useEffect(() => {
    if (game) {
      game.resetGame();
      game.setPlayerColor(playerColor);
      
      // Set initial game state
      setGameState({
        fen: game.getFEN(),
        turn: 'white',
        gameStatus: 'playing'
      });
    }
  }, [game, playerColor]);

  // Socket event handlers
  useEffect(() => {
    if (!socket || !game) return;

    // Handle moves from opponent
    socket.on('moveReceived', (data: { from: string; to: string; fen: string; turn: 'white' | 'black' }) => {
      console.log('Move received:', data);
      
      // Apply the move to our game
      game.loadFEN(data.fen);
      
      setGameState(prev => ({
        ...prev!,
        fen: data.fen,
        turn: data.turn,
        lastMove: {
          from: data.from,
          to: data.to,
          piece: '' // We could get this from the move if needed
        }
      }));
      
      setIsMyTurn(data.turn === playerColor);
      
      // Play sound for opponent's move
      if (soundEnabled) {
        soundSystem.playMove();
      }
    });

    // Handle game state updates
    socket.on('gameStateUpdate', (data: GameState) => {
      console.log('Game state update:', data);
      setGameState(data);
      setIsMyTurn(data.turn === playerColor && data.gameStatus === 'playing');
      
      if (data.gameStatus !== 'playing') {
        handleGameEnd(data);
      }
    });

    // Handle opponent connection status
    socket.on('opponentConnected', (data: OpponentInfo) => {
      console.log('Opponent connected:', data);
      setOpponent(data);
      setGameMessage('');
    });

    socket.on('opponentDisconnected', () => {
      console.log('Opponent disconnected');
      setOpponent({ connected: false });
      setGameMessage('Opponent disconnected. Waiting for reconnection...');
    });

    // Handle connection status
    socket.on('connect', () => {
      setConnectionStatus('connected');
    });

    socket.on('disconnect', () => {
      setConnectionStatus('disconnected');
    });

    socket.on('reconnecting', () => {
      setConnectionStatus('reconnecting');
    });

    // Handle game end events
    socket.on('gameEnded', (data: { reason: string; winner?: 'white' | 'black' | 'draw' }) => {
      console.log('Game ended:', data);
      setGameState(prev => ({
        ...prev!,
        gameStatus: data.reason as any,
        winner: data.winner
      }));
      handleGameEnd({ ...gameState!, gameStatus: data.reason as any, winner: data.winner });
    });

    // Handle resignation
    socket.on('opponentResigned', () => {
      console.log('Opponent resigned');
      setGameState(prev => ({
        ...prev!,
        gameStatus: 'resigned',
        winner: playerColor
      }));
      setGameMessage('Your opponent resigned. You win!');
      if (soundEnabled) {
        soundSystem.playGameStart(); // Victory sound
      }
    });

    return () => {
      socket.off('moveReceived');
      socket.off('gameStateUpdate');
      socket.off('opponentConnected');
      socket.off('opponentDisconnected');
      socket.off('gameEnded');
      socket.off('opponentResigned');
    };
  }, [socket, game, playerColor, soundEnabled, gameState]);

  const handleGameEnd = (state: GameState) => {
    let message = '';
    
    switch (state.gameStatus) {
      case 'checkmate':
        message = state.winner === playerColor ? 'Checkmate! You win!' : 'Checkmate! You lose.';
        break;
      case 'stalemate':
        message = 'Stalemate! It\'s a draw.';
        break;
      case 'draw':
        message = 'Game ended in a draw.';
        break;
      case 'resigned':
        message = state.winner === playerColor ? 'Your opponent resigned. You win!' : 'You resigned.';
        break;
    }
    
    setGameMessage(message);
    
    if (soundEnabled) {
      if (state.winner === playerColor) {
        soundSystem.playGameStart(); // Victory sound
      } else if (state.winner === 'draw') {
        soundSystem.playMove(); // Draw sound
      }
    }
  };

  const handleMove = useCallback((from: string, to: string) => {
    if (!game || !socket || !isMyTurn || gameState?.gameStatus !== 'playing') {
      return false;
    }

    // Try to make the move locally first
    const moveResult = game.makeMove(from, to);
    
    if (moveResult.success) {
      const newFEN = game.getFEN();
      const newTurn = game.getTurn();
      
      // Send move to server
      socket.emit('makeMove', {
        roomCode,
        from,
        to,
        fen: newFEN,
        turn: newTurn
      });

      // Update local state
      setGameState(prev => ({
        ...prev!,
        fen: newFEN,
        turn: newTurn,
        lastMove: { from, to, piece: moveResult.piece || '' }
      }));
      
      setIsMyTurn(false);

      // Play move sound
      if (soundEnabled) {
        if (moveResult.capture) {
          soundSystem.playCapture();
        } else {
          soundSystem.playMove();
        }
      }

      // Check for game end conditions
      if (game.isGameOver()) {
        const gameStatus = game.isCheckmate() ? 'checkmate' : 
                          game.isStalemate() ? 'stalemate' : 'draw';
        const winner = gameStatus === 'checkmate' ? playerColor : 'draw';
        
        socket.emit('gameEnd', {
          roomCode,
          reason: gameStatus,
          winner
        });
      }

      return true;
    }

    return false;
  }, [game, socket, isMyTurn, gameState, roomCode, playerColor, soundEnabled]);

  const handleResign = () => {
    if (socket && gameState?.gameStatus === 'playing') {
      socket.emit('resign', { roomCode });
      setGameState(prev => ({
        ...prev!,
        gameStatus: 'resigned',
        winner: playerColor === 'white' ? 'black' : 'white'
      }));
      setGameMessage('You resigned.');
      setShowResignConfirm(false);
    }
  };

  const handleOfferDraw = () => {
    if (socket && gameState?.gameStatus === 'playing') {
      socket.emit('offerDraw', { roomCode });
      setGameMessage('Draw offer sent to opponent...');
    }
  };

  if (!game || !gameState) {
    return (
      <div className="multiplayer-loading">
        <h2>Loading game...</h2>
      </div>
    );
  }

  return (
    <div className="multiplayer-chess-container">
      {/* Connection Status Bar */}
      <div className={`connection-bar ${connectionStatus}`}>
        <div className="connection-info">
          <span className="status-dot"></span>
          <span>
            {connectionStatus === 'connected' && 'Connected'}
            {connectionStatus === 'reconnecting' && 'Reconnecting...'}
            {connectionStatus === 'disconnected' && 'Disconnected'}
          </span>
        </div>
        
        <div className="room-info">
          Room: {roomCode}
        </div>
        
        <div className="opponent-status">
          <span className={`opponent-dot ${opponent.connected ? 'connected' : 'disconnected'}`}></span>
          <span>
            {opponent.connected ? 'Opponent online' : 'Opponent offline'}
          </span>
        </div>
      </div>

      {/* Game Message */}
      {gameMessage && (
        <div className="game-message">
          {gameMessage}
        </div>
      )}

      {/* Main Game Area */}
      <div className="game-container">
        <div className="game-info-section">
          <GameInfo
            game={game}
            onBackToHome={onBackToMenu}
            difficulty="multiplayer"
            playerColor={playerColor}
          />
          
          {/* Multiplayer Controls */}
          <div className="multiplayer-controls">
            <div className="turn-indicator">
              <div className={`turn-badge ${isMyTurn ? 'my-turn' : 'opponent-turn'}`}>
                {isMyTurn ? 'Your Turn' : 'Opponent\'s Turn'}
              </div>
            </div>
            
            {gameState.gameStatus === 'playing' && (
              <div className="game-actions">
                <button
                  onClick={() => setShowResignConfirm(true)}
                  className="resign-button"
                  disabled={!opponent.connected}
                >
                  Resign
                </button>
                
                <button
                  onClick={handleOfferDraw}
                  className="draw-button"
                  disabled={!opponent.connected}
                >
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

      {/* Resign Confirmation Modal */}
      {showResignConfirm && (
        <div className="modal-backdrop">
          <div className="resign-modal">
            <h3>Resign Game?</h3>
            <p>Are you sure you want to resign? This will end the game and your opponent will win.</p>
            <div className="modal-actions">
              <button onClick={handleResign} className="confirm-resign">
                Yes, Resign
              </button>
              <button onClick={() => setShowResignConfirm(false)} className="cancel-resign">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiplayerChessBoard;