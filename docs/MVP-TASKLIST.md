# MonikersMayhem – MVP Task List

This document breaks the MVP into concrete steps so the backend, frontend, and Raspberry Pi setup can be built in a sensible order.

Treat each section as a phase. You don't need to do everything inside a phase perfectly before moving on, but try to keep this general order.



---



## Phase 1 – Backend Skeleton



**Goal:** Have a running Node + Express + Socket.io server with a basic room and player model.



### Tasks



- [x] Initialize `server/package.json`

  - `npm init -y`

  - Install dependencies:

    - [x] `express`

    - [x] `socket.io`

    - [x] `cors`

    - [x] `nodemon` (dev)



- [x] Create `server/server.js`

  - [x] Set up basic Express server

  - [x] Add a simple `GET /health` endpoint returning `{ status: "ok" }`

  - [x] Attach Socket.io to the HTTP server

  - [x] Log when a client connects/disconnects



- [x] Create `server/socket/index.js`

  - [x] Export a function to initialize Socket.io

  - [x] Wire it up from `server.js`



- [x] Create `server/socket/gameHandlers.js`

  - [x] Set up placeholder handlers for:

    - `join_room`

    - `create_profile`

    - `set_teams`

    - `start_draft`

    - `draft_choice`

    - `start_round`

    - `submit_point`

    - `request_skip`

    - `host_skip_decision`



- [x] Create `server/game/gameState.js`

  - [x] Define an in-memory structure for:

    - Rooms

    - Players

    - Teams

    - Current round

    - Current turn

    - Deck



At the end of Phase 1, the server should:

- [x] Start with `npm run dev` ✅

- [x] Respond on `/health` ✅

- [x] Accept Socket.io connections and log them ✅



---



## Phase 2 – React Client Skeleton



**Goal:** Have a React app with `/tv` and `/play` routes and a live Socket.io connection.



### Tasks



- [x] Initialize `client` React app

  - Use Vite or CRA (your choice)

  - Install dependencies:

    - [x] `react-router-dom`

    - [x] `socket.io-client`



- [x] Set up routing in `client/src/App.tsx`

  - [x] Route `/tv` → `TVLayout`

  - [x] Route `/play` → `PhoneLayout`



- [x] Create base route components:

  - [x] `routes/TVLayout.tsx`

    - Simple placeholder: "TV Layout"

  - [x] `routes/PhoneLayout.tsx`

    - Simple placeholder: "Phone Layout"



- [x] Create `hooks/useSocket.ts`

  - [x] Connect to the backend via Socket.io

  - [x] Expose:

    - `socket` instance

    - `connected` state

  - [x] Log connection events for now



At the end of Phase 2, you should be able to:

- [x] Run backend + frontend together ✅

- [x] Open `/tv` and `/play` and see a "connected" log to the backend ✅



---



## Phase 3 – Lobby & Profiles



**Goal:** Players can join, create/select a profile, and appear in a lobby seen on the TV.



### Backend



- [ ] `models/players.js`

  - [ ] In-memory or JSON-based storage for MVP

  - [ ] Functions:

    - `findOrCreateProfile(name, birthday, gender)`

    - `getProfileById(id)`

    - `updateProfileStats(...)`



- [ ] Socket events:

  - [ ] `create_profile` → return `profileId`

  - [ ] `join_room` → add player to room state

  - [ ] Broadcast updated player list to TV



### Frontend – Phone



- [ ] `JoinScreen.tsx`

  - [ ] Form for:

    - Name

    - Birthday

    - Gender

  - [ ] On submit → emit `create_profile`

  - [ ] Then emit `join_room` with room code (MVP can use a default room)



### Frontend – TV



- [ ] `TVLobby.tsx`

  - [ ] Show list of connected players

  - [ ] Show placeholder teams (no assignment yet)



At the end of Phase 3:

- Players can join on phones

- TV shows everyone in the lobby

- Profiles are created/stored



---



## Phase 4 – Team Management



**Goal:** Support random or manual team assignment, with the Host in control.



### Backend



- [ ] Extend `gameState.js` to track:

  - `teams` (e.g., `Team A`, `Team B`)

  - `players` → which team they belong to

- [ ] Socket events:

  - [ ] `set_teams` (from host)

  - [ ] `update_team_assignment` (manual moves)

  - [ ] Broadcast team changes to all clients



### Frontend – Phone (Host)



