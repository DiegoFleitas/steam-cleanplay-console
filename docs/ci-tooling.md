## CI Tooling

- **Bun**: GitHub Actions workflows use Bun `1.3.11` via `oven-sh/setup-bun@v2`.
- **Package manager lock**: `package.json` declares `"packageManager": "bun@1.3.11"` to keep local and CI environments aligned.

### Installation in CI

- Dependencies are installed with:

```bash
bun install --frozen-lockfile
```

This guarantees that CI uses the exact dependency graph described in `bun.lock`. If the lockfile is out of date, the workflow will fail.

### Tests in CI

- The `test:ci` script runs Vitest in non-watch, single-run mode:

```bash
bun run test:ci
```

- `ci.yml` and `deploy-fly.yml` both call this script to ensure consistent behavior between local and CI runs.

### Caching (optional)

If you later want to cache Bun install artifacts:

- Use `bun pm cache` path and `actions/cache` explicitly, or add a cache step keyed on `bun.lock`.
