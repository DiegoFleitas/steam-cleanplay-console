## CI Tooling

- **Node.js**: GitHub Actions workflows use `node-version: 20.x` via `actions/setup-node@v4`.
- **pnpm**: pnpm is installed via `pnpm/action-setup@v4` with `version: 10.30.0`.
- **Package manager lock**: `package.json` declares `"packageManager": "pnpm@10.30.0"` to keep local and CI environments aligned.

### Installation in CI

- Dependencies are installed with:

```bash
pnpm install --frozen-lockfile
```

This guarantees that CI uses the exact dependency graph described in `pnpm-lock.yaml`. If the lockfile is out of date, the workflow will fail.

### Tests in CI

- The `test:ci` script runs Vitest in non-watch, single-run mode:

```bash
pnpm test:ci
```

- `ci.yml` and `deploy-fly.yml` both call this script to ensure consistent behavior between local and CI runs.

### Caching (optional)

If you later want to cache pnpm packages:

- Use `pnpm store path` and `actions/cache` explicitly.
- Do **not** enable `cache: pnpm` in `actions/setup-node` when also using `pnpm/action-setup`, to avoid conflicting cache strategies.
