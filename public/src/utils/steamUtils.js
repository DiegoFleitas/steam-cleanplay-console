import { locations } from "./steamCountries.js";
import { pazerList } from "./blacklists/pazer/tf2BotDetector.js";
import { cheatingGroups } from "./blacklists/pazer/groups.js";
import { mcd } from "./blacklists/megascatterbomb/cheaterDatabase.js";

// @see https://github.com/PazerOP/tf2_bot_detector/blob/master/staging/cfg/playerlist.official.json
const tf2BotDetectorMap = new Map(
  pazerList.players.map((player) => [player.steamid, player])
);

// @see https://github.com/PazerOP/tf2_bot_detector/blob/master/staging/cfg/untrusted_groups.official.json
const cheatingGroupsMap = new Map(
  cheatingGroups.groups.map((group) => [group.id, group])
);

// @see https://megascatterbomb.com/mcd
const cheaterDbMap = new Map(mcd.map((player) => [player.id, player]));

export const getId = (inputSteamID) => {
  try {
    const steamID = new SteamID(inputSteamID);
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
    // Check if this player is part of a cheating group
    for (const group of item.groups) {
      if (cheatingGroupsMap.has(group.id)) {
        item.cheatingGroups.add(group);
        item.blacklist.add("tf2botdetector");
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

      // Check if this friend is a cheater
      if (tf2BotDetectorMap.has(friendId)) {
        item.relatedCheaters.add(friendId);
        item.blacklist.add("tf2botdetector");
      } else if (cheaterDbMap.has(friendId)) {
        item.relatedCheaters.add(friendId);
        item.blacklist.add("mcd");
      }
    }
  }

  return dataMap;
};
