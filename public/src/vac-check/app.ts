import {
  onBansData,
  onSummaryData,
  onSteamLevelData,
  onOwnedGamesData,
  onSteamFriendListData,
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
  playerXMLRequest,
  playerLogsRequest,
} from "../utils/apiRequests.js";
import { drawTable, clearTable } from "./tableUtils.js";
import STATE from "../state.js";
import { parseStatusInput } from "./parseStatusInput.js";

let text = `#   3481 "「VΛC」✔ Lightning⸙Dust"            [U:1:1266329853]     32:26       85    0 active #   3481 "critical shit"            [U:1:1407862404]     32:26       85    0 active #   3481 "Blackjack"             [U:1:120274086]     32:26       85    0 active #   1123 "miura"             [U:1:132939500]     24:08       57    0 active #   1039 "Agadir"            [U:1:1037258007]     1:38:25    64    0 active #   1124 "sakay"             [U:1:1264703974]    21:46       78    0 active #   1140 "Tilápia2.0"       [U:1:1264702923]    11:33       44    0 active #   1020 "adriano.thiele"    [U:1:1477596109]     2:08:15    51    0 active #   1146 "Theoddsguy"        [U:1:1131600126]    06:11      117    1 active #   1125 "[CHILI]"           [U:1:1025561896]    20:10       97    0 active #   1075 "Jompas"            [U:1:1508352030]    52:27      108    0 active #   1118 "hochi mama"        [U:1:1265357981]    30:01       48    0 active #   1136 "HyperMat"          [U:1:436527521]     13:08       58    0 active #   1126 "nesturdoba"        [U:1:227181971]     19:12      127    0 active #   1103 "Kitty ❤"         [U:1:127424796]     39:51       32    0 active #   1066 "xmateoff"          [U:1:1227469169]     1:08:22    93    0 active #   1132 "Frosty"            [U:1:375197856]     16:10       86    0 active #   1109 "Kanno"             [U:1:313232557]     38:58      106    0 active #   1149 "Comrade"           [U:1:489396812]     00:47       75   74 spawning #   1137 "soldado em treinamento" [U:1:1386588645] 13:03    108    0 active #   1107 "Argentinian Boy"   [U:1:1163422494]    39:04       68    0 active #   1141 "Mcl_Blue"          [U:1:75586915]      10:46       77    0 active #   1121 "possiblejewel75"   [U:1:1225436622]    26:52      112    0 active #   1119 "Zeruel"            [U:1:419240233]     29:32       35    0 active #   1108 "Jim"               [U:1:204256192]     39:04       55    0 active
`;

let ids: string[] | null = null;

const inputElem = document.querySelector("#input-players") as HTMLTextAreaElement;
if (inputElem) inputElem.value = text;

document.querySelector("#button")?.addEventListener("click", () => {
  processInput(inputElem?.value ?? "");
  (document.querySelector("#vac-check") as HTMLElement).style.display = "";
});

const processInput = async (input: string): Promise<void> => {
  const trimmedInput = input.trim();
  const loader = document.getElementById("loader");
  const dataTable = document.getElementById("dataTable");
  const emptyState = document.getElementById("empty-state");

  if (!trimmedInput) {
    if (loader) (loader as HTMLElement).hidden = true;
    if (dataTable) (dataTable as HTMLElement).hidden = true;
    if (emptyState) (emptyState as HTMLElement).hidden = false;
    return;
  }

  if (emptyState) (emptyState as HTMLElement).hidden = true;
  if (loader) (loader as HTMLElement).hidden = false;
  if (typeof window.bubblesCursor === "function") window.bubblesCursor();

  const parsed = parseStatusInput(trimmedInput);
  STATE.vacLookup = parsed.vacLookup;
  STATE.isTF2 = parsed.isTF2;
  STATE.isCSGO = parsed.isCSGO;

  ids = Object.keys(STATE.vacLookup);
  STATE.tableData = [];
  clearTable();

  try {
    if (!ids.length) {
      if (loader) (loader as HTMLElement).hidden = true;
      if (dataTable) (dataTable as HTMLElement).hidden = true;
      if (emptyState) {
        emptyState.textContent = "No valid Steam IDs were found in the input.";
        (emptyState as HTMLElement).hidden = false;
      }
      return;
    }

    await fetchData(ids);
    drawTable();
  } catch (error) {
    console.error(error);
  } finally {
    if (loader) (loader as HTMLElement).hidden = true;
    if (dataTable) (dataTable as HTMLElement).hidden = false;
  }
};

const fetchData = async (ids: string[]): Promise<void> => {
  try {
    const bansResponse = await playerBansRequest(ids);
    if (bansResponse) onBansData(bansResponse);

    const summariesResponse = await playerSummariesRequest(ids);
    if (summariesResponse) onSummaryData(summariesResponse);

    const players = summariesResponse as { steamid: string; profileurl?: string }[];
    await Promise.all(players.map(fetchPlayerData));

    onSteamLevelData(await playerSteamlevelRequest(ids));
  } catch (error) {
    console.error(error);
  } finally {
    const loader = document.getElementById("loader");
    const dataTable = document.getElementById("dataTable");
    if (loader) (loader as HTMLElement).hidden = true;
    if (dataTable) (dataTable as HTMLElement).hidden = false;
  }
};

const fetchPlayerData = async (player: { steamid: string; profileurl?: string }): Promise<void> => {
  const steamId = player.steamid;
  const requests: Promise<unknown>[] = [];

  requests.push(
    playerXMLRequest(`${player.profileurl ?? ""}?xml=1`).then((response) => {
      onXMLData(response as string, steamId);
    })
  );
  requests.push(
    playerFriendListRequest(steamId).then((friendListResponse) => {
      onSteamFriendListData(friendListResponse, steamId);
    })
  );
  requests.push(
    playerOwnedGamesRequest(steamId).then((ownedGamesResponse) => {
      const res = ownedGamesResponse as { response?: unknown };
      onOwnedGamesData(res?.response, steamId);
    })
  );
  requests.push(
    playerLogsRequest(steamId).then((logsResponse) => {
      onLogsData(logsResponse, steamId);
    })
  );

  await Promise.all(requests);
};

