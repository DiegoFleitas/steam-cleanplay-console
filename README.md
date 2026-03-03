# Steam Cleanplay Console

A web-based tool to check if players in a Team Fortress 2 or Counter-Strike: Global Offensive matches have any Steam bans. It also features a social graph to visualize the relationships between players based on their Steam friendships / relevant groups.

## Development

Vite is used for development and building the front-end application. It provides fast development with features like hot module replacement (HMR) and efficient production builds. Vite is configured using `vite.config.js` in the project root. All requests with the `/api` prefix are forwarded to the back-end Express server during development, using the vite server-proxy configuration.

PRE: You need to have docker to run the image at /redis folder

- Rename .env.example to .env & update the values
- Run `npm run dev`
- **Open the app at http://localhost:5173** (Vite). Do not use http://localhost:3000 during development—the backend runs on 3000 and serves raw files; the frontend must be loaded from Vite so TypeScript is compiled and scripts run correctly.

Production and `pnpm start` require a built frontend. Run `pnpm build` before `pnpm start` (or use `pnpm start`, which runs the build first). If you open http://localhost:3000 when no build exists, the server returns **503 Service Unavailable** with the message "Frontend not built. Run \`pnpm build\` and try again."

## Tests

Vitest is used for both backend and frontend tests.

- **Run all tests**: `pnpm test`
- **Run tests once (CI)**: `pnpm test:ci`
- **Watch mode**: `pnpm test:watch`
- **Test UI**: `pnpm test:ui`
- **TypeScript check**: `pnpm typecheck`

Test files live under the `tests` folder:

- Backend tests in `tests/backend` (Node environment)
- Frontend and UI tests in `tests/frontend` (jsdom / DOM-focused)

## TypeScript

The app is written in TypeScript. Backend entry is `server.ts` (run with `tsx`). New modules should be added in `.ts`; prefer type inference and avoid `any` where practical. Data-only blacklist files under `public/src/utils/blacklists` remain JavaScript.

## Coding standards

- **Linting**: ESLint with TypeScript support.
  - Run lint: `pnpm lint`
  - Auto-fix lint issues: `pnpm lint:fix`
- **Formatting**: Prettier (with import sorting).
  - Format code: `pnpm format`
  - Check formatting (CI-safe): `pnpm format:check`
- **Type checking**: strict TypeScript options enabled for app code.
  - Run typecheck: `pnpm typecheck`
- **CI**:
  - GitHub Actions run `pnpm lint`, `pnpm typecheck`, `pnpm test:ci`, and `pnpm build` on pushes/PRs.
  - Deploy workflow also runs lint, typecheck, and tests before deploying to Fly.io.
- **Dependencies & security**:
  - Dependabot is configured to open weekly dependency update PRs.
  - Basic dependency audit: `pnpm audit --prod`
- **Pre-commit hooks**:
  - Husky + lint-staged run ESLint and Prettier on staged files before each commit.

## Troubleshooting

- Read `redis/README.md`

## Deployment

- Replace "name" & "app" strings with your new app name at package.json at fly.toml (respectively)
- Run `npm i`
- Rename .env.example to .env
- Run `flyctl launch`
- When prompted for a builder, select builtin Nodejs.
- Run `npm run fly:deploy` (for future deployments only this command will be needed)

## Stopping / Starting app

- `npm run fly:stop`
- `npm run fly:start`

## Read app secrets

- `npm run fly:ssh`
- type `env`
- quit with `exit`

## Set app secrets

Add them to .env file. Alternatively use fly.io built command but note those take precedence over the ones at .env

- `flyctl secrets set SECRET="myvalue" -a <app-name>`

## Read server logs

From terminal

- `npm run fly:logs`

## Redis

Upstash Redis can be created with `flyctl redis create`

- `flyctl redis list` & copy redis name
- `flyctl redis status <redis-name>` & then copy the Private URL & set the proper env variable at the .env file

## Other

Currently hosted free of charge on Fly.io

- https://fly.io/blog/shipping-logs/
- https://fly.io/docs/reference/redis/
