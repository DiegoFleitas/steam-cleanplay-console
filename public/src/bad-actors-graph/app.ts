declare const cytoscape: {
  use: (ext: unknown) => void;
  (opts: unknown): { fit: () => void; on: (a: string, b: string, c: (e: unknown) => void) => void; nodes: () => { on: (e: string, fn: (event: unknown) => void) => void }; elements: () => { not: (x: unknown) => { remove: () => void; restore: () => void } }; destroy: () => void };
};
declare const cytoscapePopper: unknown;

import STATE from "../state.js";
import { getId, discoverFriendships } from "../utils/steamUtils.js";
import {
  playerXMLRequest,
  playerSummariesRequest,
  playerBansRequest,
  playerFriendListRequest,
} from "../utils/apiRequests.js";
import {
  onXMLData,
  onSummaryData,
  onBansData,
  onSteamFriendListData,
} from "./dataHandlers.js";

cytoscape.use(cytoscapePopper);

const typeColors: Record<string, string> = {
  true: "#f95d6a",
  false: "#999",
};

const inputElem = document.querySelector("#input-players") as HTMLTextAreaElement;
let allData: string[] = [];

document.querySelector("#button")?.addEventListener("click", () => {
  const input = inputElem?.value ?? "";
  allData = input
    .split(/(".*?"|[^"\s]+)+(?=\s*|\s*$)/g)
    .filter((e) => e.trim().length > 0);
  parseSteamData();
  getSteamData().then(() => {
    const schema = graphSchema(STATE.graphLookup);
    console.log("graph schema", schema);
    (document.querySelector("#vac-check") as HTMLElement).style.display = "";
    new Graph(schema);
  });
});

class Graph {
  cy: ReturnType<typeof cytoscape>;
  tips: HTMLDivElement;

  constructor(elements: unknown) {
    this.tips = document.createElement("div");
    try {
      this.cy = cytoscape({
        container: document.getElementById("cy"),
        userZoomingEnabled: false,
        boxSelectionEnabled: false,
        autounselectify: true,
        layout: {
          name: "cose",
          nodeDimensionsIncludeLabels: false,
          animate: false,
          fit: true,
        },
        style: [
          {
            selector: "node",
            style: {
              "background-color": (el: { attr: (k: string) => string }) => typeColors[el.attr("bans")],
              "background-image": (el: { attr: (k: string) => string }) => el.attr("img"),
              "background-height": "100%",
              "background-width": "100%",
              "border-color": (el: { attr: (k: string) => string }) => typeColors[el.attr("bans")],
              "border-width": "3%",
              color: "#000",
              width: 30,
              height: 30,
              shape: "roundrectangle",
              "font-family": "Helvetica",
              "font-size": 8,
              "min-zoomed-font-size": 8,
              "overlay-opacity": 0,
            },
          },
          {
            selector: "edge",
            style: {
              "overlay-opacity": 0,
              "target-arrow-shape": "triangle",
              "target-distance-from-node": 10,
              width: 2,
              "source-arrow-shape": "none",
            },
          },
        ],
        elements,
      });

      this.cy.fit();

      this.cy.on("click", "node", (event: unknown) => {
        const ev = event as { target: { predecessors: () => { union: (x: unknown) => { not: (x: unknown) => { remove: () => void; restore: () => void } } }; union: (x: unknown) => unknown; successors: () => unknown; data: () => { id?: string } } };
        const node = ev.target;
        const pred = node.predecessors() as unknown as { union: (x: unknown) => { union: (x: unknown) => unknown } };
        const connected = pred.union(node).union(node.successors());
        const notConnected = this.cy.elements().not(connected) as { remove: () => void; restore: () => void };
        notConnected.remove();
        setTimeout(() => notConnected.restore(), 5000);
        const data = node.data();
        if (data?.id) {
          window.open(`https://steamcommunity.com/profiles/${data.id}`, "_blank");
        }
      });

      this.cy.nodes().on("mouseover", (event: unknown) => {
        const ev = event as { target: { popper: (opts: unknown) => void } };
        const target = ev.target;
        (target as { popperref?: unknown }).popperref = target.popper({
          content: () => {
            const node = (event as { target: { data: (k: string) => string } }).target;
            this.tips.innerHTML = `${node.data("name")}`;
            this.tips.className = "node-tooltip";
            document.body.appendChild(this.tips);
            return this.tips;
          },
          popper: { placement: "top-start", removeOnDestroy: true },
        });
      });
    } catch (error) {
      console.log(error);
    }
  }

  destroy(): void {
    this.cy.destroy();
    this.tips.remove();
  }
}

const graphSchema = (graphLookup: Record<string, unknown>): { nodes: unknown[]; edges: unknown[] } => {
  const elements: { nodes: unknown[]; edges: unknown[] } = { nodes: [], edges: [] };
  const existingEdges = new Set<string>();

  try {
    for (const [key, entry] of Object.entries(graphLookup)) {
      const e = entry as Record<string, unknown> & { id: string; name?: string; relatedSteamIds?: string; img?: string; bans?: boolean; relatedCheaters?: string; blacklist?: Set<string>; cheatingGroups?: unknown[] };
      const node = {
        data: {
          id: e.id,
          name: e.name,
          relatedSteamIds: e.relatedSteamIds,
          img: e.img,
          bans: e.bans,
        },
      };
      elements.nodes.push(node);

      const relatedIds = (e.relatedSteamIds as string)?.split(" ") ?? [];
      for (const id of relatedIds) {
        if (!id || key === id) continue;
        const edgeId = `${key}-${id}`;
        if (!existingEdges.has(edgeId)) {
          elements.edges.push({
            data: { id: edgeId, source: key, target: id },
          });
          existingEdges.add(edgeId);
        }
      }

      const relatedCheaters = (e.relatedCheaters as string)?.split(" ") ?? [];
      for (const id of relatedCheaters) {
        if (!id || key === id) continue;
        let img = "";
        if (e.blacklist?.has("tf2botdetector")) img = "/img/tf2botdetector.png";
        else if (e.blacklist?.has("tacobot")) img = "/img/tacobot.jpg";
        else if (e.blacklist?.has("mcd")) img = "/img/mcd.jpg";
        else if (e.blacklist?.has("custom")) img = "/img/custom.png";
        elements.nodes.push({
          data: {
            id,
            name: `known cheater (${id}) ${Array.from(e.blacklist ?? []).join("/")}`,
            relatedSteamIds: "",
            img,
            bans: true,
          },
        });
        elements.edges.push({
          data: { id: `${key}-${id}`, source: key, target: id },
        });
      }

      const groups = (e.cheatingGroups as Iterable<{ id: unknown; url?: string; name?: string; description?: string }>) ?? [];
      for (const group of groups) {
        elements.nodes.push({
          data: {
            id: group.id,
            name: `known cheater group - ${group.url ?? group.name ?? group.description ?? group.id}`,
            relatedSteamIds: "",
            img: "/img/tf2botdetector.png",
            bans: true,
          },
        });
        elements.edges.push({
          data: { id: `${key}-${group.id}`, source: key, target: group.id },
        });
      }
    }
  } catch (err) {
    console.error(err);
  }
  return elements;
};

const parseSteamData = (): void => {
  for (let index = 0; index < allData.length; index++) {
    const elem = allData[index];
    if (elem.length >= 12) {
      const id64 = getId(elem);
      if (id64 && id64.length > 16) {
        const name = allData?.[index - 1]?.replaceAll('"', "") ?? "";
        STATE.graphLookup[id64] = { name, id: id64 };
      }
    }
  }
};

const getSteamData = async (): Promise<void> => {
  const ids = Object.keys(STATE.graphLookup);

  const playerSummaries = playerSummariesRequest(ids);
  const playerBans = playerBansRequest(ids);
  const playerDataPromises: Promise<unknown>[] = [];

  for (const id of ids) {
    playerDataPromises.push(
      Promise.all([
        playerFriendListRequest(id),
        playerXMLRequest(`https://steamcommunity.com/profiles/${id}/?xml=1`),
      ]).then(([friendListData, xmlData]) => {
        onSteamFriendListData(friendListData, id);
        onXMLData(xmlData as string, id);
      })
    );
  }

  const [summaryData, bansData] = await Promise.all([playerSummaries, playerBans]);
  if (summaryData) onSummaryData(summaryData);
  if (bansData) onBansData(bansData);
  await Promise.all(playerDataPromises);

  const graphData = Object.values(STATE.graphLookup) as Parameters<typeof discoverFriendships>[0];
  const friendships = discoverFriendships(graphData);

  for (const [, item] of friendships) {
    const entry = item as { id: string; relatedPlayers?: Set<string>; relatedCheaters?: Set<string>; cheatingGroups?: unknown; blacklist?: Set<string> };
    const lookupEntry = STATE.graphLookup[entry.id] as Record<string, unknown>;
    if (lookupEntry) {
      lookupEntry.relatedPlayers = entry.relatedPlayers;
      lookupEntry.relatedSteamIds = Array.from(entry.relatedPlayers ?? []).join(" ");
      lookupEntry.relatedCheaters = Array.from(entry.relatedCheaters ?? []).join(" ");
      lookupEntry.cheatingGroups = entry.cheatingGroups;
      lookupEntry.blacklist = entry.blacklist;
    }
  }
};
