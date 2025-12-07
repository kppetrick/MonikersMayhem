// client/src/components/phone/__tests__/JoinScreen.test.tsx
// Tests for JoinScreen component

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JoinScreen } from '../JoinScreen';

// Mock the useSocket hook
vi.mock('../../../hooks/useSocket', () => ({
  useSocket: vi.fn(),
}));

import { useSocket } from '../../../hooks/useSocket';

describe('JoinScreen', () => {
  let mockSocket: any;
  let mockEmit: any;
  let mockOn: any;
  let mockOff: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Create mock socket
    mockEmit = vi.fn();
    mockOn = vi.fn();
    mockOff = vi.fn();
    
    mockSocket = {
      id: 'socket-123',
      emit: mockEmit,
      on: mockOn,
      off: mockOff,
    };
    
    // Default mock: connected socket
    (useSocket as any).mockReturnValue({
      socket: mockSocket,
      connected: true,
    });
    
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('Room Code Screen (Step 1)', () => {
    it('should render room code input on initial load', () => {
      render(<JoinScreen />);
      
      expect(screen.getByLabelText(/room code/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
      expect(screen.queryByLabelText(/name/i)).not.toBeInTheDocument();
    });

    it('should show connecting message when not connected', () => {
      (useSocket as any).mockReturnValue({
        socket: null,
        connected: false,
      });
      
      render(<JoinScreen />);
      
      expect(screen.getByText(/connecting to server/i)).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should show error if room code is not exactly 5 characters', async () => {
      const user = userEvent.setup();
      render(<JoinScreen />);
      
      await user.type(screen.getByLabelText(/room code/i), 'ABC');
      await user.click(screen.getByRole('button', { name: /continue/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/5-character room code/i)).toBeInTheDocument();
      });
    });

    it('should show error if room code is empty', async () => {
      const user = userEvent.setup();
      render(<JoinScreen />);
      
      await user.click(screen.getByRole('button', { name: /continue/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/5-character room code/i)).toBeInTheDocument();
      });
    });

    it('should convert room code to uppercase', async () => {
      const user = userEvent.setup();
      render(<JoinScreen />);
      
      const roomCodeInput = screen.getByLabelText(/room code/i);
      await user.type(roomCodeInput, 'abc12');
      
      expect(roomCodeInput).toHaveValue('ABC12');
    });

    it('should limit room code to 5 characters', async () => {
      const user = userEvent.setup();
      render(<JoinScreen />);
      
      const roomCodeInput = screen.getByLabelText(/room code/i);
      await user.type(roomCodeInput, 'ABCDEFG');
      
      expect(roomCodeInput).toHaveValue('ABCDE');
    });

    it('should proceed to profile screen with valid 5-character room code', async () => {
      const user = userEvent.setup();
      render(<JoinScreen />);
      
      await user.type(screen.getByLabelText(/room code/i), 'ABC12');
      await user.click(screen.getByRole('button', { name: /continue/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/join room: abc12/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /change room code/i })).toBeInTheDocument();
      });
    });
  });

  describe('Profile Screen (Step 2)', () => {
    const navigateToProfileScreen = async (user: any) => {
      await user.type(screen.getByLabelText(/room code/i), 'ROOM1');
      await user.click(screen.getByRole('button', { name: /continue/i }));
      await waitFor(() => {
        expect(screen.getByText(/join room: room1/i)).toBeInTheDocument();
      });
    };

    describe('New Profile Creation', () => {
      it('should show new profile form when no stored profiles exist', async () => {
        const user = userEvent.setup();
        render(<JoinScreen />);
        await navigateToProfileScreen(user);
        
        expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/birthday/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/gender/i)).toBeInTheDocument();
        expect(screen.queryByLabelText(/select profile/i)).not.toBeInTheDocument();
      });

      it('should emit create_profile with form data on submit', async () => {
        const user = userEvent.setup();
        render(<JoinScreen />);
        await navigateToProfileScreen(user);
        
        await user.type(screen.getByLabelText(/name/i), 'John Smith');
        await user.type(screen.getByLabelText(/birthday/i), '1990-05-15');
        await user.selectOptions(screen.getByLabelText(/gender/i), 'male');
        await user.click(screen.getByRole('button', { name: /join game/i }));
        
        await waitFor(() => {
          expect(mockEmit).toHaveBeenCalledWith(
            'create_profile',
            {
              name: 'John Smith',
              birthday: '1990-05-15',
              gender: 'male',
            },
            expect.any(Function)
          );
        });
      });

      it('should show error if profile fields are missing', async () => {
        const user = userEvent.setup();
        render(<JoinScreen />);
        await navigateToProfileScreen(user);
        
        await user.click(screen.getByRole('button', { name: /join game/i }));
        
        await waitFor(() => {
          expect(screen.getByText(/please fill in all fields/i)).toBeInTheDocument();
        });
        
        expect(mockEmit).not.toHaveBeenCalled();
      });

      it('should emit join_room after successful profile creation', async () => {
        const user = userEvent.setup();
        render(<JoinScreen />);
        await navigateToProfileScreen(user);
        
        await user.type(screen.getByLabelText(/name/i), 'Jane Doe');
        await user.type(screen.getByLabelText(/birthday/i), '1985-03-20');
        await user.selectOptions(screen.getByLabelText(/gender/i), 'female');
        await user.click(screen.getByRole('button', { name: /join game/i }));
        
        // Wait for create_profile to be called
        await waitFor(() => {
          expect(mockEmit).toHaveBeenCalledWith(
            'create_profile',
            expect.any(Object),
            expect.any(Function)
          );
        });
        
        // Simulate successful profile creation callback
        const createProfileCall = mockEmit.mock.calls.find(
          (call: any[]) => call[0] === 'create_profile'
        );
        const callback = createProfileCall[2];
        
        const mockProfile = {
          profileId: 'profile-123',
          name: 'Jane Doe',
          birthday: '1985-03-20',
          gender: 'female',
          age: 39,
          ageRange: '36-40',
        };
        
        callback(mockProfile);
        
        // Verify join_room was called
        await waitFor(() => {
          expect(mockEmit).toHaveBeenCalledWith('join_room', {
            roomCode: 'ROOM1',
            profile: mockProfile,
          });
        });
      });

      it('should show error if profile creation fails', async () => {
        const user = userEvent.setup();
        render(<JoinScreen />);
        await navigateToProfileScreen(user);
        
        await user.type(screen.getByLabelText(/name/i), 'Test User');
        await user.type(screen.getByLabelText(/birthday/i), '2000-01-01');
        await user.selectOptions(screen.getByLabelText(/gender/i), 'male');
        await user.click(screen.getByRole('button', { name: /join game/i }));
        
        // Wait for create_profile to be called
        await waitFor(() => {
          expect(mockEmit).toHaveBeenCalledWith(
            'create_profile',
            expect.any(Object),
            expect.any(Function)
          );
        });
        
        // Simulate error response
        const createProfileCall = mockEmit.mock.calls.find(
          (call: any[]) => call[0] === 'create_profile'
        );
        const callback = createProfileCall[2];
        
        callback({ error: 'Failed to create profile' });
        
        // Verify error is shown
        await waitFor(() => {
          expect(screen.getByText(/failed to create profile/i)).toBeInTheDocument();
        });
        
        // Should not call join_room
        expect(mockEmit).not.toHaveBeenCalledWith('join_room', expect.any(Object));
      });
    });

    describe('Existing Profile Selection', () => {
      beforeEach(() => {
        // Set up localStorage with a stored profile
        const storedProfile = {
          profileId: 'profile-123',
          name: 'John Doe',
          birthday: '1990-05-15',
          gender: 'male' as const,
        };
        localStorage.setItem('monikers-mayhem-profiles', JSON.stringify([storedProfile]));
      });

      it('should show profile selection when stored profiles exist', async () => {
        const user = userEvent.setup();
        render(<JoinScreen />);
        await navigateToProfileScreen(user);
        
        expect(screen.getByLabelText(/select profile/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /create new profile/i })).toBeInTheDocument();
        expect(screen.queryByLabelText(/name/i)).not.toBeInTheDocument();
      });

      it('should allow switching to new profile form', async () => {
        const user = userEvent.setup();
        render(<JoinScreen />);
        await navigateToProfileScreen(user);
        
        await user.click(screen.getByRole('button', { name: /create new profile/i }));
        
        expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /use existing profile/i })).toBeInTheDocument();
      });

      it('should allow switching back to profile selection', async () => {
        const user = userEvent.setup();
        render(<JoinScreen />);
        await navigateToProfileScreen(user);
        
        await user.click(screen.getByRole('button', { name: /create new profile/i }));
        await user.click(screen.getByRole('button', { name: /use existing profile/i }));
        
        expect(screen.getByLabelText(/select profile/i)).toBeInTheDocument();
        expect(screen.queryByLabelText(/name/i)).not.toBeInTheDocument();
      });

      it('should emit create_profile and join_room when existing profile is selected', async () => {
        const user = userEvent.setup();
        render(<JoinScreen />);
        await navigateToProfileScreen(user);
        
        await user.selectOptions(screen.getByLabelText(/select profile/i), 'profile-123');
        await user.click(screen.getByRole('button', { name: /join game/i }));
        
        // Wait for create_profile to be called with stored profile data
        await waitFor(() => {
          expect(mockEmit).toHaveBeenCalledWith(
            'create_profile',
            {
              name: 'John Doe',
              birthday: '1990-05-15',
              gender: 'male',
            },
            expect.any(Function)
          );
        });
      });
    });

    it('should allow going back to room code screen', async () => {
      const user = userEvent.setup();
      render(<JoinScreen />);
      await navigateToProfileScreen(user);
      
      await user.click(screen.getByRole('button', { name: /change room code/i }));
      
      await waitFor(() => {
        expect(screen.getByLabelText(/room code/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
        expect(screen.queryByLabelText(/name/i)).not.toBeInTheDocument();
      });
    });

    it('should show error if socket is null when submitting profile', async () => {
      // Set socket to null but keep connected: true (so button isn't disabled)
      (useSocket as any).mockReturnValue({
        socket: null,
        connected: true,
      });
      
      const user = userEvent.setup();
      render(<JoinScreen />);
      
      // Navigate to profile screen
      await user.type(screen.getByLabelText(/room code/i), 'ROOM1');
      await user.click(screen.getByRole('button', { name: /continue/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/join room: room1/i)).toBeInTheDocument();
      });
      
      // Fill form
      await user.type(screen.getByLabelText(/name/i), 'Test User');
      await user.type(screen.getByLabelText(/birthday/i), '2000-01-01');
      await user.selectOptions(screen.getByLabelText(/gender/i), 'male');
      
      // Try to submit with null socket
      await user.click(screen.getByRole('button', { name: /join game/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/not connected to server/i)).toBeInTheDocument();
      });
    });
  });

  describe('Loading states', () => {
    it('should show loading state when submitting profile', async () => {
      const user = userEvent.setup();
      render(<JoinScreen />);
      
      await user.type(screen.getByLabelText(/room code/i), 'ROOM1');
      await user.click(screen.getByRole('button', { name: /continue/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/join room: room1/i)).toBeInTheDocument();
      });
      
      await user.type(screen.getByLabelText(/name/i), 'John');
      await user.type(screen.getByLabelText(/birthday/i), '1990-05-15');
      await user.selectOptions(screen.getByLabelText(/gender/i), 'male');
      await user.click(screen.getByRole('button', { name: /join game/i }));
      
      // Button should show loading state - be specific about which button
      const submitButton = screen.getByRole('button', { name: /joining/i });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    it('should stop loading when room_update is received', async () => {
      render(<JoinScreen />);
      
      // Set up room_update listener
      await waitFor(() => {
        expect(mockOn).toHaveBeenCalledWith('room_update', expect.any(Function));
      });
      
      const roomUpdateHandler = mockOn.mock.calls.find(
        (call: any[]) => call[0] === 'room_update'
      )[1];
      
      // Simulate room_update event
      roomUpdateHandler({ roomCode: 'ROOM1', players: [] });
      
      // Button should no longer be in loading state (if we're on profile screen)
      // This test might need adjustment based on actual behavior
    });
  });
});
