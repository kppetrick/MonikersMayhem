// server/game/drafting.js
// Draft engine: serve cards and record offer/draft stats.

// TODO: import pickDraftCandidate when it's implemented in models/cards
// const { getCardById, pickDraftCandidate } = require("../models/cards");

// NOTE: For MVP, this file will be expanded to:
// - keep track of which cards have been offered to which players
// - update timesOffered / timesDrafted by age/gender
// - finalize a game deck after drafting

function getNextDraftCardForPlayer(room, playerProfile) {
  // TODO: use pickDraftCandidate + analytics weighting
  // Placeholder: return null for now
  return null;
}

module.exports = {
  getNextDraftCardForPlayer,
};

