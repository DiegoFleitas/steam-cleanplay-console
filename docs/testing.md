## Testing

- **Test runner**: [Vitest](https://vitest.dev/) runs both backend and frontend tests.
- **Config**: `vitest.config.mts`:
  - Discovers tests under `tests/**/*.test.[jt]s`.
  - Uses `environmentMatchGlobs` so:
    - `tests/backend/**` run in the Node environment.
    - `tests/frontend/**` run in the jsdom environment.
  - Exposes an alias `@src` that points to `public/src`.

### Commands

- Run all tests once (CI-style):

```bash
pnpm test:ci
```

- Run all tests in watch mode:

```bash
pnpm test:watch
```

- Run the Vitest UI:

```bash
pnpm test:ui
```

### Import conventions

- Prefer the `@src` alias in tests instead of deep relative paths, for example:

```js
import { getLocation } from "@src/utils/steamUtils.js";
```

- For very large data files (like blacklist lists), use small fixtures or mocks:
  - `tests/fixtures/blacklists.sample.js` provides a tiny, schema-correct sample.
  - `tests/frontend/blacklists.test.js` uses this fixture so tests validate **shape** without loading massive payloads.

### Environment and secrets

- Backend tests that rely on `STEAM_API_KEY`:
  - `tests/backend/proxy.test.js` sets a default `process.env.STEAM_API_KEY = "test-steam-api-key"` in `beforeEach`.
  - This means **no real Steam API key or CI secret is required** to run tests locally or in CI.

