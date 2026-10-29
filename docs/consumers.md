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

## Shared default theme and first paint (0.3.1)

Both sites default to dark regardless of the system theme. Only the saved value `covel-theme=light` selects light; missing, invalid or inaccessible storage selects dark. An existing explicit light preference is retained. Theme and locale storage failures must not prevent the UI from rendering or switching in the current tab. Mounting does not write either preference; only an explicit user toggle does.

Keep `<html class="dark">` and insert the exact output of the shared generator into each site's `<head>`, after charset/viewport and before external styles or scripts:

```sh
node vendor/catalog-kit/tools/theme-bootstrap.mjs
```

The exported `themeBootstrap()` from `@covel/catalog-kit/tools/theme-bootstrap` produces the same text, delimited by `<!-- covel-theme:start -->` and `<!-- covel-theme:end -->`. Consumer checks can compare that block with the function output. Replace any old handwritten theme bootstrap and conflicting fixed light `theme-color` metadata; do not include two initializers. This is a synchronous inline script, not `type="module"`, so it applies a saved light preference before CSS/React arrives. Its fallback colors match the current frame palette; the main CSS variables take over once loaded. The initializer and React import the same preference functions, and both update `color-scheme` with the root class.

Browser acceptance should cover missing/invalid storage, explicit light and dark, throwing storage getters and writes, theme toggle plus reload, and first paint with external JS/CSS blocked under a light OS preference. Theme storage is origin-specific: the two hostnames share behavior, not browser storage. This release changes theme initialization only; it does not change download modes or installation guidance.
