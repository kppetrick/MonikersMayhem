// server/models/players.js
// Player profile persistence (JSON or DB later).

// For very early MVP, this can just be an in-memory map.
// Later, load/save from JSON or SQLite.

const { randomUUID } = require('crypto');

const players = new Map(); // profileId (UUID) -> profile
const nameIndex = new Map(); // formattedName -> [profileId1, profileId2, ...]

function findProfileByNameAndBirthday(name, birthday) {
  // TODO: Format name using formatName(name)
  const formattedName = formatName(name);
  // TODO: Lookup in nameIndex: nameIndex.get(formattedName) -> array of profileIds
  const profileIds = nameIndex.get(formattedName);
  // TODO: If no array found, return null
  if (!profileIds) {
    return null;
  }
  // TODO: Iterate through profileIds, get each profile from players Map
  for (const profileId of profileIds) {
    const profile = players.get(profileId);
    if (profile && profile.birthday === birthday) {  // Add profile check
      return profile;
    }
  }
  // TODO: Return matching profile, or null if no match
  return null;
}

function createProfile(name, birthday, gender) {
  // TODO: Generate UUID for profileId (format: `profile-${randomUUID()}`)
  const profileId = `profile-${randomUUID()}`;
  // TODO: Format name using formatName()
  const formattedName = formatName(name);
  // TODO: Calculate age using calculateAge(birthday)
  const age = calculateAge(birthday);
  // TODO: Calculate ageRange using getAgeRange(age)
  const ageRange = getAgeRange(age);
  // TODO: Create profile object with all fields:
  //   - id, name (formatted), birthday, gender
  //   - age, ageRange
  //   - gamesPlayed: 0, pointsEarnedAsClueGiver: 0, turnsAsClueGiver: 0
  //   - lifetimeCardsOffered: 0, lifetimeCardsDrafted: 0
  //   - createdCards: [], lastActive: Date.now()
  const profile = {
    id: profileId,
    name: formattedName,
    birthday: birthday,
    gender: gender,
    age: age,
    ageRange: ageRange,
    gamesPlayed: 0,
    pointsEarnedAsClueGiver: 0,
    turnsAsClueGiver: 0,
    lifetimeCardsOffered: 0,
    lifetimeCardsDrafted: 0,
    createdCards: [],
    lastActive: Date.now(),
  };
  // TODO: Store in players Map
  players.set(profileId, profile);
  // TODO: Add to nameIndex: if nameIndex has formattedName, push profileId; else create new array
  if (nameIndex.has(formattedName)) {
    nameIndex.get(formattedName).push(profileId);
  } else {
    nameIndex.set(formattedName, [profileId]);
  }
  // TODO: Return created profile
  return profile;
}

function getProfileById(profileId) {
  // TODO: Get profile from players Map: players.get(profileId)
  const profile = players.get(profileId);
  // TODO: If profile is null/undefined, return null
  if (!profile) {
    return null;
  }
  // TODO: Recalculate age using calculateAge(profile.birthday)
  const age = calculateAge(profile.birthday);
  // TODO: Recalculate ageRange using getAgeRange(age)
  const ageRange = getAgeRange(age);
  // TODO: Update profile.age and profile.ageRange with new values
  profile.age = age;
  profile.ageRange = ageRange;
  profile.lastActive = Date.now();
  // TODO: Update profile.lastActive = Date.now()
  players.set(profileId, profile);
  // TODO: Return updated profile
  return profile;
}

function formatName(name) {
  if (!name || name.trim().length === 0) return name;

  let result = name
    .replace(/[^a-zA-Z\s'-]/g, " ") // Replace special characters with spaces
    .replace(/-+/g, "-") // Normalize multiple hyphens to single hyphen
    .replace(/'+/g, "'") // Normalize multiple apostrophes to single apostrophe
    .trim(); // Remove leading/trailing spaces

  // Remove leading/trailing hyphens and apostrophes
  result = result.replace(/^[-']+|[-']+$/g, "");
  result = result.trim();

  // If empty after all processing, return empty string
  if (result.length === 0) return "";

  return result
    .toLowerCase() // Lowercase everything first
    .replace(/\b\w/g, char => char.toUpperCase()) // Capitalize first letter of each word (after spaces, hyphens, apostrophes)
    .replace(/\s+/g, " "); // Normalize multiple spaces to single space
}

// TODO: add functions to update lifetime stats and persist to disk.

function calculateAge(birthday) {
  // Input validation: null, undefined, or empty string
  if (birthday === null || birthday === undefined || birthday === "") {
    throw new Error("Birthday is required");
  }

  // Format validation: strict YYYY-MM-DD format only
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(birthday)) {
    throw new Error("Invalid birthday format. Expected YYYY-MM-DD");
  }

  // Parse date components
  const parts = birthday.split("-");
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  // Validate month range (1-12)
  if (month < 1 || month > 12) {
    throw new Error("Invalid month");
  }

  // Validate day range (1-31)
  if (day < 1 || day > 31) {
    throw new Error("Invalid day");
  }

  // Special handling: Feb 29 in non-leap year should throw (check BEFORE Date validation)
  // For leap year Feb 29, treat as Feb 28 for age calculation
  let dayForAge = day;
  if (month === 2 && day === 29) {
    const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    if (!isLeapYear) {
      throw new Error("Invalid date. February 29 only exists in leap years");
    }
    dayForAge = 28; // Use Feb 28 for age calculation
  }

  // Create Date object (month is 0-indexed in JavaScript)
  const birthDate = new Date(year, month - 1, day);

  // Verify date is valid (catches invalid dates like Feb 30, Apr 31, etc.)
  if (birthDate.getFullYear() !== year || birthDate.getMonth() !== month - 1 || birthDate.getDate() !== day) {
    throw new Error("Invalid date");
  }

  // Check for future dates (normalize to midnight for accurate comparison)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const birthDateForCheck = new Date(year, month - 1, day);
  birthDateForCheck.setHours(0, 0, 0, 0);
  if (birthDateForCheck > today) {
    throw new Error("Birthday cannot be in the future");
  }

  // Calculate age: subtract years, then adjust if birthday hasn't occurred this year
  // Use original parsed values (or adjusted dayForAge for Feb 29) for accurate calculation
  // Create fresh Date object for current date (don't use modified 'today' from future check)
  const now = new Date();
  const currentYear = now.getFullYear();
  let age = currentYear - year;

  // Check if birthday has occurred this year by comparing month and day
  const currentMonth = now.getMonth(); // 0-indexed
  const currentDay = now.getDate();
  const birthMonth = month - 1; // Convert to 0-indexed
  const birthDay = dayForAge;

  // Decrement age if birthday hasn't occurred yet this year
  if (currentMonth < birthMonth || (currentMonth === birthMonth && currentDay < birthDay)) {
    age--;
  }

  return age;
}

function getAgeRange(age) {
  // Map age to range bucket
  if (age <= 10) {
    return "10 and under";
  } else if (age <= 15) {
    return "11-15";
  } else if (age <= 20) {
    return "16-20";
  } else if (age <= 25) {
    return "21-25";
  } else if (age <= 30) {
    return "26-30";
  } else if (age <= 35) {
    return "31-35";
  } else if (age <= 40) {
    return "36-40";
  } else {
    return "41+";
  }
}

module.exports = {
  players,
  nameIndex,
  findProfileByNameAndBirthday,
  createProfile,
  getProfileById,
  formatName,
  calculateAge,
  getAgeRange,
};

