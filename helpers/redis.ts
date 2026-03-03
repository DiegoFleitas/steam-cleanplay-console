import redis, { type RedisClientType } from "redis";
import crypto from "crypto";

let redisClient: RedisClientType | null = null;

export const isHealthy = async (): Promise<boolean> => {
  const client = await getRedisClient();
  if (!client) {
    return false;
  }
  try {
    const result = await client.ping();
    return result === "PONG";
  } catch (error) {
    console.log(`[REDIS_PING_ERROR] ${error}`);
    return false;
  }
};

const getRedisClient = async (): Promise<RedisClientType | null> => {
  if (!redisClient) {
    try {
      const options = {
        url: process.env.FLYIO_REDIS_URL || "redis://localhost:6379",
        disableOfflineQueue: true,
        socket: {
          connectTimeout: 10000,
        },
      };
      console.log("[REDIS_OPTIONS]", options);
      redisClient = redis.createClient(options) as RedisClientType;
      redisClient
        .on("error", (error: Error) => {
          console.log(`[REDIS_CLIENT_ERROR] ${error}`);
          throw error;
        })
        .on("connect", () => {
          console.log("Connected to Redis");
        });
      await redisClient.connect();
    } catch (error) {
      console.error(error);
    }
  }
  return redisClient;
};

export const getCacheValue = async (key: string): Promise<unknown> => {
  const client = await getRedisClient();
  if (!client) {
    return null;
  }
  try {
    const hashedKey = getCacheKey(key);
    const value = await client.get(hashedKey);
    !value
      ? console.log(`[REDIS_MISS] ${hashedKey} (${key})`)
      : console.log(`[REDIS_HIT] ${hashedKey} (${key})`);
    try {
      return JSON.parse(value) as unknown;
    } catch {
      return value;
    }
  } catch (error) {
    console.log(`[REDIS_GET_ERROR] (${key}) ${error}`);
    return null;
  }
};

export const setCacheValue = async (
  key: string,
  value: unknown,
  ttl: number = 60
): Promise<boolean | null> => {
  const client = await getRedisClient();
  if (!client) {
    return null;
  }
  try {
    const serializedValue = JSON.stringify(value);
    const hashedKey = getCacheKey(key);
    const result = await client.set(hashedKey, serializedValue, { EX: ttl });
    console.log(`[REDIS_SET] ${hashedKey} (${key}) TTL: ${ttl}`);
    return result === "OK";
  } catch (error) {
    console.log(`[REDIS_SET_ERROR] (${key}) ${error}`);
    return null;
  }
};

const getCacheKey = (str: string): string => {
  const hash = crypto.createHash("sha256");
  hash.update(str);
  return `${process.env.FLY_APP_NAME || "app"}:${hash.digest("hex")}`;
};
