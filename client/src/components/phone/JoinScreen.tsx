// JoinScreen: Two-step flow for players to join a game room
// Step 1: Enter 5-character room code
// Step 2: Select existing profile or create new profile, then join room
import React, { useState, useEffect } from "react";
import { useSocket } from "../../hooks/useSocket";

type Profile = {
  profileId: string;
  name: string;
  birthday: string;
  gender: "male" | "female";
};

const STORAGE_KEY = "monikers-mayhem-profiles";

function getStoredProfiles(): Profile[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveProfile(profile: Profile) {
  const profiles = getStoredProfiles();
  // Check if profile already exists (by profileId)
  const existingIndex = profiles.findIndex(p => p.profileId === profile.profileId);
  if (existingIndex >= 0) {
    profiles[existingIndex] = profile;
  } else {
    profiles.push(profile);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
}

export const JoinScreen: React.FC = () => {
  const [roomCode, setRoomCode] = useState("");
  const [roomCodeEntered, setRoomCodeEntered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { socket, connected } = useSocket();
  
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [showNewProfileForm, setShowNewProfileForm] = useState(false);
  const [name, setName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "">("");
  const [connectedPlayerIds, setConnectedPlayerIds] = useState<string[]>([]);
  
  const storedProfiles = getStoredProfiles();
  
  // Filter out profiles that are already connected to the room
  const availableProfiles = storedProfiles.filter(
    profile => !connectedPlayerIds.includes(profile.profileId)
  );
  
  const handleRoomCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCode || roomCode.length !== 5) {
      setError("Please enter a 5-character room code");
      return;
    }
    
    if (!socket || !connected) {
      setError("Not connected to server");
      return;
    }
    
    setError(null);
    setLoading(true);
    
    // Validate room code exists before proceeding
    socket.emit("validate_room", roomCode.toUpperCase(), (response: { valid?: boolean; error?: string; connectedPlayerIds?: string[] }) => {
      setLoading(false);
      if (response.error || !response.valid) {
        setError(response.error || "Room code not found. Please check the code and try again.");
        return;
      }
      // Store connected player IDs to filter profiles
      setConnectedPlayerIds(response.connectedPlayerIds || []);
      // Room is valid, proceed to profile selection
      setRoomCodeEntered(true);
    });
  };

  useEffect(() => {
    if (!socket) return;
    
    // Listen for room updates after joining (stops loading state)
    socket.on("room_update", (data: { roomCode: string; players: any[] }) => {
      console.log("Room update received:", data);
      setLoading(false);
    });
    
    // Listen for join room errors
    socket.on("join_room_error", (data: { error: string }) => {
      setError(data.error);
      setLoading(false);
    });
    
    return () => {
      socket.off("room_update");
      socket.off("join_room_error");
    };
  }, [socket]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    setError(null);
    
    if (!socket) {
      setError("Not connected to server");
      setLoading(false);
      return;
    }

    try {
      let profile: Profile;
      
      if (selectedProfileId && !showNewProfileForm) {
        // Use existing profile from localStorage
        profile = availableProfiles.find(p => p.profileId === selectedProfileId)!;
        
        if (!profile) {
          setError("Selected profile is no longer available");
          setLoading(false);
          return;
        }
        
        // Verify profile exists on server (re-creates if needed)
        socket.emit("create_profile", { 
          name: profile.name, 
          birthday: profile.birthday, 
          gender: profile.gender 
        }, (response: any) => {
          if (response.error) {
            setError(response.error);
            setLoading(false);
            return;
          }
          
          const updatedProfile = { ...response };
          saveProfile(updatedProfile);
          socket.emit("join_room", { roomCode, profile: updatedProfile });
        });
      } else {
        // Create new profile
        if (!name || !birthday || !gender) {
          setError("Please fill in all fields");
          setLoading(false);
          return;
        }
        
        socket.emit("create_profile", { name, birthday, gender }, (response: any) => {
          if (response.error) {
            setError(response.error);
            setLoading(false);
            return;
          }
          
          profile = response;
          saveProfile(profile);
          socket.emit("join_room", { roomCode, profile });
        });
      }
    } catch (err) {
      setError("Failed to join room");
      setLoading(false);
    }
  };

  if (!roomCodeEntered) {
    return (
      <main>
        <h1>Join MonikersMayhem</h1>
        <form onSubmit={handleRoomCodeSubmit} noValidate>
          <label>
            Room Code
            <input 
              value={roomCode} 
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())} 
              placeholder="Enter 5-character room code"
              maxLength={5}
              minLength={5}
              required
            />
          </label>

          {error && <div className="error">{error}</div>}

          <button type="submit" disabled={!connected || loading}>
            {loading ? "Checking room code..." : "Continue"}
          </button>
          {!connected && <p>Connecting to server...</p>}
        </form>
      </main>
    );
  }

  return (
    <main>
      <h1>Join Room: {roomCode}</h1>
      <button 
        type="button" 
        onClick={() => {
          setRoomCodeEntered(false);
          setError(null);
        }}
      >
        ← Change Room Code
      </button>

      <form onSubmit={handleProfileSubmit} noValidate>
        {availableProfiles.length > 0 && !showNewProfileForm && (
          <>
            <label>
              Select Profile
              <select 
                value={selectedProfileId} 
                onChange={(e) => setSelectedProfileId(e.target.value)}
                required
              >
                <option value="">Choose a profile...</option>
                {availableProfiles.map((profile) => (
                  <option key={profile.profileId} value={profile.profileId}>
                    {profile.name} ({profile.birthday})
                  </option>
                ))}
              </select>
            </label>
            
            {storedProfiles.length > availableProfiles.length && (
              <p className="info">
                {storedProfiles.length - availableProfiles.length} profile(s) already in room
              </p>
            )}
            
            <button 
              type="button" 
              onClick={() => {
                setShowNewProfileForm(true);
                setSelectedProfileId("");
              }}
            >
              Create New Profile
            </button>
          </>
        )}

        {(showNewProfileForm || availableProfiles.length === 0) && (
          <>
            {availableProfiles.length > 0 && (
              <button 
                type="button" 
                onClick={() => {
                  setShowNewProfileForm(false);
                  setSelectedProfileId(availableProfiles[0]?.profileId || "");
                }}
              >
                Use Existing Profile
              </button>
            )}
            
            <label>
              Name
              <input value={name} onChange={(e) => setName(e.target.value)} required />
            </label>

            <label>
              Birthday
              <input type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} required />
            </label>

            <label>
              Gender
              <select value={gender} onChange={(e) => setGender(e.target.value as any)} required>
                <option value="">Select…</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </label>
          </>
        )}

        {error && <div className="error">{error}</div>}

        <button type="submit" disabled={loading || !connected}>
          {loading ? "Joining..." : "Join Game"}
        </button>
        {!connected && <p>Connecting to server...</p>}
      </form>
    </main>
  );
};

