# 客来宝统一中文官网 FR 索引

> **当前细节优化（2026-10-22）：** [FR-27](FR-27-website-detail-refinements.md) / M5-07按review1调整首页、试用、新闻和关于；今日内容橱窗为静态介绍条，公告article-e2撤回410。本地实现、评审和验收完成，未部署；[验收记录](../../5-Evidence/m5-07/README.md)。

> **当前内容维护决策（2026-10-20）：** [FR-25](FR-25-static-news-and-cases.md) 是新闻/案例的现行需求，替代 FR-12/FR-24 及 CMS 补充；FR-10/FR-11/FR-19 仅服务 CMS 的能力不再是目标要求。下列旧顺序与完成状态保留历史含义，新任务为 M5-05；首响应 HTML、询盘、授权及 Production 门禁继续有效。

| 字段 | 内容 |
| --- | --- |
| 文档版本 | `v1.1` |
| 文档状态 | FR-25 Local Code Ready；真实历史内容迁移及 Production BLOCKED |
| 实现状态 | M1/M2/M3/M4-01～M4-04 Local Code Ready；Production 外部门禁仍 `BLOCKED` |
| 更新日期 | `2026-10-20` |
| 上游 SRS | `../Kelaibao-Unified-Website-SRS.md` |
| 上游变更设计 | `../../../../../docs/superpowers/specs/2026-07-31-kelaibao-unified-website-design.md` |

## 1. 路径与验证基线

```text
FR_DIR=docs/1-Requirement/Mainland-Website-FR
FR_BACKLOG_DIR=docs/1-Requirement/Mainland-Website-FR/backlog
FR_DONE_DIR=docs/1-Requirement/Mainland-Website-FR/Done
DESIGN_DIR=docs/2-Design
SPRINT_DIR=docs/3-Plan
SPRINT_DONE_DIR=docs/3-Plan/Done
REVIEW_DIR=docs/4-Reviews
REVIEW_DONE_DIR=docs/4-Reviews/Done
VERIFICATION_COMMANDS=pnpm test && pnpm lint && pnpm build
```

文档编写阶段使用 `git diff --check`、链接/编号检查和 SRS 覆盖检查作为最小验证。代码实施仍使用项目声明的全部命令，不得因为本次文档工作跳过未来的 `build` 门禁。

当前工程为独立仓库 `D:/code/kelaibao-web`，以上路径相对于仓库根目录；旧文档中的 `products/kelaibao/` 是历史位置。M1/M2 FR 继续保留改版前的已实现需求事实；其当前品牌、信息架构和发布迁移由 FR-15～FR-18 覆盖，不对 FR-01～FR-14 正文做批量改写。

## 2. 拆分原则

1. 每个 FR 形成可独立验收的用户能力或上线门禁，避免按单个页面机械拆分。
2. M1/M2 的顾问站以企业微信为首要转化入口；M3 改版后，K-Link 免费体验以小程序二维码为主，客来宝媒体咨询继续使用独立企业微信入口。
3. 职业表达、隐私与效果声明是产品边界，不作为发布后的补充文案处理。
4. 中文站独立建设，不依赖或修改 `products/sino-en/`。
5. M2 固定采用 ESA + FC 全栈 Next.js + RDS MySQL + 私有 OSS + DirectMail；MySQL 为成本优先选择，实际总成本在 M2-00 验证；不使用 ESA Pages 或 Vercel。
6. FR-25 撤销新闻/案例 CMS 及专用后台要求；公开内容均由代码维护，不增加公众账号、支付、CRM、小程序或页面编辑系统。
7. 所有外部集成直接使用明确 HTTP(S) API，不使用通用 webservice。
8. SEO/GEO 只实现技术基线，不承诺排名、推荐、AI 引用、收录或流量。
9. M3 只保留一个客来宝官网应用；K-Link 是产品名，客来宝媒体是 `/media` 单页子业务。
10. 小程序只通过二维码引导体验；官网不实现小程序业务、公众账号、登录或 Dashboard。
11. M3 曾复用 M2 的 CMS；FR-25 改为静态新闻/案例，询盘、媒体安全与发现基线保留，不增加 `site_key`、第二数据库或跨应用内容 API。
12. M4 可增加 repository adapter 和 SQLite 本地测试实现；Production 仍只允许 RDS MySQL，SQLite 不构成第二个生产数据库或云门禁证据。
13. M4-02 只升级现有公开站视觉；当前 layout、用户可见文字、业务交互、CMS、发现与生产架构全部冻结。
14. M4-03 在 M4-02 基础上补齐完整视觉系统、字体与可替换本地素材；文案、结构、路由和功能继续冻结，概念图中的生成文字与数据不得进入实现。

