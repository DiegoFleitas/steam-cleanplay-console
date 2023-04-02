import STATE from "./state.js";

const TF2_APP_ID = 440;
const CSGO_APP_ID = 730;

export const onBansData = (data) => {
  // setup STATE.lookup
  data.players.forEach((player) => {
    const playerEntry = STATE.lookup[player.SteamId];

    const divElements = [];
    if (player.NumberOfVACBans || player.NumberOfGameBans) {
      if (player.NumberOfGameBans) {
        divElements.push(createDiv(`${player.NumberOfGameBans} Game bans`));
      }
      if (player.NumberOfVACBans) {
        divElements.push(
          createDiv(`${player.NumberOfVACBans} VAC bans`, "color: red;")
        );
      }
      divElements.push(createDiv(`${player.DaysSinceLastBan} days ago`));
    }
    const span = createSpanWithChildren(...divElements);

    const anchor =
      playerEntry["link_html"] ||
      createAnchor(
        STATE.lookup[player.SteamId]["name"],
        `https://steamcommunity.com/profiles/${player.SteamId}`,
        "_blank"
      );

    playerEntry["link_html"] = anchor;
    playerEntry["link"] = anchor.textContent;
    playerEntry["vac_html"] = span;
    playerEntry["vac"] = span.textContent;
    playerEntry["bans"] = player;
  });
};

export const onSummaryData = (data) => {
  console.log(data);
  data.players.forEach((player) => {
    const span = createSpan(
      player.communityvisibilitystate !== 3 ? "hidden" : "public"
    );

    const playerEntry = STATE.lookup[player.steamid];
    playerEntry["profile_html"] = span;
    playerEntry["profile"] = span.textContent;

    // FIXME: race condition
    const isPersonanameMismatched =
      playerEntry["link"]?.textContent?.indexOf(player.personaname) === -1;

    playerEntry["link_html"] =
      playerEntry["link_html"] ||
      createAnchor(
        player.personaname,
        player.profileurl,
        "_blank",
        isPersonanameMismatched ? "color:red;" : ""
      );

    playerEntry["personaname"] = player.personaname;
    playerEntry["personaname_html"] = createSpan(player.personaname);

    playerEntry["profileurl"] = player.profileurl;

    // Private community visibility STATE - 1
    // FriendsOnly community visibility STATE - 2
    // Public community visibility STATE - 3
    playerEntry["visibility"] = player.communityvisibilitystate;

    playerEntry["avatar"] = player.avatarmedium;
    playerEntry["avatar_html"] = createImage(player.avatarmedium);

    playerEntry["timecreated_raw"] = player.timecreated;
    const created = new Date(player.timecreated * 1000);
    const now = new Date();
    const diffDays = Math.ceil(Math.abs(now - created) / (1000 * 60 * 60 * 24));
    playerEntry["timecreated"] = diffDays ? diffDays : "";

    playerEntry["summary"] = player;
  });
};

export const onSteamLevelData = (data) => {
  for (let i = 0; i < data.length; i++) {
    let id = data[i].steamid;
    const playerEntry = STATE.lookup[id];
    playerEntry["level"] = data[i]?.response
      ? data[i].response?.player_level
      : "";
  }
};

export const onOwnedGamesData = (data, id) => {
  const playerEntry = STATE.lookup[id];
  playerEntry["playtime_raw"] = "";
  playerEntry["playtime"] = "";
  playerEntry["os"] = "";

  if (data && data.games) {
    const games = data.games.filter(
      (g) =>
        (STATE.isTF2 && g.appid === TF2_APP_ID) ||
        (STATE.isCSGO && g.appid === CSGO_APP_ID)
    );
    for (let i = 0; i < games.length; i++) {
      let game = games[i];
      const hrs = parseInt(game.playtime_forever / 60);

      playerEntry["playtime_raw"] = game.playtime_forever;
      playerEntry["playtime"] = hrs;

      let os = "";
      if (game.playtime_linux_forever) os += "🐧";
      if (game.playtime_windows_forever) os += "🪟";
      if (game.playtime_mac_forever) os += "🍎";
      playerEntry["os"] = os;
    }
  }
};

export const onSteamFriendListData = (data, id) => {
  const playerEntry = STATE.lookup[id];
  let friends = [];
  let friendsArray = [];

  if (data && data.friendslist && data.friendslist.friends) {
    friendsArray = data.friendslist.friends.map((el) => {
      return el.steamid;
    });
    friends = data.friendslist.friends;
  }

  const span = createSpan(friendsArray.join());
  playerEntry["friends"] = friends;
  playerEntry["friends_html"] = span;
};

export const onSteamUserStatsData = (data) => {
  for (let i = 0; i < data.length; i++) {
    let id = data[i].steamid;
    const playerEntry = STATE.lookup[id];
    playerEntry["stats"] = data[i].playerstats;
  }
};

export const onXMLData = (xml, id) => {
  const playerEntry = STATE.lookup[id];
  playerEntry["xml"] = xml;
  let parser = new DOMParser();
  let xmlDoc = parser.parseFromString(xml, "text/xml");
  playerEntry["xml_parsed"] = xmlDoc;
  const groups = [];
  const elems = xmlDoc.getElementsByTagName("groupURL");
  for (let group of elems) {
    groups.push(group.childNodes[0].nodeValue);
  }
  console.log(groups.join());

  const span = createSpan(groups.join());
  playerEntry["groups_html"] = span;
  playerEntry["groups"] = groups.join();
};

export const onLogsData = (response, id) => {
  const playerEntry = STATE.lookup[id];

  const anchors = [];

  if (response && response.total) {
    anchors.push(
      createAnchor(
        `logs.tf (${response.total})`,
        `https://logs.tf/profile/${id}`,
        "_blank"
      )
    );
  }

  anchors.push(
    createAnchor(
      "steamid.uk",
      `https://steamid.uk/profile/${id}`,
      "_blank",
      "padding: 2px;"
    )
  );

  anchors.push(
    createAnchor(
      "sourcebans",
      `https://www.google.com/search?q="${id}"+"sourceban"`,
      "_blank",
      "padding: 2px;"
    )
  );

  const div = createDivWithChildren(...anchors);
  if (!playerEntry["other_html"]) {
    playerEntry["other_html"] = document.createElement("div");
  }

  playerEntry["other_html"].appendChild(div);
  playerEntry["other"] += div.textContent;
};

export const onSourcebansData = (response, id) => {
  const playerEntry = STATE.lookup[id];

  const anchor = createAnchor("sourcebans", "#", "_blank", "padding:2px");

  if (!playerEntry["other_html"]) {
    playerEntry["other_html"] = document.createElement("div");
  }

  playerEntry["other_html"].appendChild(anchor);
  playerEntry["other"] += anchor.textContent;
};

// Helper functions
const createSpan = (content) => {
  const span = document.createElement("span");
  span.innerHTML = content;
  return span;
};

const createAnchor = (content, href, target = "", style = "") => {
  const anchor = document.createElement("a");
  anchor.innerHTML = content;
  anchor.href = href;
  anchor.target = target;
  anchor.style = style;
  return anchor;
};

const createImage = (src) => {
  const img = document.createElement("img");
  img.src = src;
  return img;
};

const createDivWithChildren = (...children) => {
  const div = document.createElement("div");
  children.forEach((child) => div.appendChild(child));
  return div;
};

const createSpanWithChildren = (...children) => {
  const span = document.createElement("span");
  children.forEach((child) => span.appendChild(child));
  return span;
};

const createDiv = (content, style = "") => {
  const div = document.createElement("div");
  div.innerHTML = content;
  div.style = style;
  return div;
};
