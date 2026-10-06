# Sprint M3-05 / FR-18 Document Review Confirm

**Reviewed Inputs**

- `docs/1-Requirement/Mainland-Website-FR/FR-18-claims-content-discovery-and-release-migration.md`
- `docs/3-Plan/sprint-m3-05.md`
- `docs/4-Reviews/sprint-m3-05-review-by-gpt-5.5.md`
- `docs/1-Requirement/Kelaibao-Unified-Website-SRS.md`
- `docs/2-Design/Kelaibao-Unified-Website-Visual-Design-Spec.md`
- `docs/2-Design/Alibaba-Cloud-Fullstack-Architecture-Spec.md`
- `docs/5-Evidence/m2-05/gate-input.json`
- `scripts/validate-release.mjs` and `scripts/lib/release-validator.mjs`

**Review Date**

- 2026-08-01

## Overall Conclusion

The review is sound and identifies seven in-scope contract gaps. All seven findings are accepted. They do not require a new product surface, database schema, second site, direct SQL migration, or fake Production evidence; they make the existing M3-05 scope deterministic and fail-closed.

Implementation remains blocked until these accepted changes are applied to FR-18 and Sprint M3-05. After the document updates, the target may proceed to TDD implementation.

## Decision Table

| No. | Severity | Type | Review Source | Original Comment Summary | Decision | Evidence | Follow-up Plan / Rejection Reason |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | High | Requirement | `M3-05-DOC-01` | CMS inventory lacks an explicit database-free Local/Preview contract and real Production evidence boundary. | Accept | FR-18 requires a published-content inventory and audit trail, while `resolveServerConfig` intentionally permits database-free Preview. Treating an empty fixture as live migration evidence would violate SRS `FR-POLICY-002`. | Define `sourceMode=fixture\|live-cms`, required sanitized inventory fields, and a fail-closed rule: fixture/empty input may validate local software but can never satisfy Production CMS migration evidence. |
| 2 | High | Documentation | `M3-05-DOC-02` | `brand-content-migration.md` and `gate-report.md` have no minimum schema. | Accept | FR-18 requires auditable migration, claims and dual-layer release outputs; the current M2 gate input/report already demonstrates stable IDs, evidence paths and sensitive-data checks. | Add exact sections/fields for inventory provenance, item decisions, audit/revision evidence, unresolved blockers, `localReady`, `productionReady`, status, commands/exits, inherited gates and sensitive-data checks. Machine-consumed state remains JSON; Markdown reports summarize it. |
| 3 | Medium | Requirement | `M3-05-DOC-03` | Claims completeness, freshness, authorization and placeholder rules are undefined. | Accept | FR-18 and SRS `FR-CONTENT-001` require definition, method, source, date, scope, authorization and reviewer; the existing release validator already rejects placeholder Production evidence. | Expand the fixed claims schema with evidence type/path, capture/expiry dates, authorization enum, public-use approval, placeholder flag, weakened replacement copy/reason, and fixtures for expired, placeholder, unauthorized and unsupported claims. |
| 4 | Medium | Clarity | `M3-05-DOC-04` | Default and `--require-production-live` release outcomes are not fixed precisely. | Accept | Existing validator returns `CODE_READY_WITH_EXTERNAL_LEGACY` with exit 0 when local checks pass but Production is blocked, and returns exit 1 under `--require-production-live`; schema errors return 2. | Record exact exit/status/boolean expectations and require the gate report to capture command, exit code, status and blocker IDs for both modes. |
| 5 | Medium | Risk | `M3-05-DOC-05` | M3-05 does not explicitly preserve all 16 inherited Production blocker IDs. | Accept | `PRODUCTION_GATE_IDS` currently contains 16 mandatory gates and M3-04 release evidence reports all 16 blocked. FR-18 forbids automatic closure of M2 legacy gates. | Require superset continuity for the 16 IDs, forbid omitted/decreased blockers without real PASS evidence, and add an omitted-inherited-gate negative fixture. New M3 claims/CMS gates may add blockers but never replace the inherited set. |
| 6 | Medium | Test | `M3-05-DOC-06` | Brand scan roots/exclusions and internal compatibility allowlist are ambiguous. | Accept | SRS permits historical migration/review/evidence references and controlled internal identifiers such as `SINO_RUNTIME_MODE`, but public output must not present the old brand, old canonical, dual origin or `site_key`. | Define exact public source/runtime/build/discovery/mail/CMS scan roots, historical exclusions, and a justified compatibility allowlist. Test both a public leak that fails and a historical/internal allowed match that passes. |
| 7 | Low | Maintainability | `M3-05-DOC-07` | Final Done and commit gates are underspecified. | Accept | `sprint-workflow`, product `AGENTS.md`, and prior M3 completion records require document/code review-confirm, verification, evidence, Done moves and an isolated Sprint commit. | Add the complete closure checklist, keep Production blocked unless every real mandatory gate passes, move FR/Sprint to `Done/` only after all local gates, and commit only the M3-05 files with the required message. |

## Needs Immediate Action

- Apply all seven accepted contract updates to FR-18 and Sprint M3-05 before implementation.

## Can Be Deferred

- Real CMS inventory execution, claims proof/authorization, formal domain/ICP, production QR assets and the inherited cloud/cost/recovery gates remain external Production work. They may remain `BLOCKED`, but their absence must be explicit in evidence.

## Final Status

- **ACCEPTED_WITH_REQUIRED_DOCUMENT_CHANGES**.
- Minimum remaining document work: apply findings `M3-05-DOC-01` through `M3-05-DOC-07`, verify links/diff, and mark the Sprint `DOCUMENT_REVIEW_CONFIRMED` before starting code.
