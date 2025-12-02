// server/game/rounds.js
// Round lifecycle logic for MonikersMayhem.

const ROUND_SEQUENCE = [
  { id: 1, name: "Say Anything", type: "anything" },
  { id: 2, name: "One Word", type: "one-word" },
  { id: 3, name: "Charades", type: "charades" },
  { id: 4, name: "Bonus Round", type: "bonus" },
];

function getCurrentRound(room) {
  return ROUND_SEQUENCE.find((r) => r.id === room.roundNumber) || ROUND_SEQUENCE[0];
}

function advanceRound(room) {
  if (room.roundNumber < ROUND_SEQUENCE.length) {
    room.roundNumber += 1;
  } else {
    room.status = "finished";
  }
}

module.exports = {
  ROUND_SEQUENCE,
  getCurrentRound,
  advanceRound,
};

