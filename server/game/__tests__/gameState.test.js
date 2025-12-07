// server/game/__tests__/gameState.test.js
// Tests for room and game state management functions

const {
  rooms,
  createEmptyRoom,
  getOrCreateRoom,
  getRoom,
  addPlayerToRoom,
  removePlayerFromRoom,
  getPlayerBySocketId,
  getPlayerByProfileId,
  setHost,
  handlePlayerDisconnect,
} = require('../gameState');

// Helper to create a mock profile for testing
function createMockProfile(profileId, name, birthday = '1990-05-15', gender = 'male') {
  return {
    id: profileId,
    name: name,
    birthday: birthday,
    gender: gender,
    age: 34,
    ageRange: '31-35',
    gamesPlayed: 0,
    pointsEarnedAsClueGiver: 0,
    turnsAsClueGiver: 0,
    lifetimeCardsOffered: 0,
    lifetimeCardsDrafted: 0,
    createdCards: [],
    lastActive: Date.now(),
  };
}

describe('createEmptyRoom', () => {
  test('should create a room with correct structure', () => {
    const roomCode = 'ABC12';
    const room = createEmptyRoom(roomCode);

    expect(room.code).toBe(roomCode);
    expect(room.players).toEqual([]);
    expect(room.teams).toEqual([]);
    expect(room.deck).toEqual([]);
    expect(room.discard).toEqual([]);
    expect(room.roundNumber).toBe(1);
    expect(room.currentTurn).toBeNull();
    expect(room.status).toBe('lobby');
    expect(room.createdAt).toBeGreaterThan(0);
    expect(typeof room.createdAt).toBe('number');
  });

  test('should create room with different room codes', () => {
    const room1 = createEmptyRoom('ROOM1');
    const room2 = createEmptyRoom('XYZ99');

    expect(room1.code).toBe('ROOM1');
    expect(room2.code).toBe('XYZ99');
  });

  test('should set createdAt timestamp', () => {
    const before = Date.now();
    const room = createEmptyRoom('TEST');
    const after = Date.now();

    expect(room.createdAt).toBeGreaterThanOrEqual(before);
    expect(room.createdAt).toBeLessThanOrEqual(after);
  });
});

describe('getOrCreateRoom', () => {
  beforeEach(() => {
    rooms.clear();
  });

  test('should create a new room if it does not exist', () => {
    const roomCode = 'NEW12';
    const room = getOrCreateRoom(roomCode);

    expect(room).toBeDefined();
    expect(room.code).toBe(roomCode);
    expect(rooms.has(roomCode)).toBe(true);
    expect(rooms.get(roomCode)).toBe(room);
  });

  test('should return existing room if it already exists', () => {
    const roomCode = 'EXIST';
    const room1 = getOrCreateRoom(roomCode);
    const room2 = getOrCreateRoom(roomCode);

    expect(room1).toBe(room2);
    expect(rooms.size).toBe(1);
  });

  test('should handle multiple different rooms', () => {
    const room1 = getOrCreateRoom('ROOM1');
    const room2 = getOrCreateRoom('ROOM2');
    const room3 = getOrCreateRoom('ROOM3');

    expect(room1.code).toBe('ROOM1');
    expect(room2.code).toBe('ROOM2');
    expect(room3.code).toBe('ROOM3');
    expect(rooms.size).toBe(3);
  });
});

describe('getRoom', () => {
  beforeEach(() => {
    rooms.clear();
  });

  test('should return room if it exists', () => {
    const roomCode = 'EXIST';
    const created = getOrCreateRoom(roomCode);
    const retrieved = getRoom(roomCode);

    expect(retrieved).toBe(created);
    expect(retrieved.code).toBe(roomCode);
  });

  test('should throw error if room does not exist', () => {
    expect(() => getRoom('NONEXIST')).toThrow();
  });

  test('should throw error with descriptive message', () => {
    expect(() => getRoom('MISSING')).toThrow(/room/i);
  });
});

