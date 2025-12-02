// server/game/scoring.js
// Scoring helpers for teams, rounds, and players.

function addPointForTeam(room, teamId) {
  // TODO: implement team scoring and round scoring
  console.log("addPointForTeam placeholder", { teamId });
}

function recordClueGiverStats(room, clueGiverProfileId, pointsThisTurn) {
  // TODO: update per-player stats in memory and later persist via models/players
  console.log("recordClueGiverStats placeholder", { clueGiverProfileId, pointsThisTurn });
}

module.exports = {
  addPointForTeam,
  recordClueGiverStats,
};

