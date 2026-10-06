# Sprint M2-04 公开 SSR 与 SEO/GEO

> **状态：** `CODE_READY_WITH_EXTERNAL_LEGACY`；M2-03 已以提交 `4d117ac` 完成，本 Sprint 的 GPT-5.5-only 文档与代码 review-confirm 均已完成并应用，本地实现和验证通过；`M2-LEGACY-01/02` 未关闭前不得标记 Production Live。

## 1. Sprint 目标

实现 [FR-13](../1-Requirement/Mainland-Website-FR/FR-13-public-ssr-seo-geo-technical-baseline.md)，交付新闻/案例公开 SSR、结构化数据和发现文件。

核心目标：

- 首个响应即可读取公开正文。
- canonical、JSON-LD、RSS、sitemap 和实验性 `llms.txt` 与发布状态一致。

## 2. 前置依赖

- `sprint-m2-03` 完成全部门禁并提供稳定详情查询、published snapshot 和精确 purge URL/outbox。
- FR-13 与本 Sprint 已完成 GPT-5.5-only 文档 review-confirm。

协同说明：

- SEO/GEO 只验收技术基线，不把排名或 AI 引用作为完成条件。
- M2-04 详情严格复用 M2-03 `published | not_found | gone` public DTO；公开列表在相同 repository boundary 新增只返回 immutable published revision 的有界查询，不复用后台 `listByType()`。
- `M2-LEGACY-01` 覆盖真实 ESA endpoint/身份、ESA→FC→RDS 链路、≤60 秒缓存、主动刷新和告警证据；`M2-LEGACY-02` 继续覆盖真实报价、流量假设和预算硬上限。两项不阻断本地开发，但 Production Live 保持 `BLOCKED`。

## 3. 纳入范围

本 Sprint 纳入以下 FR：

- `FR-13` 公开 SSR 与 SEO/GEO 技术基线。

涉及包和目录：

- `/news`、`/news/[slug]`、`/cases`、`/cases/[slug]`，包括 published 列表/详情、空列表、未知/草稿 `404` 与 offline `410`。
- public content repository/query DTO、metadata/JSON-LD 纯函数、`sitemap.xml`、`feed.xml`、`llms.txt`、robots/crawl gate 与可验证缓存头。
- `.env.example` 中默认关闭的 server-only 抓取开关；只有 production 环境且 FR-08/Production readiness 明确批准时才能打开。

## 4. 暂不纳入范围

- 排名监控、关键词保证、搜索提交 API、AI 自动内容和引用追踪。
- 真实 ESA/FC/RDS/OSS/DirectMail 发布、主动刷新、告警、缓存时效或恢复演练。

原因：

- 这些不是已批准的技术基线，也不能作为可保证结果。

## 5. 工作范围

### 5.1 工作包：公开 SSR 与状态码

目标：

- 输出可抓取正文和正确状态。

实现任务清单：

- [x] 先写 public query contract：详情 `published` 只返回匹配 `published_revision_id` 的 immutable sanitized snapshot，`not_found` 映射真实 `404`，`gone` 映射真实 `410`；公开列表只查询 published pointer，按 `published_at DESC, id DESC` 确定排序并固定最多 100 条。
- [x] 实现新闻/案例列表与详情服务端渲染；首个 HTTP 响应必须含 title、summary、sanitized body、发布日期/更新时间和可读面包屑，不以客户端 fetch/JS 注入核心内容。
- [x] public route、metadata、JSON-LD 和发现文件只能消费 public DTO，不得读取 draft revision、`source_html`、案例授权管理员、审计或其他后台字段。
- [x] 为详情选择能够实际控制 HTTP status 的 Next.js SSR 边界；不得用 `200` 空壳、客户端跳转或把 offline 降级为 `404` 代替 `410`。
- [x] repository/DB 不可用时让 route 返回可诊断 `5xx`，不输出残缺正文、fallback 假内容或供应商/SQL/凭据细节。
- [x] published 页面与发现响应声明 `s-maxage <= 60` 的共享缓存契约；未知、草稿、offline、5xx、`/admin` 与 `/api` 不得进入共享缓存。

测试要求：

