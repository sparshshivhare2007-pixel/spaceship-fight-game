const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Game configuration
const GAME_MODES = {
  '1v1': { maxPlayers: 2, teams: false },
  '2v2': { maxPlayers: 4, teams: true, teamSize: 2 },
  'squad': { maxPlayers: 4, teams: false, battleRoyale: true },
  '4v4': { maxPlayers: 8, teams: true, teamSize: 4 }
};

// Room storage
const rooms = new Map();

class GameRoom {
  constructor(roomId, hostId, hostName, gameMode) {
    this.roomId = roomId;
    this.hostId = hostId;
    this.gameMode = gameMode;
    this.maxPlayers = GAME_MODES[gameMode].maxPlayers;
    this.players = new Map(); // playerId -> { id, name, team, shipHealth, isReady }
    this.gameState = 'waiting'; // waiting, starting, active, ended
    this.gameLoop = null;
  }

  addPlayer(playerId, playerName) {
    if (this.players.size >= this.maxPlayers) {
      return { success: false, error: 'Room is full' };
    }
    
    // Assign team if teams mode
    let team = null;
    if (GAME_MODES[this.gameMode].teams) {
      const teamSize = GAME_MODES[this.gameMode].teamSize;
      const team1Count = Array.from(this.players.values()).filter(p => p.team === 1).length;
      const team2Count = Array.from(this.players.values()).filter(p => p.team === 2).length;
      
      if (team1Count < teamSize) team = 1;
      else if (team2Count < teamSize) team = 2;
      else team = null;
    }
    
    this.players.set(playerId, {
      id: playerId,
      name: playerName,
      team: team,
      shipHealth: 100,
      isReady: false,
      score: 0
    });
    
    return { success: true, team };
  }

  removePlayer(playerId) {
    this.players.delete(playerId);
    
    // If host leaves and room still has players, assign new host
    if (playerId === this.hostId && this.players.size > 0) {
      const newHost = Array.from(this.players.keys())[0];
      this.hostId = newHost;
      return { newHost };
    }
    
    return null;
  }

  canHostStart() {
    return this.players.size >= 2; // At least 2 players to start
  }

  startGame() {
    if (this.gameState !== 'waiting') return false;
    if (!this.canHostStart()) return false;
    
    this.gameState = 'active';
    
    // Initialize all players with full health
    this.players.forEach((player, id) => {
      player.shipHealth = 100;
      player.score = 0;
    });
    
    return true;
  }

