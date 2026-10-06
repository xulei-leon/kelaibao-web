# Sprint M4-01 Database Adapter And Local SQLite Test Runtime Code Review

Review date: 2026-08-01

Reviewer: GPT-5.5

## Scope

Reviewed only the M4-01 implementation areas requested in the delegation: database adapter config, repository factory wiring, SQLite runtime/schema/repositories, auth/content/media/purge route wiring, maintenance/release scripts, M4-01 docs/evidence, and M4-01 tests.

Unrelated page, CSS, QR, content-layout, site-config, and other working-tree changes were not reviewed.

## Findings

| Severity | Type | Location | Issue | Evidence | Recommendation |
| --- | --- | --- | --- | --- | --- |
| Medium | Security / Path Safety | `src/server/config.ts:47`, `scripts/lib/sqlite-local-test.mjs:33`, `scripts/sqlite-maintenance.mjs:19` | SQLite path validation is lexical for the runtime config and only validates the parent realpath in the maintenance helper. An existing `.local-data/*.sqlite` symlink can still be opened by `node:sqlite`, so local-test migrate/runtime may write outside the allowed `.local-data` boundary. | `sqlitePath()` accepts a target based on `resolve()`/`relative()` and extension only. `assertSafeExistingSqlitePath()` checks `lstatSync(parent)` and builds `actualTarget` with `resolve(actualParent, basename)`, but it does not `lstat` or `realpath` an existing target file before `new DatabaseSync(target)`. The runbook says reset must not operate on linked paths (`docs/2-Design/Admin-Security-and-Media-Runbook.md:16`), and FR-19 requires real-path validation against symlink/junction escape. Existing `tests/sqlite-maintenance.test.ts` covers outside paths but not existing target symlinks/junctions. | Before opening or deleting a SQLite database, reject an existing target that is a symlink/reparse point, or compare the existing target's `realpath` against the allowed `.local-data` realpath. Apply the same realpath-safe helper to runtime config/open and maintenance scripts, and add tests for target-file symlink, parent junction/symlink, and sidecar boundaries. |
| Medium | Correctness / Fail-Closed Config | `src/server/config.ts:124`, `src/server/config.ts:154`, `scripts/admin-maintenance.mjs:168` | Partial or ambiguous SQLite configuration is not consistently fail-closed. Server config only infers MySQL from `DATABASE_URL`; if `SQLITE_DATABASE_PATH` or `DATABASE_RUNTIME_SCOPE=local-test` is set without `DATABASE_ADAPTER=sqlite` and without `DATABASE_URL`, preview silently returns an unconfigured database. The admin maintenance script separately defaults to MySQL, so `DATABASE_URL` plus SQLite variables with no explicit adapter can run MySQL maintenance instead of failing ambiguous config. | FR-19 says only `DATABASE_URL` may infer MySQL, SQLite must be explicit local-test, and mixed MySQL/SQLite variables must fail. In `resolveServerConfig()`, `adapter` is `requestedAdapter || (databaseUrl ? "mysql" : undefined)`, then the no-DB preview path returns `{ runtimeMode, appVersion }` without rejecting stray SQLite variables. In `admin-maintenance.mjs`, `const adapter = process.env.DATABASE_ADAPTER?.trim() || "mysql"` bypasses `resolveServerConfig()` and does not reject `SQLITE_DATABASE_PATH` when defaulting to MySQL. Current `tests/m2-server-config.test.ts:83` covers explicit adapter conflicts, but not SQLite variables without an adapter. | Treat any SQLite-specific variable without `DATABASE_ADAPTER=sqlite` as an invalid partial SQLite configuration, except where a test helper injects a validated runtime directly. Reuse the same adapter-config resolver in `admin-maintenance.mjs` or mirror its full conflict matrix, and add negative tests for SQLite path/scope without adapter and for `admin:bootstrap` with both `DATABASE_URL` and SQLite variables but no explicit adapter. |

## Notes

- No Critical or High findings were identified in the reviewed M4-01 scope.
- Repository factory routing is present for the reviewed admin/content/media/purge routes and public/discovery runtime. A scoped scan found factory usage rather than direct `new MySql*Repository()` construction in those paths.
- SQLite auth/content/media/purge writes use `BEGIN IMMEDIATE` through a per-path in-process lock, and the focused tests cover login/session/logout, concurrent failed login lockout, content publish/offline, local purge, media metadata, release validation, and maintenance reset happy/outside/production cases.

## Verification

Ran:

```powershell
pnpm vitest run tests/m2-server-config.test.ts tests/m3-release-cli.test.ts tests/sqlite-admin-flow.test.ts tests/sqlite-auth-integration.test.ts tests/sqlite-content-integration.test.ts tests/sqlite-maintenance.test.ts tests/sqlite-media-repository.test.ts
```

Result: 7 test files passed, 22 tests passed.

