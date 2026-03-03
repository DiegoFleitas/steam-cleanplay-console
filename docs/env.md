## Environment configuration

Environment variables are loaded via `dotenv` (see `app.ts`) and read at runtime from `process.env`.

### Core variables

- **`STEAM_API_KEY`** (required in production/staging)
  - Used by the backend proxy (`controllers/proxy.js`) to authenticate requests to `api.steampowered.com`.
  - Centralized in `helpers/config.js` via `getSteamApiKey()`.
  - Behavior:
    - In `NODE_ENV=production` or `NODE_ENV=staging`, missing `STEAM_API_KEY` throws an error.
    - In development/test, missing `STEAM_API_KEY` logs a warning and returns an empty string, so you can run the app without a real key.

- **`FLY_APP_NAME`**
  - Logical app name used by Fly.io tooling.

- **`FLYIO_REDIS_URL`**
  - Connection string for the Upstash Redis instance used by the app.

- **`PRETTIFY_LOGS`**
  - Optional flag to control log formatting when using the Fly logger.

See `.env.example` for all currently expected variables and sample values.

### Tests vs. production

- **Tests**:
  - Backend tests set a dummy `STEAM_API_KEY` in `beforeEach`, so they do not depend on real secrets.
  - Other env vars are generally not required for unit tests.

- **Production / staging**:
  - Set `STEAM_API_KEY`, `FLYIO_REDIS_URL`, and any other required values as Fly secrets:

```bash
flyctl secrets set STEAM_API_KEY="your-key" FLYIO_REDIS_URL="redis://..." -a <app-name>
```
