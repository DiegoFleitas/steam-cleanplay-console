import request from 'supertest';
import type { Mock } from 'vitest';
import app from '../../app.ts';

vi.mock('../../helpers/axios.ts', () => {
  const get = vi.fn();
  const post = vi.fn();
  const axiosInstance = { get, post };
  const factory = () => axiosInstance;
  return { __esModule: true, default: factory, axiosInstance };
});

vi.mock('../../helpers/redis.ts', async () => {
  const actual =
    await vi.importActual<typeof import('../../helpers/redis.ts')>('../../helpers/redis.ts');
  return {
    ...actual,
    getCacheValue: vi.fn(),
    setCacheValue: vi.fn(),
  };
});

describe('proxy endpoint', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    if (!process.env.STEAM_API_KEY) {
      process.env.STEAM_API_KEY = 'test-steam-api-key';
    }
    const { __resetCache } = await import('../../controllers/proxy.ts');
    const { __resetThrottle } = await import('../../helpers/throttle.ts');
    __resetCache();
    __resetThrottle();
  });

  it('returns 404 when url is missing', async () => {
    const res = await request(app).get('/api/proxy/');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: 'Url not found' });
  });

  it('returns cached response when available', async () => {
    const { getCacheValue } = await import('../../helpers/redis.ts');
    (getCacheValue as Mock).mockResolvedValue({ foo: 'bar' });

    const res = await request(app).get('/api/proxy/https://api.steampowered.com/test');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ foo: 'bar' });
  });

  it('proxies GET request on cache miss', async () => {
    const { getCacheValue } = await import('../../helpers/redis.ts');
    const { axiosInstance } = await import('../../helpers/axios.ts');

    (getCacheValue as Mock).mockResolvedValue(null);
    (axiosInstance.get as Mock).mockResolvedValue({
      status: 200,
      data: { ok: true },
    });

    const res = await request(app).get('/api/proxy/https://api.steampowered.com/test');

    expect(axiosInstance.get).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it('injects STEAM_API_KEY into Steam API requests', async () => {
    const { getCacheValue } = await import('../../helpers/redis.ts');
    const { axiosInstance } = await import('../../helpers/axios.ts');

    process.env.STEAM_API_KEY = 'injected-key';
    (getCacheValue as Mock).mockResolvedValue(null);
    (axiosInstance.get as Mock).mockResolvedValue({
      status: 200,
      data: { ok: true },
    });

    const res = await request(app).get(
      '/api/proxy/https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/',
    );

    expect(res.status).toBe(200);
    expect(axiosInstance.get).toHaveBeenCalledTimes(1);
    expect((axiosInstance.get as Mock).mock.calls[0][0]).toContain(
      'https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/',
    );
    expect((axiosInstance.get as Mock).mock.calls[0][0]).toContain('key=injected-key');
  });

  it('forwards non-401 error status codes as 500 by default', async () => {
    const { getCacheValue } = await import('../../helpers/redis.ts');
    const { axiosInstance } = await import('../../helpers/axios.ts');

    (getCacheValue as Mock).mockResolvedValue(null);
    (axiosInstance.get as Mock).mockRejectedValue({
      response: { status: 500, statusText: 'Internal Error' },
    });

    const res = await request(app).get('/api/proxy/https://api.steampowered.com/test');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Internal Server Error' });
  });

  it('handles 429 gracefully with empty response body', async () => {
    const { getCacheValue } = await import('../../helpers/redis.ts');
    const { axiosInstance } = await import('../../helpers/axios.ts');

    (getCacheValue as Mock).mockResolvedValue(null);
    (axiosInstance.get as Mock).mockRejectedValue({
      response: {
        status: 429,
        statusText: 'Too Many Requests',
        data: { retry_after: 60 },
      },
    });

    const res = await request(app).get('/api/proxy/https://api.steampowered.com/test');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({});
  });

  it('decodes URL-encoded target URL before proxying', async () => {
    const { getCacheValue } = await import('../../helpers/redis.ts');
    const { axiosInstance } = await import('../../helpers/axios.ts');

    (getCacheValue as Mock).mockResolvedValue(null);
    (axiosInstance.get as Mock).mockResolvedValue({
      status: 200,
      data: { ok: true },
    });

    const res = await request(app).get('/api/proxy/https%3A%2F%2Fapi.steampowered.com%2Ftest');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
    expect(axiosInstance.get).toHaveBeenCalledTimes(1);
    expect((axiosInstance.get as Mock).mock.calls[0][0]).toContain(
      'https://api.steampowered.com/test?key=',
    );
  });

  it('forwards 401 error with original response body', async () => {
    const { getCacheValue } = await import('../../helpers/redis.ts');
    const { axiosInstance } = await import('../../helpers/axios.ts');

    (getCacheValue as Mock).mockResolvedValue(null);
    (axiosInstance.get as Mock).mockRejectedValue({
      response: {
        status: 401,
        statusText: 'Unauthorized',
        data: { reason: 'invalid key' },
      },
    });

    const res = await request(app).get('/api/proxy/https://api.steampowered.com/test');

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ reason: 'invalid key' });
  });
});
