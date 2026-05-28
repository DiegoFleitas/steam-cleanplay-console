import STATE from '../state.js';
import { getLocation } from '../utils/steamUtils.js';

declare const moment: (date?: Date) => { fromNow: () => string };

const TF2_APP_ID = 440;
const CSGO_APP_ID = 730;

const createSpan = (content: string): HTMLSpanElement => {
  const span = document.createElement('span');
  span.textContent = content;
  return span;
};

const createAnchor = (
  content: string,
  href: string,
  target = '',
  style = '',
): HTMLAnchorElement => {
  const anchor = document.createElement('a');
  anchor.textContent = content;
  anchor.href = href;
  anchor.target = target;
  anchor.style.cssText = style;
  return anchor;
};

const createImage = (src: string): HTMLImageElement => {
  const img = document.createElement('img');
  img.style.cssText = 'border-radius: 5px;';
  img.src = src;
  return img;
};

const createDivWithChildren = (...children: Node[]): HTMLDivElement => {
  const div = document.createElement('div');
  children.forEach((child) => div.appendChild(child));
  return div;
};

const createSpanWithChildren = (...children: Node[]): HTMLSpanElement => {
  const span = document.createElement('span');
  children.forEach((child) => span.appendChild(child));
  return span;
};

const createDiv = (content: string, style = ''): HTMLDivElement => {
  const div = document.createElement('div');
  div.textContent = content;
  div.style.cssText = style;
  return div;
};

export const onBansData = (players: unknown[]): void => {
  (
    players as {
      SteamId: string;
      NumberOfVACBans?: number;
      NumberOfGameBans?: number;
      DaysSinceLastBan?: number;
    }[]
  ).forEach((player) => {
    const playerEntry = STATE.vacLookup[player.SteamId];
    if (!playerEntry) return;
    const divElements: HTMLDivElement[] = [];
    if (player.NumberOfVACBans || player.NumberOfGameBans) {
      if (player.NumberOfGameBans) {
        divElements.push(
          createDiv(`${player.NumberOfGameBans} Game bans`, 'color: #800000;font-size: x-small;'),
        );
      }
      if (player.NumberOfVACBans) {
        divElements.push(
          createDiv(`${player.NumberOfVACBans} VAC bans`, 'color: #800000;font-size: x-small;'),
        );
      }
      divElements.push(
        createDiv(
          `(${player.DaysSinceLastBan ?? 0} days ago)`,
          'color: #800000;font-size: x-small;',
        ),
      );
    }
    const span = createSpanWithChildren(...divElements);
    const anchor =
      (playerEntry['link_html'] as HTMLAnchorElement) ||
      createAnchor(
        String(playerEntry.name),
        `https://steamcommunity.com/profiles/${player.SteamId}`,
        '_blank',
      );
    playerEntry['link_html'] = anchor;
    playerEntry['link'] = anchor.textContent;
    playerEntry['vac_html'] = span;
    playerEntry['vac'] = span.textContent;
    playerEntry['bans'] = player;
  });
};

export const onSummaryData = (players: unknown[]): void => {
  (
    players as {
      steamid: string;
      communityvisibilitystate?: number;
      personaname?: string;
      profileurl?: string;
      timecreated?: number;
      avatarmedium?: string;
      loccountrycode?: string;
      locstatecode?: string;
      loccityid?: number;
    }[]
  ).forEach((player) => {
    const playerEntry = STATE.vacLookup[player.steamid];
    if (!playerEntry) return;
    const span = createSpan(player.communityvisibilitystate !== 3 ? 'hidden' : 'public');
    playerEntry['profile_html'] = span;
    playerEntry['profile'] = span.textContent;
    playerEntry['link_html'] =
      (playerEntry['link_html'] as HTMLAnchorElement) ||
      createAnchor(player.personaname ?? '', player.profileurl ?? '', '_blank');
    playerEntry['personaname'] = player.personaname;
    playerEntry['personaname_html'] = createAnchor(
      player.personaname ?? '',
      player.profileurl ?? '',
      '_blank',
    );
    playerEntry['profileurl'] = player.profileurl;
    playerEntry['visibility'] = player.communityvisibilitystate;
    playerEntry['avatar'] = player.avatarmedium;
    playerEntry['avatar_html'] = createImage(player.avatarmedium ?? '');
    playerEntry['timecreated_raw'] = player.timecreated;
    const created = new Date((player.timecreated ?? 0) * 1000);
    playerEntry['timecreated'] = player.timecreated ? moment(created).fromNow() : '';
    playerEntry['location'] = getLocation(
      player?.loccountrycode,
      player?.locstatecode,
      player?.loccityid,
    );
    playerEntry['summary'] = player;
  });
};

export const onSteamLevelData = (data: unknown[]): void => {
  for (let i = 0; i < data.length; i++) {
    const item = data[i] as { steamid: string; response?: { player_level?: number } };
    const id = item.steamid;
    const playerEntry = STATE.vacLookup[id];
    if (playerEntry) {
      playerEntry['level'] = item?.response?.player_level ?? '';
    }
  }
};

