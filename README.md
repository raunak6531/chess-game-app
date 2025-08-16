# Chess Game with Multiplayer

A beautiful chess game with both single-player (vs AI) and multiplayer (vs friends) modes.

## Features

### Single Player
- Play against AI with multiple difficulty levels
- Beautiful animated chess board with multiple themes
- Sound effects and visual feedback
- Piece promotion with selection dialog

### Multiplayer
- **No account required** - just share a room code!
- Real-time gameplay using WebSocket connections
- Room-based system with 6-digit codes
- Automatic color assignment (first player = white, second = black)
- Connection status indicators
- Resign and draw offer functionality

## How to Run

### 1. Start the Backend Server

```bash
cd server
npm install
npm start
```

The server will run on `http://localhost:3001`

### 2. Start the Frontend

```bash
cd chess-game-app
npm install
npm start
```

The game will run on `http://localhost:3000`

## How Multiplayer Works

### Creating a Game
1. Click "Play with Friends" from the main menu
2. Click "Create Room" - you'll get a 6-digit room code
3. Share this code with your friend
4. Game starts automatically when both players join

### Joining a Game
1. Click "Play with Friends" from the main menu
2. Enter the room code your friend shared
3. Click "Join Room"
4. Game starts automatically when both players are ready

### During the Game
- **Turn Indicator**: Shows whose turn it is
- **Connection Status**: Shows if opponent is online
- **Game Controls**: Resign or offer draw
- **Real-time Moves**: See opponent's moves instantly

## Technical Architecture

### Frontend (React + TypeScript)
- **Socket.IO Client**: Real-time communication
- **Custom Chess Engine**: Move validation and game logic
- **Responsive Design**: Works on desktop and mobile
- **State Management**: React hooks for game state

### Backend (Node.js + Socket.IO)
- **Room Management**: Create/join rooms with codes
- **Move Synchronization**: Broadcast moves between players
- **Connection Handling**: Manage player connections/disconnections
- **Game State**: Track game status and turns

### Key Components
- `MultiplayerMenu`: Room creation and joining interface
- `MultiplayerChessBoard`: Real-time chess gameplay
- `ChessBoard`: Enhanced to support multiplayer moves
- `useChessGame`: Chess logic with multiplayer support

## Deployment Options

### Local Network
- Both players on same WiFi can play using local IP
- Change `REACT_APP_SERVER_URL` to your local IP

### Cloud Deployment
- Deploy server to Heroku, Railway, or similar
- Deploy frontend to Vercel, Netlify, or similar
- Update `REACT_APP_SERVER_URL` to your server URL

### Example Environment Variables
```bash
# Frontend (.env)
REACT_APP_SERVER_URL=http://localhost:3001

# Production
REACT_APP_SERVER_URL=https://your-server.herokuapp.com
```

## Security & Privacy

- **No Personal Data**: No accounts, emails, or personal info required
- **Temporary Rooms**: Rooms auto-delete when empty
- **Local Storage Only**: Game preferences stored locally
- **No Chat**: Focus on chess gameplay only

## Browser Compatibility

- **Modern Browsers**: Chrome, Firefox, Safari, Edge
- **Mobile Support**: Responsive design for phones/tablets
- **WebSocket Support**: Required for real-time gameplay

## Troubleshooting

### Connection Issues
- Check if server is running on port 3001
- Verify firewall settings
- Try refreshing the page

### Room Not Found
- Double-check the room code (case-sensitive)
- Room may have expired (auto-cleanup after 30 minutes)
- Create a new room if needed

### Game Sync Issues
- Both players should refresh if moves aren't syncing
- Check internet connection stability
- Server logs will show connection status

## Future Enhancements

- [ ] Spectator mode
- [ ] Game replay system
- [ ] Tournament brackets
- [ ] Time controls (blitz, rapid)
- [ ] Rating system (optional)
- [ ] Mobile app versions

Enjoy playing chess with your friends! 🎯♟️