# M2-00 Code Review by GPT-5.5

Review date: 2026-07-29

Reviewed change set:

- `products/sino-cn/spikes/m2-00/`
- `products/sino-cn/package.json`
- `products/sino-cn/.gitignore`
- `products/sino-cn/docs/5-Evidence/m2-00/gate-report.json`
- `products/sino-cn/docs/5-Evidence/m2-00/gate-report.md`

Requirements checked:

- `products/sino-cn/AGENTS.md`
- `products/sino-cn/docs/1-Requirement/Mainland-Website-FR/FR-09-alibaba-cloud-fullstack-runtime-and-infrastructure-gate.md`
- `products/sino-cn/docs/2-Design/Alibaba-Cloud-Fullstack-Architecture-Spec.md`
- `products/sino-cn/docs/3-Plan/sprint-m2-00.md`
- `products/sino-cn/docs/4-Reviews/sprint-m2-00-review-confirm.md`

## Findings

| Severity | Type | Location | Issue | Evidence | Recommendation |
| --- | --- | --- | --- | --- | --- |
| High | False-PASS Risk | `products/sino-cn/spikes/m2-00/lib/probes.mjs:180`, `products/sino-cn/spikes/m2-00/lib/probes.mjs:219`, `products/sino-cn/spikes/m2-00/lib/probes.mjs:312`, `products/sino-cn/spikes/m2-00/lib/probes.mjs:353`, `products/sino-cn/spikes/m2-00/config.example.json:21` | G3/G4/G6/G7 can pass using arbitrary HTTPS JSON endpoints instead of checked-in, provider-specific FC probe implementations. | The runner only requires `probeUrl`/`securityProbeUrl` to be HTTPS and then trusts allowlisted booleans returned by that endpoint. The built spike only contains `/origin`, `/runtime`, `/session/set`, `/session/echo`, and `/stream`; there are no checked-in route handlers for `/rds`, `/oss`, `/directmail`, or `/esa-purge`, even though `config.example.json` points to those paths. This leaves the P0 cloud gates dependent on external endpoints that are not reproducible from the submitted spike and can be spoofed by any HTTPS service returning the expected booleans. | Add minimal FC route handlers or provider-specific probe modules for RDS, OSS, DirectMail, and ESA purge inside the spike, using direct HTTP(S) or explicit provider boundaries as required. Also constrain gate config to the isolated FC/ESA test origin or record a non-sensitive probe identity in evidence so PASS results are tied to the reviewed deployment asset. |
| High | False-PASS Risk | `products/sino-cn/spikes/m2-00/app/app/api/m2-00/runtime/route.ts:8`, `products/sino-cn/spikes/m2-00/lib/probes.mjs:157` | The FC delivery-shape part of G2 can pass while explicitly unverified. | The runtime route defaults `deliveryShape` to `standalone-candidate-unverified` when `M2_FC_DELIVERY_SHAPE` is absent. The gate only checks that `deliveryShape` is a non-empty string, so G2 can PASS with the literal unverified default despite FR-09 requiring the FC Next.js delivery shape to be recorded and fixed by M2-00 evidence. | Treat the default/unverified value as `BLOCKED`. Require an explicit allowlisted value such as a verified FC standalone deployment label, and include that label in the evidence only after the deployed FC resource actually reports it. |

## Checks Performed

- Ran `pnpm m2:00:test`: PASS, 9 tests passed.
- Ran `pnpm m2:00:build`: PASS, Next.js standalone spike build succeeded.
- Ran `git diff --check` on reviewed paths: PASS.
- Scanned reviewed source/evidence for obvious credentials, cookies, phone/email PII, and `webservice`: no real secrets found; only test fixtures and policy text matched.
- Did not run `pnpm m2:00:gate` because it overwrites the reviewed evidence files. Existing evidence truthfully reports all eight gates as `BLOCKED` because required cloud config and cost inputs are missing.

## Overall Assessment

The current evidence does not falsely claim PASS: `gate-report.json` and `gate-report.md` correctly mark G1-G8 as `BLOCKED`. The main remaining risk is future false PASS once endpoints are supplied, because several P0 gates currently trust externally supplied HTTPS boolean probes that are not implemented or constrained by the submitted spike, and G2 accepts an explicitly unverified delivery-shape label.
