# Sprint M2-04 Document Review by GPT-5.5

## Scope

Reviewed these Sprint document-review targets as one unit:

- `docs/1-Requirement/Mainland-Website-FR/FR-13-public-ssr-seo-geo-technical-baseline.md`
- `docs/3-Plan/sprint-m2-04.md`

Judged against:

- `products/sino-cn/AGENTS.md`
- SRS sections 6.9, 6.13, 8, 10, and 11.6
- `docs/2-Design/Alibaba-Cloud-Fullstack-Architecture-Spec.md`
- `docs/2-Design/Saino-Quanwang-Visual-Design-Spec.md`
- Completed M2-03 document/code review confirmations and public-query/purge contracts

`M2-LEGACY-01` and `M2-LEGACY-02` were treated as explicitly deferred local-development legacy items. Production Live must remain `BLOCKED`. No other reviewer or sub-agent was invoked.

## Findings

| Severity | Type | Location | Issue | Evidence | Recommendation |
| --- | --- | --- | --- | --- | --- |
| High | Risk | `docs/3-Plan/sprint-m2-04.md:83-91`, `docs/3-Plan/sprint-m2-04.md:108-119` | Sprint M2-04 does not preserve the required external-legacy evidence split, so implementers can incorrectly mark real ESA cache/purge behavior or Production Live as passed. | M2-04 requires "配置 ESA <=60 秒缓存" and "验证 ESA 缓存与发布刷新" without saying which parts may only be `LOCAL_PASS`. The architecture states `M2-LEGACY-01` and `M2-LEGACY-02` only allow local engineering work and "不允许在遗留项关闭前标记 Production Live" (`Alibaba-Cloud-Fullstack-Architecture-Spec.md:172-177`). M2-03 also explicitly keeps real ESA purge, <=60 秒 cache evidence, real identity/token, and cost as `DEFERRED/BLOCKED` (`sprint-m2-03.md:131-138`, `sprint-m2-03.md:176`). | Add an M2-04 evidence matrix matching M2-03: SSR/status/schema/discovery-file contract tests may be `LOCAL_PASS`; real ESA endpoint, identity/token, ESA->FC->RDS chain, <=60 秒 cache proof, smoke/release/alert evidence, and cost proof must remain `M2-LEGACY-01/02` or `BLOCKED`. The Sprint final status should not exceed `CODE_READY_WITH_EXTERNAL_LEGACY` until those items close. |
| Medium | Requirement | `docs/3-Plan/sprint-m2-04.md:31-32`, `docs/3-Plan/sprint-m2-04.md:83-91` | Robots/indexing environment gates are in scope but not specified as implementation or test work. | FR-13 includes robots/cache in scope and requires preview environments to keep blocking indexing, while production opens crawling only after FR-08 (`FR-13-public-ssr-seo-geo-technical-baseline.md:27`, `FR-13-public-ssr-seo-geo-technical-baseline.md:45`). M2-04 lists robots in scope but has no task or acceptance item for preview `noindex`/robots behavior, production crawl gating, or FR-08 dependency. | Add explicit robots and metadata gating tasks/tests: preview/staging must emit blocking robots and/or `noindex`; production crawl-allowing robots must be conditional on FR-08/production readiness; `/admin`, `/api`, drafts, offline content, and private assets must never be discoverable. |
| Medium | Correctness | `docs/3-Plan/sprint-m2-04.md:52-58`, `docs/3-Plan/sprint-m2-04.md:66-75` | Failure and degradation behavior from FR-13 is not carried into the Sprint tests. | FR-13 requires database unavailability to return diagnostic 5xx without incomplete/wrong content, JSON-LD generation failure to leave page body accessible while recording an alert and not outputting invalid JSON-LD, and unsupported `llms.txt` not to affect pages/RSS/sitemap (`FR-13-public-ssr-seo-geo-technical-baseline.md:55-59`). M2-04 only lists happy-path SSR/status/schema tests and no JS extraction. | Add integration tests for repository/DB failure, JSON-LD generation failure, and `llms.txt` generation failure. Assertions should cover status code, absence of partial or invalid structured data, retained visible body where required, and redacted warning/audit behavior. |
| Medium | Consistency | `docs/3-Plan/sprint-m2-04.md:16`, `docs/3-Plan/sprint-m2-04.md:52-58`, `docs/3-Plan/sprint-m2-04.md:121-124` | The Sprint depends on M2-03 stable content queries but does not require using the completed public DTO contract. | M2-03 states that M2-04 can rely on the public DTO for published list/detail, draft/unknown `404`, offline `410`, and discovery filtering (`sprint-m2-03.md:112-115`). M2-03 also completed exact purge job binding and provider failure handling (`sprint-m2-03-code-review-confirm.md:36-38`). M2-04 mentions "稳定内容查询" only as a dependency, leaving room to re-query draft/source data or duplicate state logic. | Add a contract requirement that M2-04 public routes and discovery files consume only the M2-03 public DTO: `published` renders the immutable sanitized public revision; `not_found` maps to 404; `gone` maps to 410; draft/source HTML and admin-only fields are never read by public rendering. Include executable contract tests at that boundary. |
| Medium | Requirement | `docs/3-Plan/sprint-m2-04.md:85-87`, `docs/3-Plan/sprint-m2-04.md:95-98` | Discovery-file rules are too narrow for sitemap and too loose for stable crawlable URLs. | SRS 6.9 requires sitemap to include all public core pages (`Saino-Quanwang-Mainland-Website-SRS.md:314-318`), while FR-13 requires sitemap/RSS/`llms.txt` to contain only published, crawlable, stable URLs and forbids private backend/API/draft/offline URLs in `llms.txt` (`FR-13-public-ssr-seo-geo-technical-baseline.md:35-37`). M2-04 only says discovery files output `published` content and does not state that sitemap must also retain code-managed core marketing/policy pages. | Specify separate contracts: sitemap includes code-managed public core routes plus published news/cases using absolute canonical URLs; RSS contains only published news/cases entries appropriate for feed consumers; `llms.txt` is experimental, excludes `/admin`, `/api`, draft/offline/unknown/private URLs, and labels itself as experimental. |
| Low | Test | `docs/3-Plan/sprint-m2-04.md:108-110` | Viewport and accessibility validation is underspecified for public list/detail changes. | M2-04 only says "视口检查". Project rules require 320px, 390px, 768px, and 1440px checks after interaction/style changes (`products/sino-cn/AGENTS.md:12`), and the visual spec defines concrete viewport checks including `320x568`, `390x844`, `768x1024`, `1024x768`, and `1440x900`, plus no overflow and 200% zoom reflow (`Saino-Quanwang-Visual-Design-Spec.md:576-594`). | Add a public-route visual QA matrix covering `/news`, `/news/[slug]`, `/cases`, `/cases/[slug]`, and empty cases state at the required viewports, with checks for H1 hierarchy, no horizontal overflow, readable metadata/date/body, keyboard navigation, and 200% zoom reflow. |

## Positive Checks

- FR-13 correctly limits SEO/GEO to technical output and avoids ranking, recommendation, AI citation, traffic, or indexing guarantees.
- M2-04 correctly keeps ranking monitoring, keyword guarantees, search submission APIs, AI-generated content, and citation tracking out of scope.
- The Sprint already includes TDD sequencing for SSR/status tests before implementation and includes `pnpm test`, `pnpm lint`, and `pnpm build` as required validation commands.

## Overall Conclusion

The FR is directionally consistent with the SRS and architecture. The Sprint should not enter implementation until it adds the missing gates above, especially the external-legacy/Production Live evidence split and preview/production crawl controls. These are document-level fixes; no reviewed source document was modified by this review.
