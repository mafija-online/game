import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { GameRoom } from './gameRoom.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://game-zeta-flax-54.vercel.app',
      process.env.FRONTEND_URL,
    ].filter(Boolean),
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(cors());
app.use(express.json());

const rooms = new Map();

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    rooms: rooms.size,
    timestamp: new Date().toISOString()
  });
});

app.get('/room/:code', (req, res) => {
  const room = rooms.get(req.params.code);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  res.json({
    code: room.code,
    players: room.players.length,
    maxPlayers: room.maxPlayers,
    phase: room.phase,
    hostId: room.hostId
  });
});

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on('create-room', ({ roomCode, playerName }) => {
    if (rooms.has(roomCode)) {
      socket.emit('error', { message: 'Room already exists' });
      return;
    }

    const room = new GameRoom(roomCode, socket.id, io);
    rooms.set(roomCode, room);
    
    socket.join(roomCode);
    room.addPlayer(socket.id, playerName, true);
    
    socket.emit('room-created', {
      roomCode,
      hostId: socket.id,
      player: room.getPlayer(socket.id)
    });

    io.to(roomCode).emit('players-updated', { players: room.getPlayers() });
  });

  socket.on('join-room', ({ roomCode, playerName }) => {
    const room = rooms.get(roomCode);
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    if (room.phase !== 'lobby') {
      socket.emit('error', { message: 'Game already started' });
      return;
    }

    if (room.players.length >= room.maxPlayers) {
      socket.emit('error', { message: 'Room is full' });
      return;
    }

    socket.join(roomCode);
    room.addPlayer(socket.id, playerName, false);
    
    socket.emit('room-joined', {
      roomCode,
      hostId: room.hostId,
      player: room.getPlayer(socket.id),
      players: room.getPlayers()
    });

    io.to(roomCode).emit('players-updated', { players: room.getPlayers() });
  });

  socket.on('start-game', ({ roomCode, chatDuration }) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    if (socket.id !== room.hostId) return;
    if (room.players.length < 4) {
      socket.emit('error', { message: 'Need at least 4 players' });
      return;
    }
    if (room.players.length > 15) {
      socket.emit('error', { message: 'Maximum 15 players' });
      return;
    }
    room.startGame(chatDuration || 120);
  });

  socket.on('select-target', ({ roomCode, targetId }) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    room.handleTargetSelection(socket.id, targetId);
  });

  socket.on('skip-action', ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    room.handleSkipAction(socket.id);
  });

  socket.on('send-message', ({ roomCode, message, isMafiaChat }) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    room.handleChatMessage(socket.id, message, isMafiaChat);
  });

  socket.on('cast-vote', ({ roomCode, targetId }) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    room.handleVote(socket.id, targetId);
  });

  socket.on('host-rematch-decision', ({ roomCode, wantsRematch }) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    if (socket.id !== room.hostId) return;
    room.handleHostRematchDecision(wantsRematch);
  });

  socket.on('player-rematch', ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    room.handlePlayerRematch(socket.id);
  });

  socket.on('leave-lobby', ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    
    if (socket.id === room.hostId) {
      room.handleHostLeaveLobby();
      rooms.delete(roomCode);
      return;
    }
    
    room.removePlayer(socket.id);
    socket.leave(roomCode);
    io.to(roomCode).emit('players-updated', { players: room.getPlayers() });
  });

  socket.on('leave-game', ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    
    const shouldDeleteRoom = room.removePlayerFromGame(socket.id);
    
    if (shouldDeleteRoom) {
      rooms.delete(roomCode);
    }
  });

  socket.on('disconnect', () => {
    for (const [code, room] of rooms.entries()) {
      if (room.hasPlayer(socket.id)) {
        room.removePlayer(socket.id);
        if (socket.id === room.hostId) {
          if (room.players.length > 0) {
            room.assignNewHost();
            io.to(code).emit('host-changed', { hostId: room.hostId });
          } else {
            rooms.delete(code);
          }
        }
        io.to(code).emit('players-updated', { players: room.getPlayers() });
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🎮 Mafia Game Server running on port ${PORT}`);
});