describe('addPlayerToRoom', () => {
  beforeEach(() => {
    rooms.clear();
  });

  // Basic functionality: adding players and host assignment
  test('should add first player to room and set as host', () => {
    const roomCode = 'ROOM1';
    getOrCreateRoom(roomCode);

    const socketId = 'socket-123';
    const profile = createMockProfile('profile-1', 'John Smith');

    const player = addPlayerToRoom(roomCode, socketId, profile);

    expect(player).toBeDefined();
    expect(player.socketId).toBe(socketId);
    expect(player.profileId).toBe('profile-1');
    expect(player.name).toBe('John Smith');
    expect(player.isHost).toBe(true);
    expect(player.teamId).toBeUndefined();

    const room = getRoom(roomCode);
    expect(room.players).toHaveLength(1);
    expect(room.players[0]).toBe(player);
  });

  test('should add second player and not set as host', () => {
    const roomCode = 'ROOM1';
    getOrCreateRoom(roomCode);

    const profile1 = createMockProfile('profile-1', 'John Smith');
    const profile2 = createMockProfile('profile-2', 'Jane Doe');

    const player1 = addPlayerToRoom(roomCode, 'socket-1', profile1);
    const player2 = addPlayerToRoom(roomCode, 'socket-2', profile2);

    expect(player1.isHost).toBe(true);
    expect(player2.isHost).toBe(false);

    const room = getRoom(roomCode);
    expect(room.players).toHaveLength(2);
  });

  // Error handling: room validation
  test('should throw error if room does not exist', () => {
    const profile = createMockProfile('profile-1', 'John Smith');

    expect(() => addPlayerToRoom('NONEXIST', 'socket-1', profile)).toThrow();
  });

  // Reconnection: same profileId, different socketId
  test('should handle reconnection with same profileId but different socketId', () => {
    const roomCode = 'ROOM1';
    getOrCreateRoom(roomCode);

    const profile = createMockProfile('profile-1', 'John Smith');
    const player1 = addPlayerToRoom(roomCode, 'socket-old', profile);

    // Simulate disconnect (remove player)
    removePlayerFromRoom(roomCode, 'socket-old');

    // Reconnect with new socketId
    const player2 = addPlayerToRoom(roomCode, 'socket-new', profile);

    expect(player2.profileId).toBe('profile-1');
    expect(player2.socketId).toBe('socket-new');
    expect(player2.name).toBe('John Smith');

    const room = getRoom(roomCode);
    expect(room.players).toHaveLength(1);
    expect(room.players[0].socketId).toBe('socket-new');
  });

  // Reconnection: preserving player state
  test('should update socketId on reconnect while keeping other properties', () => {
    const roomCode = 'ROOM1';
    getOrCreateRoom(roomCode);

    const profile = createMockProfile('profile-1', 'John Smith');
    const player1 = addPlayerToRoom(roomCode, 'socket-1', profile);
    player1.teamId = 'A'; // Simulate player being on a team

    // Disconnect (player stays in room, marked as disconnected)
    removePlayerFromRoom(roomCode, 'socket-1');

    // Verify player is still in room but disconnected
    const room = getRoom(roomCode);
    expect(room.players).toHaveLength(1);
    expect(room.players[0].disconnected).toBe(true);
    expect(room.players[0].teamId).toBe('A'); // State preserved

    // Reconnect
    const player2 = addPlayerToRoom(roomCode, 'socket-2', profile);

    expect(player2.socketId).toBe('socket-2');
    expect(player2.profileId).toBe('profile-1');
    expect(player2.teamId).toBe('A'); // teamId preserved
    expect(player2.disconnected).toBe(false);
    expect(room.players).toHaveLength(1); // Still same player object
  });

  // Multiple players: host assignment order
  test('should add multiple different players to same room', () => {
    const roomCode = 'ROOM1';
    getOrCreateRoom(roomCode);

    const players = [
      addPlayerToRoom(roomCode, 'socket-1', createMockProfile('profile-1', 'Alice')),
      addPlayerToRoom(roomCode, 'socket-2', createMockProfile('profile-2', 'Bob')),
      addPlayerToRoom(roomCode, 'socket-3', createMockProfile('profile-3', 'Charlie')),
    ];

    expect(players).toHaveLength(3);
    expect(players[0].isHost).toBe(true);
    expect(players[1].isHost).toBe(false);
    expect(players[2].isHost).toBe(false);

    const room = getRoom(roomCode);
    expect(room.players).toHaveLength(3);
  });

  // Profile data extraction
  test('should extract profileId and name from profile object', () => {
    const roomCode = 'ROOM1';
    getOrCreateRoom(roomCode);

    const profile = createMockProfile('custom-id-123', 'Custom Name');
    const player = addPlayerToRoom(roomCode, 'socket-1', profile);

    expect(player.profileId).toBe('custom-id-123');
    expect(player.name).toBe('Custom Name');
  });
});

