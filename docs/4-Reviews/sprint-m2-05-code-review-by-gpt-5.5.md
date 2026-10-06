# M2-05 Code Review by GPT-5.5

- Review date: 2026-07-30
- Scope: complete uncommitted M2-05 working-tree diff under `D:\code\tokengate\products\sino-cn`, including untracked files.
- Sprint target: `docs/3-Plan/sprint-m2-05.md`
- Constraints checked: product `AGENTS.md`, FR-14, FR-08, M2-05 Sprint, DirectMail/no generic webservice rule, PII/logging boundaries, same-origin inquiry contract, runbook updates, release-validator semantics.
- Explicit exclusions honored: did not read, copy, import, or depend on `D:\code\tokengate\products\sino-en\src`; did not call GPT-5.3 Codex Spark or any additional review model.

## Findings

| Severity | Type | Location | Issue | Evidence | Recommendation |
| --- | --- | --- | --- | --- | --- |
| High | Correctness | `scripts/lib/release-validator.mjs:137`; `tests/m2-release-validator.test.ts:123` | A production gate can be marked `PASS` even when its own evidence or FC previous-app/new-schema compatibility matrix says the actual result failed. This can incorrectly allow `PRODUCTION_LIVE_READY` if all gate statuses are set to `PASS`, violating the Sprint requirement that compatibility matrix failure must block Production Live. | `validateProductionGate` only checks placeholder-like text for `PASS` evidence and does not validate `evidence.actualResult` or `compatibility.actualResult` as successful. A targeted local probe accepted `fc_previous_app_new_schema_compatibility` with `status: "PASS"` and `compatibility.actualResult: "FAIL"`. Existing tests cover missing compatibility but not failed compatibility. | For every `PASS` production gate, reject contradictory evidence such as `FAIL`, `BLOCKED`, `not run`, `pending`, or similar in `evidence.actualResult`; for `fc_previous_app_new_schema_compatibility`, also require a successful `compatibility.actualResult`. Add tests for failed compatibility, failed recovery/rollback evidence, and placeholder compatibility values. |
| Medium | Requirement | `scripts/lib/release-validator.mjs:118`; `docs/5-Evidence/m2-05/gate-input.json:68` | The validator does not enforce the required M2 legacy-blocker mapping. The checked-in `gate-input.json` currently includes `M2-LEGACY-01` and `M2-LEGACY-02`, but the validator would accept those external production blockers without `legacyId`, weakening the release gate semantics requested by the Sprint. | A targeted local probe removed `legacyId` from all `BLOCKED` production gates and `validateReleaseGateInput` still accepted the input. The Sprint says M2-LEGACY-01 and M2-LEGACY-02 are explicit external blockers that do not block local readiness and must continue to block Production Live. | Enforce `legacyId: "M2-LEGACY-01"` for non-PASS DirectMail/ESA/FC/RDS/OSS cloud-resource gates and `legacyId: "M2-LEGACY-02"` for the non-PASS cost/budget gate. Add tests for missing and incorrect legacy mappings. |
| Medium | Requirement | `src/app/api/inquiry/route.ts:13`; `src/server/inquiry/service.ts:143` | Non-POST method handling is left to the framework instead of the route/service contract, so method-boundary responses are not covered by tests and may not carry the required `private, no-store` cache policy. | The route exports only `POST`; `handleInquiryRequest` has no method guard. `tests/m2-inquiry-api.test.ts` covers invalid JSON/content type/body/limits but does not exercise GET/PUT/PATCH/DELETE/OPTIONS boundaries. The Sprint requires only POST JSON and all responses to use `private, no-store`. | Add explicit non-POST route handlers or a shared method-boundary handler that returns stable 405/204 responses with `Cache-Control: private, no-store, max-age=0`, plus tests for method boundaries and `Allow`/cache headers. |
| Low | Correctness | `src/server/inquiry/service.ts:232` | Content-Type validation accepts any value starting with `application/json`, including invalid media types such as `application/jsonp`. | The check uses `contentType.startsWith("application/json")`; this accepts `application/jsonp` even though the contract says POST JSON. | Parse the media type before `;` and require exactly `application/json` unless a deliberate `+json` family is intended. Add a negative test for `application/jsonp`. |

## Checks Performed

- Read the M2-05 Sprint, product `AGENTS.md`, FR-14, FR-08, updated runbook sections, new inquiry route/server modules, client submit/form changes, release validator, evidence files, and related tests.
- Used the codebase graph for code discovery and targeted scans; fallback text scans found no `products/sino-en/src` dependency and no new generic `webservice` abstraction in the reviewed implementation.
- Ran `pnpm test`: 39 files / 167 tests passed.
- Ran `pnpm lint`: `tsc --noEmit` passed.
- Ran `pnpm validate:release`: returned `CODE_READY_WITH_EXTERNAL_LEGACY` with all required production gates blocked.
- Ran `pnpm validate:release -- --require-production-live`: exited nonzero as expected while reporting Production blocked.
- Did not run `pnpm build` because it writes build artifacts and the delegation required writing or overwriting only this review report file.

## Overall Assessment

The M2-05 implementation is broadly aligned with the local code-readiness target: same-origin `/api/inquiry`, bounded DTO validation, DirectMail via explicit HTTPS form POST, no lead database, no generic webservice abstraction, no PII telemetry, and production gates remaining blocked for M2-LEGACY-01/M2-LEGACY-02 and FR-08 external evidence.

Local readiness should remain conditional on fixing the release-validator integrity gaps above, because they affect the safety of future Production Live decisions even though the current checked-in evidence still reports `CODE_READY_WITH_EXTERNAL_LEGACY / Production BLOCKED`.
