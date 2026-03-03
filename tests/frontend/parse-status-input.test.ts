import { parseStatusInput } from "@src/vac-check/parseStatusInput.ts";

// Mock getId so tests don't depend on SteamID library in jsdom
vi.mock("@src/utils/steamUtils.js", () => {
  const STEAM64_BASE = BigInt("76561197960265728");
  return {
    getId: (raw: string): string | null => {
      const uMatch = raw.match(/\[U:1:(\d+)\]/);
      if (uMatch) return String(STEAM64_BASE + BigInt(uMatch[1]));
      const sMatch = raw.match(/STEAM_[01]:[01]:(\d+)/);
      if (sMatch) {
        const y = raw.includes("STEAM_1:") ? 1 : 0;
        const z = Number(sMatch[1]);
        return String(STEAM64_BASE + BigInt(z) * BigInt(2) + BigInt(y));
      }
      return null;
    },
  };
});

describe("parseStatusInput", () => {
  describe("TF2 status format ([U:1:xxx])", () => {
    it("extracts one player from a TF2 status line", () => {
      const line =
        '# 3481 "「VΛC」✔ Lightning⸙Dust"            [U:1:1266329853]     32:26       85    0 active';
      const result = parseStatusInput(line);

      expect(result.isTF2).toBe(true);
      expect(result.isCSGO).toBe(false);
      expect(Object.keys(result.vacLookup)).toHaveLength(1);

      const id64 = Object.keys(result.vacLookup)[0];
      expect(id64).toHaveLength(17);
      expect(id64).toMatch(/^\d+$/);

      const entry = result.vacLookup[id64];
      expect(entry.name).toBe("「VΛC」✔ Lightning⸙Dust");
      expect(entry.id).toBe(id64);
    });

    it("extracts multiple TF2 players from a single line", () => {
      const line =
        '# 3481 "Blackjack" [U:1:120274086] 32:26 85 0 active # 1123 "miura" [U:1:132939500] 24:08 57 0 active';
      const result = parseStatusInput(line);

      expect(result.isTF2).toBe(true);
      expect(Object.keys(result.vacLookup)).toHaveLength(2);

      const entries = Object.values(result.vacLookup);
      const names = entries.map((e) => e.name);
      expect(names).toContain("Blackjack");
      expect(names).toContain("miura");
    });

    it("extracts players from multiple TF2 status lines", () => {
      const input = `# 3481 "PlayerOne" [U:1:120274086] 32:26 85 0 active
# 1123 "PlayerTwo" [U:1:132939500] 24:08 57 0 active`;
      const result = parseStatusInput(input);

      expect(result.isTF2).toBe(true);
      expect(Object.keys(result.vacLookup)).toHaveLength(2);

      const entries = Object.values(result.vacLookup);
      expect(entries.map((e) => e.name).sort()).toEqual(["PlayerOne", "PlayerTwo"]);
    });
  });

  describe("CS:GO status format (STEAM_x:y:zzz)", () => {
    it("extracts one player from a CS:GO status line", () => {
      const line =
        '# 2 "Player Name" STEAM_1:0:12345678 01:23 45 0 active 192.168.1.1:27005';
      const result = parseStatusInput(line);

      expect(result.isCSGO).toBe(true);
      expect(Object.keys(result.vacLookup)).toHaveLength(1);

      const id64 = Object.keys(result.vacLookup)[0];
      expect(id64).toHaveLength(17);
      expect(result.vacLookup[id64].name).toBe("Player Name");
    });

    it("extracts player with STEAM_0:0: format", () => {
      const line = '# 5 "AnotherPlayer" STEAM_0:0:87654321 00:15 32 0 active';
      const result = parseStatusInput(line);

      expect(result.isCSGO).toBe(true);
      expect(Object.keys(result.vacLookup)).toHaveLength(1);
      expect(Object.values(result.vacLookup)[0].name).toBe("AnotherPlayer");
    });

    it("extracts multiple CS:GO players from multiple lines", () => {
      const input = `# 1 "Alice" STEAM_1:0:111111 01:00 50 0 active
# 2 "Bob" STEAM_1:0:222222 02:00 60 0 active`;
      const result = parseStatusInput(input);

      expect(result.isCSGO).toBe(true);
      expect(Object.keys(result.vacLookup)).toHaveLength(2);
      const names = Object.values(result.vacLookup).map((e) => e.name);
      expect(names).toContain("Alice");
      expect(names).toContain("Bob");
    });
  });

  describe("edge cases", () => {
    it("returns empty vacLookup and no flags when input has no valid Steam IDs", () => {
      const result = parseStatusInput("just some random text and numbers 12345");
      expect(result.vacLookup).toEqual({});
      expect(result.isTF2).toBe(false);
      expect(result.isCSGO).toBe(false);
    });

    it("returns empty when input is empty string", () => {
      const result = parseStatusInput("");
      expect(Object.keys(result.vacLookup)).toHaveLength(0);
    });

    it("returns empty when input is only whitespace", () => {
      const result = parseStatusInput("   \n  \t  ");
      expect(Object.keys(result.vacLookup)).toHaveLength(0);
    });

    it("pairs each Steam ID with the name at the same index on the line", () => {
      const line = '# 1 "First" [U:1:111] 0:00 0 0 active # 2 "Second" [U:1:222] 0:00 0 0 active';
      const result = parseStatusInput(line);

      const entries = Object.values(result.vacLookup);
      const first = entries.find((e) => e.name === "First");
      const second = entries.find((e) => e.name === "Second");
      expect(first).toBeDefined();
      expect(second).toBeDefined();
      expect(first!.id).not.toBe(second!.id);
    });
  });
});
