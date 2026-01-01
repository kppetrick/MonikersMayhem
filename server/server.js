// server/server.js
// Main Express + Socket.io server entrypoint for CircumAct.

const http = require("http");
const express = require("express");
const path = require("path");
const { initSocket } = require("./socket");

const app = express();
const server = http.createServer(app);

// TODO: configure CORS if needed for dev
// const cors = require("cors");
// app.use(cors());

const PORT = process.env.PORT || 4000;

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// TODO: In production, serve client build from here
// const clientBuildPath = path.join(__dirname, "..", "client", "dist");
// app.use(express.static(clientBuildPath));

// Initialize Socket.io
initSocket(server);

server.listen(PORT, () => {
  console.log(`CircumAct server listening on port ${PORT}`);
});

