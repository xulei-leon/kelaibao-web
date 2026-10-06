# Sprint M4-02 公开站视觉风格升级 Code Review by GPT-5.5

## Review Scope

- Reviewed current uncommitted M4-02 implementation and tests under `products/kelaibao`.
- Source of truth: `docs/3-Plan/sprint-m4-02-public-site-visual-style-upgrade.md` and `docs/1-Requirement/Mainland-Website-FR/FR-20-visual-style-upgrade-and-regression-protection.md`.
- Focus areas: public/admin CSS isolation, DOM/copy/layout freeze, App Router and Pages Router imports, accessibility/contrast/reduced-motion, responsive overflow, evidence reproducibility, and whether tests enforce Sprint gates.
- Excluded unrelated pre-existing repository work and did not modify reviewed implementation files.

## Findings

| Severity | Type | Location | Issue | Evidence | Recommendation |
| --- | --- | --- | --- | --- | --- |
| Medium | Test | `tests/visual-style-contract.test.tsx:14`, `tests/visual-style-contract.test.tsx:71` | The new baseline fixture does not fully enforce the FR-20 content/layout freeze. It validates H1, raw section count, ordered marker snippets, CTA labels, and a small forbidden-copy list, but it does not compare full normalized visible text, all H2/H3 headings, navigation labels, section identity/order, grid/card counts, or hero substructure for every route. | FR-20 requires all visible copy and structure to remain frozen. The fixture schema only includes `h1`, `sectionCount`, `markers`, and `ctaLabels`; the assertion block only checks those fields plus forbidden snippets. A visual implementation could change non-marker paragraphs, remove a non-marker card, or alter H2/H3 text without this test failing. | Expand `tests/fixtures/m4-02-public-page-baseline.json` and the test to assert normalized visible text or a route-level text digest, all heading levels, section identifiers/headings in order, key grid/card counts, nav items, and hero/action/aside/boundary presence. Keep marker checks as supplementary diagnostics, not the main freeze. |
| Medium | Documentation | `docs/5-Evidence/m4-02/README.md:48` | The evidence README still leaves the post-implementation manual acceptance matrix as pending, so the Sprint evidence does not yet prove the after-state gates for manual smoke, contrast, 200% zoom, reduced motion, admin isolation, and console review. | Lines 52-58 still say `待实施后复核`, `待 smoke`, `待复核`, and `待回填` even though `after/`, `after-dom-checks.json`, and `after-console.json` exist. FR-20/Sprint require the evidence to record these after-state conclusions before exit. | Fill in the after-state manual checks with concrete pass/fail conclusions, sampled contrast color values, 200% zoom/reduced-motion notes, `/admin/login` and protected admin shell smoke results, and any reviewed console exclusions. |
| Low | Documentation | `docs/5-Evidence/m4-02/README.md:18` | The evidence command summary is stale relative to the current test set, which weakens reproducibility for the Sprint gate. | The README reports `pnpm test` as `58 files / 294 tests` and the targeted M4-02 test as `11` contracts. Current local review runs passed `59` test files / `319` tests, and `tests/visual-style-contract.test.tsx` passed `25` tests. | Update the evidence README with the current command results when the final clean verification is rerun. |
| Low | Risk | `src/app/visual-refresh.css:49`, `src/app/visual-refresh.css:84`, `src/app/visual-refresh.css:178`, `tests/visual-style-contract.test.tsx:197` | The CSS isolation test only rejects naked base-element selectors; it does not enforce that all overlay selectors are rooted under public shell/page boundaries or that admin markup cannot collide with public class names. Current admin markup did not show an overlap in review, so this is a future-regression risk rather than a current leak. | `visual-refresh.css` contains global public-class selectors such as `.site-header`, `.cta`, `.section`, `.eyebrow`, `.form-field`, and `.submit-button`. The test at `visual-style-contract.test.tsx:197` only rejects selectors beginning with `:root`, `html`, `body`, headings, links, buttons, and form controls. | Add a stricter selector contract or admin smoke assertion that public overlay selectors either start from known public boundaries (`.public-site-main`, `.site-header`, `.site-footer`, dialog/contact shell classes) or are proven absent from `/admin/login` and a protected admin shell. |

## Checks Performed

- Inspected `git diff` for M4-02 implementation files and untracked M4-02 test/evidence files.
- Confirmed both router imports load `visual-refresh.css` after `globals.css`.
- Confirmed `PageHero` variant wiring is class-only in the component implementation.
- Checked current admin layout/login/protected shell for public-class selector overlap; no current overlap found.
- Reviewed `visual-refresh.css` for remote assets, generated business copy, `!important`, reduced-motion handling, public/admin selector risk, and responsive styles.
- Reviewed `before`/`after` evidence file inventory and sampled `after-dom-checks.json` / `after-console.json`.

## Verification

- `pnpm test -- tests/visual-style-contract.test.tsx`: PASS, 25 tests.
- `pnpm test`: PASS, 59 files / 319 tests.
- `pnpm lint`: PASS, `tsc --noEmit`.
- `pnpm build`: not used as review evidence. The local attempts were interrupted by overlapping Windows/Next build process-lock behavior; per delegation, this is treated as an environment/process-lock artifact, not a code finding. Existing M4-02 build evidence remains in `docs/5-Evidence/m4-02/README.md`, and a clean final build should be rerun after review.

## Overall Assessment

The implementation is small and largely aligned with the visual-only approach: it adds a reversible overlay, wires PageHero variants without changing DOM semantics, covers both router imports, and keeps the current admin pages outside the public shell. The remaining blockers are evidence and test-gate strength, not obvious implementation regressions.
