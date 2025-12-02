// server/models/cards.js
// Card loading and analytics tracking.

const path = require("path");
const fs = require("fs");

const baseDeckPath = path.join(__dirname, "..", "data", "baseDeck.json");
const customCardsPath = path.join(__dirname, "..", "data", "customCards.json");

// For now, load synchronously on startup. Later, add proper async + persistence.
let baseDeck = [];
let customCards = [];

function loadCards() {
  try {
    if (fs.existsSync(baseDeckPath)) {
      baseDeck = JSON.parse(fs.readFileSync(baseDeckPath, "utf8"));
    }
  } catch (err) {
    console.error("Error loading baseDeck.json", err);
  }

  try {
    if (fs.existsSync(customCardsPath)) {
      customCards = JSON.parse(fs.readFileSync(customCardsPath, "utf8"));
    }
  } catch (err) {
    console.error("Error loading customCards.json", err);
  }
}

function getAllActiveCards() {
  return [...baseDeck, ...customCards].filter((c) => !c.archived);
}

function getCardById(id) {
  return getAllActiveCards().find((c) => c.id === id) || null;
}

// TODO: add analytics helpers + pickDraftCandidate

module.exports = {
  loadCards,
  getAllActiveCards,
  getCardById,
};

