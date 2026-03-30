## Deployment with Fly.io

GitHub Actions and Fly.io work together to build and deploy the app.

### Prerequisites

- A Fly.io app created from this repo (see `fly.toml`).
- GitHub Actions secret:
  - `FLY_API_TOKEN` – a Fly access token used by the deploy workflow.
- Fly app secrets:
  - `STEAM_API_KEY` – Steam Web API key used by the backend proxy.
  - `FLYIO_REDIS_URL` – Redis URL for Upstash Redis.

### GitHub Actions workflow

- Workflow file: `.github/workflows/deploy-fly.yml`.
- Key steps:
  - Checkout code.
  - Setup Bun 1.3.11.
  - Install dependencies with `bun install --frozen-lockfile`.
  - Run tests via `bun run test:ci`.
  - Setup Flyctl and run `bun run fly:deploy`.
  - After deploy, run `flyctl status` to confirm the app is healthy from Fly's perspective.

### Manual deployment

From your local machine:

```bash
bun install
flyctl launch
bun run fly:deploy
```

Make sure required secrets are set on the Fly app before deploying:

```bash
flyctl secrets set STEAM_API_KEY="your-key" FLYIO_REDIS_URL="redis://..." -a <app-name>
```

For more operational commands, see the main `README.md` (`fly:logs`, `fly:stop`, `fly:start`, etc.).
