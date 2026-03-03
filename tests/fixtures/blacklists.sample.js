export const customCheatingGroups = {
  groups: [
    {
      id: 103582791462182340,
      description: "Example cheating group",
    },
    {
      id: 103582791472548820,
      description: "Another example group",
    },
  ],
};

export const customList = {
  $schema:
    "https://raw.githubusercontent.com/PazerOP/tf2_bot_detector/master/schemas/v3/playerlist.schema.json",
  players: [
    {
      attributes: ["cheater"],
      last_seen: {
        player_name: "Example Player",
        time: 1613099920,
      },
      steamid: "76561197961137033",
    },
    {
      attributes: ["suspicious"],
      last_seen: {
        time: 1619563620,
      },
      steamid: "76561197961469458",
    },
  ],
};

