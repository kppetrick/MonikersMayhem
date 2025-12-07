# Phase 3 - Lobby & Profiles - Current Progress

**Branch:** `phase3-step2-room-management`  
**Status:** In Progress - Step 2  
**Last Updated:** [Current Session]

## ✅ Step 1 - Helper Functions in players.js (COMPLETE)

**Task:** Add three helper functions to `server/models/players.js`:

1. ✅ `formatName(name)` - Capitalize first letter of each word
   - Input: "kyle" → Output: "Kyle"
   - Input: "john smith" → Output: "John Smith"
   
2. ✅ `calculateAge(birthday)` - Calculate age from YYYY-MM-DD format
   - Input: "1990-05-15" → Output: 34 (current age)
   - Handles leap years, future dates, edge cases
   
3. ✅ `getAgeRange(age)` - Map age to bucket
   - Input: 34 → Output: "31-35"
   - Buckets: "10 and under" (0-10), "11-15", "16-20", "21-25", "26-30", "31-35", "36-40", "41+" (41 and older)

**Also implemented:**
- ✅ `createProfile(name, birthday, gender)` - Creates profile with formatted name, calculated age/ageRange
- ✅ `findProfileByNameAndBirthday(name, birthday)` - Finds existing profile
- ✅ `getProfileById(profileId)` - Retrieves profile with auto-updated age/ageRange
- ✅ Comprehensive tests in `server/models/__tests__/players.test.js`

## 🚧 Current Step: Step 2 - Room Management in gameState.js

**Task:** Add room management helper functions to `server/game/gameState.js`

**Tests written:** ✅ Comprehensive test suite in `server/game/__tests__/gameState.test.js`

**Functions to implement:**
1. ⏳ `getRoom(roomCode)` - Get room (throws if doesn't exist)
2. ⏳ `addPlayerToRoom(roomCode, socketId, profile)` - Add player, auto-assign host for first player, handle reconnection
3. ⏳ `removePlayerFromRoom(roomCode, socketId)` - Remove player, auto-assign new host if host disconnects
4. ⏳ `getPlayerBySocketId(roomCode, socketId)` - Find player by socketId
5. ⏳ `getPlayerByProfileId(roomCode, profileId)` - Find player by profileId
6. ⏳ `setHost(roomCode, profileId)` - Transfer host status

**Export the helper functions** in module.exports.

## Implementation Plan (Remaining Steps)

3. Implement `create_profile` and `join_room` socket handlers
3. Implement `create_profile` and `join_room` socket handlers
4. Update frontend JoinScreen with room code input
5. Update TVLobby to show room code and players
6. Add Socket.io room subscriptions and broadcasting

## Key Decisions Made

- Room code: Random 5-character code displayed on TV (Jackbox-style)
- Name formatting: Capitalize first letter of EACH word ("john smith" → "John Smith")
- Age calculation: From birthday (YYYY-MM-DD), exact match required
- Age ranges: "10 and under", "11-15", "16-20", "21-25", "26-30", "31-35", "36-40", "41+"
- Host: First player in room = host automatically
- Broadcasting: When player joins, broadcast "PlayerName just joined" to all (TV + phones)
- Display name: Separate field for fun names on TV/phone (future enhancement - not in MVP)
- Profile memory: Remember last profile on same device (future enhancement - not in MVP)

