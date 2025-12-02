import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { TVLayout } from "./routes/TVLayout";
import { PhoneLayout } from "./routes/PhoneLayout";
import { GameProvider } from "./context/GameContext";

const App: React.FC = () => {
  return (
    <GameProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/play" replace />} />
        <Route path="/tv" element={<TVLayout />} />
        <Route path="/play/*" element={<PhoneLayout />} />
      </Routes>
    </GameProvider>
  );
};

export default App;

