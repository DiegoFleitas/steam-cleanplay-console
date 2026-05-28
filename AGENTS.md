# cleanplay-console

**Stack:** Bun 1.3, Express, Vite (vanilla TS frontend), Redis, Fly.io

## Dev commands

```sh
bun run dev       # Vite :5173 + Express :3000 (concurrently)
bun run build     # vite build (required before `bun run start`)
bun run start     # bun server.ts — returns 503 if no build
bun run lint      # eslint . --ext .ts,.tsx,.mts
bun run lint:fix  # with --fix
bun run format    # prettier --write (with import sorting)
bun run format:check
bun run typecheck # tsc --noEmit
bun run test:ci   # vite build && vitest run (CI-style)
bun run test      # vite build && vitest
```

**Required order:** `lint → typecheck → test:ci → build` (CI runs in this order, deploy too).

## Architecture

- **Backend entry:** `server.ts` → `app.ts` (Express). Imports use `.js` extension (`module: "NodeNext"`).
- **Frontend entry:** `public/index.html` (Vite root = `public/`). Vanilla TS modules via `<script type="module">`.
- **Dev proxy:** Vite proxies `/api/*` → `http://localhost:3000`. Always load from :5173, never :3000.
- **Two frontend bundles:** `vac-check/` (ban table) + `bad-actors-graph/` (social graph); share state via `public/src/state.ts`.
- **Redis:** `helpers/redis.ts` — lazy-connects on first use, SHA-256 cache keys with configurable TTL (`CACHE_TTL`, default 1 min).
- **Proxy:** `controllers/proxy.ts` — coalesces duplicate in-flight requests per cache key, auto-injects `key` param to `api.steampowered.com` via `getSteamApiKey()`.

## Testing

- Vitest with `vitest.config.mts`. Backend tests = `node` env, frontend tests = `jsdom` env (matched by glob).
- Use `@src` alias instead of deep relative paths (maps to `public/src`).
- **No real API key needed:** `proxy.test.ts` sets `STEAM_API_KEY` in `beforeEach`.
- Blacklist tests use fixtures from `tests/fixtures/` (tiny schema-correct samples, not full payloads).

## Conventions & quirks

- `tsconfig.json`: `strict: false` but `strictNullChecks`, `noUnusedLocals`, `noUnusedParameters` are on.
- ESLint: flat config (`eslint.config.cjs`), only `.ts,.tsx,.mts` files. `@typescript-eslint/no-explicit-any` is **warn**.
- Prettier: `@ianvs/prettier-plugin-sort-imports` for import ordering.
- Pre-commit: Husky → lint-staged runs `eslint --fix && prettier --write` on staged `.ts,.tsx,.js,.jsx`.
- Blacklists under `public/src/utils/blacklists/` are JS-only files, excluded from language stats.
- `dotenv` loaded in `app.ts` at import time.
- `STEAM_API_KEY` throws in production/staging if missing; warns + returns `""` in dev/test.
- `.nvmrc` lists Node 24 but actual runtime is **Bun** (`>=1.1.0`, pinned `bun@1.3.11`).

## Env

| Var               | Notes                                        |
| ----------------- | -------------------------------------------- |
| `STEAM_API_KEY`   | Required in prod. Not needed for unit tests. |
| `FLYIO_REDIS_URL` | Defaults to `redis://localhost:6379`         |
| `FLY_APP_NAME`    | Used in Redis key prefix and flyctl commands |
| `PRETTIFY_LOGS`   | Boolean, controls Fly logger formatting      |

## Docker / Deploy

- `docker compose up` runs app + redis. Compose sets `FLYIO_REDIS_URL=redis://redis:6379`.
- Dockerfile multi-stage with `oven/bun:1.3`. Internal port 8080. `CMD bun run start`.
- Deploy via `flyctl deploy` (or `bun run fly:deploy`). Secrets must be set via `flyctl secrets set`.
