declare const $: (selector: string) => { DataTable: (opts: unknown) => { clear: () => unknown; draw: () => void } };
declare const Popper: { createPopper: (ref: Element, tooltip: HTMLElement) => { destroy: () => void } };

import STATE from "../state.js";
import { discoverFriendships } from "../utils/steamUtils.js";

let table: { clear: () => unknown; draw: () => void } | null = null;

export const clearTable = (): void => {
  if (table) {
    (table.clear() as { draw: () => void }).draw();
  } else {
    console.warn("DataTable instance not found. Cannot clear table.");
  }
};

const setupTableData = (vacLookup: Record<string, Record<string, unknown>>): unknown[] => {
  const uniqueIds = new Set<string>();
  let tableData: Record<string, unknown>[] = [];

  for (const key in vacLookup) {
    if (Object.prototype.hasOwnProperty.call(vacLookup, key)) {
      const currentItem = vacLookup[key] as Record<string, unknown> & { id: string };
      if (!uniqueIds.has(currentItem.id)) {
        uniqueIds.add(currentItem.id);
        tableData.push(currentItem);
      } else {
        console.log(`Duplicate item with id ${currentItem.id} found:`, currentItem);
      }
    }
  }

  tableData = tableData.map((row) => {
    const r = row as Record<string, unknown> & { link_html?: HTMLElement; personaname_html?: HTMLElement; vac_html?: HTMLElement; profile?: string; os?: string };
    const gameNickWords = (r.link_html as HTMLElement)?.innerText?.replace(/[\W_]+/g, "").trim() ?? "";
    const steamNickWords = (r.personaname_html as HTMLElement)?.innerText?.replace(/[\W_]+/g, "").trim() ?? "";
    const differentNicks = gameNickWords !== steamNickWords;
    return {
      ...row,
      gameNickWords,
      steamNickWords,
      differentNicks,
      gameNickOuterHTML: (r.link_html as HTMLElement)?.outerHTML?.trim(),
      steamNickOuterHTML: (r.personaname_html as HTMLElement)?.outerHTML?.trim(),
      hasVAC: (r.vac_html as HTMLElement)?.outerHTML?.includes("VAC"),
      isHidden: (r.profile as string)?.includes("hidden"),
      hasLinuxHours: (r.os as string)?.includes("🐧"),
    };
  });

  const friendships = discoverFriendships(tableData as Parameters<typeof discoverFriendships>[0]);

  tableData = tableData.map((row) => {
    const r = row as { id: string };
    let relatedPersonas = "";
    const relatedPlayers = friendships?.get(r.id)?.relatedPlayers;
    if (relatedPlayers) {
      relatedPersonas = Array.from(
        relatedPlayers,
        (id) => (friendships?.get(id) as { name?: string })?.name
      ).join(" ");
    }
    return { ...row, relatedPersonas };
  });

  return tableData;
};

