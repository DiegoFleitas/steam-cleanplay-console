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
import { getId } from "../utils/steamUtils.js";
import { drawTable, clearTable } from "./tableUtils.js";
import STATE from "../state.js";

let text = `#   3481 "「VΛC」✔ Lightning⸙Dust"            [U:1:1266329853]     32:26       85    0 active #   3481 "critical shit"            [U:1:1407862404]     32:26       85    0 active
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

  parseInput(trimmedInput);

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

const parseInput = (input: string): string[] => {
  const data = input
    .split(/(".*?"|[^"\s]+)+(?=\s*|\s*$)/g)
    .filter((e) => e.trim().length > 0);

  data.forEach((elem, index) => {
    if (elem.length >= 12) {
      const rawId = data[index];
      const id64 = getId(rawId);
      if (id64 && id64.length > 16) {
        STATE.isTF2 = elem.includes("[U:1:");
        STATE.isCSGO = elem.includes("STEAM_");
        const name = data?.[index - 1]?.replaceAll('"', "") ?? "";
        STATE.vacLookup[id64] = {
          name,
          id: id64,
        };
      }
    }
  });

  return data;
};
