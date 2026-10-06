# Sprint M4-04 Code Review Report

**Reviewer:** opencode-go/kimi-k2.7-code
**Review date:** 2026-08-05
**Project:** `products/kelaibao`
**Review base:** `HEAD` (`d5044511 chore: checkpoint sprint-m4-04 development`) plus all untracked M4-04 implementation and evidence files.
**Review type:** Code review

**Requirement sources:**

- `docs/1-Requirement/Mainland-Website-FR/FR-22-owner-approved-public-site-content-and-experience-update.md`
- `docs/3-Plan/sprint-m4-04-owner-approved-content-and-experience-update.md`
- `docs/4-Reviews/20260804-kelaibao-website-review-confirm.md`
- `products/kelaibao/AGENTS.md`
- `docs/5-Evidence/m4-04/`

## Executive Summary

The current change set is a focused batch of the larger Sprint M4-04 scope. It adds the `ImageLightbox` component, refreshes the `/media` and `/about` pages for review-confirm items C45–C56, updates the claims register and release gate inputs for the new M4-04 blocked claims, and adds/updates corresponding tests and evidence documents.

**Local verification passes:** `pnpm test` (347 passed, 2 skipped on Windows symlink EPERM), `pnpm lint` (`tsc --noEmit`), and `git diff --check` are all clean.

**Production status remains correctly BLOCKED** for all evidence-dependent Accept items (claims, media list, company credentials, Logo, office/arrival images, policy text), as documented in `docs/5-Evidence/m4-04/production-blockers.md`.

The two items that need correction before this batch can be considered locally complete are:

1. `/about` still renders the company introduction as a single `PageHero` lead paragraph instead of the independent four-paragraph “公司介绍” module required by FR-22 §7.1 and C52.
2. `/media` displays the heading “百家主流媒体全覆盖” with only 11 example outlets, creating a local content-accuracy mismatch even though Production is blocked.

## Scope Reviewed

### Modified files (`git diff HEAD`)

- `docs/5-Evidence/m3-05/claims-register.json`
- `docs/5-Evidence/m3-05/gate-input.json`
- `src/app/about/page.tsx`
- `src/app/globals.css`
- `src/app/m4-03-visual-system.css`
- `src/app/media/page.tsx`
- `tests/fixtures/m4-02-public-page-baseline.json`
- `tests/m2-server-config.test.ts`
- `tests/m3-claims-validator.test.ts`
- `tests/m3-release-cli.test.ts`
- `tests/m3-release-evidence.test.ts`
- `tests/m4-04-owner-update.test.tsx`
- `tests/sqlite-maintenance.test.ts`

### Untracked files

- `docs/5-Evidence/m4-04/decision-traceability.md`
- `docs/5-Evidence/m4-04/production-blockers.md`
- `docs/5-Evidence/m4-04/asset-provenance-ledger.md`
- `docs/5-Evidence/m4-04/visual-qa.md`
- `docs/5-Evidence/m4-04/screenshots/*.png` (20 screenshots)
- `src/components/image-lightbox.tsx`
- `tests/image-lightbox.test.tsx`

### Not in this diff

`decision-traceability.md` references `site-header.tsx`, `site-footer.tsx`, `src/app/page.tsx`, `src/app/features/page.tsx`, `src/app/team/page.tsx`, `src/app/contact/page.tsx`, `src/components/contact/inquiry-form.tsx`, `src/lib/inquiry-validation.ts`, and policy pages. None of these appear in `git diff HEAD`, so this review treats them as outside the current change set.

## Verification Results

| Check | Command / Evidence | Result | Notes |
|---|---|---|---|
| Unit tests | `pnpm test` | PASS | 64 files, 347 passed, 2 skipped (Windows `EPERM` on symlink tests) |
| Type check / lint | `pnpm lint` (`tsc --noEmit`) | PASS | No errors |
| Whitespace | `git diff --check HEAD` | PASS | No trailing whitespace or conflict markers |
| Full build | Not run on Windows | N/A | Evidence doc notes Windows standalone `package:standalone` fails with `EPERM` creating symlinks; WSL2 build recorded as PASS |
| Decision traceability | `docs/5-Evidence/m4-04/decision-traceability.md` | PASS | C01–C56 mapped to files, tests, and explicit `LOCAL_IMPLEMENTED` / `PRODUCTION_BLOCKED` states |
| Production blockers | `docs/5-Evidence/m4-04/production-blockers.md` | BLOCKED | All external-evidence items remain BLOCKED; no blocker was cleared |

