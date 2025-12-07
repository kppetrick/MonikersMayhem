// server/game/gameState.js
// In-memory representation of rooms and game state.

const rooms = new Map(); // roomCode -> roomState

function createEmptyRoom(roomCode) {
  return {
    code: roomCode,
    players: [], // { socketId, profileId, name, teamId?, isHost?, disconnected? }
    teams: [],   // [{ id: "A", name: "Team A", playerIds: [] }, ...]
    deck: [],    // active game deck (card IDs)
    discard: [], // used or completed cards
    roundNumber: 1,
    currentTurn: null, // { teamId, clueGiverId, timerRemaining, ... }
    status: "lobby",   // "lobby" | "draft" | "round" | "finished"
    createdAt: Date.now(),
  };
}

function getOrCreateRoom(roomCode) {
  if (!rooms.has(roomCode)) {
    rooms.set(roomCode, createEmptyRoom(roomCode));
  }
  return rooms.get(roomCode);
}

/**
 * Get room by code. Throws error if room doesn't exist.
 * Use getOrCreateRoom() if you want to create the room if missing.
 */
function getRoom(roomCode) {
  if(!rooms.has(roomCode)) {
    throw new Error(`Room ${roomCode} does not exist`);
  }
  return rooms.get(roomCode)
}

/**
 * Add player to room. Handles reconnection (same profileId, different socketId).
 * First player automatically becomes host.
 * On reconnection, restores player state (team, host status if they were original host).
 */
function addPlayerToRoom(roomCode, socketId, profile) {
  // Room must exist (created by TV). Throws error if room doesn't exist.
  const room = getRoom(roomCode);
  
  // Handle reconnection: find existing player (including disconnected ones)
  const existingPlayer = room.players.find(player => player.profileId === profile.id);
  if(existingPlayer) {
    existingPlayer.socketId = socketId;
    existingPlayer.disconnected = false;
    
    // If they were the original host, restore their host status
    if(existingPlayer.wasOriginalHost === true) {
      // Remove host from temporary host (if any)
      room.players.forEach(p => {
        if(p.profileId !== existingPlayer.profileId && p.isHost) {
          p.isHost = false;
        }
      });
      existingPlayer.isHost = true;
    }
    
    return existingPlayer;
  }

  // New player: create and add to room
  // Count only connected players to determine if this is the first
  const connectedPlayers = room.players.filter(p => !p.disconnected);
  const isFirstPlayer = connectedPlayers.length === 0;
  const newPlayer = {
    socketId,
    profileId: profile.id,
    name: profile.name,
    isHost: isFirstPlayer,
    wasOriginalHost: isFirstPlayer, // Track if they were the original host
    teamId: undefined,
    disconnected: false,
  };
  room.players.push(newPlayer);
  return newPlayer;
}

/**
 * Mark player as disconnected (keeps them in room to preserve state).
 * Temporarily reassigns host to a connected player if host disconnects.
 * Original host gets their status back on reconnection.
 */
function removePlayerFromRoom(roomCode, socketId) {
  const room = getRoom(roomCode);
  const player = room.players.find(p => p.socketId === socketId);
  if(!player) {
    return;
  }
  
  const wasHost = player.isHost;
  player.disconnected = true;
  player.socketId = null; // Clear socketId when disconnected
  
  // Temporarily reassign host to first connected player if host disconnected
  if(wasHost) {
    player.wasOriginalHost = true; // Remember they were original host
    const connectedPlayer = room.players.find(p => !p.disconnected && p.profileId !== player.profileId);
    if(connectedPlayer) {
      connectedPlayer.isHost = true;
      connectedPlayer.wasOriginalHost = false; // Temporary host
    }
  }
  
  return room.players;
}

/**
 * Get player by socketId. Only returns connected players (not disconnected ones).
 */
function getPlayerBySocketId(roomCode, socketId) {
  const room = getRoom(roomCode);
  return room.players.find(player => player.socketId === socketId && !player.disconnected) || null;
}

function getPlayerByProfileId(roomCode, profileId) {
  const room = getRoom(roomCode);
  return room.players.find(player => player.profileId === profileId) || null;
}

function setHost(roomCode, profileId) {
  const room = getRoom(roomCode);
  const player = getPlayerByProfileId(roomCode, profileId);
  if(!player) {
    throw new Error(`Player with profileId ${profileId} not found in room ${roomCode}`);
  }
  // Remove host status from all players in room
  room.players.forEach(player => player.isHost = false);
  // Set the target player as host
  player.isHost = true;
  return player;
}

function handlePlayerDisconnect(io, socket) {
  // Iterate through all rooms in rooms Map
  for(const room of rooms.values()) {
    const player = getPlayerBySocketId(room.code, socket.id);
    if(player) {
      removePlayerFromRoom(room.code, socket.id);
      io.to(room.code).emit("room_update", { roomCode: room.code, players: room.players });
      break;
    }
  }
}

module.exports = {
  rooms,
  createEmptyRoom,
  getOrCreateRoom,
  getRoom,
  addPlayerToRoom,
  removePlayerFromRoom,
  getPlayerBySocketId,
  getPlayerByProfileId,
  setHost,
  handlePlayerDisconnect,
};

