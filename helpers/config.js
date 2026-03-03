const NODE_ENV = process.env.NODE_ENV || "development";

const isProdLike = ["production", "staging"].includes(NODE_ENV);

export const getEnv = (name, defaultValue = "") => {
  const value = process.env[name];
  if (value !== undefined && value !== null && String(value).length > 0) {
    return value;
  }

  if (isProdLike && defaultValue === "") {
    throw new Error(`Environment variable ${name} is required`);
  }

  return defaultValue;
};

export const getSteamApiKey = () => {
  const value = process.env.STEAM_API_KEY;
  if (value && value.trim().length > 0) {
    return value;
  }

  if (isProdLike) {
    throw new Error("Environment variable STEAM_API_KEY is required");
  }

  // In development and test, allow running without a real key.
  // Callers can choose not to append the key when this returns an empty string.
  console.warn(
    "[config] STEAM_API_KEY is not set; continuing without an API key (non-production environment).",
  );
  return "";
};

