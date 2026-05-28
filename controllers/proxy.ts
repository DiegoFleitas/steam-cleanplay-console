import type { Request, Response } from 'express';
import axiosHelper from '../helpers/axios.js';
import { getSteamApiKey } from '../helpers/config.js';
import { getCacheValue, setCacheValue } from '../helpers/redis.js';
import { acquireToken } from '../helpers/throttle.js';

const axios = axiosHelper();
type ProxyResult = { status: number; data: unknown };

const ALLOWED_DOMAINS = new Set(['api.steampowered.com', 'steamcommunity.com', 'logs.tf']);

interface MemoryCacheEntry {
  data: unknown;
  status: number;
  expiresAt: number;
}

const memoryCache = new Map<string, MemoryCacheEntry>();
const MEMORY_CACHE_TTL_MS = 5 * 60 * 1000;

function getMemoryCache(key: string): MemoryCacheEntry | undefined {
  const entry = memoryCache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    return undefined;
  }
  return entry;
}

function setMemoryCache(key: string, data: unknown, status: number): void {
  memoryCache.set(key, { data, status, expiresAt: Date.now() + MEMORY_CACHE_TTL_MS });
  if (memoryCache.size > 2000) {
    const oldestKey = memoryCache.keys().next().value;
    if (oldestKey) memoryCache.delete(oldestKey);
  }
}

function getStaleMemoryCache(key: string): MemoryCacheEntry | undefined {
  return memoryCache.get(key);
}

// Coalesce identical in-flight requests for the same URL+method+body.
// This prevents stampedes when the cache is cold and the user clicks rapidly.
const inFlight = new Map<string, Promise<ProxyResult>>();

function validateUrl(rawUrl: string): URL {
  const urlObj = new URL(rawUrl);
  if (!['http:', 'https:'].includes(urlObj.protocol)) {
    throw Object.assign(new Error('Invalid protocol'), { status: 400 });
  }
  if (!ALLOWED_DOMAINS.has(urlObj.hostname)) {
    throw Object.assign(new Error('Domain not allowed'), { status: 403 });
  }
  return urlObj;
}

function addApiKeyToUrl(url: string): string {
  const urlObj = validateUrl(url);
  if (urlObj.hostname === 'api.steampowered.com') {
    const apiKey = getSteamApiKey();
    if (apiKey) {
      urlObj.searchParams.append('key', apiKey);
    }
  }
  const result = urlObj.toString();
  console.log(`[proxy] Fetching: ${urlObj.origin}${urlObj.pathname}`);
  return result;
}

export function __resetCache(): void {
  memoryCache.clear();
}

export const proxy = async (req: Request, res: Response): Promise<Response | void> => {
  const url = decodeURIComponent(req.originalUrl.replace('/api/proxy/', ''));
  const { method } = req;
  try {
    if (!url) {
      console.log('No url');
      return res.status(404).json({ message: 'Url not found' });
    }
    let response: { status: number; data?: unknown };

    const bodyKey = method === 'GET' ? '' : JSON.stringify(req.body ?? {});
    const cacheKey = `proxy:${method}:${url}:${bodyKey}`;

    const memoryEntry = getMemoryCache(cacheKey);
    if (memoryEntry) {
      console.log('[CACHE] Memory hit');
      return res.status(memoryEntry.status).json(memoryEntry.data);
    }

    const existingInFlight = inFlight.get(cacheKey);
    if (existingInFlight) {
      const result = await existingInFlight;
      return res.status(result.status).json(result.data);
    }

    const responsePromise: Promise<ProxyResult> = (async () => {
      const cachedResponse = await getCacheValue(cacheKey);
      if (cachedResponse) {
        console.log('[CACHE] Redis hit');
        setMemoryCache(cacheKey, cachedResponse, 200);
        return { status: 200, data: cachedResponse };
      }

      const targetUrl = addApiKeyToUrl(url);
      if (targetUrl.includes('api.steampowered.com')) {
        await acquireToken();
      }

      switch (method) {
        case 'GET':
          response = await axios.get(targetUrl);
          break;
        case 'POST':
          response = await axios.post(targetUrl);
          break;
        default:
          return { status: 405, data: { error: 'Method Not Allowed' } };
      }

      setMemoryCache(cacheKey, response.data, response.status);
      setCacheValue(cacheKey, response.data, 300);
      return { status: response.status, data: response.data };
    })().finally(() => {
      inFlight.delete(cacheKey);
    });

    inFlight.set(cacheKey, responsePromise);
    const result = await responsePromise;
    return res.status(result.status).json(result.data);
  } catch (error: unknown) {
    const err = error as {
      status?: number;
      message?: string;
      response?: { status?: number; statusText?: string; data?: unknown };
    };
    const status = err?.status ?? err?.response?.status ?? 500;
    const message = err?.message ?? err?.response?.statusText ?? 'Internal Server Error';
    console.log(`[proxy] ${status} ${message}`);
    if (status === 401 || status === 429) {
      const bodyKey = method === 'GET' ? '' : JSON.stringify(req.body ?? {});
      const cacheKey = `proxy:${method}:${url}:${bodyKey}`;
      const stale = getStaleMemoryCache(cacheKey);
      if (stale) {
        console.log('[CACHE] Serving stale on rate limit');
        res.set('X-Cache', 'STALE');
        return res.status(stale.status).json(stale.data);
      }
      if (status === 429) {
        console.log('[CACHE] Rate limited, no stale cache - returning empty');
        return res.status(200).json({});
      }
      const data = err?.response?.data ?? {};
      return res.status(status).json(data);
    }
    if (status === 400 || status === 403) {
      return res.status(status).json({ error: message });
    }
    return res.status(status).json({ error: 'Internal Server Error' });
  }
};
