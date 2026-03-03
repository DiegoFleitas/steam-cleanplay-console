import request from 'supertest';
import app from '../../app.ts';
import * as redisHelper from '../../helpers/redis.ts';

describe('redis health endpoint', () => {
  it('returns 200 OK when redis is healthy', async () => {
    const spy = vi.spyOn(redisHelper, 'isHealthy').mockResolvedValue(true);
    const res = await request(app).get('/redis-healthcheck');
    expect(res.status).toBe(200);
    expect(res.text).toBe('OK');
    spy.mockRestore();
  });

  it('returns 500 when redis is not healthy', async () => {
    const spy = vi.spyOn(redisHelper, 'isHealthy').mockResolvedValue(false);
    const res = await request(app).get('/redis-healthcheck');
    expect(res.status).toBe(500);
    expect(res.text).toBe('Redis is not healthy');
    spy.mockRestore();
  });
});
