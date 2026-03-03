import type { Request, Response } from "express";
import axiosHelper from "../helpers/axios.js";
import { getCacheValue, setCacheValue } from "../helpers/redis.js";
import { getSteamApiKey } from "../helpers/config.js";

const axios = axiosHelper();
const cacheTtl = Number(process.env.CACHE_TTL) || 60; // minutes

function addApiKeyToUrl(url: string): string {
  const urlObj = new URL(url);
  const domain = urlObj.hostname;
  switch (domain) {
    case "api.steampowered.com": {
      const apiKey = getSteamApiKey();
      if (apiKey) {
        urlObj.searchParams.append("key", apiKey);
      }
      break;
    }
    default:
      break;
  }
  const result = urlObj.toString();
  console.log(result);
  return result;
}

export const proxy = async (req: Request, res: Response): Promise<Response | void> => {
  const url = req.originalUrl.replace("/api/proxy/", "");
  const { method } = req;
  try {
    if (!url) {
      console.log("No url");
      return res.status(404).json({ message: "Url not found" });
    }
    let response: { status: number; data?: unknown };

    const cacheKey = `proxy:${method}:${url}:${JSON.stringify(req.body ?? {})}`;
    const cachedResponse = await getCacheValue(cacheKey);
    if (cachedResponse) {
      console.log("Response found (cached)");
      return res.status(200).json(cachedResponse);
    }

    switch (method) {
      case "GET":
        response = await axios.get(addApiKeyToUrl(url));
        break;
      case "POST":
        response = await axios.post(addApiKeyToUrl(url));
        break;
      default:
        return res.status(405).json({ error: "Method Not Allowed" });
    }
    await setCacheValue(cacheKey, response?.data, cacheTtl);
    return res.status(response.status).json(response?.data);
  } catch (error: unknown) {
    const err = error as { response?: { status?: number; statusText?: string; data?: unknown } };
    const status = err?.response?.status ?? 500;
    console.log(`[proxy] ${status} ${err?.response?.statusText ?? ""}`);
    if (status === 401) {
      const data = err?.response?.data ?? {};
      return res.status(status).json(data);
    }
    return res.status(status).json({ error: "Internal Server Error" });
  }
};
