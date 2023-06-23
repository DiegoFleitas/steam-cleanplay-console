import {
  onBansData,
  onSummaryData,
  onSteamLevelData,
  onOwnedGamesData,
  onSteamFriendListData,
  onSteamUserStatsData,
  onXMLData,
  onLogsData,
  onSourcebansData,
} from "./dataHandlers.js";
import {
  playerBansRequest,
  playerSummariesRequest,
  playerSteamlevelRequest,
  playerOwnedGamesRequest,
  playerFriendListRequest,
  getUserStatsForGameRequest,
  playerXMLRequest,
  playerLogsRequest,
  playerSourcebansRequest,
} from "../utils/apiRequests.js";
import { getId } from "../utils/steamUtils.js";
import { drawTable, clearTable } from "./tableUtils.js";
import STATE from "../state.js";

// TODO: reset button

// let text = `#    809 "❣г๏zเt๏❣" [U:1:172149372]   29:11      100    0 active #    810 "[ARG] Elver Gachica TRADEIT.GG" [U:1:411922788] 26:00  100    0 active #    819 "pontofrio2"               [U:1:162676685]     06:56       73    0 active #    820 "Gost9"             [U:1:908530649]     02:27      131    0 active #    811 "guilherme_nunes01" [U:1:100333969]     23:10       56    0 active #    821 "pigroot.deneb6"           [U:1:1201812221]     01:16       63    0 active #    816 "ＴΞｓｓΞＲ"  [U:1:98267072]      17:40      106    0 active #    785 "fuckus cuntus"     [U:1:891308439]     55:05       67    0 active #    815 "teminatorr79"      [U:1:430865125]     20:19       98    0 active #    787 "P O T A T 0 E"     [U:1:479985360]     50:04       47    0 active #    798 "(ElPeña)"         [U:1:893323848]     44:23       77    0 active #    784 "PowerGuidO CSGOEmpire.com" [U:1:491171849] 55:27   63    0 active #    789 "Avash"       [U:1:44002738]    49:54       76    0 active #    757 "Blyatman"          [U:1:413787685]      1:33:55   104    0 active #    788 "dvsilva2006"     [U:1:1004176048]     50:04       47    0 active`;
let text = `#   3481 "「VΛC」✔ Lightning⸙Dust"            [U:1:1266329853]     32:26       85    0 active #   3481 "critical shit"            [U:1:1407862404]     32:26       85    0 active #   3481 "Blackjack"             [U:1:120274086]     32:26       85    0 active #   1123 "miura"             [U:1:132939500]     24:08       57    0 active #   1039 "Agadir"            [U:1:1037258007]     1:38:25    64    0 active #   1124 "sakay"             [U:1:1264703974]    21:46       78    0 active #   1140 "Tilápia2.0"       [U:1:1264702923]    11:33       44    0 active #   1020 "adriano.thiele"    [U:1:1477596109]     2:08:15    51    0 active #   1146 "Theoddsguy"        [U:1:1131600126]    06:11      117    1 active #   1125 "[CHILI]"           [U:1:1025561896]    20:10       97    0 active #   1075 "Jompas"            [U:1:1508352030]    52:27      108    0 active #   1118 "hochi mama"        [U:1:1265357981]    30:01       48    0 active #   1136 "HyperMat"          [U:1:436527521]     13:08       58    0 active #   1126 "nesturdoba"        [U:1:227181971]     19:12      127    0 active #   1103 "Kitty ❤"         [U:1:127424796]     39:51       32    0 active #   1066 "xmateoff"          [U:1:1227469169]     1:08:22    93    0 active #   1132 "Frosty"            [U:1:375197856]     16:10       86    0 active #   1109 "Kanno"             [U:1:313232557]     38:58      106    0 active #   1149 "Comrade"           [U:1:489396812]     00:47       75   74 spawning #   1137 "soldado em treinamento" [U:1:1386588645] 13:03    108    0 active #   1107 "Argentinian Boy"   [U:1:1163422494]    39:04       68    0 active #   1141 "Mcl_Blue"          [U:1:75586915]      10:46       77    0 active #   1121 "possiblejewel75"   [U:1:1225436622]    26:52      112    0 active #   1119 "Zeruel"            [U:1:419240233]     29:32       35    0 active #   1108 "Jim"               [U:1:204256192]     39:04       55    0 active #   1108 "Coby Knight"               [U:1:466433560]     39:04       55    0 active # 1125 "miguel"           [U:1:1197874800]    20:10       97    0 active 
`;
// many relations - related through https://steamcommunity.com/groups/FPNE42069/members
// text = `input #   4497 "Cinder"            [U:1:101103742]     12:13       69    0 active edicts  : 551 used of 2048 max #   4501 "twitch.tv/hanrry_10" [U:1:169570084]   12:06       93    0 active # userid name                uniqueid            connected ping loss STATE #   4502 "Shisu"             [U:1:399491167]     12:06       66    1 active #   4496 "octavio control de plagas" [U:1:1007863318] 12:32   66    0 active #   4488 "bd0298683"         [U:1:1366025189]    18:11      137    0 active #   4493 "TROLEADOR CARA"    [U:1:1244000344]    15:21       75    0 active #   4455 "L0K0D0LL4R.-"      [U:1:381045693]     29:41       58    0 active #   4498 "Awesome Monkey"    [U:1:66685101]      12:13       76    2 active #   4499 "ɢᴜᴛ"          [U:1:197103188]     12:12       57    0 active #   4459 "Arny99"            [U:1:296674851]     29:37       84    0 active #   4461 "ElReyTilin69"      [U:1:445343715]     29:36       50    0 active #   4500 "Caza"              [U:1:1232843267]    12:11       84    0 active #   4503 "Kurose"            [U:1:367629621]     12:06       78    0 active #   4504 "✞スキネエクス✞" [U:1:839335250] 11:50    61    0 active #   4494 "tomyux07"          [U:1:1017707937]    15:09       37    0 active #   4468 "rremooo_p"         [U:1:1426657015]    29:04       88    0 active #   4506 "La Pantera del Callao" [U:1:913217554] 09:10       62    0 active #   4469 "OKOpokko"          [U:1:898390880]     29:04       89    0 active #   4485 "Fedo"              [U:1:113679676]     21:13       70    0 active`;

