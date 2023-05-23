import STATE from "../state.js";
import { getId } from "../utils/steamUtils.js";
import {
  playerGroupsRequest,
  playerSummariesRequest,
  playerBansRequest,
  playerFriendListRequest,
} from "../utils/apiRequests.js";
import {
  onGroupsData,
  onSummaryData,
  onBansData,
  onSteamFriendListData,
} from "./dataHandlers.js";

// TODO: get img & bans

cytoscape.use(cytoscapeCola);
cytoscape.use(cytoscapePopper);

const typeColors = {
  true: "#f95d6a", // red
  false: "#999", // grey
};

// get steam ids from input
let text = `#   3481 "「VΛC」✔ Lightning⸙Dust"            [U:1:1266329853]     32:26       85    0 active #   3481 "critical shit"            [U:1:1407862404]     32:26       85    0 active #   3481 "Blackjack"             [U:1:120274086]     32:26       85    0 active #   1123 "miura"             [U:1:132939500]     24:08       57    0 active #   1039 "Agadir"            [U:1:1037258007]     1:38:25    64    0 active #   1124 "sakay"             [U:1:1264703974]    21:46       78    0 active #   1140 "Tilápia2.0"       [U:1:1264702923]    11:33       44    0 active #   1020 "adriano.thiele"    [U:1:1477596109]     2:08:15    51    0 active #   1146 "Theoddsguy"        [U:1:1131600126]    06:11      117    1 active #   1125 "[CHILI]"           [U:1:1025561896]    20:10       97    0 active #   1075 "Jompas"            [U:1:1508352030]    52:27      108    0 active #   1118 "hochi mama"        [U:1:1265357981]    30:01       48    0 active #   1136 "HyperMat"          [U:1:436527521]     13:08       58    0 active #   1126 "nesturdoba"        [U:1:227181971]     19:12      127    0 active #   1103 "Kitty ❤"         [U:1:127424796]     39:51       32    0 active #   1066 "xmateoff"          [U:1:1227469169]     1:08:22    93    0 active #   1132 "Frosty"            [U:1:375197856]     16:10       86    0 active #   1109 "Kanno"             [U:1:313232557]     38:58      106    0 active #   1149 "Comrade"           [U:1:489396812]     00:47       75   74 spawning #   1137 "soldado em treinamento" [U:1:1386588645] 13:03    108    0 active #   1107 "Argentinian Boy"   [U:1:1163422494]    39:04       68    0 active #   1141 "Mcl_Blue"          [U:1:75586915]      10:46       77    0 active #   1121 "possiblejewel75"   [U:1:1225436622]    26:52      112    0 active #   1119 "Zeruel"            [U:1:419240233]     29:32       35    0 active #   1108 "Jim"               [U:1:204256192]     39:04       55    0 active
`; // const input = prompt('Input value from status on console', text) || '';
const inputElem = document.querySelector("#input-vac");
inputElem.value = text;
let allData = [];
let elements = {
  nodes: [],
  edges: [],
};

document.querySelector("#button").addEventListener("click", () => {
  let input = inputElem.value;
  allData = input
    .split(/(".*?"|[^"\s]+)+(?=\s*|\s*$)/g)
    .filter((e) => e.trim().length > 0);
  parseSteamData();
  console.log(allData);
  console.log(STATE.graphLookup);

  getSteamData().then(() => {
    console.log(STATE.graphLookup);

    const graphElements = buildGraph(elements, STATE.graphLookup);
    console.log("elements", elements);
    console.log("graphElements", graphElements);

    new Graph(graphElements);
    // new Graph(elements);
  });
});

class Graph {
  constructor(elements) {
    console.log("constructor", elements);
    this.cy = cytoscape({
      container: document.getElementById("cy"),
      userZoomingEnabled: false,
      boxSelectionEnabled: false,
      autounselectify: true,
      layout: {
        name: "cose",
        nodeDimensionsIncludeLabels: false,
        animate: false,
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

    // Bind click event
    this.cy.on("click", "node", (event) => {
      console.log("click", event);
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
          this.tips.innerHTML = `name: ${node.data("name")} id: ${node.data(
            "id"
          )}`;
          this.tips.className = "tooltipstyles";
          document.body.appendChild(this.tips);
          return this.tips;
        },
        popper: {
          placement: "top-start",
          removeOnDestroy: true,
        },
      });
    });
  }

  destroy() {
    this.cy.destroy();
    this.tips.remove();
  }
}

const buildGraph = (elements, graphLookup) => {
  for (const [key, entry] of Object.entries(graphLookup)) {
    console.log(entry);
    const node = { data: entry };
    elements.nodes.push(node);
    if (!entry || !entry.related_steamids) continue;
    const related = entry.related_steamids.split(" ");
    console.log("related", related.length, related);

    for (let i = 0; i < related.length; i++) {
      const id = related[i];
      if (!id || key === id) continue;
      const edge = {
        data: {
          id: `${key}-${id}`,
          source: key,
          target: id,
        },
      };
      const result = elements.edges.some((elem) => {
        return elem.data.id === `${key}-${id}`;
      });
      if (!result) elements.edges.push(edge);
    }
  }
  console.log("buildGraph", elements);
  return elements;
};

const parseSteamData = () => {
  // *** steam functions end ***
  for (let index = 0; index < allData.length; index++) {
    const elem = allData[index];
    if (elem.length >= 12) {
      const id64 = getId(elem);
      if (id64 && id64.length > 16) {
        const name = allData[index - 1].replaceAll('"', "");
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
    const playerFriendLists = [];

    for (const [key] of Object.entries(STATE.graphLookup)) {
      playerFriendLists.push(playerFriendListRequest(key));
    }

    const [summaryData, bansData, ...friendListsData] = await Promise.all([
      playerSummaries,
      playerBans,
      ...playerFriendLists,
    ]);

    if (summaryData) onSummaryData(summaryData.response);
    onBansData(bansData);

    friendListsData.forEach((friendListData, i) => {
      onSteamFriendListData(friendListData, Object.keys(STATE.graphLookup)[i]);
    });
    resolve();
  });
};
