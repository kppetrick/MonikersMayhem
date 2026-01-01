# Phase 3 - Lobby & Profiles - Current Progress

**Status:** 🔄 **IN PROGRESS** - Frontend components reset for rebuild  
**Last Updated:** [Current Session]

## ✅ Backend Complete

**All backend Phase 3 objectives achieved:**

### Step 1 - Helper Functions in players.js (COMPLETE)
- ✅ `formatName(name)` - Capitalize first letter of each word
- ✅ `calculateAge(birthday)` - Calculate age from YYYY-MM-DD format
- ✅ `getAgeRange(age)` - Map age to bucket
- ✅ `findOrCreateProfile(name, birthday, gender)` - Creates/finds profile
- ✅ `getProfileById(profileId)` - Retrieves profile

### Step 2 - Room Management in gameState.js (COMPLETE)
- ✅ `getRoom(roomCode)` - Get room (throws if doesn't exist)
- ✅ `addPlayerToRoom(roomCode, socketId, profile)` - Add player, auto-assign host
- ✅ `removePlayerFromRoom(roomCode, socketId)` - Remove player, handle host reassignment
- ✅ `getPlayerBySocketId(roomCode, socketId)` - Find player by socketId
- ✅ `getPlayerByProfileId(roomCode, profileId)` - Find player by profileId
- ✅ `setHost(roomCode, profileId)` - Transfer host status
- ✅ `handlePlayerDisconnect(io, socket)` - Handle disconnections

### Step 3 - Socket Handlers (COMPLETE)
- ✅ `create_profile` socket handler - Creates/finds profile and returns profileId
- ✅ `create_room` socket handler - Generates unique 5-character room code
- ✅ `join_room` socket handler - Adds player to room and broadcasts `room_update` event
- ✅ `validate_room` socket handler - Validates room code and returns connected player IDs
- ✅ Disconnect handling - Properly removes players and reassigns host
- ✅ `game_state` event - Emits full game state to all players in room

## 🔄 Frontend - Reset for Rebuild

**Decision:** Frontend components reset to placeholders for rebuild to improve understanding and maintainability.

### Phone Frontend
- [ ] `JoinScreen.tsx` - **RESET** - Needs rebuild:
  - Two-step flow: room code entry → profile selection/creation
  - Form validation and error handling
  - LocalStorage profile persistence
  - Socket integration for `create_profile` and `join_room`
  - **Navigation after join** - Route to appropriate screen based on game state
  - Listen to `game_state` events

- [ ] `PhoneLayout.tsx` - Needs auto-routing:
  - Route based on game state (lobby → draft → clue/spectate/host)
  - Use `useGameState` hook to determine current screen

- [ ] `useGameState.ts` hook - **NEEDS IMPLEMENTATION**:
  - Subscribe to `game_state` socket events
  - Return current game state, player role, room status
  - Helpers for determining which screen to show

### TV Frontend
- [ ] `TVLobby.tsx` - **RESET** - Needs rebuild:
  - Create/join room on TV load automatically
  - Display room code prominently
  - Listen to `room_update` and `game_state` socket events
  - Show list of connected players with host indicators
  - Show placeholder teams section
  - Handle loading/error states

- [ ] `TVLayout.tsx` - Needs conditional rendering:
  - Show lobby when status is "lobby"
  - Show game view when status is "draft" or "round"
  - Show summary when status is "finished"

## Key Decisions Made

- **Room code:** Random 5-character code displayed on TV (Jackbox-style)
- **Name formatting:** Capitalize first letter of EACH word ("john smith" → "John Smith")
- **Age calculation:** From birthday (YYYY-MM-DD), exact match required
- **Age ranges:** "10 and under", "11-15", "16-20", "21-25", "26-30", "31-35", "36-40", "41+"
- **Host:** First player in room = host automatically
- **Broadcasting:** When player joins, broadcast `room_update` and `game_state` events to all clients in room
- **Room creation:** TV creates room on load, players join with room code
- **Reconnection:** Players can reconnect and restore their state (host status, team assignment)
- **Frontend approach:** Rebuilding components from scratch for better understanding and maintainability

## Next Steps

1. **Implement `useGameState` hook** - Subscribe to `game_state` events
2. **Rebuild `JoinScreen`** - Full join flow with navigation
3. **Rebuild `TVLobby`** - Room display and player list
4. **Add auto-routing** - `PhoneLayout` routes based on game state
5. **Add conditional rendering** - `TVLayout` shows appropriate view based on game phase
