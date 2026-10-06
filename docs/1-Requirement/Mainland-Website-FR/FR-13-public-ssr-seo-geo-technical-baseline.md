# FR-13 公开 SSR 与 SEO/GEO 技术基线

- `FR-ID`: `FR-13`
- `标题`: 公开 SSR 与 SEO/GEO 技术基线
- `所属阶段`: 阶段 5 - 阿里云全栈升级
- `开发顺序`: 13
- `优先级`: P0
- `前置依赖`: `FR-12`
- `涉及包`: `/news`、`/cases`、metadata、JSON-LD、sitemap、RSS、robots、`llms.txt`、ESA 缓存
- `是否属于原型阶段`: 否
- `来源类型`: 新需求
- `原始 SRS 章节`: 6.9、6.13、8、10、11.6
- `相关 FR`: `FR-07`、`FR-14`

## 目标

让公开新闻与案例在首次响应中即可被用户、搜索引擎和合规抓取工具理解，并形成不夸大效果的 SEO/GEO 技术基线。

## 背景与问题

客户端加载正文会削弱抓取稳定性；仅有 metadata 又不足以表达实体、文章类型和内容关系。技术基线必须与内容状态和授权保持一致。

## 影响范围

- 新闻/案例列表和详情 SSR。
- metadata、canonical、Open Graph、语义 HTML 与 JSON-LD。
- `/sitemap.xml`、`/feed.xml`、`/llms.txt`、robots 和缓存。

## 需求描述

1. `/news/[slug]` 与 `/cases/[slug]` 的首个 HTTP 响应包含标题、摘要、正文和核心事实。
2. 每个公开内容页有唯一 title、description、canonical 和 Open Graph。
3. 全站输出 `Organization`、`WebSite`、`BreadcrumbList`；新闻输出 `NewsArticle`，案例输出 `Article`。
4. 结构化数据内容必须与可见正文一致，不包含未授权评价、虚构实体或结果保证。
5. sitemap、RSS 和 `llms.txt` 只列已发布、可抓取的稳定 URL。
6. `llms.txt` 明确为实验性发现文件，不包含私有后台、API、草稿或下线 URL。
7. 未知/草稿返回 `404`，offline 返回 `410` 且不进入发现文件。
8. 公开内容 ESA 缓存最长 60 秒，发布/下线执行精确刷新。

## 高层要求

- 不以客户端脚本作为核心正文唯一来源。
- JSON-LD 使用稳定 schema 和绝对 URL，避免与 canonical 冲突。
- SEO/GEO 验收只检查技术输出，不承诺排名、推荐、收录、AI 引用或流量。
- 预览环境继续阻止索引，正式环境只有通过 FR-08 后才开放抓取。

## 输入

- 已发布内容、站点/组织配置、路由和媒体 URL。

## 输出

- SSR HTML、metadata、JSON-LD、RSS、sitemap、robots 与 `llms.txt`。

## 失败与降级

- 数据库不可用：返回可诊断 5xx，不输出残缺或错误内容。
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

- 已发布新闻和案例无需执行客户端 JS 即可读取正文。
- schema 类型、canonical 与可见内容一致。
- 草稿和下线内容不出现在发现文件中。
- 技术说明与页面文案均不含 SEO/GEO 结果保证。

## 备注

GEO 在本项目中指面向生成式检索的技术可发现性，不是独立产品品牌。

