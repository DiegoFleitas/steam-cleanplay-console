import STATE from "../state.js";
import { discoverFriendships } from "../utils/steamUtils.js";

export const onGroupsData = (data, steamid) => {
  // console.log("onGroupsData", data);
  const playerEntry = STATE.graphLookup[steamid];
  playerEntry.groups = "";
  if (data && data.response && data.response.groups) {
    data.response.groups.forEach((groupId) => {
      playerEntry.groups += " " + groupId;
    });
  }
};

export const onSummaryData = (players) => {
  // console.log(data);
  players.forEach((player) => {
    const playerEntry = STATE.graphLookup[player.steamid];
    playerEntry.img = player.avatarmedium;
    // playerEntry["summary"] = player;
  });
};

export const onBansData = (players) => {
  players.forEach((player) => {
    const playerEntry = STATE.graphLookup[player.SteamId];
    playerEntry.bans = false;
    if (player.CommunityBanned || player.VACBanned) {
      playerEntry.bans = true;
    }
  });
};

export const onSteamFriendListData = (data, id) => {
  // console.log("onSteamFriendListData", data);
  let friends = data?.friendslist?.friends || [];
  STATE.graphLookup[id].friends = friends;
  // console.log(id, STATE.graphLookup[id]);

  const graphData = Object.values(STATE.graphLookup);

  const friendships = discoverFriendships(graphData);

  // Set the related players for each player
  for (const [_, item] of friendships) {
    STATE.graphLookup[item.id].relatedPlayers = item.relatedPlayers;
    STATE.graphLookup[item.id].relatedSteamIds = Array.from(
      item.relatedPlayers
    ).join(" ");
  }
};