let ids = null;

const inputElem = document.querySelector("#input-players");
inputElem.value = text;

document.querySelector("#button").addEventListener("click", () => {
  processInput(inputElem.value);
  document.querySelector("#vac-check").style.display = "";
});

const processInput = async (input) => {
  if (!input) {
    document.querySelector("#loader").hidden = true;
  }
  document.getElementById("loader").hidden = false;
  window.bubblesCursor();

  parseInput(input);

  ids = Object.keys(STATE.vacLookup);
  STATE.tableData = [];
  clearTable();

  try {
    await fetchData(ids);
    drawTable();
    // $(document).ready(() => {
    //   console.log("ready");
    // });
  } catch (error) {
    console.error(error);
  } finally {
    document.getElementById("loader").hidden = true;
    document.getElementById("dataTable").hidden = false;
  }
};

const fetchData = async (ids) => {
  try {
    const bansResponse = await playerBansRequest(ids);
    if (bansResponse) onBansData(bansResponse);

    const summariesResponse = await playerSummariesRequest(ids);
    if (summariesResponse) onSummaryData(summariesResponse);

    const players = summariesResponse;

    await Promise.all(players.map(fetchPlayerData));

    onSteamLevelData(await playerSteamlevelRequest(ids));
  } catch (error) {
    console.error(error);
  } finally {
    document.getElementById("loader").hidden = true;
    document.getElementById("dataTable").hidden = false;
  }
};

const fetchPlayerData = async (player) => {
  const steamId = player.steamid;
  const requests = [];

  try {
    requests.push(
      playerXMLRequest(`${player.profileurl}?xml=1`).then((response) => {
        onXMLData(response, steamId);
      })
    );
  } catch (error) {
    console.error(error);
  }
  try {
    requests.push(
      playerFriendListRequest(steamId).then((friendListResponse) => {
        onSteamFriendListData(friendListResponse, steamId);
      })
    );
  } catch (error) {
    console.error(error);
  }

  try {
    requests.push(
      playerOwnedGamesRequest(steamId).then((ownedGamesResponse) => {
        onOwnedGamesData(ownedGamesResponse.response, steamId);
      })
    );
  } catch (error) {
    console.error(error);
  }

  try {
    requests.push(
      playerLogsRequest(steamId).then((logsResponse) => {
        onLogsData(logsResponse, steamId);
      })
    );
  } catch (error) {
    console.error(error);
  }

  return Promise.all(requests);
};

const parseInput = (input) => {
  const data = input
    .split(/(".*?"|[^"\s]+)+(?=\s*|\s*$)/g)
    .filter((e) => e.trim().length > 0);

  data.forEach((elem, index) => {
    if (elem.length >= 12) {
      const rawId = data[index];
      const id64 = getId(rawId);
      if (id64 && id64.length > 16) {
        // FIXME: flags might get overriden by the next element
        STATE.isTF2 = elem.includes("[U:1:");
        STATE.isCSGO = elem.includes("STEAM_");
        const name = data?.[index - 1]?.replaceAll('"', "") || "";
        // console.log(id64, name);
        STATE.vacLookup[id64] = {
          name,
          id: id64,
        };
      }
    }
  });

  return data;
};
