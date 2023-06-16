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

// get steam ids from input
let text = `#   3481 "「VΛC」✔ Lightning⸙Dust"            [U:1:1266329853]     32:26       85    0 active #   3481 "critical shit"            [U:1:1407862404]     32:26       85    0 active #   3481 "Blackjack"             [U:1:120274086]     32:26       85    0 active #   1123 "miura"             [U:1:132939500]     24:08       57    0 active #   1039 "Agadir"            [U:1:1037258007]     1:38:25    64    0 active #   1124 "sakay"             [U:1:1264703974]    21:46       78    0 active #   1140 "Tilápia2.0"       [U:1:1264702923]    11:33       44    0 active #   1020 "adriano.thiele"    [U:1:1477596109]     2:08:15    51    0 active #   1146 "Theoddsguy"        [U:1:1131600126]    06:11      117    1 active #   1125 "[CHILI]"           [U:1:1025561896]    20:10       97    0 active #   1075 "Jompas"            [U:1:1508352030]    52:27      108    0 active #   1118 "hochi mama"        [U:1:1265357981]    30:01       48    0 active #   1136 "HyperMat"          [U:1:436527521]     13:08       58    0 active #   1126 "nesturdoba"        [U:1:227181971]     19:12      127    0 active #   1103 "Kitty ❤"         [U:1:127424796]     39:51       32    0 active #   1066 "xmateoff"          [U:1:1227469169]     1:08:22    93    0 active #   1132 "Frosty"            [U:1:375197856]     16:10       86    0 active #   1109 "Kanno"             [U:1:313232557]     38:58      106    0 active #   1149 "Comrade"           [U:1:489396812]     00:47       75   74 spawning #   1137 "soldado em treinamento" [U:1:1386588645] 13:03    108    0 active #   1107 "Argentinian Boy"   [U:1:1163422494]    39:04       68    0 active #   1141 "Mcl_Blue"          [U:1:75586915]      10:46       77    0 active #   1121 "possiblejewel75"   [U:1:1225436622]    26:52      112    0 active #   1119 "Zeruel"            [U:1:419240233]     29:32       35    0 active #   1108 "Jim"               [U:1:204256192]     39:04       55    0 active #   1108 "Coby Knight"               [U:1:466433560]     39:04       55    0 active
`; // const input = prompt('Input value from status on console', text) || '';
const inputElem = document.querySelector("#input-players");
inputElem.value = text;
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
        //console.log("click", event);
        const connected = event.target
          .predecessors()
          .union(event.target)
          .union(event.target.successors());
        const notConnected = this.cy.elements().not(connected);
        notConnected.remove();
        setTimeout(() => notConnected.restore(), 5000);
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
        elements.nodes.push({
          data: {
            id: id,
            name: `known cheater (${id})`,
            relatedSteamIds: "",
            img: "/cheater.png",
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
              group.url || group.name || group.id
            }`,
            relatedSteamIds: "",
            img: "/cheater.png",
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
    }

    resolve();
  });
};
