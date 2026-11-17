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

## Project and publishing entry points (0.3.2)

Both directory shells explain their relationship to Covel and use the same labeled resource navigation in the sidebar, mobile menu and page footer. `CatalogConfig` requires these project links:

| Field | Destination |
| --- | --- |
| `projectUrl` | `https://covel.cc/` |
| `demoUrl` | `https://demo.covel.cc/` — the public demo requires the visitor's own API key |
| `docsUrl` | `https://covel.cc/docs/en/` |
| `projectRepository` | `https://github.com/ackness/covel` |

Keep `repository` pointing to the current directory's source and `guideUrl` to its publishing guide. They are distinct from the Covel application source and user documentation. These links do not change `siteUrl`/`siblingUrl` or the consumer's deployment overrides.

The contribution section and listing dialog share the same three steps: publish a public repository with valid package files; add either singular or plural Topic for the directory kind; wait for collection and metadata checks. Incomplete metadata remains pending. Each package in a multi-package repository has its own listing. Registration does not require a directory PR. This release changes discovery guidance and project navigation, not package installation or download protocols.

## Current Covel manifest contract (0.3.3)

Covel 0.0.52 dropped manifest fields that only repeated a default. The adapters and the download validator now derive them as Covel does instead of rejecting packages that leave them out:

| Field | Derived when not written |
| --- | --- |
| plugin `id` | package directory name; a root package uses the repository name; then the `package.json` name without scope and one `plugin-` prefix |
| plugin `kind` | `plugin` (a written `core` or other kind is still rejected) |
| plugin `entry` | `server/index.js` when the package has it |
| runtime `type` | function runtime when a `function` block exists, otherwise agent; a written `type` is ignored |
| `function.handler` | `./handler.js` beside the runtime manifest; the download validator rejects a missing file |
| `package.json` | optional; when present it must declare `"type": "module"` and no runtime dependencies. Its `name` and `version` are not required, so `version-mismatch` is no longer reported |
| world `id` | world directory name (the repository name for a root world) |
| world `schemaVersion`, `supportedLocales` | not read; editions come from `world.<locale>.yaml` / `WORLD.<locale>.md` beside `world.yaml` plus `defaultLocale` |
| world plugin preset | first `pack:` reference of `plugins`, else the legacy `pluginPolicy.presetId` |

Plugin and world IDs now follow Covel's pattern (start with a lowercase letter, `framework` reserved, at most 64 characters); a written ID that starts with a digit is now an invalid manifest. A plugin ID written next to a differently named directory stays pending with `directory-id-mismatch`.

Consumer actions:

- Sync the pin and reinstall cleanly as usual, then verify installed bytes.
- Fixtures that assert `version-mismatch`, a required `package.json`, world `supportedLocales` or `schemaVersion: "1.0"` must be updated. Fixtures may keep old manifests; they are still accepted.
- Run `collect:local` (or the local collection test) to confirm packages written to the current contract are indexed. No API, storage, schema or migration change is involved; snapshots and D1 data do not need rebuilding. A world entry's `locales` and `pluginPreset` can change at the next collection when its files and the old fields disagree.
