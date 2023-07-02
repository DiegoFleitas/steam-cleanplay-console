import { locations } from "./steamCountries.js";
import { pazerList } from "./blacklists/tf2BotDetector/pazerList.js";
import { cheatingGroups } from "./blacklists/tf2BotDetector/untrustedGroups.js";
import { mcdList } from "./blacklists/megascatterbomb/megaCheaterDatabase.js";
import { tacobotList } from "./blacklists/tacobot/tacobotList.js";
import { customList } from "./blacklists/custom/tf2BotDetector.js";
import { customCheatingGroups } from "./blacklists/custom/untrustedGroups.js";

// @see https://github.com/PazerOP/tf2_bot_detector/blob/master/staging/cfg/playerlist.official.json
const tf2BotDetectorMap = new Map(
  pazerList.players
    .filter((player) => player.attributes.includes("cheater"))
    .map((player) => [player.steamid, player])
);

// @see https://github.com/PazerOP/tf2_bot_detector/blob/master/staging/cfg/untrusted_groups.official.json
const cheatingGroupsMap = new Map(
  cheatingGroups.groups.map((group) => [group.id, group])
);

// @see https://megascatterbomb.com/mcd
const cheaterDbMap = new Map(mcdList.map((player) => [player.id, player]));

// @see https://api.tacobot.tf/public/tf2bd/v1
const tacobotMap = new Map(
  tacobotList.players.map((player) => [player.steamid, player])
);

// custom blacklist in tf2botdetector format
const tf2BotDetectorCustomMap = new Map(
  customList.players
    .filter((player) => player.attributes.includes("cheater"))
    .map((player) => [player.steamid, player])
);

const cheatingGroupsCustomMap = new Map(
  customCheatingGroups.groups.map((group) => [group.id, group])
);

export const getId = (inputSteamID) => {
  try {
    const steamID = new SteamID(inputSteamID);
    if (steamID && steamID?.type === 4) {
      // ignore server ids
      // console.log("Invalid Steam ID: ", inputSteamID);
      return null;
    }
    const steam64identifier = steamID.getSteamID64();
    // console.log(inputSteamID, steam64identifier);
    return steam64identifier;
  } catch (error) {
    // console.log(`Invalid Steam ID: ${inputSteamID}`, error);
    return null;
  }
};

export const getLocation = (countryCode, stateCode, cityId) => {
  let locationParts = [];

  if (locations?.[countryCode]) {
    locationParts.push(locations?.[countryCode]?.countryName || "");

    if (locations?.[countryCode]?.states?.[stateCode]) {
      locationParts.push(
        locations?.[countryCode]?.states?.[stateCode]?.stateName || ""
      );

      if (locations?.[countryCode]?.states?.[stateCode]?.cities?.[cityId]) {
        locationParts.push(
          locations?.[countryCode]?.states?.[stateCode]?.cities?.[cityId]
            .cityName || ""
        );
      }
    }
  }

  // console.log("getLocation", [countryCode, stateCode, cityId], locationParts);
  return locationParts.filter((part) => part).join(", ");
};

export const discoverFriendships = (data) => {
  // init sets
  const dataWithSets = data.map((item) => ({
    ...item,
    relatedCheaters: new Set(),
    relatedPlayers: new Set(),
    cheatingGroups: new Set(),
    blacklist: new Set(),
  }));
  // map all players by their id
  const dataMap = new Map(dataWithSets.map((item) => [item.id, item]));

  for (const [_, item] of dataMap) {
    if (!item?.groups?.length) continue; // skip if no groups
    // Check if this player is part of a cheating group
    for (const group of item.groups) {
      if (cheatingGroupsMap.has(group.id)) {
        group.description =
          group.description || cheatingGroupsMap.get(group.id).description;
        item.cheatingGroups.add(group);
        item.blacklist.add("tf2botdetector");
      } else if (cheatingGroupsCustomMap.has(group.id)) {
        group.description =
          group.description ||
          cheatingGroupsCustomMap.get(group.id).description;
        item.cheatingGroups.add(group);
        item.blacklist.add("custom");
      }
    }

    if (!item.friends) continue; // skip if no friends
    for (const friend of item.friends) {
      const friendId = friend.steamid;
      const friendItem = dataMap.get(friendId);
      if (friendItem) {
        item.relatedPlayers.add(friendId);
        friendItem.relatedPlayers.add(item.id);
      }

      // Check if this friend is a known cheater
      if (tf2BotDetectorMap.has(friendId)) {
        item.relatedCheaters.add(friendId);
        item.blacklist.add("tf2botdetector");
      }
      if (cheaterDbMap.has(friendId)) {
        item.relatedCheaters.add(friendId);
        item.blacklist.add("mcd");
      }
      if (tacobotMap.has(friendId)) {
        item.relatedCheaters.add(friendId);
        item.blacklist.add("tacobot");
      }
      if (tf2BotDetectorCustomMap.has(friendId)) {
        item.relatedCheaters.add(friendId);
        item.blacklist.add("custom");
      }
    }
  }

  return dataMap;
};
