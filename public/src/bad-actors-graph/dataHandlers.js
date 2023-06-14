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
};

export const onXMLData = (xml, id) => {
  // console.log("xml", xml);
  let parser = new DOMParser();
  let xmlDoc = parser.parseFromString(xml, "text/xml");
  // console.log("xmlDoc", xmlDoc);
  const groups = [];
  const elems = xmlDoc.getElementsByTagName("group");
  for (let group of elems) {
    const groupData = {
      id: Number(
        group.getElementsByTagName("groupID64")[0].childNodes[0].nodeValue
      ),
      url:
        group.getElementsByTagName("groupURL")[0]?.childNodes[0]?.nodeValue ||
        "",
      name:
        group.getElementsByTagName("groupName")[0]?.childNodes[0]?.nodeValue ||
        "",
      avatarIcon:
        group.getElementsByTagName("avatarIcon")[0]?.childNodes[0]?.nodeValue ||
        "",
      summary:
        group.getElementsByTagName("summary")[0]?.childNodes[0]?.nodeValue ||
        "",
      headline:
        group.getElementsByTagName("headline")[0]?.childNodes[0]?.nodeValue ||
        "",
    };
    groups.push(groupData);
  }

  STATE.graphLookup[id].groups = groups;
  STATE.graphLookup[id].summary =
    xmlDoc.getElementsByTagName("summary")[0]?.childNodes[0]?.nodeValue || "";
};