describe('removePlayerFromRoom', () => {
  beforeEach(() => {
    rooms.clear();
  });

  // Basic functionality: marking players as disconnected
  test('should mark player as disconnected by socketId', () => {
    const roomCode = 'ROOM1';
    getOrCreateRoom(roomCode);

    const profile = createMockProfile('profile-1', 'John Smith');
    addPlayerToRoom(roomCode, 'socket-1', profile);

    removePlayerFromRoom(roomCode, 'socket-1');

    const room = getRoom(roomCode);
    expect(room.players).toHaveLength(1); // Player stays in room
    expect(room.players[0].disconnected).toBe(true);
    expect(room.players[0].socketId).toBeNull();
  });

  // Host reassignment: automatic when host disconnects
  test('should assign new host if host disconnects', () => {
    const roomCode = 'ROOM1';
    getOrCreateRoom(roomCode);

    const player1 = addPlayerToRoom(roomCode, 'socket-1', createMockProfile('profile-1', 'Alice'));
    const player2 = addPlayerToRoom(roomCode, 'socket-2', createMockProfile('profile-2', 'Bob'));

    expect(player1.isHost).toBe(true);
    expect(player2.isHost).toBe(false);

    // Remove host
    removePlayerFromRoom(roomCode, 'socket-1');

    const room = getRoom(roomCode);
    expect(room.players).toHaveLength(2); // Both players stay in room
    expect(room.players.find(p => p.profileId === 'profile-1').disconnected).toBe(true);
    expect(room.players.find(p => p.profileId === 'profile-1').wasOriginalHost).toBe(true);
    expect(room.players.find(p => p.profileId === 'profile-2').isHost).toBe(true); // Temporary host
    expect(room.players.find(p => p.profileId === 'profile-2').wasOriginalHost).toBe(false);
  });

  // Host reassignment: multiple players
  test('should assign host to next player when host disconnects', () => {
    const roomCode = 'ROOM1';
    getOrCreateRoom(roomCode);

    const player1 = addPlayerToRoom(roomCode, 'socket-1', createMockProfile('profile-1', 'Alice'));
    const player2 = addPlayerToRoom(roomCode, 'socket-2', createMockProfile('profile-2', 'Bob'));
    const player3 = addPlayerToRoom(roomCode, 'socket-3', createMockProfile('profile-3', 'Charlie'));

    // Remove host (player1)
    removePlayerFromRoom(roomCode, 'socket-1');

    const room = getRoom(roomCode);
    expect(room.players).toHaveLength(3); // All players stay in room
    expect(room.players.find(p => p.profileId === 'profile-1').disconnected).toBe(true);
    // First connected player should be host
    expect(room.players.find(p => p.profileId === 'profile-2').isHost).toBe(true);
    expect(room.players.find(p => p.profileId === 'profile-3').isHost).toBe(false);
  });

  // Idempotency: safe to call multiple times
  test('should be idempotent - no error if player not found', () => {
    const roomCode = 'ROOM1';
    getOrCreateRoom(roomCode);

    // Should not throw
    expect(() => removePlayerFromRoom(roomCode, 'nonexistent-socket')).not.toThrow();

    const room = getRoom(roomCode);
    expect(room.players).toHaveLength(0); // No players added, so array is empty
  });

  // Error handling: room validation
  test('should throw error if room does not exist', () => {
    expect(() => removePlayerFromRoom('NONEXIST', 'socket-1')).toThrow();
  });

  test('should mark non-host player as disconnected without affecting host', () => {
    const roomCode = 'ROOM1';
    getOrCreateRoom(roomCode);

    const player1 = addPlayerToRoom(roomCode, 'socket-1', createMockProfile('profile-1', 'Alice'));
    const player2 = addPlayerToRoom(roomCode, 'socket-2', createMockProfile('profile-2', 'Bob'));

    removePlayerFromRoom(roomCode, 'socket-2');

    const room = getRoom(roomCode);
    expect(room.players).toHaveLength(2); // Both players stay in room
    expect(room.players.find(p => p.profileId === 'profile-1').isHost).toBe(true);
    expect(room.players.find(p => p.profileId === 'profile-1').disconnected).toBe(false);
    expect(room.players.find(p => p.profileId === 'profile-2').disconnected).toBe(true);
  });

  // Edge cases: last player disconnects
  test('should handle marking last player as disconnected', () => {
    const roomCode = 'ROOM1';
    getOrCreateRoom(roomCode);

    addPlayerToRoom(roomCode, 'socket-1', createMockProfile('profile-1', 'Alice'));
    removePlayerFromRoom(roomCode, 'socket-1');

    const room = getRoom(roomCode);
    expect(room.players).toHaveLength(1); // Player stays in room
    expect(room.players[0].disconnected).toBe(true);
    expect(room.players[0].isHost).toBe(true); // Still host (no one to transfer to)
    expect(room.players[0].wasOriginalHost).toBe(true);
  });
});

