import type { Request, Response } from 'express';
import axiosHelper from '../helpers/axios.js';
import { getSteamApiKey } from '../helpers/config.js';
import { getCacheValue } from '../helpers/redis.js';

const axios = axiosHelper();
type ProxyResult = { status: number; data: unknown };

// Coalesce identical in-flight requests for the same URL+method+body.
// This prevents stampedes when the cache is cold and the user clicks rapidly.
const inFlight = new Map<string, Promise<ProxyResult>>();

function addApiKeyToUrl(url: string): string {
  const urlObj = new URL(url);
  const domain = urlObj.hostname;
  switch (domain) {
    case 'api.steampowered.com': {
      const apiKey = getSteamApiKey();
      if (apiKey) {
        urlObj.searchParams.append('key', apiKey);
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
  const url = req.originalUrl.replace('/api/proxy/', '');
  const { method } = req;
  try {
    if (!url) {
      console.log('No url');
      return res.status(404).json({ message: 'Url not found' });
    }
    let response: { status: number; data?: unknown };

    // Keep cache/in-flight keys stable for GET requests (front-end only uses GET here).
    // For GET, any req.body variations would otherwise prevent coalescing.
    const bodyKey = method === 'GET' ? '' : JSON.stringify(req.body ?? {});
    const cacheKey = `proxy:${method}:${url}:${bodyKey}`;

    const existingInFlight = inFlight.get(cacheKey);
    if (existingInFlight) {
      const result = await existingInFlight;
      return res.status(result.status).json(result.data);
    }

    const responsePromise: Promise<ProxyResult> = (async () => {
      const cachedResponse = await getCacheValue(cacheKey);
      if (cachedResponse) {
        console.log('Response found (cached)');
        return { status: 200, data: cachedResponse };
      }

      switch (method) {
        case 'GET':
          response = await axios.get(addApiKeyToUrl(url));
          break;
        case 'POST':
          response = await axios.post(addApiKeyToUrl(url));
          break;
        default:
          return { status: 405, data: { error: 'Method Not Allowed' } };
      }

      return { status: response.status, data: response.data };
    })().finally(() => {
      inFlight.delete(cacheKey);
    });

    inFlight.set(cacheKey, responsePromise);
    const result = await responsePromise;
    return res.status(result.status).json(result.data);
  } catch (error: unknown) {
    const err = error as { response?: { status?: number; statusText?: string; data?: unknown } };
    const status = err?.response?.status ?? 500;
    console.log(`[proxy] ${status} ${err?.response?.statusText ?? ''}`);
    if (status === 401 || status === 429) {
      const data = err?.response?.data ?? {};
      return res.status(status).json(data);
    }
    return res.status(status).json({ error: 'Internal Server Error' });
  }
};
