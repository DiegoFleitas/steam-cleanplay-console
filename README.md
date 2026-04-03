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

**Prerequisites:** Docker, to run the Redis image described in the `redis` folder.

- Rename `.env.example` to `.env` and update the values.
- Run `bun run dev`.
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
  - Deploy workflow also runs lint, typecheck, and tests before deploying to Fly.io.
- **Dependencies & security**:
  - Dependabot is configured to open weekly dependency update PRs.
  - Basic dependency audit: `bun audit`
- **Git hooks** (optional): after `bun install`, run `bun run setup:hooks` once (needs **Node 18+** on your `PATH`). That registers Husky; pre-commit runs **lint-staged** from `node_modules/.bin` so it works from terminals and the VS Code Git UI (Git’s `PATH` usually does not include `bunx`). CI runs the same lint/format checks without hooks.

## Troubleshooting

- Read `redis/README.md`.
- **Hooks won’t install**: run `node ./node_modules/husky/bin.js` from the repo root instead of `bun run setup:hooks`. If that still fails, skip hooks and use `bun run lint` / `bun run format` before pushing; CI will catch issues.

## Deployment

- Replace "name" & "app" strings with your new app name at package.json at fly.toml (respectively)
- Run `bun install`
- Rename .env.example to .env
- Run `flyctl launch`
- When prompted for a builder, choose the **Dockerfile** build (the image uses Bun).
- Run `bun run fly:deploy` (for future deployments only this command will be needed)

## Stopping / Starting app

- `bun run fly:stop`
- `bun run fly:start`

## Read app secrets

- `bun run fly:ssh`
- type `env`
- quit with `exit`

## Set app secrets

Add them to .env file. Alternatively use fly.io built command but note those take precedence over the ones at .env

- `flyctl secrets set SECRET="myvalue" -a <app-name>`

## Read server logs

From terminal

- `bun run fly:logs`

## Redis

Upstash Redis can be created with `flyctl redis create`

- `flyctl redis list` & copy redis name
- `flyctl redis status <redis-name>` & then copy the Private URL & set the proper env variable at the .env file

## Other

Currently hosted free of charge on Fly.io

- https://fly.io/blog/shipping-logs/
- https://fly.io/docs/reference/redis/