export const drawTable = (): void => {
  const tableData = setupTableData(STATE.vacLookup as Record<string, Record<string, unknown>>) as unknown[];

  tableData.sort(
    (a: unknown, b: unknown) => {
      const ax = a as Record<string, unknown>;
      const bx = b as Record<string, unknown>;
      return (
        Number(bx.hasVAC) - Number(ax.hasVAC) ||
        Number(ax.timecreated) - Number(bx.timecreated) ||
        Number(bx.hasLinuxHours) - Number(ax.hasLinuxHours) ||
        Number(bx.differentNicks) - Number(ax.differentNicks) ||
        Number(bx.isHidden) - Number(ax.isHidden) ||
        Number(ax.playtime) - Number(bx.playtime) ||
        Number(ax.level) - Number(bx.level)
      );
    }
  );

  table = $("#dataTable").DataTable({
    data: tableData,
    responsive: true,
    paging: true,
    searching: true,
    ordering: true,
    info: true,
    lengthChange: false,
    order: [],
    language: { search: "Search all columns: " },
    columns: [
      { data: "id", visible: false },
      {
        title: "Avatar",
        data: "avatar_html",
        render: (data: HTMLElement) => data?.outerHTML ?? "",
        defaultContent: "",
        searchable: false,
      },
      {
        title: "Game nick",
        data: "link_html",
        render: (_data: unknown, _type: unknown, row: Record<string, unknown>) => {
          if (row?.differentNicks) {
            const element = document.createElement("div");
            element.innerHTML = `<del>${row?.gameNickOuterHTML}</del><br>${row?.steamNickOuterHTML}`;
            const del = element.querySelector("del");
            if (del) {
              del.classList.add("has-tooltip");
              (del as HTMLElement).dataset.tooltip =
                "This player in-game nick differs from their steam account name.";
            }
            return element.innerHTML;
          }
          return (row?.gameNickOuterHTML as string) ?? `<a href="https://steamcommunity.com/profiles/${row?.id}" target="_blank">${row?.name}</a>`;
        },
        defaultContent: "",
      },
      {
        title: "Other",
        data: "other_html",
        render: (data: HTMLElement) => `${data?.outerHTML ?? ""}`,
        defaultContent: "",
        searchable: false,
      },
      {
        title: "VAC",
        data: "vac_html",
        render: (data: HTMLElement) => data?.outerHTML,
        defaultContent: "",
      },
      { title: "OS", data: "os", defaultContent: "" },
      { title: "Created", data: "timecreated", defaultContent: "" },
      { title: "Profile", data: "profile", defaultContent: "" },
      { title: "Level", data: "level", defaultContent: "" },
      { title: "Playtime (hrs)", data: "playtime", defaultContent: "" },
      { title: "Location", data: "location", defaultContent: "" },
      {
        title: "Steam nick",
        visible: false,
        data: "personaname_html",
        render: (data: HTMLElement) => data?.outerHTML,
        defaultContent: "",
      },
      {
        title: "Groups",
        data: "groups_html",
        render: (data: HTMLElement) => `${data?.outerHTML ?? ""}`,
        defaultContent: "",
      },
      { title: "Created (raw)", visible: false, data: "timecreated_raw", defaultContent: "" },
      {
        title: "Related",
        visible: false,
        data: "relatedPersonas",
        render: (data: unknown) => (data as string) ?? "",
        defaultContent: "",
      },
      {
        title: "Summary",
        visible: true,
        data: "summary",
        render: (data: unknown) => ((data as string) === "No information given." ? "" : data) as string,
        defaultContent: "",
      },
    ],
    columnDefs: [
      { targets: 4, type: "boolean", orderable: true, data: "hasVAC" },
      { targets: 7, type: "boolean", orderable: true, data: "isHidden" },
      { targets: 5, type: "boolean", orderable: true, data: "hasLinuxHours" },
      { targets: 2, type: "boolean", orderable: true, data: "differentNicks" },
      { targets: 14, className: "break-word" },
    ],
    pageLength: 30,
  });
  table.draw();

  const tooltip = document.createElement("div");
  tooltip.classList.add("tooltip");
  document.body.append(tooltip);

  let popperInstance: { destroy: () => void } | null = null;

  document.addEventListener(
    "mouseenter",
    (e: Event) => {
      const target = e.target as HTMLElement;
      if (target?.matches?.(".has-tooltip")) {
        tooltip.innerText = target.dataset.tooltip ?? "";
        tooltip.style.display = "block";
        popperInstance = Popper.createPopper(target, tooltip);
      }
    },
    true
  );

  document.addEventListener(
    "mouseleave",
    (e: Event) => {
      const target = e.target as HTMLElement;
      if (target?.matches?.(".has-tooltip")) {
        tooltip.style.display = "none";
        if (popperInstance) {
          popperInstance.destroy();
          popperInstance = null;
        }
      }
    },
    true
  );
};
