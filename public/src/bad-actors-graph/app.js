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

// TODO: get img & bans

// cytoscape.use(cytoscapeCola);
cytoscape.use(cytoscapePopper);

const typeColors = {
  true: "#f95d6a", // red
  false: "#999", // grey
};

const inputElem = document.querySelector("#input-players");
let allData = [];

document.querySelector("#button").addEventListener("click", () => {
  let input = inputElem.value;
  allData = input
    .split(/(".*?"|[^"\s]+)+(?=\s*|\s*$)/g)
    .filter((e) => e.trim().length > 0);
  parseSteamData();
  getSteamData().then(() => {
    const schema = graphSchema(STATE.graphLookup);
    console.log("graph schema", schema);

    document.querySelector("#vac-check").style.display = "";
    new Graph(schema);
  });
});

class Graph {
  constructor(elements) {
    try {
      //console.log("constructor", elements);
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
              "background-color": (el) => typeColors[el.attr("bans")],
              "background-image": (el) => el.attr("img"),
              "background-height": "100%",
              "background-width": "100%",
              "border-color": (el) => typeColors[el.attr("bans")],
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

      // Bind click event
      this.cy.on("click", "node", (event) => {
        // hide not connected nodes for 5 seconds
        const node = event.target;
        const connected = node
          .predecessors()
          .union(node)
          .union(node.successors());
        const notConnected = this.cy.elements().not(connected);
        notConnected.remove();
        setTimeout(() => notConnected.restore(), 5000);
        // open profile
        const data = node.data();
        if (data?.id) {
          window.open(
            `https://steamcommunity.com/profiles/${data?.id}`,
            "_blank"
          );
        }
      });

      // Bind tooltip event
      this.tips = document.createElement("div");
      this.cy.nodes().on("mouseover", (event) => {
        const target = event.target;
        target.popperref = target.popper({
          content: () => {
            const node = event.target;
            this.tips.innerHTML = `${node.data("name")}`;
            this.tips.className = "node-tooltip";
            document.body.appendChild(this.tips);
            return this.tips;
          },
          popper: {
            placement: "top-start",
            removeOnDestroy: true,
          },
        });
      });
    } catch (error) {
      console.log(error);
    }
  }

  destroy() {
    this.cy.destroy();
    this.tips.remove();
  }
}

const graphSchema = (graphLookup) => {
  const elements = {
    nodes: [],
    edges: [],
  };
  const existingEdges = new Set();

  try {
    for (const [key, entry] of Object.entries(graphLookup)) {
      const node = {
        data: {
          id: entry.id,
          name: entry.name,
          relatedSteamIds: entry.relatedSteamIds,
          img: entry.img,
          bans: entry.bans,
        },
      };
      elements.nodes.push(node);

      for (const id of entry?.relatedSteamIds?.split(" ")) {
        // console.log("id", id);
        if (!id || key === id) continue;

        const edgeId = `${key}-${id}`;

        if (!existingEdges.has(edgeId)) {
          const edge = {
            data: {
              id: edgeId,
              source: key,
              target: id,
            },
          };
          elements.edges.push(edge);
          existingEdges.add(edgeId);
        }
      }
      for (const id of entry?.relatedCheaters?.split(" ")) {
        // console.log("id", id);
        if (!id || key === id) continue;

        let img = "";
        // TODO: dynamic pie-like img for shared cheaters?
        if (entry?.blacklist?.has("tf2botdetector")) {
          img = "/img/tf2botdetector.png";
        } else if (entry?.blacklist?.has("tacobot")) {
          img = "/img/tacobot.jpg";
        } else if (entry?.blacklist?.has("mcd")) {
          img = "/img/mcd.jpg";
        } else if (entry?.blacklist?.has("custom")) {
          img = "/img/custom.png";
        }

        elements.nodes.push({
          data: {
            id: id,
            name: `known cheater (${id}) ${Array.from(
              entry?.blacklist ?? []
            ).join("/")}`,
            relatedSteamIds: "",
            img: img,
            bans: true,
          },
        });
        elements.edges.push({
          data: {
            id: `${key}-${id}`,
            source: key,
            target: id,
          },
        });
      }
      entry?.cheatingGroups?.forEach((group) => {
        elements.nodes.push({
          data: {
            id: group.id,
            name: `known cheater group - ${
              group.url || group.name || group.description || group.id
            }`,
            relatedSteamIds: "",
            img: "/img/tf2botdetector.png",
            bans: true,
          },
        });
        elements.edges.push({
          data: {
            id: `${key}-${group.id}`,
            source: key,
            target: group.id,
          },
        });
      });
    }
  } catch (err) {
    console.error(err);
  } finally {
    return elements;
  }
};

const parseSteamData = () => {
  for (let index = 0; index < allData.length; index++) {
    const elem = allData[index];
    if (elem.length >= 12) {
      const id64 = getId(elem);
      if (id64 && id64.length > 16) {
        const name = allData?.[index - 1]?.replaceAll('"', "") || "";
        STATE.graphLookup[id64] = {
          name,
          id: id64,
        };
      }
    }
  }
};

const getSteamData = async () => {
  const ids = Object.keys(STATE.graphLookup);

  return new Promise(async (resolve) => {
    const playerSummaries = playerSummariesRequest(ids);
    const playerBans = playerBansRequest(ids);
    const playerDataPromises = [];

    for (const id of ids) {
      const friendListPromise = playerFriendListRequest(id);
      const xmlPromise = playerXMLRequest(
        `https://steamcommunity.com/profiles/${id}/?xml=1`
      );

      // Combine the friend list and XML data promises for each id
      playerDataPromises.push(
        Promise.all([friendListPromise, xmlPromise]).then(
          ([friendListData, xmlData]) => {
            onSteamFriendListData(friendListData, id);
            onXMLData(xmlData, id);
          }
        )
      );
    }

    const [summaryData, bansData] = await Promise.all([
      playerSummaries,
      playerBans,
    ]);

    if (summaryData) onSummaryData(summaryData);
    if (bansData) onBansData(bansData);

    // Wait for all friend list and XML data to be processed
    await Promise.all(playerDataPromises);

    const graphData = Object.values(STATE.graphLookup);
    console.log("STATE.graphLookup", STATE.graphLookup);
    const friendships = discoverFriendships(graphData);

    // Set the related players for each player
    for (const [_, item] of friendships) {
      STATE.graphLookup[item.id].relatedPlayers = item.relatedPlayers;
      STATE.graphLookup[item.id].relatedSteamIds = Array.from(
        item.relatedPlayers
      ).join(" ");
      STATE.graphLookup[item.id].relatedCheaters = Array.from(
        item.relatedCheaters
      ).join(" ");
      STATE.graphLookup[item.id].cheatingGroups = item.cheatingGroups;
      STATE.graphLookup[item.id].blacklist = item.blacklist;
    }

    resolve();
  });
};