- [x] 集成测试首响应 HTML、禁用客户端 JS 可读正文、published `200`、draft/unknown `404`、offline `410`、空列表和 DB failure `5xx`。
- [x] 断言公开查询/HTML 不含 draft/source/admin-only 字段，缓存头上限为 60 秒且错误/私有响应不公开缓存。

### 5.2 工作包：Metadata 与 JSON-LD

目标：

- 提供一致的实体与文章语义。

实现任务清单：

- [x] 从同一个 public DTO 生成唯一 title、description、absolute canonical 与 Open Graph；title/description/URL 不使用 draft 或后台 fallback。
- [x] 用纯函数生成 absolute `Organization`、`WebSite`、`BreadcrumbList`；新闻生成 `NewsArticle`，案例生成 `Article`，headline/description/date/URL 与可见页面一致。
- [x] JSON-LD 使用防 `</script>` 序列化并只包含已批准组织配置、可见正文事实和已确认 public media；不得生成评价、客户、结果保证或虚构实体。
- [x] schema 构造/序列化失败时页面正文仍返回 `200`，不输出残缺/无效 JSON-LD，并写入只含 request/component/stable reason 的脱敏 warning。

测试要求：

- [x] JSON-LD 可解析、使用 absolute HTTPS production URL、schema 类型/日期/headline/canonical 与可见正文一致，恶意 `</script>` 不能逃逸。
- [x] 注入 schema failure 后正文仍可用、响应不含无效 JSON-LD，warning 不含正文、SQL、PII 或凭据。

### 5.3 工作包：发现文件与缓存

目标：

- 让公开内容可发现并及时收敛。

实现任务清单：

- [x] sitemap 保留代码管理的公开核心 routes，并加入 published 新闻/案例；RSS 只输出 published 新闻/案例；实验性 `llms.txt` 明确标注实验性并只列稳定公开入口。
- [x] 三个发现文件全部使用 absolute canonical URL、去重、确定排序、固定最多 100 个 CMS 条目，并排除 draft/offline/unknown、`/admin`、`/api`、私有 OSS、preview URL 和 query/fragment。
- [x] 复用 M2-03 精确刷新集合 `/news|cases` 列表、详情、`/sitemap.xml`、`/feed.xml`、`/llms.txt`；本地只验证 URL/outbox/响应缓存头契约，真实 ESA 主动刷新与 ≤60 秒证据继续遗留。
- [x] 增加 server-only crawl gate：默认、preview、staging 及未通过 FR-08 的 production 都输出 blocking robots 与 metadata `noindex,nofollow,nocache`；只有明确 production-ready 配置允许公开抓取，且仍 disallow `/admin`、`/api` 和私有路径。
- [x] `llms.txt` 生成失败不得影响公开页面、RSS 或 sitemap；发现文件失败返回独立可诊断 5xx，不输出部分集合。

测试要求：

- [x] published/draft/offline 混合集合下逐项验证 sitemap/RSS/`llms.txt` 内容、Content-Type、绝对 URL、排序、去重、上限与 `s-maxage <= 60`。
- [x] 验证 crawl gate 默认关闭、preview/staging 阻止、production-ready 才允许，且所有模式都排除后台/API/私有路径。
- [x] 注入 `llms.txt` failure 后页面、RSS、sitemap 的独立生成仍通过。

## 6. 验收标准

- 公开内容首响应含正文和正确语义。
- metadata、canonical、Open Graph 和 JSON-LD 一致有效。
- 发现文件只包含已发布 URL。
- sitemap 同时保留代码管理的公开核心 routes；三类发现文件均不泄露后台、API、草稿、下线或私有资产。
- 公开详情真实返回 `200/404/410`，DB 失败为 `5xx`；JSON-LD 失败不破坏可见正文。
- 默认抓取关闭，只有 production-ready 显式门禁允许索引；本地缓存头契约可验证，但不冒充真实 ESA 时效证据。
- 任何用户文案、测试或验收都不承诺 SEO/GEO 结果。

## 7. 验证要求

项目声明的验证命令：

- `pnpm test`
- `pnpm lint`
- `pnpm build`

专项验证：

