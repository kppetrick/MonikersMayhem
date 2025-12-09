// client/src/components/tv/__tests__/TVLobby.test.tsx
// Tests for TVLobby component

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { TVLobby } from '../TVLobby';

// Mock the useSocket hook
vi.mock('../../../hooks/useSocket', () => ({
  useSocket: vi.fn(),
}));

import { useSocket } from '../../../hooks/useSocket';

describe('TVLobby', () => {
  let mockSocket: any;
  let mockEmit: any;
  let mockOn: any;
  let mockOff: any;
  let mockJoin: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Create mock socket
    mockEmit = vi.fn();
    mockOn = vi.fn();
    mockOff = vi.fn();
    mockJoin = vi.fn();
    
    mockSocket = {
      id: 'socket-tv-123',
      emit: mockEmit,
      on: mockOn,
      off: mockOff,
      join: mockJoin,
    };
    
    // Default mock: connected socket
    (useSocket as any).mockReturnValue({
      socket: mockSocket,
      connected: true,
    });
  });

  describe('Room Creation', () => {
    it('should emit create_room when component mounts and socket is connected', async () => {
      render(<TVLobby />);
      
      await waitFor(() => {
        expect(mockEmit).toHaveBeenCalledWith('create_room', expect.any(Function));
      });
    });

    it('should not emit create_room if socket is not connected', () => {
      (useSocket as any).mockReturnValue({
        socket: null,
        connected: false,
      });
      
      render(<TVLobby />);
      
      expect(mockEmit).not.toHaveBeenCalled();
    });

    it('should not emit create_room if socket is null', () => {
      (useSocket as any).mockReturnValue({
        socket: null,
        connected: true,
      });
      
      render(<TVLobby />);
      
      expect(mockEmit).not.toHaveBeenCalled();
    });

    it('should join the room when room code is received', async () => {
      render(<TVLobby />);
      
      // Wait for create_room to be called
      await waitFor(() => {
        expect(mockEmit).toHaveBeenCalledWith('create_room', expect.any(Function));
      });
      
      // Simulate successful room creation callback
      const createRoomCall = mockEmit.mock.calls.find(
        (call: any[]) => call[0] === 'create_room'
      );
      const callback = createRoomCall[1];
      
      callback({ roomCode: 'ABC12' });
      
      await waitFor(() => {
        expect(mockJoin).toHaveBeenCalledWith('ABC12');
      });
    });

    it('should display room code prominently after room is created', async () => {
      render(<TVLobby />);
      
      // Wait for create_room to be called
      await waitFor(() => {
        expect(mockEmit).toHaveBeenCalledWith('create_room', expect.any(Function));
      });
      
      // Simulate successful room creation
      const createRoomCall = mockEmit.mock.calls.find(
        (call: any[]) => call[0] === 'create_room'
      );
      const callback = createRoomCall[1];
      callback({ roomCode: 'XYZ99' });
      
      await waitFor(() => {
        expect(screen.getByText('XYZ99')).toBeInTheDocument();
      });
      
      // Check that room code is displayed prominently (in a large element)
      const roomCodeElement = screen.getByText('XYZ99');
      expect(roomCodeElement).toBeInTheDocument();
    });

    it('should show error message if room creation fails', async () => {
      render(<TVLobby />);
      
      // Wait for create_room to be called
      await waitFor(() => {
        expect(mockEmit).toHaveBeenCalledWith('create_room', expect.any(Function));
      });
      
      // Simulate error response
      const createRoomCall = mockEmit.mock.calls.find(
        (call: any[]) => call[0] === 'create_room'
      );
      const callback = createRoomCall[1];
      callback({ error: 'Failed to create room' });
      
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
        expect(screen.getByText(/failed to create room/i)).toBeInTheDocument();
      });
    });

    it('should show loading state while creating room', () => {
      render(<TVLobby />);
      
      expect(screen.getByText(/creating room/i)).toBeInTheDocument();
    });

    it('should show connecting message when socket is not connected', () => {
      (useSocket as any).mockReturnValue({
        socket: null,
        connected: false,
      });
      
      render(<TVLobby />);
      
      expect(screen.getByText(/connecting to server/i)).toBeInTheDocument();
    });
  });

  describe('Room Updates and Player Display', () => {
    const setupRoom = async () => {
      render(<TVLobby />);
      
      // Wait for create_room to be called
      await waitFor(() => {
        expect(mockEmit).toHaveBeenCalledWith('create_room', expect.any(Function));
      });
      
      // Simulate successful room creation
      const createRoomCall = mockEmit.mock.calls.find(
        (call: any[]) => call[0] === 'create_room'
      );
      const callback = createRoomCall[1];
      callback({ roomCode: 'ROOM1' });
      
      // Wait for room_update listener to be set up
      await waitFor(() => {
        expect(mockOn).toHaveBeenCalledWith('room_update', expect.any(Function));
      });
      
      return mockOn.mock.calls.find((call: any[]) => call[0] === 'room_update')[1];
    };

    it('should listen to room_update events after room is created', async () => {
      await setupRoom();
      
      expect(mockOn).toHaveBeenCalledWith('room_update', expect.any(Function));
    });

    it('should display "Waiting for players..." when no players have joined', async () => {
      const roomUpdateHandler = await setupRoom();
      
      // Simulate room_update with empty players
      roomUpdateHandler({ roomCode: 'ROOM1', players: [] });
      
      await waitFor(() => {
        expect(screen.getByText(/waiting for players/i)).toBeInTheDocument();
      });
    });

    it('should display player names when players join', async () => {
      const roomUpdateHandler = await setupRoom();
      
      const players = [
        {
          socketId: 'socket-1',
          profileId: 'profile-1',
          name: 'Alice',
          isHost: true,
          disconnected: false,
        },
        {
          socketId: 'socket-2',
          profileId: 'profile-2',
          name: 'Bob',
          isHost: false,
          disconnected: false,
        },
      ];
      
      roomUpdateHandler({ roomCode: 'ROOM1', players });
      
      await waitFor(() => {
        expect(screen.getByText('Alice')).toBeInTheDocument();
        expect(screen.getByText('Bob')).toBeInTheDocument();
      });
    });

    it('should show host badge (👑 Host) for the host player', async () => {
      const roomUpdateHandler = await setupRoom();
      
      const players = [
        {
          socketId: 'socket-1',
          profileId: 'profile-1',
          name: 'Alice',
          isHost: true,
          disconnected: false,
        },
        {
          socketId: 'socket-2',
          profileId: 'profile-2',
          name: 'Bob',
          isHost: false,
          disconnected: false,
        },
      ];
      
      roomUpdateHandler({ roomCode: 'ROOM1', players });
      
      await waitFor(() => {
        expect(screen.getByText('Alice')).toBeInTheDocument();
        expect(screen.getByText(/👑 host/i)).toBeInTheDocument();
      });
      
      // Bob should not have host badge
      const bobElement = screen.getByText('Bob');
      expect(bobElement.closest('li')).not.toHaveTextContent(/👑 host/i);
    });

    it('should show disconnected players as greyed out', async () => {
      const roomUpdateHandler = await setupRoom();
      
      const players = [
        {
          socketId: 'socket-1',
          profileId: 'profile-1',
          name: 'Alice',
          isHost: true,
          disconnected: false,
        },
        {
          socketId: null,
          profileId: 'profile-2',
          name: 'Bob',
          isHost: false,
          disconnected: true,
        },
        {
          socketId: 'socket-3',
          profileId: 'profile-3',
          name: 'Charlie',
          isHost: false,
          disconnected: false,
        },
      ];
      
      roomUpdateHandler({ roomCode: 'ROOM1', players });
      
      await waitFor(() => {
        expect(screen.getByText('Alice')).toBeInTheDocument();
        expect(screen.getByText('Bob')).toBeInTheDocument();
        expect(screen.getByText('Charlie')).toBeInTheDocument();
      });
      
      // Bob should be displayed but greyed out (check for disabled/greyed styling)
      const bobElement = screen.getByText('Bob');
      expect(bobElement).toBeInTheDocument();
      // Check that Bob's list item has a class or style indicating disconnected state
      const bobListItem = bobElement.closest('li');
      expect(bobListItem).toHaveClass(/disconnected|greyed|disabled/i);
    });

    it('should update player count in header', async () => {
      const roomUpdateHandler = await setupRoom();
      
      const players = [
        {
          socketId: 'socket-1',
          profileId: 'profile-1',
          name: 'Alice',
          isHost: true,
          disconnected: false,
        },
        {
          socketId: 'socket-2',
          profileId: 'profile-2',
          name: 'Bob',
          isHost: false,
          disconnected: false,
        },
      ];
      
      roomUpdateHandler({ roomCode: 'ROOM1', players });
      
      await waitFor(() => {
        expect(screen.getByText(/players \(2\)/i)).toBeInTheDocument();
      });
    });

    it('should only update players if room_update is for the current room', async () => {
      const roomUpdateHandler = await setupRoom();
      
      // First, set up players for current room
      roomUpdateHandler({
        roomCode: 'ROOM1',
        players: [
          {
            socketId: 'socket-1',
            profileId: 'profile-1',
            name: 'Alice',
            isHost: true,
            disconnected: false,
          },
        ],
      });
      
      await waitFor(() => {
        expect(screen.getByText('Alice')).toBeInTheDocument();
      });
      
      // Update for different room should not affect display
      roomUpdateHandler({
        roomCode: 'DIFFERENT',
        players: [
          {
            socketId: 'socket-2',
            profileId: 'profile-2',
            name: 'Bob',
            isHost: true,
            disconnected: false,
          },
        ],
      });
      
      // Alice should still be there, Bob should not appear
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.queryByText('Bob')).not.toBeInTheDocument();
    });

    it('should clean up room_update listener on unmount', async () => {
      const { unmount } = render(<TVLobby />);
      
      // Wait for room to be created first
      await waitFor(() => {
        expect(mockEmit).toHaveBeenCalledWith('create_room', expect.any(Function));
      });
      
      // Simulate room creation
      const createRoomCall = mockEmit.mock.calls.find(
        (call: any[]) => call[0] === 'create_room'
      );
      const callback = createRoomCall[1];
      callback({ roomCode: 'ROOM1' });
      
      // Wait for listener to be set up
      await waitFor(() => {
        expect(mockOn).toHaveBeenCalledWith('room_update', expect.any(Function));
      });
      
      unmount();
      
      // Verify cleanup
      expect(mockOff).toHaveBeenCalledWith('room_update', expect.any(Function));
    });
  });

  describe('Teams Section', () => {
    const setupRoom = async () => {
      render(<TVLobby />);
      
      await waitFor(() => {
        expect(mockEmit).toHaveBeenCalledWith('create_room', expect.any(Function));
      });
      
      const createRoomCall = mockEmit.mock.calls.find(
        (call: any[]) => call[0] === 'create_room'
      );
      const callback = createRoomCall[1];
      callback({ roomCode: 'ROOM1' });
      
      await waitFor(() => {
        expect(screen.getByText('ROOM1')).toBeInTheDocument();
      });
    };

    it('should display teams section with placeholder message', async () => {
      await setupRoom();
      
      expect(screen.getByRole('heading', { name: /teams/i })).toBeInTheDocument();
      expect(screen.getByText(/teams will be assigned/i)).toBeInTheDocument();
    });

    it('should show teams placeholder even when players have joined', async () => {
      await setupRoom();
      
      // Wait for room_update listener
      await waitFor(() => {
        expect(mockOn).toHaveBeenCalledWith('room_update', expect.any(Function));
      });
      
      const roomUpdateHandler = mockOn.mock.calls.find(
        (call: any[]) => call[0] === 'room_update'
      )[1];
      
      roomUpdateHandler({
        roomCode: 'ROOM1',
        players: [
          {
            socketId: 'socket-1',
            profileId: 'profile-1',
            name: 'Alice',
            isHost: true,
            disconnected: false,
          },
        ],
      });
      
      // Teams placeholder should still be visible
      expect(screen.getByRole('heading', { name: /teams/i })).toBeInTheDocument();
      expect(screen.getByText(/teams will be assigned/i)).toBeInTheDocument();
    });
  });

  describe('UI Structure and Styling Classes', () => {
    it('should have tv-lobby class on main section', async () => {
      const { container } = render(<TVLobby />);
      
      await waitFor(() => {
        expect(mockEmit).toHaveBeenCalledWith('create_room', expect.any(Function));
      });
      
      const section = container.querySelector('.tv-lobby');
      expect(section).toBeInTheDocument();
    });

    it('should have room-code-display section with large room code', async () => {
      render(<TVLobby />);
      
      await waitFor(() => {
        expect(mockEmit).toHaveBeenCalledWith('create_room', expect.any(Function));
      });
      
      const createRoomCall = mockEmit.mock.calls.find(
        (call: any[]) => call[0] === 'create_room'
      );
      const callback = createRoomCall[1];
      callback({ roomCode: 'TEST1' });
      
      await waitFor(() => {
        expect(screen.getByText(/room code/i)).toBeInTheDocument();
        expect(screen.getByText('TEST1')).toBeInTheDocument();
      });
    });

    it('should have players-section with list structure', async () => {
      const roomUpdateHandler = await (async () => {
        render(<TVLobby />);
        
        await waitFor(() => {
          expect(mockEmit).toHaveBeenCalledWith('create_room', expect.any(Function));
        });
        
        const createRoomCall = mockEmit.mock.calls.find(
          (call: any[]) => call[0] === 'create_room'
        );
        const callback = createRoomCall[1];
        callback({ roomCode: 'ROOM1' });
        
        await waitFor(() => {
          expect(mockOn).toHaveBeenCalledWith('room_update', expect.any(Function));
        });
        
        return mockOn.mock.calls.find((call: any[]) => call[0] === 'room_update')[1];
      })();
      
      roomUpdateHandler({
        roomCode: 'ROOM1',
        players: [
          {
            socketId: 'socket-1',
            profileId: 'profile-1',
            name: 'Alice',
            isHost: true,
            disconnected: false,
          },
        ],
      });
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /players/i })).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple room_update events correctly', async () => {
      render(<TVLobby />);
      
      await waitFor(() => {
        expect(mockEmit).toHaveBeenCalledWith('create_room', expect.any(Function));
      });
      
      const createRoomCall = mockEmit.mock.calls.find(
        (call: any[]) => call[0] === 'create_room'
      );
      const callback = createRoomCall[1];
      callback({ roomCode: 'ROOM1' });
      
      await waitFor(() => {
        expect(mockOn).toHaveBeenCalledWith('room_update', expect.any(Function));
      });
      
      const roomUpdateHandler = mockOn.mock.calls.find(
        (call: any[]) => call[0] === 'room_update'
      )[1];
      
      // First update: one player
      roomUpdateHandler({
        roomCode: 'ROOM1',
        players: [
          {
            socketId: 'socket-1',
            profileId: 'profile-1',
            name: 'Alice',
            isHost: true,
            disconnected: false,
          },
        ],
      });
      
      await waitFor(() => {
        expect(screen.getByText('Alice')).toBeInTheDocument();
      });
      
      // Second update: two players
      roomUpdateHandler({
        roomCode: 'ROOM1',
        players: [
          {
            socketId: 'socket-1',
            profileId: 'profile-1',
            name: 'Alice',
            isHost: true,
            disconnected: false,
          },
          {
            socketId: 'socket-2',
            profileId: 'profile-2',
            name: 'Bob',
            isHost: false,
            disconnected: false,
          },
        ],
      });
      
      await waitFor(() => {
        expect(screen.getByText('Alice')).toBeInTheDocument();
        expect(screen.getByText('Bob')).toBeInTheDocument();
      });
    });

    it('should handle room_update with missing roomCode gracefully', async () => {
      render(<TVLobby />);
      
      await waitFor(() => {
        expect(mockEmit).toHaveBeenCalledWith('create_room', expect.any(Function));
      });
      
      const createRoomCall = mockEmit.mock.calls.find(
        (call: any[]) => call[0] === 'create_room'
      );
      const callback = createRoomCall[1];
      callback({ roomCode: 'ROOM1' });
      
      await waitFor(() => {
        expect(mockOn).toHaveBeenCalledWith('room_update', expect.any(Function));
      });
      
      const roomUpdateHandler = mockOn.mock.calls.find(
        (call: any[]) => call[0] === 'room_update'
      )[1];
      
      // Should not crash on malformed update
      expect(() => {
        roomUpdateHandler({ players: [] });
      }).not.toThrow();
    });

    it('should not create room multiple times if already created', async () => {
      render(<TVLobby />);
      
      await waitFor(() => {
        expect(mockEmit).toHaveBeenCalledWith('create_room', expect.any(Function));
      });
      
      // Count how many times create_room was called
      const createRoomCalls = mockEmit.mock.calls.filter(
        (call: any[]) => call[0] === 'create_room'
      );
      expect(createRoomCalls.length).toBe(1);
      
      // Simulate successful creation
      const callback = createRoomCalls[0][1];
      callback({ roomCode: 'ROOM1' });
      
      // Wait a bit and verify no additional calls
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const finalCreateRoomCalls = mockEmit.mock.calls.filter(
        (call: any[]) => call[0] === 'create_room'
      );
      expect(finalCreateRoomCalls.length).toBe(1);
    });
  });
});

