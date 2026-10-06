# Sprint M2-03 Code Review by GPT-5.5

## Scope

Reviewed the uncommitted M2-03 change set under `products/sino-cn`, including the tracked FR/plan/runbook/config/auth/admin-home diffs and the new migration, admin content pages, admin/internal API routes, content domain/repository/purge modules, ESA direct HTTPS provider, UI components, and M2-03 tests.

External evidence explicitly deferred by the sprint (`M2-LEGACY-01` and `M2-LEGACY-02`) was treated as out of scope and was not flagged as a defect.

## Findings

| Severity | Type | Location | Issue | Evidence | Recommendation |
| --- | --- | --- | --- | --- | --- |
| Medium | Correctness | `src/app/api/admin/content/[id]/publish/route.ts:52`, `src/app/api/admin/content/[id]/offline/route.ts:39`, `src/server/content/purge-runtime.ts:11-20`, `src/server/content/purge-jobs.ts:115-126` | Post-commit purge does not target the job created by the successful publish/offline transaction. | The content repository returns the new `purgeJobId` after inserting the precise URL job (`src/server/content/mysql-repository.ts:420-485`), but both route handlers discard that id and call `attemptPostCommitPurge()` with only a request id. The helper then calls `processNextPurgeJob()`, whose repository method claims the oldest ready job by `ORDER BY next_attempt_at ASC, id ASC`, not the just-enqueued job. Under backlog, the response can report a purge attempt for an unrelated older job while the current content's precise URL set remains pending. | Pass the returned `purgeJobId` into the post-commit path and add a repository method that claims that exact ready job, while keeping `claimNext()` for the scheduled worker. Return and test the actual processed job id in publish/offline responses. |
| Medium | Requirement | `src/server/content/purge-runtime.ts:11-25`, `src/app/api/internal/cache-purge/route.ts:23-41` | ESA provider/config failures are only logged and do not update a purge job or write purge-failure audit metadata. | `attemptPostCommitPurge()` resolves ESA config and constructs the provider before processing a job; any config/provider setup error is caught as `deferred` with a console log only. The internal worker route has the same provider setup inside its top-level `try` and returns rejection without marking any ready job `retry`/`failed`. FR-12 requires external refresh failures after commit to update the job, write a redacted audit/warning, and allow bounded retry. | Once a job is selected, classify provider setup failures with a stable code such as `esa_config_unavailable`, mark the selected job `retry` or `failed` according to the retry policy, and write the existing `cache_purge_failed` audit event. Keep authentication failures separate, since no trusted worker should claim jobs in that case. |
| Low | Test | `tests/m2-content-repository.test.ts`, `tests/m2-content-api.test.ts`, `tests/m2-purge-jobs.test.ts` | Tests do not cover the route/repository contract that should bind a content mutation to its own purge job. | Existing repository tests cover create, duplicate slug, stale version, and audit rollback. Purge tests exercise a generic `claimNext()` fake/repository path, and API tests mainly assert route files contain expected symbols. No test fails if publish/offline creates `purgeJobId = X` but the route processes a different ready job. | Add an executable publish/offline API or service integration test with two ready purge jobs, asserting the post-commit attempt processes the newly enqueued job id and leaves older jobs for the worker, or intentionally documents FIFO-only behavior if that is the accepted product decision. |

## Positive Checks

- No Critical or High findings found in the reviewed M2-03 implementation.
- The content domain enforces `news | case`, draft/public pointer separation, stale version rejection, immutable slug after first publish, case first-publish authorization, and `published | not_found | gone` public DTO behavior.
- Mutating admin content routes use the existing `requireAdminMutation()` guard for session, canonical Origin/Host, and CSRF validation.
- The implementation uses direct ESA HTTPS provider boundaries and a targeted scan did not find prohibited generic `webservice` usage in implementation files.
- Client-side M2-03 files did not expose `ESA_ACCESS_KEY_*`, `ESA_SECURITY_TOKEN`, `PURGE_WORKER_TOKEN`, `DATABASE_URL`, or Authorization material.

## Verification

- `pnpm test` in `products/sino-cn`: passed, 30 test files and 119 tests.
- `pnpm lint` in `products/sino-cn`: passed (`tsc --noEmit`).
- `pnpm build` was not run because the delegation restricted modifications to the review report only, and the build would write build artifacts.
