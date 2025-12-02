// server/utils/fuzzyMatch.js
// Basic fuzzy matching for detecting near-duplicate custom cards.
// MVP can be very simple: lowercase + Levenshtein threshold, or even just substring checks.

function normalize(str) {
  return (str || "").toLowerCase().trim();
}

function areRoughlyEqual(a, b) {
  const na = normalize(a);
  const nb = normalize(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  // TODO: improve to a proper Levenshtein or similarity metric.
  return na.includes(nb) || nb.includes(na);
}

module.exports = { areRoughlyEqual };

