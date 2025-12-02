// server/socket/gameHandlers.js
// All Socket.io event handlers for game actions.

const { getOrCreateRoom, handlePlayerDisconnect } = require("../game/gameState");
// TODO: import more helpers from game/ as they are implemented

function registerGameHandlers(io, socket) {
  // TODO: authenticate or identify player if needed

  socket.on("join_room", ({ roomCode, profile }) => {
    // TODO: add player to room, broadcast updated lobby state
    console.log("join_room", { roomCode, profile });
    const room = getOrCreateRoom(roomCode);
    // placeholder: just echo back for now
    socket.join(roomCode);
    io.to(roomCode).emit("room_update", { roomCode, players: room.players || [] });
  });

  socket.on("create_profile", (profileData, callback) => {
    // TODO: call players model to find/create profile
    console.log("create_profile", profileData);
    // placeholder: echo back fake profile ID
    const fakeProfileId = "profile-" + socket.id;
    if (callback) {
      callback({ profileId: fakeProfileId });
    }
  });

  // TODO: implement these later according to MVP-TASKLIST
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