  getGameState() {
    return {
      roomId: this.roomId,
      hostId: this.hostId,
      gameMode: this.gameMode,
      maxPlayers: this.maxPlayers,
      gameState: this.gameState,
      players: Array.from(this.players.entries()).map(([id, p]) => ({
        id,
        name: p.name,
        team: p.team,
        shipHealth: p.shipHealth,
        isReady: p.isReady,
        score: p.score
      }))
    };
  }
}

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);
  let currentRoom = null;

  // Create room
  socket.on('createRoom', ({ playerName, gameMode }) => {
    const roomId = uuidv4().substring(0, 8).toUpperCase();
    const room = new GameRoom(roomId, socket.id, playerName, gameMode);
    rooms.set(roomId, room);
    
    room.addPlayer(socket.id, playerName);
    socket.join(roomId);
    currentRoom = roomId;
    
    socket.emit('roomCreated', {
      roomId,
      gameState: room.getGameState()
    });
    
    io.to(roomId).emit('roomUpdate', room.getGameState());
  });

  // Join room
  socket.on('joinRoom', ({ roomId, playerName }) => {
    const room = rooms.get(roomId.toUpperCase());
    
    if (!room) {
      socket.emit('joinError', { error: 'Room not found' });
      return;
    }
    
    if (room.gameState !== 'waiting') {
      socket.emit('joinError', { error: 'Game already in progress' });
      return;
    }
    
    const result = room.addPlayer(socket.id, playerName);
    
    if (!result.success) {
      socket.emit('joinError', { error: result.error });
      return;
    }
    
    socket.join(roomId.toUpperCase());
    currentRoom = roomId.toUpperCase();
    
    socket.emit('joinSuccess', {
      roomId,
      team: result.team,
      gameState: room.getGameState()
    });
    
    io.to(roomId.toUpperCase()).emit('roomUpdate', room.getGameState());
  });

  // Player ready toggle
  socket.on('playerReady', ({ isReady }) => {
    if (!currentRoom) return;
    
    const room = rooms.get(currentRoom);
    if (!room) return;
    
    const player = room.players.get(socket.id);
    if (player) {
      player.isReady = isReady;
      io.to(currentRoom).emit('roomUpdate', room.getGameState());
    }
  });

  // Host start game
  socket.on('startGame', () => {
    if (!currentRoom) return;
    
    const room = rooms.get(currentRoom);
    if (!room) return;
    
    // Verify host
    if (room.hostId !== socket.id) {
      socket.emit('error', { error: 'Only the host can start the game' });
      return;
    }
    
    // Check if all players are ready
    const allReady = Array.from(room.players.values()).every(p => p.isReady === true);
    if (!allReady && room.players.size > 1) {
      socket.emit('error', { error: 'All players must be ready before starting' });
      return;
    }
    
    if (room.startGame()) {
      io.to(currentRoom).emit('gameStarted', { gameState: room.getGameState() });
      startGameLoop(room);
    } else {
      socket.emit('error', { error: 'Cannot start game: not enough players' });
    }
  });

  // Spaceship movement/shooting
  socket.on('playerAction', ({ action, data }) => {
    if (!currentRoom) return;
    
    const room = rooms.get(currentRoom);
    if (!room || room.gameState !== 'active') return;
    
    // Broadcast action to all players in room
    socket.to(currentRoom).emit('opponentAction', {
      playerId: socket.id,
      action,
      data
    });
  });

  // Damage dealt
  socket.on('dealDamage', ({ targetId, damage }) => {
    if (!currentRoom) return;
    
    const room = rooms.get(currentRoom);
    if (!room || room.gameState !== 'active') return;
    
    const target = room.players.get(targetId);
    if (target) {
      target.shipHealth = Math.max(0, target.shipHealth - damage);
      
      // Check for elimination
      if (target.shipHealth <= 0) {
        const attacker = room.players.get(socket.id);
        if (attacker) {
          attacker.score += 10;
        }
        
        io.to(currentRoom).emit('playerEliminated', {
          playerId: targetId,
          playerName: target.name
        });
      }
      
      io.to(currentRoom).emit('healthUpdate', {
        playerId: targetId,
        health: target.shipHealth
      });
      
      // Check game end condition
      checkGameEnd(room);
    }
  });

  // Disconnect handling
  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    
    if (currentRoom) {
      const room = rooms.get(currentRoom);
      if (room) {
        const hostChange = room.removePlayer(socket.id);
        
        if (room.players.size === 0) {
          // Delete empty room
          rooms.delete(currentRoom);
        } else {
          io.to(currentRoom).emit('playerDisconnected', {
            playerId: socket.id
          });
          
          if (hostChange) {
            io.to(currentRoom).emit('hostChanged', {
              newHostId: hostChange.newHost
            });
          }
          
          io.to(currentRoom).emit('roomUpdate', room.getGameState());
        }
      }
    }
  });
});

// Game loop for continuous updates
function startGameLoop(room) {
  if (room.gameLoop) clearInterval(room.gameLoop);
  
  room.gameLoop = setInterval(() => {
    if (room.gameState !== 'active') {
      clearInterval(room.gameLoop);
      return;
    }
    
    // Send game tick updates
    io.to(room.roomId).emit('gameTick', {
      timestamp: Date.now(),
      players: Array.from(room.players.entries()).map(([id, p]) => ({
        id,
        health: p.shipHealth,
        score: p.score
      }))
    });
  }, 1000 / 60); // 60 FPS updates
}

function checkGameEnd(room) {
  if (room.gameState !== 'active') return;
  
  let gameEnded = false;
  let winner = null;
  
  if (GAME_MODES[room.gameMode].teams) {
    // Team mode: check if one team has no players alive
    const team1Alive = Array.from(room.players.values()).filter(p => p.team === 1 && p.shipHealth > 0).length;
    const team2Alive = Array.from(room.players.values()).filter(p => p.team === 2 && p.shipHealth > 0).length;
    
    if (team1Alive === 0) {
      gameEnded = true;
      winner = { type: 'team', id: 2 };
    } else if (team2Alive === 0) {
      gameEnded = true;
      winner = { type: 'team', id: 1 };
    }
  } else {
    // Solo/BR mode: last player standing
    const alivePlayers = Array.from(room.players.values()).filter(p => p.shipHealth > 0);
    if (alivePlayers.length <= 1 && room.players.size >= 2) {
      gameEnded = true;
      winner = { type: 'player', id: alivePlayers[0]?.id };
    }
  }
  
  if (gameEnded) {
    room.gameState = 'ended';
    clearInterval(room.gameLoop);
    
    io.to(room.roomId).emit('gameEnded', {
      winner,
      finalScores: Array.from(room.players.entries()).map(([id, p]) => ({
        id,
        name: p.name,
        score: p.score
      }))
    });
    
    // Delete room after 30 seconds
    setTimeout(() => {
      rooms.delete(room.roomId);
    }, 30000);
  }
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
