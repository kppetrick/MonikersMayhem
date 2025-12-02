// server/models/players.js
// Player profile persistence (JSON or DB later).

// For very early MVP, this can just be an in-memory map.
// Later, load/save from JSON or SQLite.

const players = new Map(); // profileId -> profile

function findOrCreateProfile({ name, birthday, gender }) {
  // TODO: implement proper lookup by (name + birthday)
  const profileId = `profile-${name}-${birthday}`.replace(/\s+/g, "_");
  if (!players.has(profileId)) {
    players.set(profileId, {
      id: profileId,
      name,
      birthday,
      gender,
      gamesPlayed: 0,
      pointsEarnedAsClueGiver: 0,
      turnsAsClueGiver: 0,
      lifetimeCardsOffered: 0,
      lifetimeCardsDrafted: 0,
      createdCards: [],
      lastActive: Date.now(),
    });
  }
  return players.get(profileId);
}

function getProfileById(profileId) {
  return players.get(profileId) || null;
}

// TODO: add functions to update lifetime stats and persist to disk.

module.exports = {
  players,
  findOrCreateProfile,
  getProfileById,
};

