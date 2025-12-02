// server/socket/index.js
// Socket.io initialization and connection wiring.

const { Server } = require("socket.io");
const { registerGameHandlers } = require("./gameHandlers");

function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: "*", // TODO: tighten CORS for production
    },
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    registerGameHandlers(io, socket);

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
      // TODO: handle player leaving room / cleaning up game state
    });
  });
}

module.exports = { initSocket };