export const onOwnedGamesData = (data: unknown, id: string): void => {
  const playerEntry = STATE.vacLookup[id];
  if (!playerEntry) return;
  playerEntry['playtime_raw'] = '';
  playerEntry['playtime'] = '';
  playerEntry['os'] = '';
  const d = data as {
    games?: {
      appid: number;
      playtime_forever: number;
      playtime_linux_forever?: number;
      playtime_windows_forever?: number;
      playtime_mac_forever?: number;
    }[];
  } | null;
  if (d?.games) {
    const games = d.games.filter(
      (g) => (STATE.isTF2 && g.appid === TF2_APP_ID) || (STATE.isCSGO && g.appid === CSGO_APP_ID),
    );
    for (let i = 0; i < games.length; i++) {
      const game = games[i];
      const hrs = Math.floor(game.playtime_forever / 60);
      playerEntry['playtime_raw'] = game.playtime_forever;
      playerEntry['playtime'] = hrs;
      let os = '';
      if (game.playtime_linux_forever) os += '🐧';
      if (game.playtime_windows_forever) os += '🪟';
      if (game.playtime_mac_forever) os += '🍎';
      playerEntry['os'] = os;
    }
  }
};

export const onSteamFriendListData = (data: unknown, id: string): void => {
  const playerEntry = STATE.vacLookup[id];
  if (!playerEntry) return;
  let friends: unknown[] = [];
  let friendsArray: string[] = [];
  const d = data as { friendslist?: { friends?: { steamid: string }[] } } | null;
  if (d?.friendslist?.friends) {
    friendsArray = d.friendslist.friends.map((el) => el.steamid);
    friends = d.friendslist.friends;
  }
  const span = createSpan(friendsArray.join());
  playerEntry['friends'] = friends;
  playerEntry['friends_html'] = span;
};

export const onSteamUserStatsData = (data: unknown[]): void => {
  for (let i = 0; i < data.length; i++) {
    const item = data[i] as { steamid: string; playerstats?: unknown };
    const id = item.steamid;
    const playerEntry = STATE.vacLookup[id];
    if (playerEntry) playerEntry['stats'] = item.playerstats;
  }
};

export const onXMLData = (xml: string, id: string): void => {
  const playerEntry = STATE.vacLookup[id];
  if (!playerEntry) return;
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xml, 'text/xml');
  const groups: { id: string; url: string; name: string }[] = [];
  const elems = xmlDoc.getElementsByTagName('group');
  for (let i = 0; i < elems.length; i++) {
    const group = elems[i];
    const groupData = {
      id: group.getElementsByTagName('groupID64')[0]?.childNodes[0]?.nodeValue ?? '',
      url: group.getElementsByTagName('groupURL')[0]?.childNodes[0]?.nodeValue ?? '',
      name: group.getElementsByTagName('groupName')[0]?.childNodes[0]?.nodeValue ?? '',
    };
    groups.push(groupData);
  }
  const anchors: HTMLAnchorElement[] = [];
  groups.forEach((group) => {
    if (group.url) {
      anchors.push(
        createAnchor(
          group.name,
          `https://steamcommunity.com/groups/${group.url}`,
          '_blank',
          'padding: 2px;font-size:x-small;',
        ),
      );
    }
  });
  const div = createDivWithChildren(...anchors);
  div.className = 'display-column';
  playerEntry['groups_html'] = div;
  playerEntry['groups'] = groups;
  playerEntry['summary'] =
    xmlDoc.getElementsByTagName('summary')[0]?.childNodes[0]?.nodeValue ?? '';
};

export const onLogsData = (response: unknown, id: string): void => {
  const playerEntry = STATE.vacLookup[id];
  if (!playerEntry) return;
  const anchors: HTMLAnchorElement[] = [];
  const r = response as { total?: number } | null;
  if (r?.total) {
    anchors.push(
      createAnchor(
        `logs.tf(${r.total})`,
        `https://logs.tf/profile/${id}`,
        '_blank',
        'padding: 2px;font-size:x-small;',
      ),
    );
  }
  anchors.push(
    createAnchor(
      'steamid.uk',
      `https://steamid.uk/profile/${id}`,
      '_blank',
      'padding: 2px;font-size:x-small;',
    ),
    createAnchor(
      'sourcebans',
      `https://sourceban-checker.netlify.app/?steamid=${id}`,
      '_blank',
      'padding: 2px;font-size:x-small;',
    ),
    createAnchor('rep.tf', `https://rep.tf/${id}`, '_blank', 'padding: 2px;font-size:x-small;'),
    createAnchor(
      'steamdb',
      `https://steamdb.info/calculator/${id}`,
      '_blank',
      'padding: 2px;font-size:x-small;',
    ),
    createAnchor(
      'bazaar.tf',
      `https://bazaar.tf/score/${id}`,
      '_blank',
      'padding: 2px;font-size:x-small;',
    ),
  );
  const div = createDivWithChildren(...anchors);
  div.className = 'display-column';
  if (!playerEntry['other_html']) {
    playerEntry['other_html'] = document.createElement('div');
  }
  (playerEntry['other_html'] as HTMLDivElement).appendChild(div);
  playerEntry['other'] = (playerEntry['other'] ?? '') + (div.textContent ?? '');
};

export const onSourcebansData = (_response: unknown, id: string): void => {
  const playerEntry = STATE.vacLookup[id];
  if (!playerEntry) return;
  const anchor = createAnchor('sourcebans', '#', '_blank', 'padding:2px');
  if (!playerEntry['other_html']) {
    playerEntry['other_html'] = document.createElement('div');
  }
  (playerEntry['other_html'] as HTMLDivElement).appendChild(anchor);
  playerEntry['other'] = (playerEntry['other'] ?? '') + (anchor.textContent ?? '');
};
