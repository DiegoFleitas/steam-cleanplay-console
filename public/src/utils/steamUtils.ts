import SteamID from "steamid";
import { locations } from "./steamCountries.js";
import { pazerList } from "./blacklists/tf2BotDetector/pazerList.js";
import { cheatingGroups } from "./blacklists/tf2BotDetector/untrustedGroups.js";
import { mcdList } from "./blacklists/megascatterbomb/megaCheaterDatabase.js";
import { tacobotList } from "./blacklists/tacobot/tacobotList.js";

type PlayerId = string;

type Group = {
  id: number | string;
  description?: string;
};

type Player = {
  id: PlayerId;
  groups?: Group[];
  friends?: { steamid: PlayerId }[];
  relatedCheaters?: Set<PlayerId>;
  relatedPlayers?: Set<PlayerId>;
  cheatingGroups?: Set<Group>;
  blacklist?: Set<string>;
  [key: string]: unknown;
};

// @see https://github.com/PazerOP/tf2_bot_detector/blob/master/staging/cfg/playerlist.official.json
const tf2BotDetectorMap = new Map<PlayerId, unknown>(
  pazerList.players
    .filter((player: any) => player.attributes.includes("cheater"))
    .map((player: any) => [player.steamid as PlayerId, player])
);

// @see https://github.com/PazerOP/tf2_bot_detector/blob/master/staging/cfg/untrusted_groups.official.json
const cheatingGroupsMap = new Map<number | string, Group>(
  cheatingGroups.groups.map((group: any) => [group.id, group])
);

// @see https://megascatterbomb.com/mcd
const cheaterDbMap = new Map<PlayerId, unknown>(
  mcdList.map((player: any) => [player.id as PlayerId, player])
);

// @see https://api.tacobot.tf/public/tf2bd/v1
const tacobotMap = new Map<PlayerId, unknown>(
  tacobotList.players.map((player: any) => [player.steamid as PlayerId, player])
);

// Custom blacklists are optional and user-provided.
// By default, maps are empty so the app and tests do not
// depend on large, ignored files under public/src/utils/blacklists/custom.
const tf2BotDetectorCustomMap = new Map<PlayerId, unknown>();
const cheatingGroupsCustomMap = new Map<number | string, Group>();

export const getId = (inputSteamID: string): string | null => {
  try {
    const steamID = new SteamID(inputSteamID);
    if (steamID && (steamID as any)?.type === 4) {
      // ignore server ids
      return null;
    }
    const steam64identifier = steamID.getSteamID64();
    return steam64identifier;
  } catch (error) {
    return null;
  }
};

export const getLocation = (
  countryCode?: string,
  stateCode?: string,
  cityId?: number
): string => {
  const locationParts: string[] = [];

  if (countryCode && locations?.[countryCode]) {
    locationParts.push(locations?.[countryCode]?.countryName || "");

    if (stateCode && locations?.[countryCode]?.states?.[stateCode]) {
      locationParts.push(
        locations?.[countryCode]?.states?.[stateCode]?.stateName || ""
      );

      if (
        cityId !== undefined &&
        locations?.[countryCode]?.states?.[stateCode]?.cities?.[cityId]
      ) {
        locationParts.push(
          locations?.[countryCode]?.states?.[stateCode]?.cities?.[cityId]
            .cityName || ""
        );
      }
    }
  }

  return locationParts.filter((part) => part).join(", ");
};

export const discoverFriendships = (data: Player[]): Map<PlayerId, Player> => {
  const dataWithSets: Player[] = data.map((item) => ({
    ...item,
    relatedCheaters: new Set<PlayerId>(),
    relatedPlayers: new Set<PlayerId>(),
    cheatingGroups: new Set<Group>(),
    blacklist: new Set<string>(),
  }));

  const dataMap = new Map<PlayerId, Player>(
    dataWithSets.map((item) => [item.id, item])
  );

  for (const [, item] of dataMap) {
    if (!item?.groups?.length) continue;

    for (const group of item.groups) {
      if (cheatingGroupsMap.has(group.id)) {
        const source = cheatingGroupsMap.get(group.id)!;
        group.description = group.description || source.description;
        item.cheatingGroups!.add(group);
        item.blacklist!.add("tf2botdetector");
      } else if (cheatingGroupsCustomMap.has(group.id)) {
        const source = cheatingGroupsCustomMap.get(group.id)!;
        group.description = group.description || source.description;
        item.cheatingGroups!.add(group);
        item.blacklist!.add("custom");
      }
    }

    if (!item.friends) continue;
    for (const friend of item.friends) {
      const friendId = friend.steamid;
      const friendItem = dataMap.get(friendId);
      if (friendItem) {
        item.relatedPlayers!.add(friendId);
        friendItem.relatedPlayers!.add(item.id);
      }

      if (tf2BotDetectorMap.has(friendId)) {
        item.relatedCheaters!.add(friendId);
        item.blacklist!.add("tf2botdetector");
      }
      if (cheaterDbMap.has(friendId)) {
        item.relatedCheaters!.add(friendId);
        item.blacklist!.add("mcd");
      }
      if (tacobotMap.has(friendId)) {
        item.relatedCheaters!.add(friendId);
        item.blacklist!.add("tacobot");
      }
      if (tf2BotDetectorCustomMap.has(friendId)) {
        item.relatedCheaters!.add(friendId);
        item.blacklist!.add("custom");
      }
    }
  }

  return dataMap;
};