describe('getPlayerBySocketId', () => {
  beforeEach(() => {
    rooms.clear();
  });

  // Basic functionality: finding players
  test('should return player if found by socketId', () => {
    const roomCode = 'ROOM1';
    getOrCreateRoom(roomCode);

    const profile = createMockProfile('profile-1', 'John Smith');
    const added = addPlayerToRoom(roomCode, 'socket-123', profile);

    const found = getPlayerBySocketId(roomCode, 'socket-123');

    expect(found).toBe(added);
    expect(found.socketId).toBe('socket-123');
    expect(found.profileId).toBe('profile-1');
  });

  // Not found cases: return null
  test('should return null if player not found', () => {
    const roomCode = 'ROOM1';
    getOrCreateRoom(roomCode);

    const found = getPlayerBySocketId(roomCode, 'nonexistent-socket');

    expect(found).toBeNull();
  });

  // Not found cases: socketId mismatch
  test('should return null if room has players but socketId does not match', () => {
    const roomCode = 'ROOM1';
    getOrCreateRoom(roomCode);

    addPlayerToRoom(roomCode, 'socket-1', createMockProfile('profile-1', 'Alice'));

    const found = getPlayerBySocketId(roomCode, 'socket-2');

    expect(found).toBeNull();
  });

  test('should throw error if room does not exist', () => {
    expect(() => getPlayerBySocketId('NONEXIST', 'socket-1')).toThrow();
  });

  test('should find correct player in room with multiple players', () => {
    const roomCode = 'ROOM1';
    getOrCreateRoom(roomCode);

    const player1 = addPlayerToRoom(roomCode, 'socket-1', createMockProfile('profile-1', 'Alice'));
    const player2 = addPlayerToRoom(roomCode, 'socket-2', createMockProfile('profile-2', 'Bob'));

    const found1 = getPlayerBySocketId(roomCode, 'socket-1');
    const found2 = getPlayerBySocketId(roomCode, 'socket-2');

    expect(found1).toBe(player1);
    expect(found2).toBe(player2);
  });
});

