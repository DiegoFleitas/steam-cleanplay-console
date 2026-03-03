import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import request from 'supertest';
import app from '../../app.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('root route', () => {
  it('serves built frontend HTML instead of raw TypeScript when a build exists', async () => {
    const distIndexPath = path.join(__dirname, '../../public/dist/index.html');

    if (!fs.existsSync(distIndexPath)) {
      throw new Error(
        'Expected public/dist/index.html to exist. Run `pnpm build` before running this test.',
      );
    }

    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);

    // The built HTML should not reference raw .ts entrypoints or /src/ paths.
    expect(res.text).not.toMatch(/\.ts"/);
    expect(res.text).not.toMatch(/src="\/?src\//);
  });
});
