import STATE from "./state.js";

export const onGroupsData = (data, steamid) => {
  console.log("onGroupsData", data);
  const playerEntry = STATE.lookup[steamid];
  playerEntry.groups = "";
  if (data && data.response && data.response.groups) {
    data.response.groups.forEach((groupId) => {
      playerEntry.groups += " " + groupId;
    });
  }
};

export const onSummaryData = (data) => {
  // console.log(data);
  data.players.forEach((player) => {
    const playerEntry = STATE.lookup[player.steamid];
    playerEntry.img = player.avatarmedium;
    // playerEntry["summary"] = player;
  });
};

export const onBansData = (data) => {
  data.players.forEach((player) => {
    const playerEntry = STATE.lookup[player.SteamId];
    playerEntry.bans = false;
    if (player.CommunityBanned || player.VACBanned) {
      playerEntry.bans = true;
    }
  });
};

export const onSteamFriendListData = (data, id) => {
  console.log("onSteamFriendListData", data);
  let friends = data?.friendslist?.friends || [];
  STATE.lookup[id].friends = friends;
  console.log(id, STATE.lookup[id]);

  findRelations();
};

const findRelations = () => {
  const filteredLookup = Object.entries(STATE.lookup).filter(([key, entry]) => {
    return entry && entry.friends;
  });
  console.log("filteredLookup", filteredLookup);
  for (const [id1, entry] of filteredLookup) {
    if (!entry || !entry.friends) continue;
    const friendsArray = entry.friends.map((el) => {
      return el.steamid;
    });
    // TODO: ignore the one we are searching for
    for (const [id2, user] of filteredLookup) {
      console.log("findRelations entry user", entry, user);
      if (id1 !== id2 && friendsArray.includes(id2)) {
        !STATE.lookup[id1].related_steamids
          ? (STATE.lookup[id1].related_steamids = `${id2}`)
          : (STATE.lookup[id1].related_steamids += ` ${id2}`);
      }
    }
  }
};
