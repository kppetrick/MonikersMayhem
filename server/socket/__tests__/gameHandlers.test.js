// server/socket/__tests__/gameHandlers.test.js
// Tests for Socket.io game event handlers

const { registerGameHandlers } = require('../gameHandlers');
const { findOrCreateProfile } = require('../../models/players');
const { getOrCreateRoom, addPlayerToRoom } = require('../../game/gameState');

// Mock the dependencies
jest.mock('../../models/players');
jest.mock('../../game/gameState');

describe('create_profile handler', () => {
  let mockSocket;
  let mockIo;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create mock Socket.io objects
    mockSocket = {
      id: 'socket-123',
      on: jest.fn(),
    };
    
    mockIo = {
      to: jest.fn(() => ({ emit: jest.fn() })),
    };
  });

  test('should call findOrCreateProfile with profile data', () => {
    const profileData = {
      name: 'John Smith',
      birthday: '1990-05-15',
      gender: 'male',
    };
    
    const mockProfile = {
      id: 'profile-123',
      name: 'John Smith',
      birthday: '1990-05-15',
      gender: 'male',
      age: 34,
      ageRange: '31-35',
    };
    
    findOrCreateProfile.mockReturnValue(mockProfile);
    
    // Register handlers
    registerGameHandlers(mockIo, mockSocket);
    
    // Get the create_profile handler
    const createProfileHandler = mockSocket.on.mock.calls.find(
      call => call[0] === 'create_profile'
    )[1];
    
    // Call the handler
    const mockCallback = jest.fn();
    createProfileHandler(profileData, mockCallback);
    
    // Verify findOrCreateProfile was called with correct data
    expect(findOrCreateProfile).toHaveBeenCalledWith(profileData);
  });

  test('should return profile via callback on success', () => {
    const profileData = {
      name: 'Jane Doe',
      birthday: '1985-03-20',
      gender: 'female',
    };
    
    const mockProfile = {
      id: 'profile-456',
      name: 'Jane Doe',
      birthday: '1985-03-20',
      gender: 'female',
      age: 39,
      ageRange: '36-40',
    };
    
    findOrCreateProfile.mockReturnValue(mockProfile);
    
    registerGameHandlers(mockIo, mockSocket);
    const createProfileHandler = mockSocket.on.mock.calls.find(
      call => call[0] === 'create_profile'
    )[1];
    
    const mockCallback = jest.fn();
    createProfileHandler(profileData, mockCallback);
    
    // Verify callback was called with profile data
    expect(mockCallback).toHaveBeenCalledWith({
      profileId: 'profile-456',
      ...mockProfile,
    });
  });

  test('should handle errors and return error via callback', () => {
    const profileData = {
      name: 'Test User',
      birthday: '2000-01-01',
      gender: 'other',
    };
    
    findOrCreateProfile.mockImplementation(() => {
      throw new Error('Database error');
    });
    
    registerGameHandlers(mockIo, mockSocket);
    const createProfileHandler = mockSocket.on.mock.calls.find(
      call => call[0] === 'create_profile'
    )[1];
    
    const mockCallback = jest.fn();
    createProfileHandler(profileData, mockCallback);
    
    // Verify error callback
    expect(mockCallback).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Failed to create profile',
      })
    );
  });

  test('should handle null profile return', () => {
    const profileData = {
      name: 'Test User',
      birthday: '2000-01-01',
      gender: 'other',
    };
    
    findOrCreateProfile.mockReturnValue(null);
    
    registerGameHandlers(mockIo, mockSocket);
    const createProfileHandler = mockSocket.on.mock.calls.find(
      call => call[0] === 'create_profile'
    )[1];
    
    const mockCallback = jest.fn();
    createProfileHandler(profileData, mockCallback);
    
    // Verify error callback for null profile
    expect(mockCallback).toHaveBeenCalledWith({
      error: 'Failed to create profile',
    });
  });
});