## Findings

| Severity | Type | Location | Issue | Evidence | Recommendation |
|---|---|---|---|---|---|
| High | Requirement | `src/app/about/page.tsx` (lines 55–61) | The company introduction is still rendered as a single long `PageHero` lead paragraph, not as an independent “公司介绍” module with four paragraphs. | FR-22 §7.1: “`/about` Hero 改为‘关于我们’，公司介绍成为独立模块并采用审阅稿四段正文.” Review-confirm C52 Accept requires four company-introduction paragraphs. Current `PageHero` uses `lead` prop, and `PageHero` renders it inside one `<p className="page-hero__lead">`. There is no `<Section title="公司介绍">`. | Extract the company introduction from the Hero `lead` into a dedicated `Section` titled “公司介绍” with four paragraphs matching the review-confirm input; shorten the Hero lead to a concise value proposition. Update `m4-04-owner-update.test.tsx` and baseline fixture to assert the four-paragraph module exists. |
| Medium | Correctness | `src/app/media/page.tsx` (lines 23–26, 137) | The heading “百家主流媒体全覆盖” is paired with only 11 example outlets (6 mainstream + 5 local). | `MEDIA_OUTLETS` lists 11 names. The page disclaimer “可对接的媒体范围以当期项目清单、媒体审核与实际发布结果为准” qualifies the list, but the heading remains absolute and overstates the displayed scope. | Rename the heading to a qualified form such as “主流媒体资源示例” or “合作媒体范围示例”，or expand the list/heading to be internally consistent; add an assertion that the heading text carries a qualifier. |
| Medium | Maintainability | `src/app/media/page.tsx` (lines 14–26, 73–142) | Media problems, icons, and outlet lists are hardcoded directly in the page component. | `MEDIA_PROBLEMS`, `MEDIA_PROBLEM_ICONS`, and `MEDIA_OUTLETS` are local `const` arrays. Icon selection is by numeric index with an IIFE inside JSX, so a length mismatch is only caught at runtime. | Move the media content into `src/content/site-content.ts` (or a dedicated `src/content/media-content.ts`) as a typed array such as `{ problem: string; icon: LucideIcon }[]` and `{ group: string; outlets: string[] }[]`; import and map them in the page. |
| Low | Accessibility | `src/components/image-lightbox.tsx` (lines 20–41) | The native `<dialog>` does not declare `aria-modal`, and the trigger button contains an `<Image>` whose `alt` may contribute to the button’s accessible name alongside the visible label. | Line 30: `<dialog aria-label={label} ...>` lacks `aria-modal="true"`. Line 27: `<Image alt={alt} ...>` is nested inside the button whose visible label is line 28 `<span>{label}</span>`. | Add `aria-modal="true"` to the dialog. Either set `aria-hidden="true"` on the trigger image or verify the computed accessible name is the intended label only; document the expected name in the test. |
| Low | Maintainability | `src/components/image-lightbox.tsx` (lines 6–12, 27, 40) | The component always uses `unoptimized` images and offers no `className`, `priority`, or `sizes` props, limiting reuse and optimization. | Props type only exposes `alt`, `height`, `label`, `src`, `width`. Both trigger and dialog `<Image>` components pass `unoptimized`. | Remove `unoptimized` for local public assets where Next.js image optimization is desired, or make it an optional prop; expose `className`, `priority`, and `sizes` props so the component can be reused for other image sizes/positions. |
| Low | Test | `tests/image-lightbox.test.tsx` (lines 7–31) | The focus-restoration test validates the mocked `close` event path rather than the component’s actual close-button/backdrop behavior. | The test patches `HTMLDialogElement.prototype.close` to fire `close`, then calls `dialog.close()` directly. It does not click the close button or the backdrop. | Add a test that clicks the “关闭” button (or backdrop) and asserts focus returns to the trigger, or spy on `triggerRef.current.focus` to confirm the component’s `onClose` handler is executed. |
| Low | Clarity | `src/app/media/page.tsx` (line 75) | Icon rendering uses an immediately-invoked function expression inside JSX, adding unnecessary indirection. | `{(() => { const Icon = MEDIA_PROBLEM_ICONS[index]; return <Icon ... />; })()}`. | Map to a typed `{ problem, Icon }` array and render `<Icon aria-hidden="true" className="media-problem-icon" />` directly. |
| Low | Accessibility | `src/app/media/page.tsx` (lines 71–79) | The four problem cards are rendered as `<article>` elements inside a `<div>` grid, with no list semantics after the 01–04 numbers were removed. | Review-confirm C18 requires removing the numbered prefixes. The remaining structure is four sibling `<article>` elements. | Consider wrapping the grid in `<ul>` with `<li>` (styling preserved) or adding `role="list"` / `role="listitem"` so screen-reader users still perceive the four items as a related set. |
| Info | Scope | Overall change set | This diff covers only a subset of M4-04: media page, about page, claims register, evidence, and image lightbox. Header/Footer, home, features, team, contact, and policy changes are referenced in `decision-traceability.md` but absent from `git diff HEAD`. | `git diff --name-only HEAD` lists 13 files. `decision-traceability.md` maps C01–C44 and C50 to files such as `site-header.tsx`, `site-footer.tsx`, `src/app/contact/page.tsx`, `src/components/contact/inquiry-form.tsx`, and policy pages. | Confirm this is the intended final batch of M4-04; if earlier batches were already reviewed, note the commit range in the evidence directory so the full sprint review is reproducible. |
| Info | Risk / Compliance | `docs/5-Evidence/m4-04/production-blockers.md`, `docs/5-Evidence/m4-04/asset-provenance-ledger.md`, `docs/5-Evidence/m4-04/decision-traceability.md` | Production remains correctly BLOCKED for all evidence-dependent Accept items. | Blockers include: result/efficiency claims, search/indexing claims, media coverage/name authorization, K-Link attribution/lock behavior, company credentials, Logo, office image, arrival guide, and policy text. No blocker was cleared or bypassed in code. | Keep all blockers in place until the listed evidence/authorization and professional review are completed; do not promote `productionReady` to `true` until then. |
| Info | Test / Verification | `pnpm test`, `pnpm lint`, `git diff --check` | Automated quality gates pass. | 347 tests passed, 2 skipped (Windows symlink `EPERM`); `tsc --noEmit` passed; no whitespace errors. | No action required for this batch. Continue to require `pnpm test && pnpm lint && pnpm build` before any merge. |

