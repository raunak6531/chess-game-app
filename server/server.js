const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Configure CORS for Socket.IO
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:5173", "https://chess-game-app-lemon.vercel.app", "*"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(cors());
app.use(express.json());

// Store active rooms and players
const rooms = new Map();
const playerSockets = new Map();

// Generate a random 6-character room code
function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Create a new room
function createRoom() {
  let roomCode;
  do {
    roomCode = generateRoomCode();
  } while (rooms.has(roomCode));

  const room = {
    code: roomCode,
    players: [],
    gameState: {
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', // Starting position
      turn: 'white',
      status: 'waiting'
    },
    createdAt: Date.now()
  };

  rooms.set(roomCode, room);
  console.log(`Room created: ${roomCode}`);
  return room;
}

// Add player to room
function addPlayerToRoom(roomCode, socketId) {
  const room = rooms.get(roomCode);
  if (!room) return null;

  if (room.players.length >= 2) {
    return { error: 'Room is full' };
  }

  // Prevent the same socket from joining the same room twice
  if (room.players.some(p => p.socketId === socketId)) {
    return { error: 'Already in this room' };
  }

  // Prevent the same socket from joining the same room twice
  if (room.players.some(p => p.socketId === socketId)) {
    return { error: 'Already in this room' };
  }

  const playerColor = room.players.length === 0 ? 'white' : 'black';
  const player = {
    socketId,
    color: playerColor,
    connected: true,
    joinedAt: Date.now()
  };

  room.players.push(player);
  playerSockets.set(socketId, { roomCode, color: playerColor });

  console.log(`Player ${socketId} joined room ${roomCode} as ${playerColor}`);
  return { room, player };
}