describe('join_room handler', () => {
  let mockSocket;
  let mockIo;
  let mockEmit;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockEmit = jest.fn();
    mockSocket = {
      id: 'socket-123',
      on: jest.fn(),
      join: jest.fn(),
    };
    
    mockIo = {
      to: jest.fn(() => ({ emit: mockEmit })),
    };
  });

  test('should validate profile exists before joining', () => {
    registerGameHandlers(mockIo, mockSocket);
    const joinRoomHandler = mockSocket.on.mock.calls.find(
      call => call[0] === 'join_room'
    )[1];
    
    // Call with missing profile
    joinRoomHandler({ roomCode: 'ROOM1' });
    
    // Should not call addPlayerToRoom if profile is missing
    expect(addPlayerToRoom).not.toHaveBeenCalled();
  });

  test('should call addPlayerToRoom with correct parameters', () => {
    const roomCode = 'ROOM1';
    const profile = {
      id: 'profile-123',
      name: 'John Smith',
    };
    
    const mockPlayer = {
      socketId: 'socket-123',
      profileId: 'profile-123',
      name: 'John Smith',
      isHost: true,
    };
    
    addPlayerToRoom.mockReturnValue(mockPlayer);
    getOrCreateRoom.mockReturnValue({
      code: roomCode,
      players: [mockPlayer],
    });
    
    registerGameHandlers(mockIo, mockSocket);
    const joinRoomHandler = mockSocket.on.mock.calls.find(
      call => call[0] === 'join_room'
    )[1];
    
    joinRoomHandler({ roomCode, profile });
    
    // Verify addPlayerToRoom was called correctly
    expect(addPlayerToRoom).toHaveBeenCalledWith(roomCode, 'socket-123', profile);
  });

  test('should join Socket.io room', () => {
    const roomCode = 'ROOM1';
    const profile = {
      id: 'profile-123',
      name: 'John Smith',
    };
    
    const mockPlayer = {
      socketId: 'socket-123',
      profileId: 'profile-123',
      name: 'John Smith',
    };
    
    addPlayerToRoom.mockReturnValue(mockPlayer);
    getOrCreateRoom.mockReturnValue({
      code: roomCode,
      players: [mockPlayer],
    });
    
    registerGameHandlers(mockIo, mockSocket);
    const joinRoomHandler = mockSocket.on.mock.calls.find(
      call => call[0] === 'join_room'
    )[1];
    
    joinRoomHandler({ roomCode, profile });
    
    // Verify socket joined the room
    expect(mockSocket.join).toHaveBeenCalledWith(roomCode);
  });

  test('should broadcast room_update to all clients in room', () => {
    const roomCode = 'ROOM1';
    const profile = {
      id: 'profile-123',
      name: 'John Smith',
    };
    
    const mockPlayer = {
      socketId: 'socket-123',
      profileId: 'profile-123',
      name: 'John Smith',
      isHost: true,
    };
    
    const mockRoom = {
      code: roomCode,
      players: [mockPlayer],
    };
    
    addPlayerToRoom.mockReturnValue(mockPlayer);
    getOrCreateRoom.mockReturnValue(mockRoom);
    
    registerGameHandlers(mockIo, mockSocket);
    const joinRoomHandler = mockSocket.on.mock.calls.find(
      call => call[0] === 'join_room'
    )[1];
    
    joinRoomHandler({ roomCode, profile });
    
    // Verify broadcast was sent
    expect(mockIo.to).toHaveBeenCalledWith(roomCode);
    expect(mockEmit).toHaveBeenCalledWith('room_update', {
      roomCode,
      players: [mockPlayer],
    });
  });

  test('should handle reconnection (player already in room)', () => {
    const roomCode = 'ROOM1';
    const profile = {
      id: 'profile-123',
      name: 'John Smith',
    };
    
    const existingPlayer = {
      socketId: 'socket-new',
      profileId: 'profile-123',
      name: 'John Smith',
      teamId: 'A', // Preserved from before disconnect
      isHost: false,
    };
    
    addPlayerToRoom.mockReturnValue(existingPlayer);
    getOrCreateRoom.mockReturnValue({
      code: roomCode,
      players: [existingPlayer],
    });
    
    registerGameHandlers(mockIo, mockSocket);
    const joinRoomHandler = mockSocket.on.mock.calls.find(
      call => call[0] === 'join_room'
    )[1];
    
    joinRoomHandler({ roomCode, profile });
    
    // Verify player was reconnected (not added as new)
    expect(addPlayerToRoom).toHaveBeenCalled();
    expect(mockSocket.join).toHaveBeenCalledWith(roomCode);
    expect(mockEmit).toHaveBeenCalledWith('room_update', {
      roomCode,
      players: [existingPlayer],
    });
  });
});