## Detailed Discussion

### About page company introduction (High)

The most significant local gap is in `/about`. FR-22 §7.1 and review-confirm C52 explicitly require the company introduction to become an independent “公司介绍” module with four paragraphs. The current implementation keeps the entire introduction inside `PageHero.lead`, which renders as one long paragraph. This also overloads the Hero section with dense text that hurts readability. Separating it into its own `Section` will satisfy the requirement, improve scannability, and make the four-paragraph structure testable.

### Media coverage heading (Medium)

The media page correctly adds the requested outlet examples and the required disclaimer, but the heading “百家主流媒体全覆盖” implies a scope far larger than the 11 names shown. Because the item is Production-blocked for authorization reasons, the local page can still render the module, but the heading should not over-promise. A qualified heading such as “主流媒体资源示例” or “可对接媒体范围（示例）” would be more accurate and would still allow the review-confirm wording to be tracked in the claims register.

### ImageLightbox accessibility and reuse (Low)

The new `ImageLightbox` component is a solid, minimal implementation: native `<dialog>`, focus restoration, backdrop click close, and a plain-text link fallback. The Low-severity items are polish: add `aria-modal="true"`, clarify the trigger’s accessible name, and consider exposing more props for reuse. The current test coverage proves the dialog opens and focus returns, but should also exercise the actual close button/backdrop path.

### Scope note (Info)

This review covers only the uncommitted change set relative to `HEAD`. The traceability matrix implies that many C01–C44 and C50 items were implemented in earlier commits (e.g., Header, Footer, Home, Features, Team, Contact, policy pages, inquiry form). No defects are raised for those files because they are not part of the current diff, but the final Sprint review should confirm that those earlier commits were also reviewed and that the traceability matrix matches the repository history.

## Conclusion

The current M4-04 change set is well tested, lint-clean, and correctly keeps Production BLOCKED for all evidence-dependent items. Before marking this batch ready for review-confirm, address the two local findings:

1. Refactor `/about` so the company introduction is an independent “公司介绍” module with four paragraphs.
2. Qualify the `/media` “百家主流媒体全覆盖” heading or align the displayed list with the heading’s scope.

The remaining findings are Low-severity polish and one informational scope note. After the two Medium/High items are resolved and the existing test/lint/build gates are re-run, this batch can proceed to code review-confirm. Production release must remain blocked until the external evidence and authorization items in `docs/5-Evidence/m4-04/production-blockers.md` are resolved.
