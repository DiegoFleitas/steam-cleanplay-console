import { locations } from "./steamCountries.js";

export const getId = (inputSteamID) => {
  try {
    const steamID = new SteamID(inputSteamID);
    const steam64identifier = steamID.getSteamID64();
    // console.log(inputSteamID, steam64identifier);
    return steam64identifier;
  } catch (error) {
    // console.log(`Invalid Steam ID: ${inputSteamID}`, error);
    return null;
  }
};

export const getLocation = (countryCode, stateCode, cityId) => {
  let locationParts = [];

  if (locations?.[countryCode]) {
    locationParts.push(locations?.[countryCode]?.countryName || "");

    if (locations?.[countryCode]?.states?.[stateCode]) {
      locationParts.push(
        locations?.[countryCode]?.states?.[stateCode]?.stateName || ""
      );

      if (locations?.[countryCode]?.states?.[stateCode]?.cities?.[cityId]) {
        locationParts.push(
          locations?.[countryCode]?.states?.[stateCode]?.cities?.[cityId]
            .cityName || ""
        );
      }
    }
  }

  // console.log("getLocation", [countryCode, stateCode, cityId], locationParts);
  return locationParts.filter((part) => part).join(", ");
};
