import STATE from "../state.js";
import { getLocation } from "../utils/steamUtils.js";

const TF2_APP_ID = 440;
const CSGO_APP_ID = 730;

export const onBansData = (players) => {
  // setup STATE.vacLookup
  players.forEach((player) => {
    const playerEntry = STATE.vacLookup[player.SteamId];

    const divElements = [];
    if (player.NumberOfVACBans || player.NumberOfGameBans) {
      if (player.NumberOfGameBans) {
        divElements.push(
          createDiv(
            `${player.NumberOfGameBans} Game bans`,
            "color: #800000;font-size: x-small;"
          )
        );
      }
      if (player.NumberOfVACBans) {
        divElements.push(
          createDiv(
            `${player.NumberOfVACBans} VAC bans`,
            "color: #800000;font-size: x-small;"
          )
        );
      }
      divElements.push(
        createDiv(
          `(${player.DaysSinceLastBan} days ago)`,
          "color: #800000;font-size: x-small;"
        )
      );
    }
    const span = createSpanWithChildren(...divElements);

    const anchor =
      playerEntry["link_html"] ||
      createAnchor(
        STATE.vacLookup[player.SteamId]["name"],
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

export const onSummaryData = (players) => {
  // console.log(data);
  players.forEach((player) => {
    const span = createSpan(
      player.communityvisibilitystate !== 3 ? "hidden" : "public"
    );

    const playerEntry = STATE.vacLookup[player.steamid];
    playerEntry["profile_html"] = span;
    playerEntry["profile"] = span.textContent;

    playerEntry["link_html"] =
      playerEntry["link_html"] ||
      createAnchor(player.personaname, player.profileurl, "_blank");

    playerEntry["personaname"] = player.personaname;
    playerEntry["personaname_html"] = createAnchor(
      player.personaname,
      player.profileurl,
      "_blank"
    );

    playerEntry["profileurl"] = player.profileurl;

    // Private community visibility STATE - 1
    // FriendsOnly community visibility STATE - 2
    // Public community visibility STATE - 3
    playerEntry["visibility"] = player.communityvisibilitystate;

    playerEntry["avatar"] = player.avatarmedium;
    playerEntry["avatar_html"] = createImage(player.avatarmedium);

    playerEntry["timecreated_raw"] = player.timecreated;
    const created = new Date(player.timecreated * 1000);
    playerEntry["timecreated"] = player.timecreated
      ? moment(created).fromNow()
      : "";

    playerEntry["location"] = getLocation(
      player?.loccountrycode,
      player?.locstatecode,
      player?.loccityid
    );

    playerEntry["summary"] = player;
  });
};

export const onSteamLevelData = (data) => {
  for (let i = 0; i < data.length; i++) {
    let id = data[i].steamid;
    const playerEntry = STATE.vacLookup[id];
    playerEntry["level"] = data[i]?.response
      ? data[i].response?.player_level
      : "";
  }
};

export const onOwnedGamesData = (data, id) => {
  const playerEntry = STATE.vacLookup[id];
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
  const playerEntry = STATE.vacLookup[id];
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
    const playerEntry = STATE.vacLookup[id];
    playerEntry["stats"] = data[i].playerstats;
  }
};

export const onXMLData = (xml, id) => {
  const playerEntry = STATE.vacLookup[id];
  // console.log("xml", xml);
  let parser = new DOMParser();
  let xmlDoc = parser.parseFromString(xml, "text/xml");
  // console.log("xmlDoc", xmlDoc);
  const groups = [];
  const elems = xmlDoc.getElementsByTagName("group");
  for (let group of elems) {
    const groupData = {
      id: group.getElementsByTagName("groupID64")[0].childNodes[0].nodeValue,
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

  const anchors = [];
  groups.forEach((group) => {
    if (group.url) {
      const anchor = createAnchor(
        group.name,
        `https://steamcommunity.com/groups/${group.url}`,
        "_blank",
        "padding: 2px;font-size:x-small;"
      );
      anchors.push(anchor);
    }
  });

  playerEntry["groups_html"] = createDivWithChildren(...anchors);
  playerEntry["groups"] = groups;
  playerEntry["summary"] =
    xmlDoc.getElementsByTagName("summary")[0]?.childNodes[0]?.nodeValue || "";
};

export const onLogsData = (response, id) => {
  const playerEntry = STATE.vacLookup[id];

  const anchors = [];

  if (response && response.total) {
    anchors.push(
      createAnchor(
        `logs.tf(${response.total})`,
        `https://logs.tf/profile/${id}`,
        "_blank",
        "padding: 2px;font-size:x-small;"
      )
    );
  }

  anchors.push(
    createAnchor(
      "steamid.uk",
      `https://steamid.uk/profile/${id}`,
      "_blank",
      "padding: 2px;font-size:x-small;"
    )
  );

  anchors.push(
    createAnchor(
      "sourcebans",
      `https://sourceban-checker.netlify.app/?steamid=${id}`,
      // `https://searx.one/search?q="${id}" banlist`,
      "_blank",
      "padding: 2px;font-size:x-small;"
    )
  );

  anchors.push(
    createAnchor(
      "rep.tf",
      `https://rep.tf/${id}`,
      "_blank",
      "padding: 2px;font-size:x-small;"
    )
  );

  anchors.push(
    createAnchor(
      "steamdb",
      `https://steamdb.info/calculator/${id}`,
      "_blank",
      "padding: 2px;font-size:x-small;"
    )
  );

  anchors.push(
    createAnchor(
      "bazaar.tf",
      `https://bazaar.tf/score/${id}`,
      "_blank",
      "padding: 2px;font-size:x-small;"
    )
  );

  const div = createDivWithChildren(...anchors);
  div.className = "display-column";
  if (!playerEntry["other_html"]) {
    playerEntry["other_html"] = document.createElement("div");
  }

  playerEntry["other_html"].appendChild(div);
  playerEntry["other"] += div.textContent;
};

export const onSourcebansData = (response, id) => {
  const playerEntry = STATE.vacLookup[id];

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
  img.style = "border-radius: 5px;";
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
