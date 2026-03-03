import STATE from "../state.js";

export const onGroupsData = (data: unknown, steamid: string): void => {
  const playerEntry = STATE.graphLookup[steamid] as Record<string, unknown>;
  if (!playerEntry) return;
  playerEntry.groups = "";
  const d = data as { response?: { groups?: string[] } } | null;
  if (d?.response?.groups) {
    d.response.groups.forEach((groupId) => {
      (playerEntry.groups as string) += " " + groupId;
    });
  }
};

export const onSummaryData = (players: unknown[]): void => {
  (players as { steamid: string; avatarmedium?: string }[]).forEach((player) => {
    const playerEntry = STATE.graphLookup[player.steamid] as Record<string, unknown>;
    if (playerEntry) playerEntry.img = player.avatarmedium;
  });
};

export const onBansData = (players: unknown[]): void => {
  (players as { SteamId: string; CommunityBanned?: boolean; VACBanned?: boolean }[]).forEach((player) => {
    const playerEntry = STATE.graphLookup[player.SteamId] as Record<string, unknown>;
    if (playerEntry) {
      playerEntry.bans = !!(player.CommunityBanned || player.VACBanned);
    }
  });
};

export const onSteamFriendListData = (data: unknown, id: string): void => {
  const d = data as { friendslist?: { friends?: unknown[] } } | null;
  const friends = d?.friendslist?.friends ?? [];
  const playerEntry = STATE.graphLookup[id] as Record<string, unknown>;
  if (playerEntry) playerEntry.friends = friends;
};

export const onXMLData = (xml: string, id: string): void => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xml, "text/xml");
  const groups: { id: number; url: string; name: string }[] = [];
  const elems = xmlDoc.getElementsByTagName("group");
  for (let i = 0; i < elems.length; i++) {
    const group = elems[i];
    const groupData = {
      id: Number(group.getElementsByTagName("groupID64")[0]?.childNodes[0]?.nodeValue),
      url: group.getElementsByTagName("groupURL")[0]?.childNodes[0]?.nodeValue ?? "",
      name: group.getElementsByTagName("groupName")[0]?.childNodes[0]?.nodeValue ?? "",
    };
    groups.push(groupData);
  }
  const playerEntry = STATE.graphLookup[id] as Record<string, unknown>;
  if (playerEntry) {
    playerEntry.groups = groups;
    playerEntry.summary =
      xmlDoc.getElementsByTagName("summary")[0]?.childNodes[0]?.nodeValue ?? "";
  }
};
