import React from "react";
import { Routes, Route } from "react-router-dom";
import { JoinScreen } from "../components/phone/JoinScreen";
import { DraftScreen } from "../components/phone/DraftScreen";
import { ClueGiverScreen } from "../components/phone/ClueGiverScreen";
import { SpectatorScreen } from "../components/phone/SpectatorScreen";
import { HostControls } from "../components/phone/HostControls";
import { useSocket } from "../hooks/useSocket";

export const PhoneLayout: React.FC = () => {
  const { connected } = useSocket();
  
  // TODO: use game state (role, phase) to route automatically
  return (
    <div className="phone-root">
      <p>Status: {connected ? "Connected" : "Connecting..."}</p>
      <Routes>
        <Route path="/" element={<JoinScreen />} />
        <Route path="/draft" element={<DraftScreen />} />
        <Route path="/clue" element={<ClueGiverScreen />} />
        <Route path="/spectate" element={<SpectatorScreen />} />
        <Route path="/host" element={<HostControls />} />
      </Routes>
    </div>
  );
};

