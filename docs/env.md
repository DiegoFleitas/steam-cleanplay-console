## Environment configuration

Environment variables are loaded via `dotenv` (see `app.ts`) and read at runtime from `process.env`.

### Core variables

- **`STEAM_API_KEY`** (required in production/staging)
  - Used by the backend proxy (`controllers/proxy.js`) to authenticate requests to `api.steampowered.com`.
  - Centralized in `helpers/config.js` via `getSteamApiKey()`.
  - Behavior:
    - In `NODE_ENV=production` or `NODE_ENV=staging`, missing `STEAM_API_KEY` throws an error.
    - In development/test, missing `STEAM_API_KEY` logs a warning and returns an empty string, so you can run the app without a real key.

- **`REDIS_URL`**
  - Connection string for a local Redis instance. Only used in local development; Redis is disabled on Vercel.

See `.env.example` for all currently expected variables and sample values.

### Tests vs. production

- **Tests**:
  - Backend tests set a dummy `STEAM_API_KEY` in `beforeEach`, so they do not depend on real secrets.
  - Other env vars are generally not required for unit tests.

- **Production (Vercel)**:
  - Set `STEAM_API_KEY` in the Vercel project dashboard (Settings → Environment Variables).
