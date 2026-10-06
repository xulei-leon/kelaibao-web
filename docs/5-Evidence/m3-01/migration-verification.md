# M3-01 Migration Verification Evidence

## Context

- Date: 2026-07-31 (Asia/Shanghai)
- Baseline: `HEAD` before `products/sino-cn/` → `products/kelaibao/`
- Verification target: FR-15 and `sprint-m3-01`
- Result: local migration verification passed; Production remains blocked by the existing external legacy gates.

## Directory and Runtime Contract

- `products/kelaibao/` is the only Chinese website project directory; `products/sino-cn/` does not remain as a copy, junction, or compatibility package.
- `package.json` uses `kelaibao-website`.
- Runtime/configuration/current-governance scans found no public `赛诺全网` brand and no active `products/sino-cn` path.
- Implementation scans found no `site_key` or generic `webservice` abstraction.
- M2 compatibility identifiers remain unchanged where renaming would alter deployment, cookie, security, migration, sanitizer, or ESA protocol semantics, including `SINO_RUNTIME_MODE`, `SINO_APP_VERSION`, `saino_admin_session`, `saino-admin-csrf-v1`, `saino_quanwang_schema_migrations`, `saino-html-2026-07-v1`, and `x-saino-idempotency-key`.

## Database and Migration Invariance

The Git blob at the pre-migration path was compared with the worktree blob at the migrated path. Every pair was identical:

| File | Blob hash | Result |
| --- | --- | --- |
| `migrations/001_core_schema.sql` | `c3cdca441b220ee839ee03c96b97599efb395e28` | Identical |
| `migrations/002_security_foundation.sql` | `91767bcc2c6c654b5ce42fd97ac9030c118b87ad` | Identical |
| `migrations/003_content_publication.sql` | `5d5471c8f3696a8f1a2946cce32c5d39187ad9a5` | Identical |
| `src/server/db/migrations.ts` | `f447736ccc73cfbcbaef06113abfaa1ed50cf15e` | Identical |
| `src/server/db/pool.ts` | `a7ac873766fb5873ebc9ebd8f9cf317f32cb53ef` | Identical |
| `src/server/db/runtime.ts` | `0316846818b199574c2adc85f8b6f472d2b58084` | Identical |
| `scripts/migrate.mjs` | `3abbfe61b87e9e2c234af2d22c35cc293fc2dcd4` | Identical |

`FC-Deployment-Runbook.md` changes only document why the two existing `SINO_*` deployment variables remain compatible. The migration release-step instructions are unchanged.

## Adjacent Product Isolation

- `git diff --submodule=short -- products/sino-en products/geo-agent`: no output.
- `git status --short -- products/sino-en products/geo-agent`: no output.
- `products/geo-agent` remains at submodule commit `9a2e2d05a3f18609effcdbe4abf93e2818def0ab`.

## Verification Results

| Check | Result |
| --- | --- |
| `pnpm test` | PASS — 40 files, 179 tests |
| `pnpm lint` | PASS — `tsc --noEmit` |
| `pnpm build` | PASS — optimized production build and standalone packaging completed |
| `pnpm smoke:standalone` | PASS — SSR, Route Handler, runtime env, and public page smoke |
| `pnpm validate:release` | PASS — `CODE_READY_WITH_EXTERNAL_LEGACY`, `localReady=true`, `productionReady=false` |
| `git diff --check` | PASS |
| Active Kelaibao Markdown links | PASS — 20 active governance/design/plan files |
| Forbidden runtime brand/path scan | PASS |

The build emitted a non-fatal dynamic-font network timeout for `fonts.gstatic.com`; compilation, static generation, build traces, standalone packaging, and the subsequent standalone smoke all completed successfully.

## Remaining External Gates

M3-01 does not close DirectMail live-send, ESA, FC, RDS, OSS, production-domain/ICP, professional-review/authorization, production WeCom/browser, recovery, observability, or cost/budget evidence. `pnpm validate:release` correctly keeps these as Production blockers.
