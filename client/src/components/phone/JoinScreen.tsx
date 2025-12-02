import React, { useState } from "react";

export const JoinScreen: React.FC = () => {
  // TODO: hook into socket + call create_profile + join_room
  const [name, setName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other" | "preferNot" | "">("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: emit create_profile and then join_room
    console.log("Join submit", { name, birthday, gender });
  };

  return (
    <main>
      <h1>Join MonikersMayhem</h1>
      <form onSubmit={handleSubmit}>
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
            <option value="other">Other</option>
            <option value="preferNot">Prefer not to say</option>
          </select>
        </label>

        <button type="submit">Join Game</button>
      </form>
    </main>
  );
};

