# M4-01 Code Review Report

## Scope
- Reviewed only the files specified by the user for M4-01, including configuration, repository factory/runtime wiring, route wiring, SQLite scripts, migrations, and tests.
- Review date: 2026-08-01

## Findings

| Severity | Type | Location | Issue | Evidence | Recommendation |
| --- | --- | --- | --- | --- | --- |
| Low | Path-safety / Security boundary | `src/server/config.ts:47-64`; `scripts/lib/sqlite-local-test.mjs:26-45` | Local SQLite path validation does not prevent symlinked SQLite files from bypassing the `.local-data` boundary. `resolveServerConfig`/`sqlitePath` use only textual `resolve/relative` checks, and `assertSafeExistingSqlitePath` validates only the parent directory’s symlink state. A `.local-data/<name>.sqlite` symlink can therefore point outside the repository and still pass validation. | `sqlitePath` checks `fromAllowedRoot.startsWith("..")` and extension only; it does not inspect `target` itself. `assertSafeExistingSqlitePath` computes `actualTarget = resolve(actualParent, target.slice(parent.length + 1))` from the raw path instead of resolving the target file path before boundary check. `tests/sqlite-maintenance.test.ts` covers only outside-path and production guards, not target symlink escapes. | Add a target-level `lstatSync`/`realpathSync` check in both runtime config resolution and script-side helper; reject symlink or junction files outside `.local-data`. Add a regression test that a symlinked `.sqlite` under `.local-data` is rejected in maintenance/config resolution.

## No other correctness, transaction/concurrency, CSRF/session, audit atomicity, no-network purge, or schema-drifts issues were identified in the reviewed M4-01 scope.
