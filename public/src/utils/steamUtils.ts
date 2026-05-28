import SteamID from 'steamid';

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

let tf2BotDetectorMap = new Map<PlayerId, unknown>();
let cheatingGroupsMap = new Map<number | string, Group>();
let cheaterDbMap = new Map<PlayerId, unknown>();
let tacobotMap = new Map<PlayerId, unknown>();
let locationsData: Record<string, any> = {};

const tf2BotDetectorCustomMap = new Map<PlayerId, unknown>();
const cheatingGroupsCustomMap = new Map<number | string, Group>();

let blacklistInitPromise: Promise<void> | null = null;

async function ensureBlacklists(): Promise<void> {
  if (blacklistInitPromise) return blacklistInitPromise;

  blacklistInitPromise = (async () => {
    const [mcdModule, tacobotModule, pazerModule, cheatingGroupsModule, locationsModule] =
      await Promise.all([
        import('./blacklists/megascatterbomb/megaCheaterDatabase.js'),
        import('./blacklists/tacobot/tacobotList.js'),
        import('./blacklists/tf2BotDetector/pazerList.js'),
        import('./blacklists/tf2BotDetector/untrustedGroups.js'),
        import('./steamCountries.js'),
      ]);

    // @see https://github.com/PazerOP/tf2_bot_detector/blob/master/staging/cfg/playerlist.official.json
    tf2BotDetectorMap = new Map(
      pazerModule.pazerList.players
        .filter((player: any) => player.attributes.includes('cheater'))
        .map((player: any) => [player.steamid as PlayerId, player]),
    );

    // @see https://github.com/PazerOP/tf2_bot_detector/blob/master/staging/cfg/untrusted_groups.official.json
    cheatingGroupsMap = new Map(
      cheatingGroupsModule.cheatingGroups.groups.map((group: any) => [group.id, group]),
    );

    // @see https://megascatterbomb.com/mcd
    cheaterDbMap = new Map(mcdModule.mcdList.map((player: any) => [player.id as PlayerId, player]));

    // @see https://api.tacobot.tf/public/tf2bd/v1
    tacobotMap = new Map(
      tacobotModule.tacobotList.players.map((player: any) => [player.steamid as PlayerId, player]),
    );

    locationsData = locationsModule.locations;
  })();

  return blacklistInitPromise;
}

export const getId = (inputSteamID: string): string | null => {
  try {
    const steamID = new SteamID(inputSteamID);
    if (steamID && (steamID as any)?.type === 4) {
      return null;
    }
    const steam64identifier = steamID.getSteamID64();
    return steam64identifier;
  } catch (error) {
    return null;
  }
};

export const getLocation = async (
  countryCode?: string,
  stateCode?: string,
  cityId?: number,
): Promise<string> => {
  await ensureBlacklists();

  const locationParts: string[] = [];

  if (countryCode && locationsData?.[countryCode]) {
    const country = locationsData[countryCode];
    locationParts.push(country?.countryName || '');

    if (stateCode && country?.states?.[stateCode]) {
      const state = country.states[stateCode];
      locationParts.push(state?.stateName || '');

      if (cityId !== undefined && state?.cities?.[cityId]) {
        locationParts.push(state.cities[cityId].cityName || '');
      }
    }
  }

  return locationParts.filter((part) => part).join(', ');
};

export const discoverFriendships = async (data: Player[]): Promise<Map<PlayerId, Player>> => {
  await ensureBlacklists();

  const dataWithSets: Player[] = data.map((item) => ({
    ...item,
    relatedCheaters: new Set<PlayerId>(),
    relatedPlayers: new Set<PlayerId>(),
    cheatingGroups: new Set<Group>(),
    blacklist: new Set<string>(),
  }));

  const dataMap = new Map<PlayerId, Player>(dataWithSets.map((item) => [item.id, item]));

  for (const [, item] of dataMap) {
    if (item?.groups?.length) {
      for (const group of item.groups) {
        if (cheatingGroupsMap.has(group.id)) {
          const source = cheatingGroupsMap.get(group.id)!;
          group.description = group.description || source.description;
          item.cheatingGroups!.add(group);
          item.blacklist!.add('tf2botdetector');
        } else if (cheatingGroupsCustomMap.has(group.id)) {
          const source = cheatingGroupsCustomMap.get(group.id)!;
          group.description = group.description || source.description;
          item.cheatingGroups!.add(group);
          item.blacklist!.add('custom');
        }
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
        item.blacklist!.add('tf2botdetector');
      }
      if (cheaterDbMap.has(friendId)) {
        item.relatedCheaters!.add(friendId);
        item.blacklist!.add('mcd');
      }
      if (tacobotMap.has(friendId)) {
        item.relatedCheaters!.add(friendId);
        item.blacklist!.add('tacobot');
      }
      if (tf2BotDetectorCustomMap.has(friendId)) {
        item.relatedCheaters!.add(friendId);
        item.blacklist!.add('custom');
      }
    }
  }

  return dataMap;
};
