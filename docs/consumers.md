# Fixed-commit consumers

Canonical repository: `https://github.com/covel-ai/covel-catalog`, path `packages/catalog-kit`. No npm publication is required.

Keep a thin CLI in each consumer:

```js
import { fileURLToPath } from 'node:url';
import { kitCli } from '../vendor/catalog-kit/tools/sync.mjs';
await kitCli(process.argv.slice(2), fileURLToPath(new URL('../', import.meta.url)));
```

```sh
node scripts/catalog-kit.mjs sync --commit FULL_40_HEX_SHA
node scripts/catalog-kit.mjs check
```

For local review add `--source /path/to/covel-catalog`. The tool reads committed Git blobs, never uncommitted working files. Commit pins must be independently reviewed: a file hash manifest detects drift; it is not a signature or a trust certification.

The one-time migration from the old Plugins canonical uses the new canonical tool directly, with `--migrate-from-plugins`. That flag validates the old vendor manifest against its old repository before replacing it; normal checks accept only the new repository. A new consumer needs no migration flag. Once synchronized, use the vendor tool above.

Install `@covel/catalog-kit` from `file:vendor/catalog-kit` (site packages use the corresponding relative path). Run dependency installation from the consumer workspace, never inside vendor. npm consumers use `install-links=true` and a clean `npm ci`; pnpm consumers use file dependencies that install copies. After changing a pin, refresh lockfiles and verify installed package bytes match the new source; a same-version directory dependency can otherwise retain old bytes. Release kit versions for source changes.

Both consumers run the shared tests, their adapter/collector fixtures, workflow instantiation check and browser acceptance tests. The canonical repository runs the shared contracts, adapter fixtures, synchronization and real SQLite backup/restore tests, plus a container smoke test. The collector workflows remain instantiated from the pinned template. A kit upgrade must be applied to both sites before claiming rollout complete.
