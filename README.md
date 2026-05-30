[![Tests](https://github.com/DiegoFleitas/steam-cleanplay-console/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/DiegoFleitas/steam-cleanplay-console/actions/workflows/ci.yml)

# Steam Cleanplay Console

Web tool to check if TF2/CS:GO players have Steam bans, with a social graph visualizing friendships and group relationships between players.

## Development

Requires [Bun](https://bun.sh) (pinned in `package.json`).

```bash
bun install
cp .env.example .env   # set STEAM_API_KEY at minimum
bun run dev
```

Open `http://localhost:5173` (Vite). Don't use `:3000` during development — the backend serves raw files without TypeScript compilation.

## Tests

```bash
bun run test        # all tests
bun run test:ci     # single run (CI)
bun run typecheck
```

Backend tests in `tests/backend`, frontend tests in `tests/frontend`.

## Coding standards

```bash
bun run lint        # ESLint
bun run lint:fix
bun run format      # Prettier
bun run format:check
```

CI runs lint, typecheck, tests, and build on every push/PR. Husky runs lint-staged on commit.

## Deploy (Vercel)

Pushes to `main` deploy automatically via the Vercel GitHub integration. Set `STEAM_API_KEY` in Vercel Settings → Environment Variables. Manual deploy: `vercel --prod`.

Production requires a built frontend — run `bun run build` before `bun run start`.

## Environment variables

| Variable        | Description                                                                 |
| --------------- | --------------------------------------------------------------------------- |
| `STEAM_API_KEY` | Steam Web API key (required)                                                |
| `REDIS_URL`     | Redis connection string (optional, local caching only — disabled on Vercel) |

## Project structure

```
steam-cleanplay-console/
├── app.ts               # Express entry point
├── server.ts            # backend server
├── api/                 # Vercel serverless function handler
├── controllers/         # route handlers
├── helpers/             # axios, redis, config, throttle
├── middleware/
├── public/src/          # frontend (Vite)
└── tests/
    ├── backend/
    └── frontend/
```