describe('getPlayerByProfileId', () => {
  beforeEach(() => {
    rooms.clear();
  });

  // Basic functionality: finding players
  test('should return player if found by profileId', () => {
    const roomCode = 'ROOM1';
    getOrCreateRoom(roomCode);

    const profile = createMockProfile('profile-123', 'John Smith');
    const added = addPlayerToRoom(roomCode, 'socket-1', profile);

    const found = getPlayerByProfileId(roomCode, 'profile-123');

    expect(found).toBe(added);
    expect(found.profileId).toBe('profile-123');
    expect(found.name).toBe('John Smith');
  });

  // Not found cases: return null
  test('should return null if player not found', () => {
    const roomCode = 'ROOM1';
    getOrCreateRoom(roomCode);

    const found = getPlayerByProfileId(roomCode, 'nonexistent-profile');

    expect(found).toBeNull();
  });

  // Not found cases: profileId mismatch
  test('should return null if room has players but profileId does not match', () => {
    const roomCode = 'ROOM1';
    getOrCreateRoom(roomCode);

    addPlayerToRoom(roomCode, 'socket-1', createMockProfile('profile-1', 'Alice'));

    const found = getPlayerByProfileId(roomCode, 'profile-2');

    expect(found).toBeNull();
  });

  test('should throw error if room does not exist', () => {
    expect(() => getPlayerByProfileId('NONEXIST', 'profile-1')).toThrow();
  });

  test('should find correct player in room with multiple players', () => {
    const roomCode = 'ROOM1';
    getOrCreateRoom(roomCode);

    const player1 = addPlayerToRoom(roomCode, 'socket-1', createMockProfile('profile-1', 'Alice'));
    const player2 = addPlayerToRoom(roomCode, 'socket-2', createMockProfile('profile-2', 'Bob'));

    const found1 = getPlayerByProfileId(roomCode, 'profile-1');
    const found2 = getPlayerByProfileId(roomCode, 'profile-2');

    expect(found1).toBe(player1);
    expect(found2).toBe(player2);
  });
});

describe('setHost', () => {
  beforeEach(() => {
    rooms.clear();
  });

  // Basic functionality: host transfer
  test('should transfer host from current host to new host', () => {
    const roomCode = 'ROOM1';
    getOrCreateRoom(roomCode);

    const player1 = addPlayerToRoom(roomCode, 'socket-1', createMockProfile('profile-1', 'Alice'));
    const player2 = addPlayerToRoom(roomCode, 'socket-2', createMockProfile('profile-2', 'Bob'));

    expect(player1.isHost).toBe(true);
    expect(player2.isHost).toBe(false);

    const newHost = setHost(roomCode, 'profile-2');

    expect(newHost.profileId).toBe('profile-2');
    expect(newHost.isHost).toBe(true);

    const room = getRoom(roomCode);
    const updatedPlayer1 = room.players.find(p => p.profileId === 'profile-1');
    const updatedPlayer2 = room.players.find(p => p.profileId === 'profile-2');

    expect(updatedPlayer1.isHost).toBe(false);
    expect(updatedPlayer2.isHost).toBe(true);
  });

  // Return value: updated player
  test('should return the updated player object', () => {
    const roomCode = 'ROOM1';
    getOrCreateRoom(roomCode);

    addPlayerToRoom(roomCode, 'socket-1', createMockProfile('profile-1', 'Alice'));
    const player2 = addPlayerToRoom(roomCode, 'socket-2', createMockProfile('profile-2', 'Bob'));

    const newHost = setHost(roomCode, 'profile-2');

    expect(newHost).toBe(player2);
    expect(newHost.isHost).toBe(true);
  });

  // Error handling: room validation
  test('should throw error if room does not exist', () => {
    expect(() => setHost('NONEXIST', 'profile-1')).toThrow();
  });

  // Error handling: player validation
  test('should throw error if player not found in room', () => {
    const roomCode = 'ROOM1';
    getOrCreateRoom(roomCode);

    addPlayerToRoom(roomCode, 'socket-1', createMockProfile('profile-1', 'Alice'));

    expect(() => setHost(roomCode, 'nonexistent-profile')).toThrow();
  });

  // Edge cases: no current host
  test('should handle setting host when there is no current host', () => {
    const roomCode = 'ROOM1';
    getOrCreateRoom(roomCode);

    const player1 = addPlayerToRoom(roomCode, 'socket-1', createMockProfile('profile-1', 'Alice'));
    const player2 = addPlayerToRoom(roomCode, 'socket-2', createMockProfile('profile-2', 'Bob'));

    // Manually remove host status (edge case)
    player1.isHost = false;

    const newHost = setHost(roomCode, 'profile-2');

    expect(newHost.isHost).toBe(true);
  });

  // Multiple players: host transfer
  test('should work with multiple players in room', () => {
    const roomCode = 'ROOM1';
    getOrCreateRoom(roomCode);

    const player1 = addPlayerToRoom(roomCode, 'socket-1', createMockProfile('profile-1', 'Alice'));
    const player2 = addPlayerToRoom(roomCode, 'socket-2', createMockProfile('profile-2', 'Bob'));
    const player3 = addPlayerToRoom(roomCode, 'socket-3', createMockProfile('profile-3', 'Charlie'));

    setHost(roomCode, 'profile-3');

    const room = getRoom(roomCode);
    expect(room.players.find(p => p.profileId === 'profile-1').isHost).toBe(false);
    expect(room.players.find(p => p.profileId === 'profile-2').isHost).toBe(false);
    expect(room.players.find(p => p.profileId === 'profile-3').isHost).toBe(true);
  });
});

