import { getCache, setCache } from './localCache.js';

const PROXY = '';

const sendGet = async (url: string): Promise<unknown> => {
  try {
    const response = await fetch(`/api/proxy/${encodeURIComponent(url)}`);
    const data = await response.json();
    return data;
  } catch (err) {
    console.log(err);
    return undefined;
  }
};

export const playerSummariesRequest = async (ids: string[]): Promise<unknown[]> => {
  const dummyResponse = { response: { players: [] as unknown[] } };
  let steamIds: string[] = [];
  const cachedResults: unknown[] = [];
  const cacheLabel = 'ISTEAMUSER/GETPLAYERSUMMARIES';
  for (let index = 0; index < ids.length; index++) {
    const cachedResult = await getCache(ids[index], cacheLabel);
    if (cachedResult) {
      cachedResults.push(cachedResult);
    }
  }
  if (cachedResults.length) {
    const cachedIds = cachedResults.map((result) => (result as { steamid: string }).steamid);
    steamIds = ids.filter((id) => !cachedIds.includes(id));
  } else {
    steamIds = ids;
  }

  if (steamIds.length) {
    const url = `${PROXY}https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?steamids=${steamIds.join(',')}`;
    const result = (await sendGet(url)) as { response: { players: unknown[] } };
    if (result?.response?.players) {
      for (let i = 0; i < result.response.players.length; i++) {
        const player = result.response.players[i] as { steamid: string };
        await setCache(player.steamid, player, cacheLabel);
      }
      if (cachedResults.length) {
        return dummyResponse.response.players.concat(cachedResults, result.response.players);
      }
      return dummyResponse.response.players.concat(result.response.players);
    }
  }
  return dummyResponse.response.players.concat(cachedResults);
};

export const playerBansRequest = async (ids: string[]): Promise<unknown[]> => {
  const dummyResponse = { players: [] as unknown[] };
  let steamIds: string[] = [];
  const cachedResults: unknown[] = [];
  const cacheLabel = 'ISTEAMUSER/GETPLAYERBANS';
  for (let index = 0; index < ids.length; index++) {
    const cachedResult = await getCache(ids[index], cacheLabel);
    if (cachedResult) {
      cachedResults.push(cachedResult);
    }
  }
  if (cachedResults.length) {
    const cachedIds = cachedResults.map((result) => (result as { SteamId: string }).SteamId);
    steamIds = ids.filter((id) => !cachedIds.includes(id));
  } else {
    steamIds = ids;
  }
  if (steamIds.length) {
    const url = `${PROXY}https://api.steampowered.com/ISteamUser/GetPlayerBans/v1/?steamids=${steamIds.join(',')}`;
    const result = (await sendGet(url)) as { players: unknown[] };
    if (result?.players) {
      for (let i = 0; i < result.players.length; i++) {
        const player = result.players[i] as { SteamId: string };
        await setCache(player.SteamId, player, cacheLabel);
      }
      if (cachedResults.length) {
        return dummyResponse.players.concat(cachedResults, result.players);
      }
      return dummyResponse.players.concat(result.players);
    }
  }
  return dummyResponse.players.concat(cachedResults);
};

export const playerFriendListRequest = async (id: string): Promise<unknown> => {
  const cacheLabel = 'ISTEAMUSER/GETFRIENDLIST';
  const cached = await getCache(id, cacheLabel);
  if (cached) return cached;
  const url = `${PROXY}https://api.steampowered.com/ISteamUser/GetFriendList/v0001/?steamid=${id}&relationship=friend`;
  const result = await sendGet(url);
  if (result) await setCache(id, result, cacheLabel);
  return result;
};

export const playerSteamlevelRequest = async (ids: string[]): Promise<unknown[]> => {
  const cacheLabel = 'IPLAYERSERVICE/GETSTEAMLEVEL';
  const results: unknown[] = [];
  const uncachedIds: string[] = [];
  for (let i = 0; i < ids.length; i++) {
    const cached = await getCache(ids[i], cacheLabel);
    if (cached) {
      results.push(cached);
    } else {
      uncachedIds.push(ids[i]);
    }
  }
  if (uncachedIds.length) {
    const fetched = await Promise.all(
      uncachedIds.map(async (steamid) => {
        const url = `${PROXY}https://api.steampowered.com/IPlayerService/GetSteamLevel/v1/?steamid=${steamid}`;
        const result = (await sendGet(url)) as Record<string, unknown> | undefined;
        const item = { steamid, ...(result ?? {}) } as {
          steamid: string;
          response?: { player_level?: number };
        };
        if (result) await setCache(steamid, item, cacheLabel);
        return item;
      }),
    );
    results.push(...fetched);
  }
  return results;
};

export const playerOwnedGamesRequest = async (id: string): Promise<unknown> => {
  const cacheLabel = 'IPLAYERSERVICE/GETOWNEDGAMES';
  const cached = await getCache(id, cacheLabel);
  if (cached) return cached;
  const url = `${PROXY}https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?steamid=${id}&include_played_free_games=1`;
  const result = await sendGet(url);
  if (result) await setCache(id, result, cacheLabel);
  return result;
};

export const getUserStatsForGameRequest = (ids: string[]): Promise<unknown[]> => {
  const results: unknown[] = [];
  return new Promise((resolve, reject) => {
    for (let i = 0; i < ids.length; i++) {
      const steamid = ids[i];
      const url = `${PROXY}https://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v1/?steamid=${steamid}&appid=440`;
      sendGet(url)
        .then((result) => {
          const item = result ?? {};
          (item as { steamid: string }).steamid = steamid;
          results.push(item);
          if (i === ids.length - 1) {
            resolve(results);
          }
        })
        .catch((error) => reject(error));
    }
  });
};

export const playerXMLRequest = async (url: string): Promise<unknown> => {
  if (!url) return;
  const cacheLabel = 'STEAMCOMMUNITY/PROFILEXML';
  const cached = await getCache(url, cacheLabel);
  if (cached) return cached;
  const result = await sendGet(`${PROXY}${url}`);
  if (result) await setCache(url, result, cacheLabel);
  return result;
};

export const playerLogsRequest = async (id: string): Promise<unknown> => {
  const url = `${PROXY}https://logs.tf/api/v1/log?player=${id}`;
  return sendGet(url);
};

export const playerSourcebansRequest = async (id: string): Promise<unknown> => {
  const url = `https://www.google.com/search?q="${id}"+"sourceban"`;
  return sendGet(`${PROXY}${url}`);
};