## 3. FR 清单

| 顺序 | FR | 标题 | 优先级 | Sprint | 状态 |
| --- | --- | --- | --- | --- | --- |
| 1 | [FR-01](FR-01-independent-project-shell-and-content-foundation.md) | 独立项目壳与集中内容基础 | P0 | `sprint-m1-01` | M1 Preview 基线 |
| 2 | [FR-02](FR-02-core-sales-pages-and-service-flow.md) | 核心销售页面与定制服务流程 | P0 | `sprint-m1-02` | M1 Preview 基线 |
| 3 | [FR-03](FR-03-profession-scenarios-and-compliance-boundaries.md) | 职业场景页与表达边界 | P0 | `sprint-m1-02` | M1 Preview 基线 |
| 4 | [FR-04](FR-04-wecom-primary-contact-entry.md) | 企业微信首要咨询入口 | P0 | `sprint-m1-03` | M1 Preview 基线 |
| 5 | [FR-05](FR-05-fallback-inquiry-form.md) | 隐私安全的备用询盘表单 | P0 | `sprint-m1-03`、`sprint-m2-05` | M2 Code Ready |
| 6 | [FR-06](FR-06-policy-privacy-and-claims-boundary.md) | 政策、隐私与效果声明边界 | P0 | `sprint-m1-04` | M1 Preview 基线 |
| 7 | [FR-07](FR-07-metadata-accessibility-and-quality.md) | Metadata、可访问性与发布质量 | P1 | `sprint-m1-04` | M1 Preview 基线 |
| 8 | [FR-08](FR-08-mainland-production-readiness.md) | 中国大陆生产配置与上线门禁 | P0 | `sprint-m1-05`、`sprint-m2-05` | Production BLOCKED |
| 9 | [FR-09](FR-09-alibaba-cloud-fullstack-runtime-and-infrastructure-gate.md) | 阿里云全栈运行时与基础设施门禁 | P0 | `sprint-m2-00`、`sprint-m2-01` | Code Ready / External Legacy |
| 10 | [FR-10](FR-10-single-admin-authentication-session-and-audit.md) | 单管理员认证、会话与审计（历史） | P0 | `sprint-m2-02` | 旧版已实现；CMS 专用要求撤销 |
| 11 | [FR-11](FR-11-private-oss-media-and-html-sanitization.md) | 私有 OSS 媒体与 HTML 安全净化 | P0 | `sprint-m2-02` | 旧版已实现；CMS 专用要求由 FR-25 替代 |
| 12 | [FR-12](FR-12-news-case-cms-lifecycle-and-publication.md) | 新闻与案例 CMS 生命周期（历史） | P0 | `sprint-m2-03` | 旧版已实现；目标要求由 FR-25 替代 |
| 13 | [FR-13](FR-13-public-ssr-seo-geo-technical-baseline.md) | 首响应 HTML 与 SEO/GEO 技术基线 | P0 | `sprint-m2-04`、`sprint-m5-05` | 静态内容来源已实现 / Local Code Ready |
| 14 | [FR-14](FR-14-inquiry-observability-security-production-readiness.md) | 询盘、可观测性、安全与生产就绪 | P0 | `sprint-m2-05` | Code Ready / External Legacy |
| 15 | [FR-15](Done/FR-15-kelaibao-brand-and-project-migration.md) | 客来宝品牌与项目迁移 | P0 | `sprint-m3-01` | 完成 / Code Ready |
| 16 | [FR-16](Done/FR-16-kelaibao-product-site-and-mini-program-trial.md) | 客来宝产品官网与小程序体验入口 | P0 | `sprint-m3-02`、`sprint-m3-04` | 完成 / Code Ready |
| 17 | [FR-17](Done/FR-17-kelaibao-media-page-and-legacy-route-migration.md) | 客来宝媒体单页与旧顾问路由迁移 | P0 | `sprint-m3-03` | 完成 / Code Ready |
| 18 | [FR-18](Done/FR-18-claims-content-discovery-and-release-migration.md) | 宣传口径、内容发现与发布迁移 | P0 | `sprint-m3-05` | 完成 / Code Ready / Production BLOCKED |
| 19 | [FR-19](Done/FR-19-database-adapter-and-local-sqlite-test-runtime.md) | 数据库适配层与本地 SQLite 测试运行时 | P1 | `sprint-m4-01` | 完成 / Local Code Ready / Production BLOCKED |
| 20 | [FR-20](Done/FR-20-visual-style-upgrade-and-regression-protection.md) | 官网视觉风格升级与回归保护 | P1 | `sprint-m4-02` | 完成 / Local Code Ready / Production BLOCKED |
| 21 | [FR-21](Done/FR-21-public-site-complete-visual-system-and-replaceable-assets.md) | 公开站完整视觉系统与可替换素材 | P1 | `sprint-m4-03` | 完成 / Local Code Ready / Production BLOCKED |
| 22 | [FR-22](Done/FR-22-owner-approved-public-site-content-and-experience-update.md) | 产品负责人确认的公开站内容与体验调整 | P0 | `sprint-m4-04` | 完成 / Local Code Ready / Production BLOCKED |
| 23 | [FR-23](FR-23-v3-3-public-content-and-media-packages.md) | V3.3 公开内容与媒体套餐 | P0 | `sprint-m5-03` | 完成 / Local Code Ready / Production BLOCKED |
| 24 | [FR-24](Done/FR-24-news-cms-authoring.md) | 新闻 CMS 自主图文编辑（历史） | P0 | `sprint-m5-04` | 旧版已实现；目标要求由 FR-25 替代 |
| 25 | [FR-25](FR-25-static-news-and-cases.md) | 新闻与案例普通静态页面 | P0 | `sprint-m5-05` | Local Code Ready / 真实内容迁移及 Production BLOCKED |
| 26 | [FR-26](FR-26-operations-prototype-refresh.md) | 运营原型内容、图片与配色改版 | P0 | `sprint-m5-06` | Local Code Ready / 未发布 / Production BLOCKED |
| 27 | [FR-27](FR-27-website-detail-refinements.md) | 官网细节优化 | P1 | `sprint-m5-07` | Local Code Ready / 未部署 / Production BLOCKED |

