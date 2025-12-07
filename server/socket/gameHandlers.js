// server/socket/gameHandlers.js
// All Socket.io event handlers for game actions.

const { rooms, getOrCreateRoom, getRoom, addPlayerToRoom, handlePlayerDisconnect } = require("../game/gameState");
const { findOrCreateProfile } = require("../models/players");
const { randomRoomCode } = require("../utils/id");

function registerGameHandlers(io, socket) {
  socket.on("create_profile", (profileData, callback) => {
    try {
      // Call findOrCreateProfile with profileData (should have: name, birthday, gender)
      const profile = findOrCreateProfile(profileData);
      
      if (!profile) {
        if (callback) {
          callback({ error: "Failed to create profile" });
        }
        return;
      }
      
      // Return profile object via callback
      if (callback) {
        callback({ profileId: profile.id, ...profile });
      }
      
      console.log("create_profile", profileData, "→ profileId:", profile.id);
    } catch (error) {
      console.error("Error creating profile:", error);
      if (callback) {
        callback({ error: "Failed to create profile", message: error.message });
      }
    }
  });

  socket.on("create_room", (callback) => {
    try {
      // Generate unique room code (retry if collision)
      let roomCode;
      let attempts = 0;
      do {
        roomCode = randomRoomCode(5);
        attempts++;
        if (attempts > 10) {
          throw new Error("Failed to generate unique room code");
        }
      } while (rooms.has(roomCode));

      // Create the room
      const room = getOrCreateRoom(roomCode);
      socket.join(roomCode);

      if (callback) {
        callback({ roomCode });
      }

      console.log("create_room", { roomCode });
    } catch (error) {
      console.error("Error creating room:", error);
      if (callback) {
        callback({ error: "Failed to create room", message: error.message });
      }
    }
  });

  socket.on("join_room", ({ roomCode, profile }) => {
    try {
      // Validate that profile object exists and has an id
      if (!profile || !profile.id) {
        console.error("join_room: Invalid profile data", { roomCode, profile });
        return;
      }

      // Add player to room (room must exist - created by TV)
      addPlayerToRoom(roomCode, socket.id, profile);
      socket.join(roomCode);

      // Broadcast updated room state to all clients in the room
      const room = getRoom(roomCode);
      io.to(roomCode).emit("room_update", {
        roomCode,
        players: room.players,
      });

      console.log("join_room", { roomCode, profileId: profile.id });
    } catch (error) {
      console.error("Error joining room:", error);
      // Emit error back to the joining client
      socket.emit("join_room_error", { error: error.message });
    } 
  });

  // Placeholder handlers for future phases
  socket.on("set_teams", (payload) => {
    console.log("set_teams", payload);
  });

  socket.on("start_draft", (payload) => {
    console.log("start_draft", payload);
  });

  socket.on("draft_choice", (payload) => {
    console.log("draft_choice", payload);
  });

  socket.on("start_round", (payload) => {
    console.log("start_round", payload);
  });

  socket.on("start_turn", (payload) => {
    console.log("start_turn", payload);
  });

  socket.on("submit_point", (payload) => {
    console.log("submit_point", payload);
  });

  socket.on("request_skip", (payload) => {
    console.log("request_skip", payload);
  });

  socket.on("host_skip_decision", (payload) => {
    console.log("host_skip_decision", payload);
  });

  socket.on("disconnecting", () => {
    handlePlayerDisconnect(io, socket);
  });
}

module.exports = { registerGameHandlers };

