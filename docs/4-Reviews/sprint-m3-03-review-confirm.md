# Sprint M3-03 Review Confirm

**Reviewed Inputs**

- `products/kelaibao/docs/1-Requirement/Mainland-Website-FR/FR-17-kelaibao-media-page-and-legacy-route-migration.md`
- `products/kelaibao/docs/3-Plan/sprint-m3-03.md`
- `products/kelaibao/docs/4-Reviews/sprint-m3-03-review-by-gpt-5.5.md`
- `products/kelaibao/docs/1-Requirement/Kelaibao-Unified-Website-SRS.md`
- `products/kelaibao/docs/2-Design/Kelaibao-Unified-Website-Visual-Design-Spec.md`
- Current M3-02 public link emitters, discovery routes, Dialog tests, and Next.js configuration

**Review Date**

- 2026-07-31

## Overall Conclusion

The single requested reviewer found five valid document gaps. All are accepted because they convert already approved requirements into complete, executable coverage without expanding M3-03 into the M3-04 homepage or full Header/Footer redesign.

The FR/Sprint may proceed to TDD only after the accepted document changes below are applied.

## Decision Table

| No. | Severity | Type | Review Source | Original Comment Summary | Decision | Evidence | Follow-up Plan / Rejection Reason |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | High | Test | `GPT-5.5 Finding 1` | Current old-route emitters outside the listed files/tests could continue linking retired routes while the named tests pass. | Accept | Runtime source still emits old paths from `site-footer.tsx`, `app/page.tsx`, `direct-sales-focus.tsx`, `service-overview.tsx`, `mobile-contact-bar.tsx`, `site-content.ts`, and route metadata. FR-17 already requires all live navigation to stop listing retired URLs. | Add all known emitters to the Sprint file scope. Require a runtime/source contract that rejects the five retired paths outside the redirect definition, redirect tests, and historical docs, while permitting `/media` anchors. |
| 2 | High | Discovery | `GPT-5.5 Finding 2` | Discovery acceptance names sitemap but omits `llms.txt` and other required surfaces fed by the same route inventory. | Accept | SRS `FR-DISCOVERY-001/002` covers sitemap, RSS, `llms.txt`, canonical, Open Graph and JSON-LD. `PUBLIC_ROUTES` currently feeds both sitemap and `llms.txt`, and M2 discovery tests still assert `/services`. | Expand FR/Sprint scope and targeted tests to generated sitemap and `llms.txt`, plus RSS where applicable, metadata/canonical, Open Graph URLs, and JSON-LD. Assert all five retired routes are absent from generated discovery outputs. |
| 3 | Medium | Accessibility | `GPT-5.5 Finding 3` | The media WeCom tests do not explicitly preserve focus, Escape, error announcement and accessible naming while semantics change. | Accept | The SRS and visual design require both QR Dialogs to preserve keyboard operation, focus entry/restoration, accurate alt, status text and correct fallback. M3-03 changes every relevant WeCom label and path. | Add explicit test bullets for accessible name, initial/contained focus, Escape and close button, focus restoration, broken-image removal/status announcement, media fallback anchor, and absence of mini-program resource/event behavior. |
| 4 | Medium | Clarity | `GPT-5.5 Finding 4` | “真实 HTTP” redirect verification lacks an exact reproducible server/no-follow command and `Location` examples. | Accept | FR-17 requires permanent status plus query and fragment retention; a redirect-following client or config-only assertion could report a false pass. | Add `scripts/smoke-media-redirects.mjs` to the Sprint scope. It must start against the built standalone server, issue no-follow requests such as `/services?utm_source=m3-03`, assert the permanent status and exact `/media?utm_source=m3-03#services` ordering for all five routes, and assert `/for/other?x=1` is `404`. |
| 5 | Low | Clarity | `GPT-5.5 Finding 5` | “navigation only uses `/media`” can be misread as taking over M3-04's final six-item navigation. | Accept | M3-03 must remove live links to retired consultant routes, while the approved sequence assigns the final homepage/full Header/Footer/six-item navigation to M3-04. | Rewrite acceptance to require every existing consultant/service/method link to target `/media` or a stable anchor, while explicitly deferring the final six-item Header/Footer model to M3-04. |

## Needs Immediate Action

- Apply all five accepted document clarifications before creating M3-03 implementation tests.

## Can Be Deferred

- Final homepage content, the complete six-item product navigation, and the full Header/Footer outer-shell switch remain M3-04 scope.
- Formal enterprise-WeChat asset verification remains an external Production gate and must stay `BLOCKED` until evidence exists.

## Final Status

`ACCEPTED_WITH_REQUIRED_DOCUMENT_CHANGES`. Apply the confirmed edits, validate the documents, and then begin M3-03 TDD implementation.
