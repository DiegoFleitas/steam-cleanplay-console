export const setCache = async (key, value, label = "") => {
  const fullKey = `${label}:${key}`;
  try {
    if (!value) return;
    const timestamp = Date.now();
    console.log(
      `[LOCALFORAGE_SET] ${fullKey} (${JSON.stringify(
        value,
        null,
        2
      )}) TTL: ${timestamp}`
    );
    await localforage.setItem(`${fullKey}`, { value, timestamp });
  } catch (error) {
    console.log(`[LOCALFORAGE_SET_ERROR] (${fullKey})`);
    console.log(error);
  }
};

export const getCache = async (key, label) => {
  const fullKey = `${label}:${key}`;
  try {
    const HOUR_IN_MS = 1000 * 60 * 60;
    const cacheRecord = await localforage.getItem(fullKey);
    if (cacheRecord && Date.now() - cacheRecord.timestamp <= HOUR_IN_MS) {
      console.log(`[LOCALFORAGE_HIT] ${fullKey}`, cacheRecord.value);
      return cacheRecord.value;
    } else {
      console.log(`[LOCALFORAGE_MISS] ${fullKey}`);
      await localforage.removeItem(fullKey); // might have expired
      return null;
    }
  } catch (error) {
    console.log(`[LOCALFORAGE_GET_ERROR] (${fullKey})`);
    console.log(error);
    return null;
  }
};