- 无 JS 抓取、真实 `200/404/410/5xx`、public DTO isolation、schema/escape/failure、RSS/sitemap/`llms.txt`、crawl gate 和缓存头。
- 客户端 bundle 扫描 `DATABASE_URL`、crawl/purge/ESA/OSS/管理员/DirectMail secrets；`src/`、`scripts/`、migration 扫描无通用 `webservice`。
- `/news`、`/news/[slug]`、`/cases`、`/cases/[slug]` 与空列表在 320×568、390×844、768×1024、1024×768、1440×900 检查单 H1、标题顺序、正文/日期可读、键盘链接、无横向溢出；200% zoom 正确回流。

证据分栏：

| 验证项 | 本 Sprint 允许状态 | Production 状态 |
| --- | --- | --- |
| public DTO、SSR 首响应、`200/404/410/5xx`、metadata、JSON-LD、发现文件、crawl gate | `LOCAL_PASS` | 仍需真实 FC/RDS/正式域名证据 |
| `s-maxage <= 60` 响应头、精确 purge URL/outbox/fake provider | `LOCAL_PASS` | `M2-LEGACY-01 / DEFERRED` |
| 真实 ESA 缓存 ≤60 秒、主动刷新、ESA→FC→RDS、身份/token、告警 | 不得标 PASS | `M2-LEGACY-01 / BLOCKED` |
| 真实报价、流量假设和预算硬上限 | 不得标 PASS | `M2-LEGACY-02 / BLOCKED` |

## 8. 实施顺序

1. 写 public query、SSR、状态码、缓存和失败降级测试。
2. 实现 published-only 列表 query 与列表/详情 SSR。
3. 写 metadata/JSON-LD/escape/failure 测试并实现纯函数。
4. 写 discovery/crawl gate/failure 测试并实现 RSS/sitemap/`llms.txt`/robots。
5. 验证缓存头与 M2-03 精确 purge 契约；真实 ESA 证据保持遗留。
6. 代码 review-confirm、全量验证和独立提交。

## 9. 风险控制

- 结构化数据与正文漂移：从同一服务端 DTO 生成并做契约测试。
- 下线内容仍被发现：状态过滤与 purge/TTL 双重保证。
- App Router 状态码能力不足：在测试先固定真实 410 契约，再选择可显式控制 status 的 SSR 边界，不以 404/200 冒充。
- 抓取过早开放：server-only production-ready 双门禁默认关闭，robots 与 page metadata 使用同一判断。
- JSON-LD/XSS：使用单一安全 serializer，失败时省略 schema 而非输出半成品。
- DB/发现生成失败泄漏：错误响应与 warning 只保留稳定 reason code，不输出正文、SQL 或凭据。
- 技术基线被包装为结果保证：文档和 UI 增加禁止承诺契约。
- M2-04 最高交付状态为 `CODE_READY_WITH_EXTERNAL_LEGACY`，`M2-LEGACY-01/02` 关闭前不得标记 Production Live。

## 10. 交付结论

`CODE_READY_WITH_EXTERNAL_LEGACY`

- GPT-5.5-only 文档 review-confirm 与代码 review-confirm 均完成；未调用 GPT-5.3 Codex Spark。
- 两项已接受代码审查意见均已落地：共享缓存收紧为 `public, s-maxage=60, must-revalidate`，public list/detail JOIN 强制 `r.status = 'published'` 并对损坏 pointer fail closed。
- 最终全量验证：35 个测试文件、140/140 tests 通过；`pnpm lint`、`pnpm build`、`pnpm smoke:standalone`、`git diff --check` 均通过。
- 专项扫描：`.next/static` 未发现数据库、云凭据、crawl/purge 配置、`mysql2` 或 server-only public page 标识；`src/`、`scripts/`、`migrations/` 未发现通用 `webservice`。
- 浏览器 QA：320×568、390×844、768×1024、1024×768、1440×900 及 1440×900 在 200% 下的 720×450 等效重排通过；新闻列表、案例空态、案例详情和下线状态均为单 H1、正文/日期可读、无横向溢出、无应用控制台错误或框架错误覆盖，320px 菜单交互通过。
- `M2-LEGACY-01` 继续记录缺少隔离 ESA/FC/RDS/OSS/DirectMail 资源、probe 身份/token，以及真实缓存、主动刷新、链路和告警证据。
- `M2-LEGACY-02` 继续记录缺少真实报价、流量假设和预算硬上限。
- 上述两项不阻断本地代码交付，但 Production Live 保持 `BLOCKED`。