describe('handlePlayerDisconnect', () => {
  beforeEach(() => {
    rooms.clear();
  });

  test('should mark player as disconnected and broadcast room_update event', () => {
    const roomCode = 'ROOM1';
    getOrCreateRoom(roomCode);
    
    const profile1 = createMockProfile('profile-1', 'Alice');
    const profile2 = createMockProfile('profile-2', 'Bob');
    
    const player1 = addPlayerToRoom(roomCode, 'socket-1', profile1);
    player1.teamId = 'A'; // Set team before disconnect
    addPlayerToRoom(roomCode, 'socket-2', profile2);
    
    // Mock Socket.io io object
    const mockEmit = jest.fn();
    const mockIo = {
      to: jest.fn(() => ({ emit: mockEmit })),
    };
    
    // Mock socket object
    const mockSocket = { id: 'socket-1' };
    
    // Call handlePlayerDisconnect
    handlePlayerDisconnect(mockIo, mockSocket);
    
    // Verify player is still in room but marked as disconnected
    const room = getRoom(roomCode);
    expect(room.players).toHaveLength(2); // Both players still in room
    expect(room.players.find(p => p.profileId === 'profile-1').disconnected).toBe(true);
    expect(room.players.find(p => p.profileId === 'profile-1').teamId).toBe('A'); // State preserved
    expect(room.players.find(p => p.profileId === 'profile-2').disconnected).toBe(false);
    
    // Verify emit was called with correct arguments
    expect(mockIo.to).toHaveBeenCalledWith(roomCode);
    expect(mockEmit).toHaveBeenCalledWith('room_update', {
      roomCode: roomCode,
      players: room.players,
    });
  });

  test('should handle host disconnection and temporarily reassign host', () => {
    const roomCode = 'ROOM1';
    getOrCreateRoom(roomCode);
    
    const profile1 = createMockProfile('profile-1', 'Alice');
    const profile2 = createMockProfile('profile-2', 'Bob');
    
    const player1 = addPlayerToRoom(roomCode, 'socket-1', profile1);
    const player2 = addPlayerToRoom(roomCode, 'socket-2', profile2);
    
    expect(player1.isHost).toBe(true);
    expect(player1.wasOriginalHost).toBe(true);
    
    const mockEmit = jest.fn();
    const mockIo = {
      to: jest.fn(() => ({ emit: mockEmit })),
    };
    const mockSocket = { id: 'socket-1' };
    
    handlePlayerDisconnect(mockIo, mockSocket);
    
    const room = getRoom(roomCode);
    expect(room.players).toHaveLength(2); // Both players still in room
    expect(room.players.find(p => p.profileId === 'profile-1').disconnected).toBe(true);
    expect(room.players.find(p => p.profileId === 'profile-1').wasOriginalHost).toBe(true);
    expect(room.players.find(p => p.profileId === 'profile-2').isHost).toBe(true); // Temporary host
    expect(room.players.find(p => p.profileId === 'profile-2').wasOriginalHost).toBe(false);
  });

  test('should restore original host status when host reconnects', () => {
    const roomCode = 'ROOM1';
    getOrCreateRoom(roomCode);
    
    const profile1 = createMockProfile('profile-1', 'Alice');
    const profile2 = createMockProfile('profile-2', 'Bob');
    
    const player1 = addPlayerToRoom(roomCode, 'socket-1', profile1);
    const player2 = addPlayerToRoom(roomCode, 'socket-2', profile2);
    
    // Host disconnects
    removePlayerFromRoom(roomCode, 'socket-1');
    const room = getRoom(roomCode);
    expect(room.players.find(p => p.profileId === 'profile-2').isHost).toBe(true); // Temporary host
    
    // Original host reconnects
    const reconnectedPlayer = addPlayerToRoom(roomCode, 'socket-1-new', profile1);
    
    expect(reconnectedPlayer.isHost).toBe(true); // Host restored
    expect(reconnectedPlayer.wasOriginalHost).toBe(true);
    expect(room.players.find(p => p.profileId === 'profile-2').isHost).toBe(false); // Temporary host removed
  });

  test('should not emit if player not found in any room', () => {
    const roomCode = 'ROOM1';
    getOrCreateRoom(roomCode);
    
    const profile = createMockProfile('profile-1', 'Alice');
    addPlayerToRoom(roomCode, 'socket-1', profile);
    
    const mockEmit = jest.fn();
    const mockIo = {
      to: jest.fn(() => ({ emit: mockEmit })),
    };
    const mockSocket = { id: 'socket-nonexistent' };
    
    handlePlayerDisconnect(mockIo, mockSocket);
    
    // Verify no emit was called
    expect(mockIo.to).not.toHaveBeenCalled();
    expect(mockEmit).not.toHaveBeenCalled();
    
    // Verify room unchanged (player still connected)
    const room = getRoom(roomCode);
    expect(room.players).toHaveLength(1);
    expect(room.players[0].disconnected).toBe(false);
  });

  test('should find player in correct room when multiple rooms exist', () => {
    getOrCreateRoom('ROOM1');
    getOrCreateRoom('ROOM2');
    
    const profile1 = createMockProfile('profile-1', 'Alice');
    const profile2 = createMockProfile('profile-2', 'Bob');
    
    addPlayerToRoom('ROOM1', 'socket-1', profile1);
    addPlayerToRoom('ROOM2', 'socket-2', profile2);
    
    const mockEmit = jest.fn();
    const mockIo = {
      to: jest.fn(() => ({ emit: mockEmit })),
    };
    const mockSocket = { id: 'socket-2' };
    
    handlePlayerDisconnect(mockIo, mockSocket);
    
    // Verify only player in ROOM2 was marked as disconnected
    const room1 = getRoom('ROOM1');
    const room2 = getRoom('ROOM2');
    
    expect(room1.players).toHaveLength(1);
    expect(room1.players[0].disconnected).toBe(false);
    expect(room2.players).toHaveLength(1);
    expect(room2.players[0].disconnected).toBe(true);
    
    // Verify emit was called for ROOM2, not ROOM1
    expect(mockIo.to).toHaveBeenCalledWith('ROOM2');
    expect(mockIo.to).not.toHaveBeenCalledWith('ROOM1');
  });
});

