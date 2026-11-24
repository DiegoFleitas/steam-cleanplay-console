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

// Success responses may be cached by the CDN; error responses must never be,
// otherwise a transient upstream failure is served as a real answer for an hour.
const SUCCESS_CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
  'Vercel-CDN-Cache-Control': 'max-age=3600',
};

function sendSuccess(res: Response, status: number, data: unknown): Response {
  res.set(SUCCESS_CACHE_HEADERS);
  return res.status(status).json(data);
}

function sendError(
  res: Response,
  status: number,
  body: unknown,
  retryAfterSeconds?: unknown,
): Response {
  res.set('Cache-Control', 'no-store');
  res.set('Vercel-CDN-Cache-Control', 'no-store');
  if (retryAfterSeconds !== undefined && retryAfterSeconds !== null) {
    res.set('Retry-After', String(retryAfterSeconds));
  }
  return res.status(status).json(body);
}

export function __resetCache(): void {
  memoryCache.clear();
}

export const proxy = async (req: Request, res: Response): Promise<Response | void> => {
  const { method } = req;
  let url = '';
  try {
    // decodeURIComponent throws URIError on malformed % sequences; keep it inside
    // the try so it cannot escape to Express's default handler.
    try {
      url =
        (req.query.url as string) ?? decodeURIComponent(req.originalUrl.replace('/api/proxy/', ''));
    } catch {
      return sendError(res, 400, { error: 'Malformed URL' });
    }
    if (!url) {
      console.log('No url');
      return sendError(res, 404, { message: 'Url not found' });
    }
    let response: { status: number; data?: unknown };

    const bodyKey = method === 'GET' ? '' : JSON.stringify(req.body ?? {});
    const cacheKey = `proxy:${method}:${url}:${bodyKey}`;

    const memoryEntry = getMemoryCache(cacheKey);
    if (memoryEntry) {
      console.log('[CACHE] Memory hit');
      return sendSuccess(res, memoryEntry.status, memoryEntry.data);
    }

    const existingInFlight = inFlight.get(cacheKey);
    if (existingInFlight) {
      const result = await existingInFlight;
      return sendSuccess(res, result.status, result.data);
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
    return sendSuccess(res, result.status, result.data);
  } catch (error: unknown) {
    const err = error as {
      status?: number;
      message?: string;
      response?: {
        status?: number;
        statusText?: string;
        data?: unknown;
        headers?: { 'retry-after'?: string };
      };
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
        return sendSuccess(res, stale.status, stale.data);
      }
      if (status === 429) {
        console.log('[CACHE] Rate limited, no stale cache - returning 429');
        return sendError(res, 429, {}, err?.response?.headers?.['retry-after'] ?? 60);
      }
      const data = err?.response?.data ?? {};
      return sendError(res, status, data);
    }
    if (status === 400 || status === 403) {
      return sendError(res, status, { error: message });
    }
    return sendError(res, status, { error: 'Internal Server Error' });
  }
};
