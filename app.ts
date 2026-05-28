import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import { logging } from 'diegos-fly-logger/index.mjs';
import { config as dotenvConfig } from 'dotenv';
import express from 'express';
import { proxy } from './controllers/index.js';
import { session } from './middleware/index.js';

dotenvConfig();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, 'public');
const distDir = path.join(publicDir, 'dist');
const hasBuild = fs.existsSync(path.join(distDir, 'index.html'));

const app = express();

// Serve only the built frontend at /. Never serve public/index.html (it references .ts and breaks when served by Express).
app.get('/', (_req, res) => {
  if (!hasBuild) {
    res
      .status(503)
      .set('Content-Type', 'text/plain')
      .send('Frontend not built. Run `bun run build` and try again.');
    return;
  }
  res.sendFile('index.html', { root: distDir });
});
if (hasBuild) {
  app.use(express.static(distDir));
}
app.use(express.static(publicDir));

app.use(session);

app.use(logging);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/healthcheck', (_req, res) => {
  res.status(200).send('OK');
});

app.all('/api/proxy/:url(*)', async (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=3600');
  return proxy(req, res);
});

export default app;
