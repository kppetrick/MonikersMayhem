import React from "react";
import { TVLobby } from "../components/tv/TVLobby";
import { TVScoreboard } from "../components/tv/TVScoreboard";
import { TVRoundStatus } from "../components/tv/TVRoundStatus";
import { useSocket } from "../hooks/useSocket";

export const TVLayout: React.FC = () => {
  const { connected } = useSocket();
  
  // TODO: conditionally render lobby vs in-game vs summary based on game state
  return (
    <div className="tv-root">
      <h1>MonikersMayhem – TV</h1>
      <p>Status: {connected ? "Connected" : "Connecting..."}</p>
      <TVRoundStatus />
      <TVScoreboard />
      <TVLobby />
    </div>
  );
};

