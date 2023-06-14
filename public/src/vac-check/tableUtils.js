import STATE from "../state.js";
import { discoverFriendships } from "../utils/steamUtils.js";

let table = null;
export const clearTable = () => {
  if (table) {
    table.clear().draw(); // Clear the table and redraw it
  } else {
    console.warn("DataTable instance not found. Cannot clear table.");
  }
};

const setupTableData = (vacLookup) => {
  const uniqueIds = new Set(); // Create a Set to store unique ids
  let tableData = []; // Create a new array to store the desired properties

  for (const key in vacLookup) {
    if (vacLookup.hasOwnProperty(key)) {
      const currentItem = vacLookup[key];

      // Check if the id is already in the Set
      if (!uniqueIds.has(currentItem.id)) {
        uniqueIds.add(currentItem.id); // Add the id to the Set
        tableData.push(currentItem); // Add the item to the new array
      } else {
        console.log(
          `Duplicate item with id ${currentItem.id} found:`,
          currentItem
        ); // Log the duplicate item
      }
    }
  }

  // Pre-process the data for more performant table building
  tableData = tableData.map((row) => {
    let gameNickWords = row.link_html?.innerText.replace(/[\W_]+/g, "").trim();
    let steamNickWords = row.personaname_html?.innerText
      .replace(/[\W_]+/g, "")
      .trim();
    let differentNicks = gameNickWords !== steamNickWords;
    return {
      ...row,
      gameNickWords,
      steamNickWords,
      differentNicks,
      gameNickOuterHTML: row.link_html?.outerHTML.trim(),
      steamNickOuterHTML: row.personaname_html?.outerHTML.trim(),
      hasVAC: row.vac_html?.outerHTML.includes("VAC"),
      isHidden: row.profile?.includes("hidden"),
      hasLinuxHours: row.os?.includes("🐧"),
    };
  });

  const friendships = discoverFriendships(tableData);
  console.log("friendships", friendships);

  // Set the related players for each player
  tableData = tableData.map((row) => {
    let relatedPersonas = "";
    const relatedPlayers = friendships?.get(row.id)?.relatedPlayers;
    if (relatedPlayers) {
      relatedPersonas = Array.from(
        relatedPlayers,
        (id) => friendships?.get(id)?.name
      ).join(" ");
    }
    return {
      ...row,
      relatedPersonas,
    };
  });

  return tableData;
};

export const drawTable = () => {
  const tableMap = setupTableData(STATE.vacLookup);
  const tableData = Array.from(tableMap.values());

  tableData.sort(
    (a, b) =>
      b.hasVAC - a.hasVAC || // VAC presence first
      a.timecreated - b.timecreated || // Newest accounts next
      b.hasLinuxHours - a.hasLinuxHours || // Playtime on 🐧 next
      b.differentNicks - a.differentNicks || // Different nicks next
      b.isHidden - a.isHidden || // Hidden profiles next
      a.playtime - b.playtime || // Lowest playtime next
      a.level - b.level // Lowest level last
  );

  console.log("tableData", tableData);

  table = $("#dataTable").DataTable({
    data: tableData, // Set the data for the table
    responsive: true,
    paging: true,
    searching: true,
    ordering: true,
    info: true,
    lengthChange: false,
    order: [], // Disable initial sort
    language: {
      search: "Search all columns: ",
    },

    columns: [
      {
        data: "id",
        visible: false,
      },
      {
        title: "Avatar",
        data: "avatar_html",
        render: (data, type, row) => {
          return data?.outerHTML ?? "";
        },
        defaultContent: "",
        searchable: false,
      },
      {
        title: "Game nick",
        data: "link_html",
        // append steam nick if different to game nick
        render: (data, type, row) => {
          if (row?.differentNicks) {
            const element = document.createElement("div");
            element.innerHTML = `<del>${row?.gameNickOuterHTML}</del><br>${row?.steamNickOuterHTML}`;

            const del = element.querySelector("del");
            del.classList.add("has-tooltip");
            del.dataset.tooltip =
              "This player in-game nick differs from their steam account name.";

            return element.innerHTML;
          }
          return (
            row?.gameNickOuterHTML ??
            `<a href="https://steamcommunity.com/profiles/${row?.id}" target="_blank">${row?.name}</a>`
          );
        },
        defaultContent: "",
      },
      {
        title: "Other",
        data: "other_html",
        render: (data, type, row) => {
          return `${data?.outerHTML || ""}`;
        },
        defaultContent: "",
        searchable: false,
      },
      {
        title: "VAC",
        data: "vac_html",
        render: (data, type, row) => {
          return data?.outerHTML;
        },
        defaultContent: "",
      },
      { title: "OS", data: "os", defaultContent: "" },
      {
        title: "Created",
        data: "timecreated",
        defaultContent: "",
      },
      { title: "Profile", data: "profile", defaultContent: "" },
      { title: "Level", data: "level", defaultContent: "" },
      { title: "Playtime (hrs)", data: "playtime", defaultContent: "" },
      { title: "Location", data: "location", defaultContent: "" },
      {
        title: "Steam nick",
        data: "personaname_html",
        render: (data, type, row) => {
          return data?.outerHTML;
        },
        defaultContent: "",
      },
      {
        title: "Groups",
        data: "groups_html",
        render: (data, type, row) => {
          return `${data?.outerHTML || ""}`;
        },
        defaultContent: "",
      },
      {
        title: "Created (raw)",
        visible: false,
        data: "timecreated_raw",
        defaultContent: "",
      },
      {
        title: "Related",
        visible: true,
        data: "relatedPersonas",
        render: (data, type, row) => {
          return data || "";
        },
        defaultContent: "",
      },
      {
        title: "Summary",
        visible: true,
        data: "summary",
        defaultContent: "",
      },
    ],
    columnDefs: [
      {
        targets: 4, // index of the VAC column
        type: "boolean",
        orderable: true,
        // Use pre-processed boolean for sorting
        data: "hasVAC",
      },
      {
        targets: 7, // index of the profile column
        type: "boolean",
        orderable: true,
        // Use pre-processed boolean for sorting
        data: "isHidden",
      },
      {
        targets: 5, // index of the OS column
        type: "boolean",
        orderable: true,
        // Use pre-processed boolean for sorting
        data: "hasLinuxHours",
      },
      {
        targets: 2, // index of the "Game nick" column
        type: "boolean",
        orderable: true,
        // Use the pre-processed boolean for sorting
        data: "differentNicks",
      },
    ],
    pageLength: 30,
  });
  table.draw();

  const tooltip = document.createElement("div");
  tooltip.classList.add("tooltip");
  document.body.append(tooltip);

  let popperInstance = null;

  document.addEventListener(
    "mouseenter",
    (e) => {
      if (e.target.matches(".has-tooltip")) {
        tooltip.innerText = e.target.dataset.tooltip;
        tooltip.style.display = "block"; // Make the tooltip visible
        popperInstance = Popper.createPopper(e.target, tooltip);
      }
    },
    true
  ); // Using capture phase to handle event as soon as it propagates

  document.addEventListener(
    "mouseleave",
    (e) => {
      if (e.target.matches(".has-tooltip")) {
        tooltip.style.display = "none"; // Hide the tooltip
        if (popperInstance) {
          popperInstance.destroy(); // Destroy the popper instance
          popperInstance = null;
        }
      }
    },
    true
  ); // Using capture phase to handle event as soon as it propagates
};
