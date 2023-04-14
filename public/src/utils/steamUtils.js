import SteamID from "steamid";

export const getId = (inputSteamID) => {
  try {
    const steamID = new SteamID(inputSteamID);
    const steam64identifier = steamID.getSteamID64();
    console.log(inputSteamID, steam64identifier);
    return steam64identifier;
  } catch (error) {
    console.log(`Invalid Steam ID: ${inputSteamID}`, error);
    return null;
  }
};
