# 新闻与案例静态页面设计及当前实现分析

日期：2026-10-20。代码基线：`f4cfea3`。状态：M5-05 静态代码及本地验证完成，真实内容迁移/Production BLOCKED；下表保留基线提交的核查事实。当前工程根目录为 `D:/code/kelaibao-web`，下文代码路径相对此根目录。

## 当前提交与实现

| 提交/模块 | 核查结果 | 对本次变更的影响 |
| --- | --- | --- |
| `f4cfea3`（HEAD） | 合并 FC 部署指南、配置模板与相应校验引用 | 不包含新闻/案例静态化；不能仅改部署文档认定迁移完成 |
| `4f149e3` | 共享编辑器改为 HTML 输入，自动生成 slug，增加新闻逻辑删除及 MySQL/SQLite 迁移和测试 | 与新目标相反，这些后台能力不再作为后续功能要求；已有历史数据仍需保护 |
| `src/pages/news/{index,[slug]}.tsx`、`src/pages/cases/{index,[slug]}.tsx` | 四个页面均导出 `getServerSideProps` | 当前是请求时 SSR，不是构建期静态页面 |
| `src/server/content/public-page-server.ts` | 通过 repository 查询 published snapshot，处理 404/410；无数据库的 Preview 列表允许空状态 | 去掉运行时内容查询；空 Preview 不能证明真实库无内容 |
| `src/server/content/public-contract.ts` | 公开 DTO 包含 revision、sanitizedHtml、时间和封面元数据 | 静态内容保留公开字段，摆脱数据库 ID、pointer、revision 契约 |
| `src/server/discovery/runtime.ts` 与 App Router 的发现文件路由 | sitemap、RSS、llms 共用 repository 查询新闻和案例，失败为 503 | 发现文件必须同步迁移，否则页面静态化后仍依赖数据库 |
| `src/app/admin/(protected)/news`、`cases` 与共享 `content-editor.tsx` | 提供创建、HTML 编辑、上传、保存及生命周期操作 | 移除目标 CMS 入口和专用调用，不再优化编辑体验 |
| `src/app/api/admin/content`、`src/server/content/service.ts`、两种 repository | 内容事务、修订、授权、版本冲突、新闻逻辑删除 | 不再驱动公开页面；保留历史数据，不运行破坏性迁移 |
| `src/app/api/internal/cache-purge/route.ts` | 从数据库读取 purge job 后调用 ESA | 静态内容刷新归发布流程，停用只服务 CMS 的 worker 与调度 |

核查使用当前源码与 git 记录；本轮未读取真实数据库、连接云服务或验证线上内容。工作区原有未跟踪 `var/` 不纳入本次修改。

## 目标数据流

```text
仓库内新闻/案例模块 + 已授权静态图片 + 撤回/跳转清单
    -> 内容校验与 Next.js 构建
    -> 同一版本的列表、详情、metadata、sitemap、RSS、llms.txt
    -> FC 制品部署与 ESA 受影响 URL 刷新
    -> 访客首响应读取完整页面

询盘仍为：浏览器 -> /api/inquiry -> DirectMail HTTPS
```

沿用现有公开页面外观、导航、路径和品牌。以一个类型明确的静态内容模块作为列表、详情、摘要与发现文件的共同来源，复用现有可用布局，不再通过数据库生成正文。实现可沿用 Pages Router 静态生成或迁入 App Router，但同一 URL 只能有一个路由所有者；迁移时删除冲突路由，不建立第二应用。

静态条目包含 `slug`、`title`、`summary`、`publishedAt`、`updatedAt`、受控正文和可选图片（URL、alt、宽高），类型区分新闻/案例。日期使用明确时区并保持原始首次发布日期，不能把迁移日期当作首次发布日期。类型内重复 slug、无效日期、缺少必要字段、公开清单和撤回/跳转清单冲突应使构建失败。slug 不能沿用 CMS 的“每次新建自动编号”交互。

## 替代与保留

[FR-25](../1-Requirement/Mainland-Website-FR/FR-25-static-news-and-cases.md) 是本次内容维护方式的现行依据，覆盖旧 FR-12/FR-24、M2-03/M5-04 及 auto-slug、HTML editor、news-delete 的冲突要求。旧设计、review-confirm 和验收证据仅证明历史版本；其完成记录不应被重写为本次迁移已经完成。

保留首响应 HTML、可访问性、响应式、授权审查、SEO 发现、Preview 索引限制与生产门禁。仅服务 CMS 的登录、Session、图片上传、净化预览、审计与 outbox 在迁移中一并退场；被询盘、静态资源、配置或发布工具共享的功能须按调用关系保留或改造。

原阿里云平台选型不因“静态页面”改变为 ESA Pages、Vercel 或纯静态托管。RDS、私有 OSS、旧表与历史媒体的保留/退役需按实际用途另行评估，不在本次规格修订中删除资源或放开 Bucket 权限。部署指南与配置模板须在实施阶段按最终依赖更新，当前运行代码仍适用旧操作说明。

## 发布与迁移控制

实施遵循 [M5-05](../3-Plan/sprint-m5-05-static-news-and-cases.md)。先盘点公开内容与历史 URL，再冻结 CMS 写入、导出核对、构建并验证，再切换 FC 版本、刷新并抽查 ESA 内容。所有已公开路径必须明确为保留、永久跳转或 410；未知路径为 404。静态化不允许通过删除数据库来实现，也不允许把旧库草稿打包上线。

发布采用版本一致性检查；列表、正文、首页/关于页摘要与发现文件不能分别从新旧数据源读取。缓存刷新有独立发布证据，不沿用“事务成功即发布完成”的旧 CMS 语义。保留旧制品、数据与媒体供受控回退；没有真实内容和缓存证据时只报告本地验证。

## M5-05 当前实现回填

内容源为 `src/content/articles.ts`；受控模型和校验在 `article-types.ts`、`src/lib/static-content.ts`，公共展示在 `src/lib/content-pages.tsx`。Pages Router 列表/详情为 SSG，发现路由 force-static；仅撤回/跳转由 middleware 按轻量代码清单响应。CMS 专用入口、实现和依赖已移除，MySQL 保留用于离线盘点和历史 SQL 工具。当前已核实本地公开清单为空，不推断真实库为空。

本地 295 项测试、类型、构建、standalone smoke、发布门禁负向检查及四视口通过；长英文标题裁剪已修复。详情和边界见 [验收记录](../5-Evidence/m5-05/README.md)，真实历史内容迁移及云部署仍保持 BLOCKED。
