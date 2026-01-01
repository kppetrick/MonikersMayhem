# CircumAct – Architecture Overview

This document describes the high-level architecture of CircumAct: a charades and Taboo-style party game that runs as a Raspberry Pi "console" with TV + phone UIs.



---



## 1. System Overview



CircumAct consists of three main parts:



1. **Raspberry Pi**

   - Runs the Node.js backend and serves the built React frontend.

   - Acts as a Wi-Fi Access Point so phones can connect locally (no internet required).

   - Outputs the TV UI via HDMI (Chromium in kiosk mode in the future).



2. **TV UI (`/tv` route)**

   - Display-only interface (no direct input).

   - Shows:

     - Lobby + players

     - Teams and current clue-giver

     - Round name + rules

     - Timer

     - Deck/card count

     - Team scores and per-round scores

     - End-of-round and end-of-game summaries



3. **Phone UI (`/play` route)**

   - Interactive interface for players and host.

   - Used for:

     - Joining the room

     - Creating/selecting a profile

     - Team selection (if manual)

     - Drafting cards (swipe yes/no)

     - Clue-giving controls (Next, Skip Request, Start Round)

     - Viewing personal stats



All communication between TV and phones is handled by the backend using **Socket.io** over the Pi's local Wi-Fi network.



---



## 2. Tech Stack



- **Backend**

  - Node.js

  - Express (HTTP API + static file hosting)

  - Socket.io (WebSockets, real-time events)

  - SQLite or JSON (local storage for MVP)



- **Frontend**

  - React (single app)

  - React Router (`/tv`, `/play`)

  - Socket.io client

  - Responsive layouts (TV vs phone)



- **Platform**

  - Raspberry Pi 4/5

  - Raspberry Pi OS (desktop for dev → kiosk later)

  - HDMI output

  - Wi-Fi Access Point mode



---



## 3. High-Level Data Flow



1. **Pi boot**

   - Starts Node.js server.

   - Serves React app.



2. **TV**

   - Opens Chromium pointing to `/tv`.

   - Subscribes to game state via Socket.io (read-only).



3. **Phones**

   - Connect to Pi Wi-Fi.

   - Open `/play`.

   - Create/select profile.

   - Join the active room.

   - Send inputs (draft choices, start turn, skip request, etc.) to the server.



4. **Server**

   - Maintains authoritative **game state** in memory.

   - Persists long-term data (profiles, cards, stats) to SQLite/JSON.

   - Emits state updates to TV and players.



---



## 4. Backend Modules



Located in `server/`.



### 4.1 `server.js`

- Sets up:

  - Express server

  - Static file hosting for built React app

  - Socket.io server

- Initializes game state and attaches event handlers.



### 4.2 `socket/`

- `socket/index.js`

  - Initializes Socket.io with the HTTP server.

  - Sets up connection/disconnection logic.

- `socket/gameHandlers.js`

  - Registers all Socket.io event handlers:

    - `join_room`

    - `create_profile`

    - `set_teams`

    - `start_draft`

    - `draft_choice`

    - `start_round`

    - `submit_point`

    - `request_skip`

    - `host_skip_decision`

    - etc.



### 4.3 `game/`

- `gameState.js`

  - In-memory representation of rooms and games.

  - Holds:

    - players

    - teams

    - current round

    - current turn

    - deck and discard

    - timers



- `rounds.js`

  - Round lifecycle:

    - Start round

    - Move to next round

    - Determine when a round ends



- `drafting.js`

  - Handles:

    - Serving unique cards per player during draft

    - Tracking which cards were offered to whom

    - Ensuring no concurrent duplicate suggestions

    - Finalizing the game deck from drafted cards



- `scoring.js`

  - Functions for:

    - Adding points to teams and players

    - Calculating per-round and total scores

    - Summarizing stats for end-of-game



### 4.4 `models/`

- `players.js`

  - Read/write player profiles to persistent storage.

  - Lookup by name + birthday.

  - Update lifetime stats (points, turns, gamesPlayed).



- `cards.js`

  - Read base deck (`baseDeck.json`) and custom cards.

  - Apply analytics updates:

    - `timesOfferedByAge`, `timesDraftedByAge`

    - `timesOfferedByGender`, `timesDraftedByGender`

  - Filter / weight cards for drafting.

  - Archive/unarchive cards.



### 4.5 `data/`

- `baseDeck.json`

  - Card data copied from physical CircumAct decks (answer + description).



- `customCards.json` (or SQLite table)

  - User-generated cards.



### 4.6 `utils/`

- `id.js`

  - ID helpers (room IDs, player IDs).



- `fuzzyMatch.js`

  - Simple fuzzy string matching to detect near-duplicate custom cards.



---



## 5. Frontend Architecture



Located in `client/src/`.



### 5.1 Entry & App



- `index.tsx`

  - Bootstraps React app.

- `App.tsx`

  - Sets up React Router:

    - `/tv` → TV layout

    - `/play` → Phone layout



### 5.2 Routes



- `routes/TVLayout.tsx`

  - Main TV view.

  - Shows:

    - Lobby (players and teams)

    - Current round

    - Timer

    - Team scores

    - Deck/card count

    - Clue-giver name

    - End-of-round/game summaries



- `routes/PhoneLayout.tsx`

  - Entry point for all phone views.

  - Switches between:

    - Join screen

    - Draft screen

    - Clue-giver screen

    - Spectator/teammate view

    - Host controls



### 5.3 Components



#### `components/tv/`

- `TVLobby.tsx`

- `TVScoreboard.tsx`

- `TVRoundStatus.tsx`

- Future: `TVEndSummary.tsx`, etc.



#### `components/phone/`

- `JoinScreen.tsx`

- `DraftScreen.tsx`

- `ClueGiverScreen.tsx`

- `SpectatorScreen.tsx`

- `HostControls.tsx`



### 5.4 Hooks & Context



- `hooks/useSocket.ts`

  - Wraps Socket.io client.

  - Provides an easy API to send/receive events.



- `hooks/useGameState.ts`

  - Subscribes to game state updates from the server.

  - Exposes state + dispatch-like helpers to components.



- `context/GameContext.tsx`

  - Shared context for:

    - current player

    - current room

    - role (host, clue-giver, spectator)

    - basic game state snapshot



---



## 6. Persistence Strategy



For MVP, persistence can be:

- **Option 1:** JSON files in `server/data/`

- **Option 2:** SQLite database



Data to persist:

- Player profiles

- Custom cards

- Card stats (age/gender offer/draft counts)

- Lifetime player stats



In-memory state (per active room/game) is held in `gameState.js` and is rebuilt fresh when a new game starts.



---



## 7. Raspberry Pi Specifics (Later)



- Run server on boot using `systemd` or a startup script.

- Start Chromium in kiosk mode pointing to `/tv`.

- Configure Pi as Wi-Fi Access Point (`CircumAct` SSID).

- Optionally:

  - Show connection instructions on TV on startup.

  - Display the Pi's local URL or QR code for phones.



---

