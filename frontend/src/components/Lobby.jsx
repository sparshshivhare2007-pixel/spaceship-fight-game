import React, { useState } from 'react';

const Lobby = ({ onCreateRoom, onJoinRoom, telegramUser }) => {
  const [playerName, setPlayerName] = useState(telegramUser?.username || '');
  const [gameMode, setGameMode] = useState('1v1');
  const [joinRoomId, setJoinRoomId] = useState('');

  const gameModes = [
    { id: '1v1', name: '⚔️ 1v1 Duel', maxPlayers: 2, icon: '⚔️' },
    { id: '2v2', name: '👥 2v2 Team Battle', maxPlayers: 4, icon: '👥' },
    { id: 'squad', name: '🔫 Squad (4 Players)', maxPlayers: 4, icon: '🔫' },
    { id: '4v4', name: '🚀 4v4 Epic Battle', maxPlayers: 8, icon: '🚀' }
  ];

  const handleCreate = () => {
    if (playerName.trim() || telegramUser) {
      onCreateRoom(playerName || telegramUser?.first_name || 'Player', gameMode);
    }
  };

  const handleJoin = () => {
    if ((playerName.trim() || telegramUser) && joinRoomId.trim()) {
      onJoinRoom(joinRoomId, playerName || telegramUser?.first_name || 'Player');
    }
  };

  return (
    <div className="lobby">
      <h1>🚀 SPACESHIP FIGHT</h1>
      
      {telegramUser && (
        <div className="telegram-user">
          <p>Welcome, {telegramUser.first_name}! {telegramUser.username && `@${telegramUser.username}`}</p>
        </div>
      )}
      
      <div className="player-name">
        <input
          type="text"
          placeholder="Your Name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
        />
      </div>
      
      <div className="game-modes">
        <h3>SELECT GAME MODE</h3>
        <div className="mode-buttons">
          {gameModes.map(mode => (
            <button
              key={mode.id}
              className={gameMode === mode.id ? 'active' : ''}
              onClick={() => setGameMode(mode.id)}
            >
              {mode.name}
            </button>
          ))}
        </div>
      </div>
      
      <div className="create-room">
        <button onClick={handleCreate} disabled={!playerName && !telegramUser}>
          🎮 CREATE NEW ROOM
        </button>
      </div>
      
      <div className="join-room">
        <h3>OR JOIN EXISTING ROOM</h3>
        <input
          type="text"
          placeholder="Enter Room ID"
          value={joinRoomId}
          onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
          maxLength={8}
        />
        <button onClick={handleJoin} disabled={(!playerName && !telegramUser) || !joinRoomId}>
          🔗 JOIN ROOM
        </button>
      </div>
    </div>
  );
};

export default Lobby;
