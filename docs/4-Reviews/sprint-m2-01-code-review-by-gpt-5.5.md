# Sprint M2-01 Code Review by GPT-5.5

Review scope: current uncommitted M2-01 implementation under `products/sino-cn`, compared against baseline `181246c`, `products/sino-cn/AGENTS.md`, FR-09, `docs/2-Design/Alibaba-Cloud-Fullstack-Architecture-Spec.md`, and `docs/3-Plan/sprint-m2-01.md`.

Review type: code review.

## Findings

| Severity | Type | Location | Issue | Evidence | Recommendation |
| --- | --- | --- | --- | --- | --- |
| Medium | Correctness | `products/sino-cn/migrations/001_core_schema.sql:36`, `products/sino-cn/migrations/001_core_schema.sql:37`, `products/sino-cn/migrations/001_core_schema.sql:47`, `products/sino-cn/migrations/001_core_schema.sql:48`, `products/sino-cn/migrations/001_core_schema.sql:63` | The core schema allows a `case` content item to be `published` without case authorization confirmation. | The architecture spec requires: `products/sino-cn/docs/2-Design/Alibaba-Cloud-Fullstack-Architecture-Spec.md:78` says cases must be manually authorized before first publication and must record confirmation time/operator/audit event. The submitted `chk_content_items_case_authorization` constraint only forces non-case rows to keep authorization fields null; it does not require `case_authorization_confirmed_at` and `case_authorization_admin_id` when `content_type = 'case'` and `status = 'published'`. This leaves an invalid public case state enforceable neither by the M2 schema nor by the current tests. | Tighten the `content_items` constraint so published cases require both authorization fields, for example by allowing non-case rows to remain null while requiring `(content_type <> 'case' OR status <> 'published' OR (case_authorization_confirmed_at IS NOT NULL AND case_authorization_admin_id IS NOT NULL))`. Add a migration contract test or SQL-level fixture that rejects a published case without authorization and accepts draft/offline cases according to the intended lifecycle. |
| Low | Test | `products/sino-cn/tests/m2-runtime-contract.test.ts:64`, `products/sino-cn/tests/m2-migrations.test.ts:53` | M2 migration tests prove table presence, advisory locking, ordering, rollback flow, and absence of destructive keywords, but they do not validate key domain constraints from the schema contract. | The runtime contract test only scans for six `CREATE TABLE IF NOT EXISTS` statements plus `ENGINE=InnoDB`, `utf8mb4`, and no `DROP`/`RENAME`. The migration runner tests use simplified fake statements and do not exercise the real `001_core_schema.sql` constraints. This allowed the missing published-case authorization invariant above to pass. | Add focused SQL contract checks for the highest-risk invariants in `001_core_schema.sql`: published case authorization, content type/slug uniqueness expectations, media size limit, session expiry, revision number, and failed-login bound. These can remain local parser/fixture tests if no disposable MySQL instance is available in M2-01, with real RDS execution still deferred to `M2-LEGACY-01`. |
| Info | Consistency | `products/sino-cn/docs/3-Plan/sprint-m2-01.md`, `products/sino-cn/docs/2-Design/FC-Deployment-Runbook.md`, `products/sino-cn/deploy/*.example.json`, `products/sino-cn/src/app/api/health/route.ts` | No incorrect Production PASS claim found in the reviewed M2-01 change set. | New or changed M2-01 documents and deploy examples consistently mark true ESA/FC/VPC/RDS publishing, alerting, rollback, budget, and real cloud evidence as `M2-LEGACY-01 / DEFERRED` or `M2-LEGACY-02 / DEFERRED`, and cap the local sprint status at `CODE_READY_WITH_EXTERNAL_LEGACY`. The local smoke script prints a local-only `PASS`, not a Production PASS. | Keep this distinction in follow-up review-confirm and sprint status updates; do not promote the sprint beyond `CODE_READY_WITH_EXTERNAL_LEGACY` until the deferred external gates are closed with real evidence. |

## Checks Performed

- Read `products/sino-cn/AGENTS.md`, FR-09, the Alibaba Cloud architecture spec, the M2-01 sprint plan, FC deployment runbook, deploy examples, server config, MySQL pool, migration runner, SQL migration, health routes, standalone packaging/smoke scripts, and M2 tests.
- Used codebase graph discovery first (`D-code-tokengate` was already indexed); `detect_changes` found the tracked M2-01 diff, and git/file reads were used for untracked implementation files.
- Searched `products/sino-cn` for `Production`, `PASS`, `Live`, `DEFERRED`, `M2-LEGACY`, and `webservice`; no generic webservice abstraction was introduced in the reviewed M2-01 files.
- Ran `pnpm test`: PASS, 14 test files and 51 tests passed.
- Ran `pnpm lint`: PASS, `tsc --noEmit` completed.
- Ran `git diff --check -- products/sino-cn`: PASS.

## Not Run

- Did not run `pnpm build` or `pnpm smoke:standalone` because those commands create or update build artifacts outside the single report file this delegation allowed me to write. Existing tests cover the declared package scripts and standalone contract statically, but full artifact packaging/smoke remains unverified by this review run.

## Overall Assessment

The M2-01 implementation is directionally consistent with the sprint boundary: it removes static export, establishes a standalone runtime contract, keeps server config server-only, uses `mysql2/promise` with bounded process-level pooling, keeps migrations release-only, and documents external cloud evidence as deferred rather than passed. The main actionable issue is the missing database invariant for authorized case publication, plus the related test coverage gap that let that invariant slip through.
