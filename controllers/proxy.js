import axiosHelper from "../helpers/axios.js";
const axios = axiosHelper();
import { getCacheValue, setCacheValue } from "../helpers/redis.js";

const cacheTtl = process.env.CACHE_TTL || 60; // minutes

export const proxy = async (req, res) => {
  const url = req.originalUrl.replace("/api/proxy/", "");
  const { method } = req;
  try {
    if (!url) {
      console.log("No url");
      return res.status(404).json({ message: "Url not found" });
    }
    let response;

    const cacheKey = `proxy:${method}:${url}:${JSON.stringify(req.body)}`;
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
    }
    await setCacheValue(cacheKey, response?.data, cacheTtl);
    return res.status(response.status).json(response?.data);
  } catch (error) {
    const status = error?.response?.status || 500;
    console.log(`[proxy] ${status} ${error?.response?.statusText}`);
    if (status === 401) {
      const data = error?.response?.data || {};
      return res.status(status).json(data);
    }
    return res.status(status).json({ error: "Internal Server Error" });
  }
};

// this way we avoid leaking secrets to client side
const addApiKeyToUrl = (url) => {
  const urlObj = new URL(url);
  const domain = urlObj.hostname;
  switch (domain) {
    case "api.steampowered.com":
      urlObj.searchParams.append("key", process.env.STEAM_API_KEY);
      break;
    default:
      break;
  }
  const result = urlObj.toString();
  console.log(result);
  return result;
};
