import React, { useState, useEffect } from "react";
import { useSocket } from "../../hooks/useSocket";

type Player = {
  socketId: string | null;
  profileId: string;
  name: string;
  isHost: boolean;
  teamId?: string;
  disconnected?: boolean;
};

type RoomUpdate = {
  roomCode: string;
  players: Player[];
};

export const TVLobby: React.FC = () => {
  const { socket, connected } = useSocket();
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Create room automatically when TV loads
  useEffect(() => {
    if (socket && connected && !roomCode) {
      socket.emit('create_room', (result: { roomCode?: string; error?: string }) => {
        if (result.error) {
          setError(result.error);
        } else if (result.roomCode) {
          setRoomCode(result.roomCode);
          (socket as any).join(result.roomCode);
        }
      });
    }
  }, [socket, connected, roomCode]);

  // Listen for player join/leave updates
  useEffect(() => {
    if (!socket || !roomCode) return;

    const handleRoomUpdate = (data: RoomUpdate) => {
      if (data.roomCode === roomCode) {
        setPlayers(data.players);
      }
    };

    socket.on('room_update', handleRoomUpdate);

    return () => {
      socket.off('room_update', handleRoomUpdate);
    };
  }, [socket, roomCode]);

  const connectedPlayers = players.filter(p => !p.disconnected);

  return (
    <section className="tv-lobby">
      {error && <div className="error">Error: {error}</div>}
      
      {!roomCode ? (
        <div className="loading">
          {connected ? "Creating room..." : "Connecting to server..."}
        </div>
      ) : (
        <>
          <div className="room-code-display">
            <h2>Room Code</h2>
            <div className="room-code-large">{roomCode}</div>
            <p>Players join by entering this code on their phones</p>
          </div>

          <div className="players-section">
            <h3>Players ({connectedPlayers.length})</h3>
            {connectedPlayers.length === 0 ? (
              <p className="no-players">Waiting for players...</p>
            ) : (
              <ul className="players-list">
                {players.map((player) => (
                  <li 
                    key={player.profileId} 
                    className={`player-item${player.disconnected ? ' disconnected' : ''}`}
                  >
                    <span className="player-name">{player.name}</span>
                    {player.isHost && <span className="host-badge">👑 Host</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="teams-section">
            <h3>Teams</h3>
            <p className="teams-placeholder">Teams will be assigned after all players join</p>
          </div>
        </>
      )}
    </section>
  );
};


