import STATE from "../state.js";

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

  findRelationsForGraph();
};

// TODO: share a discover relation method across the whole app
const findRelationsForGraph = () => {
  // Check if STATE.graphLookup exists and is an object
  if (!STATE.graphLookup || typeof STATE.graphLookup !== "object") {
    throw new Error("STATE.graphLookup is not a valid object");
  }

  const filteredLookup = Object.entries(STATE.graphLookup).filter(
    ([key, entry]) => {
      // Ensure entry and entry.friends exist
      return entry && Array.isArray(entry.friends);
    }
  );

  for (const [id1, entry] of filteredLookup) {
    if (!entry || !Array.isArray(entry.friends)) continue;

    const friendsSet = new Set(entry.friends.map((el) => el.steamid));

    // Initialize related_steamids as an empty array
    STATE.graphLookup[id1].related_steamids = [];

    for (const [id2, user] of filteredLookup) {
      if (id1 !== id2 && friendsSet.has(id2)) {
        STATE.graphLookup[id1].related_steamids.push(id2);
      }
    }

    // Convert related_steamids array into a space-separated string
    // Remove the current steam ID if it's in related_steamids
    STATE.graphLookup[id1].related_steamids = STATE.graphLookup[
      id1
    ].related_steamids
      .filter((related_id) => related_id !== id1)
      .join(" ");
  }
};
