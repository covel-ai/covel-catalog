# Covel Catalog

Shared directory infrastructure for [Covel Worlds](https://worlds.covel.cc) and [Covel Plugins](https://plugins.covel.cc): GitHub Topics discovery, version history, policy, reproducible downloads, metrics and one configurable UI.

首版采用 **一个 Node 26 服务 + SQLite + 私有磁盘缓存**。两个静态站点继续部署到 GitHub Pages。当前无需 Redis、S3 或 Kubernetes；本仓不自动创建服务器或云资源。

## Run

```sh
npm ci --ignore-scripts
npm test
npm start
```

Health: `http://127.0.0.1:8787/healthz`. A fresh service returns 503 for catalogs/downloads until a valid policy and complete snapshots have been published. It never invents an empty live directory.

For Docker, configure `.env` from `.env.example` using three distinct scoped credentials from your secret manager, then:

```sh
docker compose up --build -d
```

The container runs as a non-root user with a read-only root filesystem and a private persistent volume. Port 8787 binds to host loopback; an HTTPS reverse proxy provides `api.covel.cc`. See [operations and recovery](docs/operations.md) before deployment. The checked-in policy is an initial review draft requiring an explicit renewal/review before publication.

## One canonical implementation

| Path | Responsibility |
| --- | --- |
| `packages/catalog-kit/src` | Schema, GitHub transport, resumable collection, releases, packaging, SQLite ledger, HTTP API and policy |
| `packages/catalog-kit/adapters` | Shared Plugins/Worlds manifest parsers and plugin download validation |
| `packages/catalog-kit/ui` | The same shadcn/ui components, layout, navigation, search and themes for both sites |
| `packages/catalog-kit/tools/sync.mjs` | Fixed-commit synchronization and SHA256 verification for both consumers |
| `packages/catalog-kit/templates` | Shared Pages workflow contract |
| `service` | Node entry point and WAL-safe backup/recovery |
| `catalog/policy.json` | Independently published withdrawal rules; not tied to crawl success |

Consumers vendor `packages/catalog-kit` at a full commit SHA and record repository, path, version and every file's SHA256. CI rejects changed, missing, linked or extra files. Never edit a vendor copy. Import the installed package with `@covel/catalog-kit/adapters/plugins`, `@covel/catalog-kit/adapters/worlds` or `@covel/catalog-kit/tools/sync`.

Consumers keep their package content, collection configuration, thin collector/site entry points and acceptance tests. An upgrade is reviewed once, then pinned and tested in both consumers. [Protocol](packages/catalog-kit/SPEC.md) · [Sync instructions](docs/consumers.md) · [Architecture and costs / 费用评估](docs/costs.md).

## Provenance and boundaries

Initial extraction: `covel-ai/covel-plugins` commit `08c14fef2827ff28ca4841ac35e7dec3efb1ab9b`, with the Worlds adapter and sync tool from `covel-ai/covel-worlds` commit `daf8927367ef81456602e772e4e0b3940c8df61d`. Both are MIT licensed. Shared kit version 0.2.0 establishes this repository as canonical; it does not change the wire schema version.

GitHub stars are repository-level. `downloadRequests` means successful, idempotent ticket issuance, not completed downloads or installations. `indexed` describes metadata completeness, not a security review. Client installation/update integration, Workers/D1/R2 adapters and multi-instance storage are separate future work.
