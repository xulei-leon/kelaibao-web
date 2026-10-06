# Sprint M5-02 Code Review

Reviewed the current working-tree changes under `products/kelaibao`, including the untracked M5-02 implementation test and responsive/link evidence, against `docs/3-Plan/sprint-m5-02.md` and `docs/4-Reviews/sprint-m5-02-review-confirm.md`.

| Severity | Type | Location | Issue | Evidence | Recommendation |
| --- | --- | --- | --- | --- | --- |
| Medium | Requirement | `src/lib/site-content.ts:27`; `tests/site-content.test.ts:32`; `tests/site-header.test.tsx:22` | The change set renames the primary-navigation `/news` item from `新闻动态` to `新闻与行业观察`, even though WP3 explicitly requires the primary navigation to remain unchanged. The updated tests now freeze the out-of-scope navigation change instead of protecting the required baseline. | `sprint-m5-02.md:161` says `保持主导航...不变`. The working-tree implementation sets `PRIMARY_NAVIGATION` to `{ label: "新闻与行业观察", href: "/news" }`, and both navigation tests were changed to expect that value. WP2 requires the new name for the news list H1, metadata, and structured-data label, but does not authorize changing the primary-navigation label. | Restore the prior `/news` primary-navigation label and update the navigation assertions accordingly. Keep `新闻与行业观察` in the centralized news-list content used by metadata, visible H1, and structured data. |
| Medium | Test | `docs/5-Evidence/m5-02/responsive-and-link-check.md:3`; `tests/m5-search-semantics.test.tsx:86` | The acceptance evidence does not cover the required 200% zoom or keyboard/focus behavior for the new links, so the accessibility and responsive gate is incomplete. | The evidence records four viewport sizes, link height, anchor gaps, and manual screenshot inspection, but contains no 200% zoom result and no keyboard traversal or visible-focus result. `sprint-m5-02.md:188`, `:206`, `:221`, and `:237` explicitly require keyboard access, visible focus, and 200% zoom checks. The SSR test verifies hrefs and labels only; it cannot establish zoom readability, keyboard operability, or focus visibility. | Run and record the new links and affected H1/footer layouts at 200% zoom, and document keyboard traversal plus visible focus at representative desktop and mobile widths. Add durable automated checks where feasible, while retaining browser evidence for layout and focus visibility. |

## Checks Performed

- Compared changed metadata, H1 copy, news-list configuration, footer labels, contextual links, stable anchors, CSS sizing/scroll offsets, and updated tests with the confirmed Sprint requirements.
- Verified that `PhraseFlow` remains used in `src/app/features/page.tsx`; no unused-import finding is reported.
- Verified automated coverage for uniqueness of all five legacy `/media` fragment targets and unchanged permanent redirect destinations.
- Inspected the untracked `tests/m5-search-semantics.test.tsx`, `src/lib/public-list-content.ts`, and `docs/5-Evidence/m5-02/responsive-and-link-check.md` content.
- No security issue was identified in the reviewed presentation, metadata, and link-only changes.

The test suite, lint, and build were not re-run during this review because the local shell process was unavailable. This report relies on direct source, diff, test, and evidence inspection.
