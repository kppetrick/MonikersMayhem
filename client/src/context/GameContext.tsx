import React, { createContext, useContext, useState } from "react";

type GameContextValue = {
  // TODO: expand this type as the game state model is implemented
  playerId: string | null;
  setPlayerId: (id: string | null) => void;
};

const GameContext = createContext<GameContextValue | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [playerId, setPlayerId] = useState<string | null>(null);

  const value: GameContextValue = {
    playerId,
    setPlayerId,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export const useGameContext = (): GameContextValue => {
  const ctx = useContext(GameContext);
  if (!ctx) {
    throw new Error("useGameContext must be used within GameProvider");
  }
  return ctx;
};

