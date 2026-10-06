# M3-02 TDD Red Evidence

## Context

- Date: 2026-07-31 (Asia/Shanghai)
- Project path: `products/kelaibao/`
- Document gate: `sprint-m3-02-review-confirm.md` accepted all required actions before implementation tests were written.
- Scope: product decision pages, isolated mini-program trial entry, contact routing, and the Production mini-program resource gate.

## Red Command

```powershell
pnpm test -- tests/product-pages.test.tsx tests/site-content.test.ts tests/routes-and-metadata.test.ts tests/indexing-and-config.test.ts tests/mini-program-config.test.ts tests/mini-program-trial.test.tsx tests/m2-release-validator.test.ts
```

## Expected Failure Contract

The pre-M3-02 implementation must fail only because the confirmed contracts do not exist yet:

1. `/features` and `/team` pages and their route metadata/sitemap entries are absent; `/about` does not yet expose the confirmed K-Link, culture, security, and contact content.
2. The centralized five-stage journey, four feature groups/ten tools, four team challenges, and three delivery guarantees are absent.
3. `MiniProgramConfig`, `MINI_PROGRAM_TRIAL`, `resolveMiniProgramConfig`, and the accessible mini-program trial dialog are absent.
4. The release validator does not yet require the `production_mini_program` gate.

## Observed Result

`FAIL` as expected: 7 test files failed, 13 assertions failed, and 20 assertions passed.

| Area | Observed failure |
| --- | --- |
| Product pages | `/features` and `/team` modules do not exist; `/about` lacks the confirmed product/company content. |
| Content contracts | `FEATURE_JOURNEY_STAGES`, `FEATURE_GROUPS`, `TEAM_CHALLENGES`, and `TEAM_DELIVERY_GUARANTEES` are missing. |
| Discovery | `/features` and `/team` are missing from public routes, metadata/canonical coverage, and sitemap inputs. |
| Mini-program configuration | `MiniProgramConfig`, `MINI_PROGRAM_TRIAL`, and `resolveMiniProgramConfig` are missing. |
| Mini-program interaction | `src/components/mini-program-trial.tsx` is missing, so the dialog suite fails during collection before interaction assertions can run. |
| Release readiness | `production_mini_program` is not a mandatory Production release gate. |

Existing covered M2 behavior continued to pass. The failures are intentional contract failures for M3-02, with no unrelated dependency, transform, or test-environment failure.