## 4. 依赖与建议实施顺序

```text
FR-01 -> FR-02 -> FR-03
FR-01 -> FR-04 -> FR-05
FR-02 + FR-03 + FR-05 -> FR-06
FR-02 + FR-03 + FR-04 + FR-05 + FR-06 -> FR-07
FR-01..FR-07 -> FR-09
FR-09 -> FR-10 -> FR-11 -> FR-12 -> FR-13 -> FR-14
FR-08 + FR-09..FR-14 -> Production Live gate
FR-15 -> FR-16（M3-02 产品页面/小程序/联系分流）
FR-15 + FR-16（M3-02） -> FR-17
FR-16（M3-02） + FR-17 -> FR-16（M3-04 统一外壳/首页）
FR-16 + FR-17 -> FR-18
FR-08 + FR-09..FR-14 + FR-15..FR-18 -> 客来宝 Production Live gate
FR-09 + FR-10 + FR-12 -> FR-19（仅增强本地开发，不改变 Production Live gate）
FR-16 + FR-17 + FR-18 + 视觉升级方案 v0.2 -> FR-20（纯视觉升级，不改变 Production Live gate）
FR-19 + FR-20 + M4-03 七张设计效果图 -> FR-21（完整视觉与可替换素材，不改变 Production Live gate）
FR-21 + 20260804 产品负责人修改意见 -> FR-22（内容、信息架构、政策、联系与正式候选素材调整）
```