- [ ] `HostControls.tsx`:

  - [ ] Buttons:

    - "Randomize Teams"

    - "Manual Teams Ready / Continue"

  - [ ] UI to swap players between teams (for MVP, simple list-based UI is fine)



### Frontend – TV



- [ ] Update `TVLobby.tsx` to show:

  - [ ] Teams and current members

  - [ ] An indicator when teams are "locked"



At the end of Phase 4:

- Teams can be set up and locked in

- Everyone sees the team assignments on TV



---



## Phase 5 – Draft Engine



**Goal:** Implement the card drafting flow and produce a game deck from player choices.



### Backend



- [ ] `data/baseDeck.json` (stub data for now)

- [ ] `models/cards.js`

  - [ ] Load base deck from JSON

  - [ ] In-memory `customCards` list for MVP

- [ ] `game/drafting.js`

  - [ ] Serve cards to players:

    - Ensure no two players see the same card at the same time

  - [ ] Track:

    - `timesOfferedByAge`

    - `timesDraftedByAge`

    - `timesOfferedByGender`

    - `timesDraftedByGender`

  - [ ] Finalize deck for game after everyone has drafted enough



- [ ] Socket events:

  - [ ] `start_draft`

  - [ ] `request_draft_card` (player wants next card)

  - [ ] `draft_choice` (accept/reject)



### Frontend – Phone



- [ ] `DraftScreen.tsx`

  - [ ] Swipe UI (or buttons) for accept/reject

  - [ ] Show how many cards the player still needs

  - [ ] Emit `draft_choice` events



### Frontend – TV



- [ ] Show draft progress:

  - [ ] "X/Y players finished drafting"

  - [ ] Maybe progress bars per player (optional)



At the end of Phase 5:

- Draft produces a deck

- Server holds the active game deck for the room



---



## Phase 6 – Round & Turn Engine



**Goal:** Implement core Monikers-style rounds and turn flow with timer and scoring.



### Backend



- [ ] `game/rounds.js`

  - [ ] Define round sequence (1–4)

  - [ ] Rules per round (just labels and type for now)

- [ ] `game/scoring.js`

  - [ ] Track:

    - Team scores

    - Round scores

    - Per-player clue-giver stats

- [ ] Timer logic (can start simple):

  - [ ] 60s main timer

  - [ ] Basic 30s grace logic for current card



- [ ] Socket events:

  - [ ] `start_round`

  - [ ] `start_turn`

  - [ ] `submit_point` (when team guesses correctly)

  - [ ] `request_skip`

  - [ ] `host_skip_decision`

  - [ ] `end_turn`

  - [ ] Broadcast updated:

    - Scores

    - Current clue-giver

    - Cards remaining



### Frontend – Phone (Clue Giver)



- [ ] `ClueGiverScreen.tsx`

  - [ ] Show current card

  - [ ] Buttons:

    - "Correct" (or Next)

    - "Skip Request"

    - "Start Round/Turn"

  - [ ] Show timer countdown



### Frontend – TV



- [ ] `TVRoundStatus.tsx`

  - [ ] Current round name

  - [ ] Team scores (total + round)

  - [ ] Current clue-giver

  - [ ] Timer

  - [ ] Cards remaining



At the end of Phase 6:

- You can run full rounds with scoring and timer

- TV & phones are synchronized



---



## Phase 7 – Summary Screens & Persistence



**Goal:** Show satisfying end-of-round/game summaries and persist stats.



### Backend



- [ ] Extend `players.js`:

  - [ ] Update player stats at end of game

- [ ] Extend `cards.js`:

  - [ ] Persist offer/draft stats



### Frontend – TV



- [ ] End-of-game summary view:

  - [ ] Team final scores

  - [ ] Round breakdown

  - [ ] High-performing clue-givers



### Frontend – Phone



- [ ] Player stat summary:

  - [ ] Points this game

  - [ ] Lifetime avg per turn (from profile)



At the end of Phase 7:

- Games feel "complete"

- Profiles and cards get smarter over time



---



## Phase 8 – Raspberry Pi Integration (MVP Level)



**Goal:** Get everything running on a Pi with HDMI and manual browser start.



- [ ] Install Node.js, npm, and git on the Pi

- [ ] Clone the repo

- [ ] Install server + client dependencies

- [ ] Build React app

- [ ] Run server

- [ ] Open Chromium manually to `/tv`

- [ ] Connect one or more phones to the same network and hit `/play`



Kiosk mode, Wi-Fi AP mode, and auto-boot will come in a later phase.

