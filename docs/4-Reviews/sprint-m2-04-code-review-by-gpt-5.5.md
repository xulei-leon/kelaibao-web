# Sprint M2-04 Code Review by GPT-5.5

**Review type:** code review
**Review date:** 2026-07-30
**Baseline:** current working tree under `products/sino-cn` relative to commit `4d117ac`, including untracked M2-04 source, test, and review files.
**Primary requirements reviewed:** `FR-13-public-ssr-seo-geo-technical-baseline.md`, `sprint-m2-04.md`, `sprint-m2-04-review-confirm.md`.

## Overall Conclusion

The implementation is directionally sound: public news/case pages use Pages Router SSR to preserve real `200/404/410` semantics, discovery files use App Router route handlers, public DTOs avoid draft/source/admin-only fields, JSON-LD and XML outputs use escaping helpers, crawl gate defaults blocked, and the M2-03 purge URL set remains compatible with `/sitemap.xml`, `/feed.xml`, and `/llms.txt`.

Production Live remains `BLOCKED` by the deferred `M2-LEGACY-01` and `M2-LEGACY-02` evidence gates. I did not require fake cloud evidence for those items.

## Findings

| Severity | Type | Location | Issue | Evidence | Recommendation |
| --- | --- | --- | --- | --- | --- |
| Medium | Correctness / Cache | `src/server/content/public-page.tsx:4`, `src/server/content/public-page-server.ts:73`, `src/server/content/public-page-server.ts:103`, `src/server/discovery/runtime.ts:39` | Shared cache responses can be served stale for 300 seconds, which conflicts with FR-13's public-content cache cap and weakens downline/publish convergence. | `PUBLIC_CACHE_CONTROL` is `public, s-maxage=60, stale-while-revalidate=300`; the same header is applied to published detail pages, lists, sitemap/RSS/`llms.txt`. FR-13 requires public ESA cache to be at most 60 seconds, and M2-04 only allows local evidence for `s-maxage <= 60`. `stale-while-revalidate=300` authorizes shared caches to reuse stale content beyond that cap. | Remove shared `stale-while-revalidate`, or cap it to the same 60-second boundary only if the Sprint explicitly accepts stale serving. Add tests that reject `stale-while-revalidate` values above the public cache cap for content and discovery responses. |
| Medium | Data Isolation / Fail-Closed | `src/server/content/mysql-repository.ts:110`, `src/server/content/mysql-repository.ts:622`, `src/server/content/mysql-repository.ts:643`, `migrations/003_content_publication.sql:35` | Public queries trust `published_revision_id` without requiring the joined revision itself to have `status = 'published'`. | The public column set does not include revision status, and both list/detail joins match only `r.id = i.published_revision_id` and `r.content_item_id = i.id`. The migration adds only a foreign key from `published_revision_id` to `content_revisions(id)`, not a same-status constraint. If a transition bug, manual repair, or future migration points `published_revision_id` at a draft/offline revision, public routes and discovery files can expose that revision instead of failing closed. | Add `AND r.status = 'published'` to public list/detail joins. For detail, an item with `i.status = 'published'` but no joined published revision should keep the existing 5xx fail-closed path. Add tests for a published item whose pointer resolves to a non-published revision. |

## Checks Covered

- Reviewed tracked and untracked M2-04 files under `products/sino-cn`; did not inspect or use `products/sino-en/src`.
- Verified the Pages/App Router split is intentional for real `410` support and does not obviously introduce `mysql2` or `DATABASE_URL` into public page/component imports.
- Verified draft/unknown map to `404`, offline maps to `410`, repository failures throw a stable 5xx path, and private/error responses set `private, no-store`.
- Verified discovery builders consume `listPublishedByType()`, use absolute canonical URLs, cap CMS entries at 100, escape XML, and keep `/admin` and `/api` out of generated route sets.
- Verified JSON-LD serialization escapes script-breaking sequences and omits schema on serialization failure.
- Verified M2-03 purge compatibility: `buildContentPurgeUrls()` includes the list URL, detail URL, `/sitemap.xml`, `/feed.xml`, and `/llms.txt`, with bounded URL count and no wildcard purge.

## Validation Evidence

I did not rerun validation commands during this review to avoid modifying build/test artifacts. Known local evidence supplied before review remains: 35 test files / 140 tests passed, `pnpm lint` passed, and `pnpm build` passed after the `mysql2` client-bundle boundary fix.
