import { getId } from "../utils/steamUtils.js";

export interface VacLookupEntry {
  name: string;
  id: string;
}

export interface ParseStatusResult {
  vacLookup: Record<string, VacLookupEntry>;
  isTF2: boolean;
  isCSGO: boolean;
}

/** Steam ID patterns: TF2 [U:1:xxx], CS:GO STEAM_x:y:zzz, or 17-digit Steam64 */
const STEAM_ID_PATTERN =
  /\[U:1:\d+\]|STEAM_[01]:[01]:\d+|7656\d{13}/g;
const QUOTED_NAME_PATTERN = /"([^"]*)"/g;

/**
 * Parses status command output (TF2 or CS:GO) and returns extracted Steam IDs
 * and player names. Supports [U:1:xxx] (TF2) and STEAM_0:0:xxx / STEAM_1:0:xxx (CS:GO).
 */
export function parseStatusInput(input: string): ParseStatusResult {
  const vacLookup: Record<string, VacLookupEntry> = {};
  let isTF2 = false;
  let isCSGO = false;

  const lines = input.split(/\r?\n/);

  for (const line of lines) {
    STEAM_ID_PATTERN.lastIndex = 0;
    QUOTED_NAME_PATTERN.lastIndex = 0;
    const idMatches = [...line.matchAll(STEAM_ID_PATTERN)];
    const nameMatches = [...line.matchAll(QUOTED_NAME_PATTERN)];

    idMatches.forEach((match, i) => {
      const rawId = match[0];
      const id64 = getId(rawId);
      if (id64 && id64.length > 16) {
        isTF2 = isTF2 || rawId.startsWith("[U:1:");
        isCSGO = isCSGO || rawId.startsWith("STEAM_");
        const name =
          i < nameMatches.length
            ? (nameMatches[i]?.[1]?.trim() ?? "")
            : nameMatches.length > 0
              ? (nameMatches[nameMatches.length - 1]?.[1]?.trim() ?? "")
              : "";
        vacLookup[id64] = {
          name,
          id: id64,
        };
      }
    });
  }

  return { vacLookup, isTF2, isCSGO };
}
