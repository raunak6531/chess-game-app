import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import './MultiplayerMenu.css';

interface MultiplayerMenuProps {
  onBackToMenu: () => void;
  onGameStart: (socket: Socket, roomCode: string, playerColor: 'white' | 'black') => void;
}

interface RoomInfo {
  code: string;
  players: number;
  status: 'waiting' | 'playing' | 'full';
}

const MultiplayerMenu: React.FC<MultiplayerMenuProps> = ({
  onBackToMenu,
  onGameStart
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [roomCode, setRoomCode] = useState('');
  const [inputRoomCode, setInputRoomCode] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [error, setError] = useState('');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);

  // Keep latest values in refs for stable socket handlers
  const roomCodeRef = useRef(roomCode);
  useEffect(() => {
    roomCodeRef.current = roomCode;
  }, [roomCode]);

  const onGameStartRef = useRef(onGameStart);
  useEffect(() => {
    onGameStartRef.current = onGameStart;
  }, [onGameStart]);

  // Connect to server on component mount (once)
  useEffect(() => {
    // Use Vite's import.meta.env instead of process.env
    const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';
    console.log('Connecting to server:', serverUrl);

    const newSocket = io(serverUrl, {
      transports: ['websocket', 'polling']
    });

    setConnectionStatus('connecting');

    newSocket.on('connect', () => {
      console.log('Connected to server');
      setConnectionStatus('connected');
      setSocket(newSocket);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnectionStatus('disconnected');
    });

    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setConnectionStatus('disconnected');
      setError(`Failed to connect to server: ${error.message}`);
    });

    newSocket.on('roomCreated', (data: { roomCode: string }) => {
      console.log('Room created:', data.roomCode);
      setRoomCode(data.roomCode);
      setRoomInfo({
        code: data.roomCode,
        players: 1,
        status: 'waiting'
      });
      setIsCreatingRoom(false);
      setError('');
    });

    newSocket.on('roomJoined', (data: { roomCode: string, players: number }) => {
      console.log('Room joined:', data);
      setRoomCode(data.roomCode);
      setRoomInfo({
        code: data.roomCode,
        players: data.players,
        status: data.players === 2 ? 'playing' : 'waiting'
      });
      setIsJoiningRoom(false);
      setError('');
    });

    newSocket.on('playerJoined', (data: { players: number }) => {
      console.log('Player joined room:', data);
      setRoomInfo(prev => prev ? {
        ...prev,
        players: data.players,
        status: data.players === 2 ? 'playing' : 'waiting'
      } : null);
    });

    newSocket.on('playerLeft', (data: { players: number }) => {
      console.log('Player left room:', data);
      setRoomInfo(prev => prev ? {
        ...prev,
        players: data.players,
        status: 'waiting'
      } : null);
    });

    newSocket.on('gameStart', (data: { roomCode: string; playerColor: 'white' | 'black' }) => {
      console.log('Game starting, you are:', data.playerColor, 'room:', data.roomCode);
      const fallbackCode = (typeof inputRoomCode === 'string' ? inputRoomCode.trim().toUpperCase() : '') || undefined;
      const code = data.roomCode || roomCodeRef.current || fallbackCode;
      if (code) {
        onGameStartRef.current(newSocket, code, data.playerColor);
      }
    });

    newSocket.on('error', (data: { message: string }) => {
      console.error('Server error:', data.message);
      setError(data.message);
      setIsCreatingRoom(false);
      setIsJoiningRoom(false);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []); // IMPORTANT: no roomCode/onGameStart in deps

  const [hostColor, setHostColor] = useState<'white' | 'black' | 'random'>('random');
  const [timeControl, setTimeControl] = useState<'none' | '3+2' | '5+0' | '10+0'>('none');

  const createRoom = () => {
    if (!socket || connectionStatus !== 'connected') {
      setError('Not connected to server');
      return;
    }

    setIsCreatingRoom(true);
    setError('');
    socket.emit('createRoom', { colorPreference: hostColor, timeControl });
  };

  const joinRoom = () => {
    if (!socket || connectionStatus !== 'connected') {
      setError('Not connected to server');
      return;
    }

    if (!inputRoomCode.trim()) {
      setError('Please enter a room code');
      return;
    }

    setIsJoiningRoom(true);
    setError('');
    socket.emit('joinRoom', { roomCode: inputRoomCode.trim().toUpperCase() });
  };

  const leaveRoom = () => {
    if (socket && roomCode) {
      socket.emit('leaveRoom', { roomCode });
      setRoomCode('');
      setRoomInfo(null);
      setError('');
    }
  };

  const copyRoomCode = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode).then(() => {
        // Could add a toast notification here
        console.log('Room code copied to clipboard');
      });
    }
  };

  const generateRandomCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setInputRoomCode(code);
  };

  return (
    <div className="multiplayer-menu">
      {/* Background effects */}
      <div className="multiplayer-bg-effects">
        <div className="bg-effect-1"></div>
        <div className="bg-effect-2"></div>
        <div className="bg-effect-3"></div>
      </div>

      {/* Back button */}
      <button onClick={onBackToMenu} className="back-button">
        ← Back to Menu
      </button>

      <div className="multiplayer-content">
        <div className="multiplayer-header">
          <h1>Play with Friends</h1>
          <p>No accounts needed — just share a room code!</p>
        </div>

        {/* Connection Status */}
        <div className={`connection-status ${connectionStatus}`}>
          <div className="status-indicator"></div>
          <span>
            {connectionStatus === 'connecting' && 'Connecting to server...'}
            {connectionStatus === 'connected' && 'Connected'}
            {connectionStatus === 'disconnected' && 'Disconnected - Check your internet connection'}
          </span>
        </div>

        {/* Error Display */}
        {error && (
          <div className="error-message">
            <span>Error: {error}</span>
          </div>
        )}

        {/* Room Management */}
        {!roomInfo ? (
          <div className="room-actions">
            {/* Create Room */}
            <div className="action-card">
              <h3>Create Room</h3>
              <p>Start a new game and get a room code to share</p>

              {/* Host Settings */}
              <div className="host-settings">
                <div className="setting-group">
                  <label>Choose Color</label>
                  <div className="options">
                    <label><input type="radio" name="hostColor" value="random" checked={hostColor==='random'} onChange={() => setHostColor('random')} /> Random</label>
                    <label><input type="radio" name="hostColor" value="white" checked={hostColor==='white'} onChange={() => setHostColor('white')} /> White</label>
                    <label><input type="radio" name="hostColor" value="black" checked={hostColor==='black'} onChange={() => setHostColor('black')} /> Black</label>
                  </div>
                </div>
                <div className="setting-group">
                  <label>Timer</label>
                  <select value={timeControl} onChange={(e) => setTimeControl(e.target.value as any)}>
                    <option value="none">No timer</option>
                    <option value="3+2">3 + 2</option>
                    <option value="5+0">5 + 0</option>
                    <option value="10+0">10 + 0</option>
                  </select>
                </div>
              </div>

              <button
                onClick={createRoom}
                disabled={connectionStatus !== 'connected' || isCreatingRoom}
                className="action-button create-button"
              >
                {isCreatingRoom ? 'Creating...' : 'Create Room'}
              </button>
            </div>

            {/* Join Room */}
            <div className="action-card">
              <h3>Join Room</h3>
              <p>Enter a room code from your friend</p>
              <div className="join-room-form">
                <div className="input-group">
                  <input
                    type="text"
                    value={inputRoomCode}
                    onChange={(e) => setInputRoomCode(e.target.value.toUpperCase())}
                    placeholder="Enter room code"
                    maxLength={6}
                    className="room-code-input"
                  />
                  <button
                    onClick={generateRandomCode}
                    className="random-button"
                    title="Generate random code (for testing)"
                  >
                    ⟲
                  </button>
                </div>
                <button
                  onClick={joinRoom}
                  disabled={connectionStatus !== 'connected' || isJoiningRoom}
                  className="action-button join-button"
                >
                  {isJoiningRoom ? 'Joining...' : 'Join Room'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Room Info */
          <div className="room-info">
            <div className="room-card">
              <div className="room-header">
                <h3>Room: {roomInfo.code}</h3>
                <button onClick={copyRoomCode} className="copy-button" title="Copy room code">
                  Copy
                </button>
              </div>
              
              <div className="room-status">
                <div className="players-count">
                  <span>{roomInfo.players}/2 Players</span>
                </div>
                
                <div className={`status-badge ${roomInfo.status}`}>
                  {roomInfo.status === 'waiting' && 'Waiting for opponent...'}
                  {roomInfo.status === 'playing' && 'Game starting...'}
                  {roomInfo.status === 'full' && 'Room full'}
                </div>
              </div>

              {roomInfo.status === 'waiting' && (
                <div className="waiting-message">
                  <p>Share this room code with your friend:</p>
                  <div className="room-code-display">
                    <span className="code">{roomInfo.code}</span>
                    <button onClick={copyRoomCode} className="copy-inline">Copy</button>
                  </div>
                </div>
              )}

              <button onClick={leaveRoom} className="leave-button">
                Leave Room
              </button>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="instructions">
          <h4>How it works:</h4>
          <ol>
            <li>One player creates a room and gets a 6-digit code</li>
            <li>Share the code with your friend</li>
            <li>Your friend joins using the code</li>
            <li>Game starts automatically when both players are ready!</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default MultiplayerMenu;