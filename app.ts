import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import { config as dotenvConfig } from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import { proxy } from './controllers/index.js';
import { session } from './middleware/index.js';

dotenvConfig();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", 'https://unpkg.com', 'https://cdn.datatables.net', "'unsafe-inline'"],
        styleSrc: [
          "'self'",
          'https://cdnjs.cloudflare.com',
          'https://cdn.datatables.net',
          'https://fonts.googleapis.com',
          "'unsafe-inline'",
        ],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: [
          "'self'",
          'https://avatars.steamstatic.com',
          'https://steamcdn-a.akamaihd.net',
          'data:',
        ],
        connectSrc: ["'self'"],
        frameAncestors: ["'none'"],
      },
    },
  }),
);

// On Vercel, static files are served by the CDN, not Express.
if (!process.env.VERCEL) {
  const publicDir = path.join(__dirname, 'public');
  const distDir = path.join(publicDir, 'dist');
  const hasBuild = fs.existsSync(path.join(distDir, 'index.html'));

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

  app.get('/healthcheck', (_req, res) => {
    res.status(200).send('OK');
  });
}

app.use(session);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.all(['/api/proxy', '/api/proxy/{*url}'], async (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
  res.setHeader('Vercel-CDN-Cache-Control', 'max-age=3600');
  return proxy(req, res);
});

export default app;