// Remove player from room
function removePlayerFromRoom(socketId) {
  const playerInfo = playerSockets.get(socketId);
  if (!playerInfo) return null;

  const { roomCode } = playerInfo;
  const room = rooms.get(roomCode);
  if (!room) return null;

  room.players = room.players.filter(p => p.socketId !== socketId);
  playerSockets.delete(socketId);

  console.log(`Player ${socketId} left room ${roomCode}`);

  // If room is empty, clean it up after 5 minutes
  if (room.players.length === 0) {
    setTimeout(() => {
      if (rooms.has(roomCode) && rooms.get(roomCode).players.length === 0) {
        rooms.delete(roomCode);
        console.log(`Room ${roomCode} cleaned up`);
      }
    }, 5 * 60 * 1000);
  }

  return { room, roomCode };
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Create room
  socket.on('createRoom', () => {
    try {
      const room = createRoom();
      const result = addPlayerToRoom(room.code, socket.id);
      
      if (result.error) {
        socket.emit('error', { message: result.error });
        return;
      }

      socket.join(room.code);
      socket.emit('roomCreated', { roomCode: room.code });
      
      console.log(`Room ${room.code} created by ${socket.id}`);
    } catch (error) {
      console.error('Error creating room:', error);
      socket.emit('error', { message: 'Failed to create room' });
    }
  });

  // Join room
  socket.on('joinRoom', ({ roomCode }) => {
    try {
      if (!roomCode || typeof roomCode !== 'string') {
        socket.emit('error', { message: 'Invalid room code' });
        return;
      }

      const room = rooms.get(roomCode.toUpperCase());
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      const result = addPlayerToRoom(roomCode.toUpperCase(), socket.id);
      if (result.error) {
        socket.emit('error', { message: result.error });
        return;
      }

      socket.join(roomCode.toUpperCase());
      socket.emit('roomJoined', { 
        roomCode: roomCode.toUpperCase(), 
        players: room.players.length 
      });

      // Notify other players in the room
      socket.to(roomCode.toUpperCase()).emit('playerJoined', { 
        players: room.players.length 
      });

      // If room is full, start the game
      if (room.players.length === 2) {
        room.gameState.status = 'playing';
        
        // Assign colors and notify players
        room.players.forEach(player => {
          io.to(player.socketId).emit('gameStart', { 
            playerColor: player.color 
          });
        });

        console.log(`Game started in room ${roomCode.toUpperCase()}`);
      }
    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  // Leave room
  socket.on('leaveRoom', ({ roomCode }) => {
    try {
      socket.leave(roomCode);
      const result = removePlayerFromRoom(socket.id);
      
      if (result) {
        socket.to(roomCode).emit('playerLeft', { 
          players: result.room.players.length 
        });
      }
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  });

  // Handle moves
  socket.on('makeMove', ({ roomCode, from, to, fen, turn }) => {
    try {
      const playerInfo = playerSockets.get(socket.id);
      if (!playerInfo || playerInfo.roomCode !== roomCode) {
        socket.emit('error', { message: 'Not in this room' });
        return;
      }

      const room = rooms.get(roomCode);
      if (!room || room.gameState.status !== 'playing') {
        socket.emit('error', { message: 'Game not active' });
        return;
      }

      // Verify it's the player's turn
      if (room.gameState.turn !== playerInfo.color) {
        socket.emit('error', { message: 'Not your turn' });
        return;
      }

      // Update game state
      room.gameState.fen = fen;
      room.gameState.turn = turn;

      // Broadcast move to other players in the room
      socket.to(roomCode).emit('moveReceived', {
        from,
        to,
        fen,
        turn
      });

      console.log(`Move made in room ${roomCode}: ${from} to ${to}`);
    } catch (error) {
      console.error('Error handling move:', error);
      socket.emit('error', { message: 'Failed to process move' });
    }
  });

  // Handle game end
  socket.on('gameEnd', ({ roomCode, reason, winner }) => {
    try {
      const room = rooms.get(roomCode);
      if (!room) return;

      room.gameState.status = reason;
      room.gameState.winner = winner;

      socket.to(roomCode).emit('gameEnded', { reason, winner });
      console.log(`Game ended in room ${roomCode}: ${reason}, winner: ${winner}`);
    } catch (error) {
      console.error('Error handling game end:', error);
    }
  });

  // Handle resignation
  socket.on('resign', ({ roomCode }) => {
    try {
      const playerInfo = playerSockets.get(socket.id);
      if (!playerInfo || playerInfo.roomCode !== roomCode) return;

      const room = rooms.get(roomCode);
      if (!room) return;

      room.gameState.status = 'resigned';
      room.gameState.winner = playerInfo.color === 'white' ? 'black' : 'white';

      socket.to(roomCode).emit('opponentResigned');
      console.log(`Player ${socket.id} resigned in room ${roomCode}`);
    } catch (error) {
      console.error('Error handling resignation:', error);
    }
  });

  // Handle draw offers
  socket.on('offerDraw', ({ roomCode }) => {
    try {
      socket.to(roomCode).emit('drawOffered');
      console.log(`Draw offered in room ${roomCode}`);
    } catch (error) {
      console.error('Error handling draw offer:', error);
    }
  });

  socket.on('acceptDraw', ({ roomCode }) => {
    try {
      const room = rooms.get(roomCode);
      if (!room) return;

      room.gameState.status = 'draw';
      room.gameState.winner = 'draw';

      io.to(roomCode).emit('gameEnded', { reason: 'draw', winner: 'draw' });
      console.log(`Draw accepted in room ${roomCode}`);
    } catch (error) {
      console.error('Error handling draw acceptance:', error);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    
    const result = removePlayerFromRoom(socket.id);
    if (result) {
      socket.to(result.roomCode).emit('opponentDisconnected');
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    rooms: rooms.size, 
    players: playerSockets.size,
    uptime: process.uptime()
  });
});

// Get room info (for debugging)
app.get('/rooms', (req, res) => {
  const roomList = Array.from(rooms.entries()).map(([code, room]) => ({
    code,
    players: room.players.length,
    status: room.gameState.status,
    createdAt: room.createdAt
  }));
  res.json(roomList);
});

// Clean up old rooms periodically (every 30 minutes)
setInterval(() => {
  const now = Date.now();
  const maxAge = 30 * 60 * 1000; // 30 minutes

  for (const [roomCode, room] of rooms.entries()) {
    if (now - room.createdAt > maxAge && room.players.length === 0) {
      rooms.delete(roomCode);
      console.log(`Cleaned up old room: ${roomCode}`);
    }
  }
}, 30 * 60 * 1000);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Chess multiplayer server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Room list: http://localhost:${PORT}/rooms`);
});

module.exports = { app, server, io };