import { customCheatingGroups } from "../../public/src/utils/blacklists/custom/untrustedGroups.js";
import { customList } from "../../public/src/utils/blacklists/custom/tf2BotDetector.js";

describe("blacklist utilities", () => {
  it("cheatingGroups has a non-empty groups array", () => {
    expect(Array.isArray(customCheatingGroups.groups)).toBe(true);
    expect(customCheatingGroups.groups.length).toBeGreaterThan(0);
  });

  it("each cheatingGroup entry has id and description", () => {
    for (const group of customCheatingGroups.groups) {
      expect(group).toHaveProperty("id");
      expect(typeof group.id === "number" || typeof group.id === "string").toBe(
        true,
      );
      expect(group).toHaveProperty("description");
      expect(typeof group.description).toBe("string");
      expect(group.description.length).toBeGreaterThan(0);
    }
  });

  it("customList has a valid schema url and players array", () => {
    expect(customList.$schema).toContain("playerlist.schema.json");
    expect(Array.isArray(customList.players)).toBe(true);
    expect(customList.players.length).toBeGreaterThan(0);
  });

  it("each customList player has attributes and steamid", () => {
    for (const player of customList.players) {
      expect(Array.isArray(player.attributes)).toBe(true);
      expect(player.attributes.length).toBeGreaterThan(0);
      expect(typeof player.steamid).toBe("string");
      expect(player.steamid.length).toBeGreaterThan(0);
    }
  });
});

