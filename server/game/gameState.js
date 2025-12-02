// server/game/gameState.js
// In-memory representation of rooms and game state.

const rooms = new Map(); // roomCode -> roomState

function createEmptyRoom(roomCode) {
  return {
    code: roomCode,
    players: [], // { socketId, profileId, name, teamId?, isHost? }
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

// TODO: add helpers for adding/removing players, updating teams, etc.

function handlePlayerDisconnect(io, socket) {
  // TODO: find which room(s) the player is in and update state
  console.log("handlePlayerDisconnect placeholder for:", socket.id);
}

module.exports = {
  rooms,
  getOrCreateRoom,
  handlePlayerDisconnect,
};

