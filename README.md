<div align="center">
  <img src="public/img/white.svg" alt="Cleanplay Console logo" width="72" />
  <h1>Cleanplay Console</h1>
  <p><em>Inspect TF2 and CS:GO players for Steam bans and visualize their social connections.</em></p>
</div>

<div align="center">

[![Tests](https://github.com/DiegoFleitas/steam-cleanplay-console/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/DiegoFleitas/steam-cleanplay-console/actions/workflows/ci.yml)

</div>

---

Paste the output of the in-game `status` command and Cleanplay Console looks up each player's VAC/game ban history, Steam level, owned games, and friend list, then renders a social graph of how everyone in the match is connected.

## Features

- VAC ban table with ban counts, ban types, and days since last ban per player
- Social graph (Cytoscape.js) showing friend connections between players in the match
- Cross-references against tf2botdetector, TacoBot, MCD, and custom blacklists; flags known cheater groups as graph nodes
- Backend request coalescing so duplicate Steam API calls for the same player are merged
- Optional Redis caching for local development, keyed by SHA-256 hash (disabled on Vercel)

## How to use

1. Open your game console and run `status`
2. Copy the output (player lines look like `# 809 "name" [U:1:172149372] 29:11 100 0 active`)
3. Paste into the text area on the page and click **Wash away the cheats™**

The ban table and social graph update together as data arrives.

## Getting started

### Prerequisites

- [Bun](https://bun.sh) ≥ 1.1.0 (pinned to `bun@1.3.11` in `package.json`)
- A [Steam Web API key](https://steamcommunity.com/dev/apikey)
- Redis (optional, local caching only)

### Installation

```bash
bun install
cp .env.example .env   # set STEAM_API_KEY at minimum
bun run dev
```

Open `http://localhost:5173`. This starts Vite (frontend) and Express (backend) concurrently. Vite proxies `/api/*` to Express on `:3000`.

> [!IMPORTANT]
> Always use `:5173` during development. Opening `:3000` directly serves raw files without TypeScript compilation.

## Environment variables

| Variable        | Required      | Description                                                                   |
| --------------- | ------------- | ----------------------------------------------------------------------------- |
| `STEAM_API_KEY` | In production | Steam Web API key. Throws on startup if missing in `production`/`staging`.    |
| `REDIS_URL`     | No            | Redis connection string for local caching. Example: `redis://localhost:6379`. |

In development and test environments a missing `STEAM_API_KEY` logs a warning instead of throwing, so you can run the app and unit tests without a real key.

## Development

```bash
bun run lint        # ESLint
bun run lint:fix
bun run format      # Prettier with import sorting
bun run format:check
bun run typecheck   # tsc --noEmit
bun run test        # vite build + vitest (watch mode)
bun run test:ci     # vite build + vitest run (single pass)
```

CI runs `lint → typecheck → test:ci → build` on every push and pull request. Husky + lint-staged auto-fix and format staged files on commit.

## Project structure

```
steam-cleanplay-console/
├── server.ts                   # Entry point, starts Express
├── app.ts                      # Express setup (routes, middleware, dotenv)
├── api/index.ts                # Vercel serverless function adapter
├── controllers/proxy.ts        # Steam API proxy with request coalescing
├── helpers/                    # axios, redis, config, throttle utilities
├── middleware/
├── public/
│   ├── index.html              # Single-page app shell
│   ├── src/
│   │   ├── vac-check/          # Ban table (Vite bundle)
│   │   ├── bad-actors-graph/   # Social graph, Cytoscape.js (Vite bundle)
│   │   └── utils/              # Shared: API requests, blacklists, concurrency
│   └── dist/                   # Built output (generated)
└── tests/
    ├── backend/                # Supertest integration tests (Node env)
    └── frontend/               # Vitest unit tests (jsdom env)
```

## Deploying to Vercel

Pushes to `main` deploy automatically via the Vercel GitHub integration.

Set `STEAM_API_KEY` in Vercel **Settings → Environment Variables** before the first deploy. Vercel serves the frontend as a static site from CDN; the Express backend runs as a serverless function handling `/api/proxy/*`.

> [!NOTE]
> Redis is disabled on Vercel. Serverless functions don't support persistent TCP connections, so the cache layer is bypassed automatically.

For a manual deploy:

```bash
bun run build
vercel --prod
```
