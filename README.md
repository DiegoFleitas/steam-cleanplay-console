[![Tests](https://github.com/DiegoFleitas/steam-cleanplay-console/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/DiegoFleitas/steam-cleanplay-console/actions/workflows/ci.yml)

# Steam Cleanplay Console

A web-based tool to check if players in a Team Fortress 2 or Counter-Strike: Global Offensive matches have any Steam bans. It also features a social graph to visualize the relationships between players based on their Steam friendships / relevant groups.

## Development

This repo uses [Bun](https://bun.sh) as the runtime and package manager (`packageManager` is pinned in `package.json`). Install dependencies first:

```sh
bun install
```

Optional Git hooks are documented under **Coding standards** below.

Vite is used for development and building the front-end application. It provides fast development with features like hot module replacement (HMR) and efficient production builds. Vite is configured using `vite.config.js` in the project root. All requests with the `/api` prefix are forwarded to the back-end Express server during development, using the vite server-proxy configuration.

- Rename `.env.example` to `.env` and update the values (at minimum `STEAM_API_KEY`)
- Run `bun run dev`
- **Open the app at http://localhost:5173** (Vite). Do not use http://localhost:3000 during development—the backend runs on 3000 and serves raw files; the frontend must be loaded from Vite so TypeScript is compiled and scripts run correctly.

Production and `bun run start` require a built frontend. Run `bun run build` before `bun run start`. If you open http://localhost:3000 when no build exists, the server returns **503 Service Unavailable** with the message "Frontend not built. Run \`bun run build\` and try again."

## Tests

Vitest is used for both backend and frontend tests.

- **Run all tests**: `bun run test`
- **Run tests once (CI)**: `bun run test:ci`
- **Watch mode**: `bun run test:watch`
- **Test UI**: `bun run test:ui`
- **TypeScript check**: `bun run typecheck`

Test files live under the `tests` folder:

- Backend tests in `tests/backend` (Node environment)
- Frontend and UI tests in `tests/frontend` (jsdom / DOM-focused)

## TypeScript

The app is written in TypeScript. Backend entry is `server.ts` (run with Bun). New modules should be added in `.ts`; prefer type inference and avoid `any` where practical. Data-only blacklist files under `public/src/utils/blacklists` remain JavaScript.

## Coding standards

- **Linting**: ESLint with TypeScript support.
  - Run lint: `bun run lint`
  - Auto-fix lint issues: `bun run lint:fix`
- **Formatting**: Prettier (with import sorting).
  - Format code: `bun run format`
  - Check formatting (CI-safe): `bun run format:check`
- **Type checking**: strict TypeScript options enabled for app code.
  - Run typecheck: `bun run typecheck`
- **CI**:
  - GitHub Actions run `bun run lint`, `bun run typecheck`, `bun run test:ci`, and `bun run build` on pushes/PRs.
- **Dependencies & security**:
  - Dependabot is configured to open weekly dependency update PRs.
  - Basic dependency audit: `bun audit`
- **Git hooks** (optional): after `bun install`, run `bun run setup:hooks` once (needs **Node 18+** on your `PATH`). That registers Husky; pre-commit runs **lint-staged** from `node_modules/.bin` so it works from terminals and the VS Code Git UI (Git’s `PATH` usually does not include `bunx`). CI runs the same lint/format checks without hooks.

## Deployment (Vercel)

The app is deployed on Vercel (Hobby/free tier). The frontend is built as a static site and served by Vercel's CDN. The Express backend runs as a serverless function handling `/api/proxy/*` requests.

### Automatic deploys

Pushes to the `main` branch are automatically deployed via the Vercel GitHub integration.

### Required environment variables

Set these in your Vercel project dashboard (Settings → Environment Variables):

| Variable        | Description                                        |
| --------------- | -------------------------------------------------- |
| `STEAM_API_KEY` | Steam Web API key (required for the proxy to work) |

### Manual deploy

```bash
vercel --prod
```

### Local preview of production build

```bash
bun run build
bun run start
```

## Environment Variables

See `.env.example` for all expected variables.

| Variable        | Description                                           |
| --------------- | ----------------------------------------------------- |
| `STEAM_API_KEY` | Steam Web API key (required in production)            |
| `REDIS_URL`     | Redis connection string (optional, for local caching) |

## Redis (local development only)

The proxy can optionally cache responses in Redis. Redis is **disabled on Vercel** (serverless functions don't support persistent TCP connections). For local dev, set `REDIS_URL` in `.env` and run Redis locally:

```bash
redis-server
```