M1-05 原静态生产路径被 M2 全栈生产路径取代；FR-08 仍保留为最终主体、备案、政策和真实环境门禁。M2 严格按 Sprint 编号顺序实施，不并行开发。

M3 复用 M2 全栈代码基线并严格按 M3-01～M3-05 顺序实施。M3 不重新实现后台、数据库、CMS 或询盘；M2 外部门禁不会因品牌改版自动关闭。

M4-01 在 M2/M3 基线上抽取 repository adapter。SQLite 只服务本地集成测试；RDS 与本地 MySQL 共用 MySQL adapter，FR-19 不改变生产门禁依赖或状态。

FR-20 与 FR-19 没有技术依赖，但项目一次只实施一个 Sprint；M4-02 必须在前序 active Sprint 关闭或由用户明确调整顺序后启动。FR-20 的截图与本地测试只证明视觉和回归质量，不关闭 Production 外部门禁。

实际 M4 顺序为：M4-02 经用户明确调整顺序后先完成，随后 M4-01 由提交 `2583ff4` 完成并归档，FR-21/M4-03 已完成 Local Code Ready 并归档。M4-03 不重新打开 M4-02，也不使用视觉证据关闭 Production 门禁。

## 5. SRS 覆盖映射

| SRS 范围 | 覆盖 FR |
| --- | --- |
| 产品隔离、技术壳、集中内容与配置 | `FR-01` |
| 首页、服务、方法、关于与人工成交路径 | `FR-02` |
| 直销、保险、证券职业场景和限制 | `FR-03` |
| 企业微信二维码、弹层与匿名 CTA 事件 | `FR-04` |
| `/contact`、直接 HTTPS 表单与失败降级 | `FR-05` |
| Privacy、Terms、Disclaimer 与授权边界 | `FR-06` |
| Metadata、SEO、响应式、可访问性与质量测试 | `FR-07` |
| 大陆托管、备案、生产配置与正式推广门禁 | `FR-08` |
| ESA、FC、RDS、OSS 运行时与可行性门禁 | `FR-09` |
| 单管理员、Session、锁定、重置与审计（历史，CMS 专用要求撤销） | `FR-10`；退场见 `FR-25` |
| 旧 CMS 私有媒体、预签名上传与净化（历史） | `FR-11`；静态素材/正文见 `FR-25` |
| 新闻/案例静态页面、代码发布、授权与历史 URL 迁移 | `FR-25`（替代 FR-12/FR-24） |
| 公开 SSR、JSON-LD、RSS、sitemap、`llms.txt` | `FR-13` |
| DirectMail、监控、安全、恢复与生产收口 | `FR-14`、`FR-08` |
| 工程目录、包名与主品牌迁移 | `FR-15` |
| 首页、功能、团队、关于与小程序体验 | `FR-16` |
| 客来宝媒体单页、职业边界和旧路由 | `FR-17` |
| 宣传口径、政策、发现与发布收口 | `FR-18`；内容维护方式由 `FR-25` 覆盖 |
| RDS/本地 MySQL 适配与 SQLite 本地后台集成测试 | `FR-19` |
| 已有公开站的视觉风格升级、layout/文案冻结与视觉回归 | `FR-20` |
| 完整品牌视觉、中文字体、可替换本地素材与概念图 fidelity QA | `FR-21` |
| 产品负责人确认的全站内容、信息架构、政策、联系与正式素材调整 | `FR-22` |

## 6. 评审与状态规则

1. 当前 FR 与已完成历史 FR 分别位于本目录及 Done；FR-25 的规格完成不替代代码迁移、review-confirm 和验收回填。
2. 实施前应为目标 FR 编写 Sprint，并完成文档 review-confirm；M4-04 的文档评审由用户于 2026-08-05 明确跳过，不作为 PASS 先例。
3. 未经人工确认，不启动多个 reviewer agents。
4. 只有代码验收完成后，才能将 FR 移入 `Done/`；文档编写完成不等于功能完成。
5. M3-01 完成后，所有 active FR/Sprint/Review 路径随工程迁移到 `products/kelaibao/docs/`。
