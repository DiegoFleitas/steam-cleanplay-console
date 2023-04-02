import STATE from "./state.js";

const PROXY = "";

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

export const playerBansRequest = async (ids) => {
  const steamids = ids.join(",");
  return sendGet(
    `${PROXY}https://api.steampowered.com/ISteamUser/GetPlayerBans/v1/?steamids=${steamids}`
  );
};

export const playerSummariesRequest = async (ids) => {
  const steamids = ids.join(",");
  return sendGet(
    `${PROXY}https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?steamids=${steamids}`
  );
};

// Many
export const playerSteamlevelRequest = (ids) => {
  let results = [];
  return new Promise((resolve, reject) => {
    for (let i = 0; i < ids.length; i++) {
      let steamid = ids[i];
      sendGet(
        `${PROXY}https://api.steampowered.com/IPlayerService/GetSteamLevel/v1/?steamid=${steamid}`
      )
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
  return sendGet(
    `${PROXY}https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?steamid=${id}&include_played_free_games=1`
  );
};

// One
export const playerFriendListRequest = async (id) => {
  return sendGet(
    `${PROXY}https://api.steampowered.com/ISteamUser/GetFriendList/v0001/?steamid=${id}&relationship=friend`
  );
};

// Many
export const getUserStatsForGameRequest = (ids) => {
  let results = [];
  return new Promise((resolve, reject) => {
    for (let i = 0; i < ids.length; i++) {
      let steamid = ids[i];
      sendGet(
        `${PROXY}https://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v1/?steamid=${steamid}&appid=440`
      )
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

export const makeXMLProfileRequest = async (id, url) => {
  // console.log(id, url);
  const playerEntry = STATE.lookup[id];
  //API only allows 1 steam id at once.
  // https://steamcommunity.com/id/salamislide
  if (!url) return;
  const endpoint = `${PROXY}${url}?xml=1`;
  return sendGet(endpoint);
};

// One
export const playerLogsRequest = async (id) => {
  return sendGet(`${PROXY}https://logs.tf/api/v1/log?player=${id}`);
};

// One
export const playerSourcebansRequest = async (id) => {
  let encoded = encodeURIComponent(
    `https://www.google.com/search?q="${id}"+"sourceban"`
  );
  return sendGet(`${PROXY}${encoded}`);
};
