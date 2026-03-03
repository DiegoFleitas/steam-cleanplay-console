declare const localforage: {
  setItem(key: string, value: unknown): Promise<void>;
  getItem(key: string): Promise<{ value: unknown; timestamp: number } | null>;
  removeItem(key: string): Promise<void>;
};

export const setCache = async (key: string, value: unknown, label = ''): Promise<void> => {
  const fullKey = `${label}:${key}`;
  try {
    if (!value) return;
    const timestamp = Date.now();
    console.log(
      `[LOCALFORAGE_SET] ${fullKey} (${JSON.stringify(value, null, 2)}) TTL: ${timestamp}`,
    );
    await localforage.setItem(fullKey, { value, timestamp });
  } catch (error) {
    console.log(`[LOCALFORAGE_SET_ERROR] (${fullKey})`);
    console.log(error);
  }
};

export const getCache = async (key: string, label: string): Promise<unknown> => {
  const fullKey = `${label}:${key}`;
  try {
    const HOUR_IN_MS = 1000 * 60 * 60;
    const cacheRecord = await localforage.getItem(fullKey);
    if (
      cacheRecord &&
      typeof cacheRecord === 'object' &&
      'timestamp' in cacheRecord &&
      Date.now() - (cacheRecord.timestamp as number) <= HOUR_IN_MS
    ) {
      console.log(`[LOCALFORAGE_HIT] ${fullKey}`, (cacheRecord as { value: unknown }).value);
      return (cacheRecord as { value: unknown }).value;
    }
    console.log(`[LOCALFORAGE_MISS] ${fullKey}`);
    await localforage.removeItem(fullKey);
    return null;
  } catch (error) {
    console.log(`[LOCALFORAGE_GET_ERROR] (${fullKey})`);
    console.log(error);
    return null;
  }
};
