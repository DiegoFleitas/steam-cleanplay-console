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

export const playerGroupsRequest = async (id) => {
  return sendGet(
    `${PROXY}https://sapihub.sheenweb.co.uk/api_player_getusergrouplist.php?&key=${SAPIHUB_KEY}&hour=24&steamid64=${id}`
  );
};

export const playerSummariesRequest = async (ids) => {
  const steamids = ids.join(",");
  return sendGet(
    `${PROXY}https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?steamids=${steamids}`
  );
};

export const playerBansRequest = async (ids) => {
  const steamids = ids.join(",");
  return sendGet(
    `${PROXY}https://api.steampowered.com/ISteamUser/GetPlayerBans/v1/?steamids=${steamids}`
  );
};

export const playerFriendListRequest = async (id) => {
  return sendGet(
    `${PROXY}https://api.steampowered.com/ISteamUser/GetFriendList/v0001/?steamid=${id}&relationship=friend`
  );
};
