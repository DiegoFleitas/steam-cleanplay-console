import { getCache, setCache } from "./localCache.js";

const PROXY = "";
const SAPIHUB_KEY = "";

const sendGet = async (url) => {
  try {
    const response = await fetch(`/api/proxy/${url}`);
    const data = await response.json();
    return data;
  } catch (err) {
    // Handle Error Here
    console.log(err);
  }
};

export const playerSummariesRequest = async (ids) => {
  const dummyResponse = { response: { players: [] } };
  let steamIds = "";
  const cachedResults = [];
  const cacheLabel = "ISTEAMUSER/GETPLAYERSUMMARIES";
  for (let index = 0; index < ids.length; index++) {
    let cachedResult = await getCache(ids[index], cacheLabel);
    if (cachedResult) {
      cachedResults.push(cachedResult);
    }
  }
  if (cachedResults.length) {
    const cachedIds = cachedResults.map((result) => result.steamid);
    steamIds = ids.filter((id) => !cachedIds.includes(id));
  } else {
    steamIds = ids;
  }

  if (steamIds.length) {
    const url = `${PROXY}https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?steamids=${steamIds.join(
      ","
    )}`;
    // pending request
    const result = await sendGet(url);
    for (let i = 0; i < result.response.players.length; i++) {
      let player = result.response.players[i];
      await setCache(player.steamid, player, cacheLabel);
    }
    if (cachedResults.length) {
      return dummyResponse.response.players.concat(
        cachedResults,
        result.response.players
      );
    }
    return dummyResponse.response.players.concat(result.response.players);
  } else {
    // fully cached
    return dummyResponse.response.players.concat(cachedResults);
  }
};

export const playerBansRequest = async (ids) => {
  const dummyResponse = { players: [] };
  let steamIds = "";
  const cachedResults = [];
  const cacheLabel = "ISTEAMUSER/GETPLAYERBANS";
  for (let index = 0; index < ids.length; index++) {
    let cachedResult = await getCache(ids[index], cacheLabel);
    if (cachedResult) {
      cachedResults.push(cachedResult);
    }
  }
  if (cachedResults.length) {
    const cachedIds = cachedResults.map((result) => result.SteamId);
    steamIds = ids.filter((id) => !cachedIds.includes(id));
  } else {
    steamIds = ids;
  }
  if (steamIds.length) {
    const url = `${PROXY}https://api.steampowered.com/ISteamUser/GetPlayerBans/v1/?steamids=${steamIds.join(
      ","
    )}`;
    // pending request
    const result = await sendGet(url);
    for (let i = 0; i < result.players.length; i++) {
      let player = result.players[i];
      await setCache(player.SteamId, player, cacheLabel);
    }
    if (cachedResults) {
      return dummyResponse.players.concat(cachedResults, result.players);
    }
    return dummyResponse.players.concat(result.players);
  } else {
    // fully cached
    return dummyResponse.players.concat(cachedResults);
  }
};

export const playerFriendListRequest = async (id) => {
  const url = `${PROXY}https://api.steampowered.com/ISteamUser/GetFriendList/v0001/?steamid=${id}&relationship=friend`;
  return sendGet(url);
};

export const playerSteamlevelRequest = (ids) => {
  let results = [];
  return new Promise((resolve, reject) => {
    for (let i = 0; i < ids.length; i++) {
      let steamid = ids[i];
      let url = `${PROXY}https://api.steampowered.com/IPlayerService/GetSteamLevel/v1/?steamid=${steamid}`;
      sendGet(url)
        .then((result) => {
          if (!result) result = [];
          result.steamid = steamid;
          results.push(result);
          if (i === ids.length - 1) {
            resolve(results);
          }
        })
        .catch((error) => reject(error));
    }
  });
};

export const playerOwnedGamesRequest = async (id) => {
  const url = `${PROXY}https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?steamid=${id}&include_played_free_games=1`;
  return sendGet(url);
};

export const getUserStatsForGameRequest = (ids) => {
  let results = [];
  return new Promise((resolve, reject) => {
    for (let i = 0; i < ids.length; i++) {
      let steamid = ids[i];
      let url = `${PROXY}https://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v1/?steamid=${steamid}&appid=440`;
      sendGet(url)
        .then((result) => {
          if (!result) result = [];
          result.steamid = steamid;
          results.push(result);
          if (i === ids.length - 1) {
            resolve(results);
          }
        })
        .catch((error) => reject(error));
    }
  });
};

export const playerXMLRequest = async (url) => {
  // ex: https://steamcommunity.com/id/salamislide?xml=1
  if (!url) return;
  return sendGet(`${PROXY}${url}`);
};

export const playerLogsRequest = async (id) => {
  const url = `${PROXY}https://logs.tf/api/v1/log?player=${id}`;
  return sendGet(url);
};

export const playerSourcebansRequest = async (id) => {
  const url = `https://www.google.com/search?q="${id}"+"sourceban"`;
  let encoded = encodeURIComponent(url);
  return sendGet(`${PROXY}${encoded}`);
};
