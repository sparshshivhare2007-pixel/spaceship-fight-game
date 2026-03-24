const { GAME_MODES } = require('./roomManager');

function startGameLoop(room, io) {
  if (room.gameLoop) clearInterval(room.gameLoop);
  
  room.gameLoop = setInterval(() => {
    if (room.gameState !== 'active') {
      clearInterval(room.gameLoop);
      return;
    }
    
    // Send game tick updates to all players in room
    io.to(room.roomId).emit('gameTick', {
      timestamp: Date.now(),
      players: Array.from(room.players.entries()).map(([id, p]) => ({
        id,
        health: p.shipHealth,
        score: p.score,
        team: p.team
      }))
    });
  }, 1000 / 30); // 30 FPS updates
}

function checkGameEnd(room) {
  if (room.gameState !== 'active') return { gameEnded: false };
  
  let gameEnded = false;
  let winner = null;
  
  if (GAME_MODES[room.gameMode].teams) {
    // Team mode: check if one team has no players alive
    const team1Alive = Array.from(room.players.values()).filter(p => p.team === 1 && p.shipHealth > 0).length;
    const team2Alive = Array.from(room.players.values()).filter(p => p.team === 2 && p.shipHealth > 0).length;
    
    if (team1Alive === 0 && team2Alive > 0) {
      gameEnded = true;
      winner = { type: 'team', id: 2 };
    } else if (team2Alive === 0 && team1Alive > 0) {
      gameEnded = true;
      winner = { type: 'team', id: 1 };
    } else if (team1Alive === 0 && team2Alive === 0) {
      // Tie - all dead at same time
      gameEnded = true;
      winner = { type: 'draw' };
    }
  } else {
    // Solo/BR mode: last player standing
    const alivePlayers = Array.from(room.players.values()).filter(p => p.shipHealth > 0);
    if (alivePlayers.length <= 1 && room.players.size >= 2) {
      gameEnded = true;
      if (alivePlayers.length === 1) {
        winner = { type: 'player', id: alivePlayers[0].id };
      } else {
        winner = { type: 'draw' };
      }
    }
  }
  
  return { gameEnded, winner };
}

module.exports = { startGameLoop, checkGameEnd };
