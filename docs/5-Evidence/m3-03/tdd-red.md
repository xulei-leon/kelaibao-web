# M3-03 TDD Red Evidence

## Context

- Date: 2026-07-31 (Asia/Shanghai)
- Project path: `products/kelaibao/`
- Document gate: `sprint-m3-03-review-confirm.md` accepted all five document-review findings before implementation tests were written.
- Scope: `/media`, five exact legacy-route redirects, discovery/link-emitter cleanup, and the media-specific Enterprise WeChat consultation contract.

## Red Command

```powershell
pnpm exec vitest run tests/media-page-and-redirects.test.tsx tests/routes-and-metadata.test.ts tests/indexing-and-config.test.ts tests/m2-discovery-files.test.ts tests/site-header.test.tsx tests/wechat-contact.test.tsx tests/wechat-panel.test.tsx --reporter=dot
```

## Expected Failure Contract

The pre-M3-03 implementation must fail only because the confirmed contracts do not exist yet:

1. `/media` and its five stable anchors, metadata, canonical, Open Graph URL, and public discovery entry are absent.
2. The five retired consultant routes remain live pages and live link emitters; exact permanent redirects are absent.
3. The reproducible no-follow HTTP redirect smoke script is absent.
4. The Enterprise WeChat CTA, Dialog, analytics event, QR alternative text, failure fallback, inert background, and contact panel still expose the previous generic consultation semantics.

## Observed Result

`FAIL` as expected: 6 of 7 test files failed, with 18 failed and 15 passed assertions.

| Area | Observed failure |
| --- | --- |
| Media page | `src/app/media/page.tsx` is absent, so the complete offer, shell, CTA isolation, and five-anchor assertions fail. |
| Redirects | `next.config.ts` has no redirect function, and `scripts/smoke-media-redirects.mjs` is absent. |
| Route/discovery contract | `PUBLIC_ROUTES` still contains the five retired routes and lacks `/media`; `/media` metadata/canonical/Open Graph coverage is absent. |
| Live link emitters | Header and known page/component emitters still link to `/services`, `/method`, or `/for/*`. |
| WeCom Dialog | Default accessible name, title, event, close-button name, backdrop/inert behavior, QR label, and failure fallback are not media-specific. |
| Contact panel | QR label and failure fallback still use generic consultation semantics. |

The `m2-discovery-files` suite passed all four assertions, and the existing Escape/focus-restoration and product/media contact isolation baselines also passed. No failure was caused by an import, transform, dependency, or test-environment problem.
