import STATE from "../state.js";

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
  const tableData = []; // Create a new array to store the desired properties

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

  // don't return the related_steamids and friends columns
  return findRelations(tableData);
};

export const drawTable = () => {
  const tableData = setupTableData(STATE.vacLookup);

  console.log("tableData", tableData);

  table = $("#dataTable").DataTable({
    data: tableData, // Set the data for the table
    paging: true,
    searching: true,
    ordering: true,
    info: true,
    lengthChange: true,
    order: [], // Disable initial sort

    columns: [
      {
        data: "id",
        visible: false,
      },
      {
        title: "Avatar",
        data: "avatar_html",
        render: (data, type, row) => {
          return data?.outerHTML;
        },
        defaultContent: "",
      },
      {
        title: "Game nick",
        data: "link_html",
        render: (data, type, row) => {
          return data?.outerHTML;
        },
        defaultContent: "",
      },
      {
        title: "Other",
        data: "other_html",
        render: (data, type, row) => {
          return data?.outerHTML;
        },
        defaultContent: "",
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
        title: "Created (days)",
        data: "timecreated",
        defaultContent: "",
      },
      { title: "Profile", data: "profile", defaultContent: "" },
      { title: "Level", data: "level", defaultContent: "" },
      { title: "Playtime (hrs)", data: "playtime", defaultContent: "" },
      {
        title: "Steam nick",
        data: "personaname_html",
        render: (data, type, row) => {
          return data?.outerHTML;
        },
        defaultContent: "",
      },
      { title: "Groups", data: "groups", defaultContent: "" },
      {
        title: "Created (days)",
        visible: false,
        data: "timecreated_raw",
        defaultContent: "",
      },
      { title: "Related", visible: true, data: "related", defaultContent: "" },
    ],
    columnDefs: [
      {
        targets: 4, // index of the VAC column
        type: "numeric",
        // Set the sorting type to 'numeric'
        orderable: true,
        compare: (a, b) => {
          // custom sort function for the VAC column
          if (a.includes("VAC") && !b.includes("VAC")) {
            return -1; // a contains VAC, so a should come before b
          } else if (!a.includes("VAC") && b.includes("VAC")) {
            return 1; // b contains VAC, so b should come before a
          } else {
            return 0; // no difference, do not sort
          }
        },
      },
      {
        targets: 7, // index of the profile column
        type: "numeric",
        orderable: true,
        compare: (a, b) => {
          // custom sort function for the profile column
          if (a.includes("hidden") && !b.includes("hidden")) {
            return -1; // a contains hidden, so a should come before b
          } else if (!a.includes("hidden") && b.includes("hidden")) {
            return 1; // b contains hidden, so b should come before a
          } else {
            return 0; // no difference, do not sort
          }
        },
      },
      {
        targets: 5, // index of the OS column
        type: "numeric",
        orderable: true,
        compare: (a, b) => {
          // custom sort function for the OS column
          if (a.includes("🐧") && !b.includes("🐧")) {
            return -1; // a contains 🐧, so a should come before b
          } else if (!a.includes("🐧") && b.includes("🐧")) {
            return 1; // b contains 🐧, so b should come before a
          } else {
            return 0; // no difference, do not sort
          }
        },
      },
      // {
      //   targets: "_all", // Apply to all columns
      //   defaultContent: "", // Provide default content if the cell is empty
      // },
    ],
    // createdRow: (row, data, dataIndex) => {
    //   if (data["related"]) {
    //     $(row).addClass("text-danger");
    //   }
    // },
    pageLength: 30,
  });
  table
    .order([
      [4, "desc"], // Sort by VAC first, in descending order
      [5, "desc"], // Then sort by OS containing 🐧, in descending order
      [6, "asc"], // Then sort by least created days, in ascending order
      [9, "asc"], // Then sort by lowest playtime first, in ascending order
      [7, "desc"], // Then sort by hidden profiles, in descending order
      [8, "asc"], // Finally sort by lower level first, in ascending order
    ])
    .draw();
};

const findRelations = (tableData) => {
  tableData.forEach((element) => {
    element.related = "";
    element.related_steamids = "";
    const name = element.personaname;
    element?.friends?.forEach((friend) => {
      const friendId = friend.steamid;
      const friendEntry = tableData.find((el) => el.id === friendId);
      if (friendEntry) {
        friendEntry.related += ` ${name}`;
        element.related_steamids += ` ${element.id}`;
        if (!element.related) {
          element.related = name;
        } else {
          element.related += `, ${name}`;
        }
      }
      // if (friendEntry) {
      //   const span = createSpan(name, "red");
      //   friendEntry.related += ` ${name}`;
      //   element.related_steamids += ` ${element.id}`;
      //   if (!element.related) {
      //     element.related = span;
      //   } else {
      //     element.related += `, ${span.innerHTML}`;
      //   }
      // }
    });
  });
  return tableData;
};

// const createSpan = (content, color) => {
//   const span = document.createElement("span");
//   span.style.color = color;
//   span.innerHTML = content;
//   return span;
// };
