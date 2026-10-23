# FR-13 公开 SSR 与 SEO/GEO 技术基线

> **2026-10-20 规格覆盖：** 保留首响应 HTML 与 SEO/GEO 技术基线，内容来源改为静态清单，缓存更新归代码部署；SSR 不再表示必须逐请求查库。 现行依据为 [FR-25](FR-25-static-news-and-cases.md)；M5-05 已完成静态代码与本地验证，真实内容迁移和 Production 证据仍待补齐。

- `FR-ID`: `FR-13`
- `标题`: 公开 SSR 与 SEO/GEO 技术基线
- `所属阶段`: 阶段 5 - 阿里云全栈升级
- `开发顺序`: 13
- `优先级`: P0
- `前置依赖`: `FR-25`（静态内容）；FR-12 仅为旧实现历史
- `涉及包`: `/news`、`/cases`、metadata、JSON-LD、sitemap、RSS、robots、`llms.txt`、ESA 缓存
- `是否属于原型阶段`: 否
- `来源类型`: 新需求
- `原始 SRS 章节`: 6.9、6.13、8、10、11.6
- `相关 FR`: `FR-07`、`FR-14`

> 2026-10-23 索引策略覆盖：见 [公开搜索抓取 Review Confirm](../../4-Reviews/public-search-crawl-review-confirm.md)。

## 目标

让公开新闻与案例在首次响应中即可被用户、搜索引擎和合规抓取工具理解，并形成不夸大效果的 SEO/GEO 技术基线。

## 背景与问题

客户端加载正文会削弱抓取稳定性；仅有 metadata 又不足以表达实体、文章类型和内容关系。技术基线必须与内容状态和授权保持一致。

## 影响范围

- 新闻/案例列表和详情的构建期静态 HTML。
- metadata、canonical、Open Graph、语义 HTML 与 JSON-LD。
- `/sitemap.xml`、`/feed.xml`、`/llms.txt`、robots 和缓存。

## 需求描述

1. `/news/[slug]` 与 `/cases/[slug]` 的首个 HTTP 响应包含标题、摘要、正文和核心事实。
2. 每个公开内容页有唯一 title、description、canonical 和 Open Graph。
3. 全站输出 `Organization`、`WebSite`、`BreadcrumbList`；新闻输出 `NewsArticle`，案例输出 `Article`。
4. 结构化数据内容必须与可见正文一致，不包含未授权评价、虚构实体或结果保证。
5. sitemap、RSS 和 `llms.txt` 与页面共用静态公开清单，只列可抓取的稳定 URL，不查询内容数据库。
6. `llms.txt` 明确为实验性发现文件，不包含私有后台、API、草稿或下线 URL。
7. 未知 URL 返回真实 `404`；曾公开后撤回 URL 由代码清单返回真实 `410`，不得进入发现文件；私人草稿不进入公开制品。
8. 新闻、案例及发现文件按普通静态页面采用发布版本缓存，部署精确刷新受影响 URL；不再使用 CMS 即时发布和事务 outbox 契约。

## 高层要求

- 不以客户端脚本作为核心正文唯一来源。
- JSON-LD 使用稳定 schema 和绝对 URL，避免与 canonical 冲突。
- SEO/GEO 验收只检查技术输出，不承诺排名、推荐、收录、AI 引用或流量。
- 依据 2026-10-23 用户要求，所有环境的公开页面均允许抓取与索引，取消 PUBLIC_CRAWL_STATUS 门禁；后台、API、健康检查与撤回页面仍排除。FR-08 其他发布门禁继续有效。

## 输入

- 代码维护的静态公开清单、站点/组织配置、撤回/跳转清单与静态图片。

## 输出

- 构建生成的首响应 HTML、metadata、JSON-LD、RSS、sitemap、robots 与 `llms.txt`。

## 失败与降级

- 内容数据库不可用：静态页面与发现文件仍可用，不查询内容 repository；内容模块无效应阻止构建和发布，保留上一可用版本。
- 结构化数据生成失败：页面正文仍可访问并记录告警，不输出无效 JSON-LD。
- `llms.txt` 不受支持：不影响页面、RSS 或 sitemap。

## 不纳入范围

- 排名监控平台、关键词保证、自动内容生成、搜索提交 API 或付费投放。
- AI 引用追踪和任何推荐/流量承诺。

## 最小验证方式

- 对 HTML 首响应、metadata、canonical、JSON-LD schema 和状态码做集成测试。
- 验证 sitemap/RSS/`llms.txt` 过滤、绝对 URL 与缓存头。
- 实施阶段运行 `pnpm test`、`pnpm lint`、`pnpm build`。

## 验收要点

- 静态公开新闻和案例无需执行客户端 JS 即可读取正文，且无内容数据库依赖。
- schema 类型、canonical 与可见内容一致。
- 私人草稿与撤回内容不出现在公开清单或发现文件；410 由代码清单维护。
- 技术说明与页面文案均不含 SEO/GEO 结果保证。

## 备注

GEO 在本项目中指面向生成式检索的技术可发现性，不是独立产品品牌。

