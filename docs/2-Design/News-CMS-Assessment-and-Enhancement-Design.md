# 新闻管理现状核查与操作体验补齐方案

- 核查日期：2026-09-23。
- 代码基线：`843ceb2`，`products/kelaibao/` 当前工作区。
- 状态：2026-09-24 已完成 FR-24 / Sprint M5-04 的文档与代码评审、实现及本地验收；本文现状章节保留 2026-09-23 的核查基线。当前交付见 [Sprint M5-04](../3-Plan/Done/sprint-m5-04.md) 与 [验收记录](../5-Evidence/m5-04/README.md)。
- 范围：客来宝现有网站的新闻内容管理、MySQL 持久化和私有 OSS 图片存储。

## 1. 结论

本项目**已经有设计文档，也已经有对应代码实现**，无需重新建设 CMS、数据库或独立后台应用。现有入口为 `/admin/login` → `/admin/news` → 新建/编辑新闻。

现有闭环包括单管理员认证、标题/摘要/正文编辑、草稿、安全预览、发布、下线、重新发布、修订记录、MySQL repository、OSS 上传确认 API，以及从已发布数据库快照读取的公开新闻列表与详情页。

但“存在后台和上传 API”不等于“非技术使用者可方便地自主发布图文”：当前正文控件是 HTML textarea，代表图需要手填媒体 ID；本次在 `src/` 未发现调用 presign/confirm 完成选图直传的浏览器控件。应在现有后台补齐编辑与选图体验，而非重做数据架构。

本次未连接真实 RDS、OSS、ESA 或生产站。仓库的最新相关发布证据仍记录 Production blocker，因此不能据源码和本地测试断言线上后台已经配置可用。

## 2. 已有设计与实施依据

| 文档 | 已覆盖内容 |
| --- | --- |
| [全栈架构规格](Alibaba-Cloud-Fullstack-Architecture-Spec.md) | ESA → FC 全栈 Next.js → RDS MySQL + 私有 OSS，数据模型、后台、净化、运行边界 |
| [FR-10 管理员认证](../1-Requirement/Mainland-Website-FR/FR-10-single-admin-authentication-session-and-audit.md) | 预创建管理员、Session、CSRF、审计 |
| [FR-11 私有 OSS 与 HTML 净化](../1-Requirement/Mainland-Website-FR/FR-11-private-oss-media-and-html-sanitization.md) | 图片短期授权、上传确认、服务端校验、净化与安全预览 |
| [FR-12 新闻与案例 CMS](../1-Requirement/Mainland-Website-FR/FR-12-news-case-cms-lifecycle-and-publication.md) | 字段、状态机、草稿/发布快照、并发保护、修订、缓存刷新 |
| [FR-13 公开 SSR](../1-Requirement/Mainland-Website-FR/FR-13-public-ssr-seo-geo-technical-baseline.md) | 新闻列表/详情、404/410、metadata、sitemap、RSS |
| [Sprint M2-03](../3-Plan/sprint-m2-03.md) | CMS 实施记录，状态为 `CODE_READY_WITH_EXTERNAL_LEGACY` |
| [Sprint M5-01](../3-Plan/Done/sprint-m5-01.md) | 新闻代表图、尺寸及授权校验、revision 绑定与公开 SEO 图片 |
| [管理员与媒体 Runbook](Admin-Security-and-Media-Runbook.md) | 管理员初始化、媒体上传协议、缓存任务及部署配置 |
| [项目 README](../../README.md) | 本地启动、SQLite 后台调试与手工发布步骤 |

FR-11 原范围明确不含通用图库；本方案也不引入通用素材管理系统。新增便捷编辑控件需在后续 FR/Sprint 中明确，而不是把旧 Sprint 的完成状态解释为这些控件已经交付。

## 3. 实际代码核查

以下路径均相对于 `products/kelaibao/`。

| 能力 | 代码证据 | 判断 |
| --- | --- | --- |
| 新闻后台路由 | `src/app/admin/(protected)/news/page.tsx`、`new/page.tsx`、`[id]/page.tsx` | 已实现 |
| 内容编辑和生命周期操作 | `src/components/admin/content-editor.tsx`、`content-list.tsx` | 已实现；正文为 HTML 输入，封面手填 ID |
| 管理 API | `src/app/api/admin/content/` | 已有列表、创建、保存、发布/重新发布、下线、修订接口 |
| 状态机与持久化 | `src/server/content/domain.ts`、`service.ts`、`mysql-repository.ts` | 已有事务、乐观锁、草稿/公开 revision 隔离、审计和 purge outbox |
| MySQL 运行时 | `src/server/db/repository-factory.ts`、`pool.ts`；依赖 `mysql2` | 已实现；SQLite 仅为本地测试适配器 |
| OSS 图片后端 | `src/app/api/admin/media/{presign,confirm,public-usage}/route.ts`、`src/server/media/service.ts` | 已有上传授权、确认入库、公开使用确认 |
| OSS 直接 HTTPS | `src/server/integrations/oss/provider.ts` | 已实现；服务端使用短期凭据，无通用 webservice |
| 公开新闻 | `src/pages/news/index.tsx`、`[slug].tsx`、`src/server/content/public-page-server.ts` | SSR 经 repository 读取已发布数据，不是静态新闻数组 |
| 表结构 | `migrations/001_core_schema.sql` 至 `004_seo_images.sql` | 已有内容、修订、管理员、媒体、上传 intent、审计、缓存任务与代表图字段 |
| 可视化正文编辑、浏览器选图上传 | `content-editor.tsx` 与本次 `src/` 调用检索 | 未发现完整操作界面，是本次建议补齐项 |

补充观察：preview 且未配置任何数据库时，新闻列表会返回空列表；这不能用来判断 CMS 尚未实现。已有数据库时，公开查询只读取 `published_revision_id` 指向的快照，草稿不会直接出现在新闻页。

图谱已刷新；索引工具明确排除了 `src/server/media` 与 `src/app/api/admin/media`，这些目录使用实际文件读取补证，未把图谱缺失当作代码缺失。

## 4. 数据与文件存储方案：复用现有架构

```text
管理员浏览器 → 同域 /admin 与 /api/admin/* → FC Next.js → RDS MySQL
       └─ 获取短期上传授权 → HTTPS PUT → 私有 OSS pending 对象
                                      ↓ 服务端确认、校验、不可变复制
                               私有 OSS media 对象 → ESA 图片分发
公开 /news 与 /news/[slug] → 服务端读取 MySQL 已发布 revision → SSR HTML
```

| 数据 | 存放位置 |
| --- | --- |
| 标题、摘要、slug、工作副本、状态和版本 | MySQL `content_items` |
| 原始 HTML、净化 HTML、不可变修订、代表图 ID/alt | MySQL `content_revisions`；工作副本 HTML 也保存在 `content_items` |
| 图片二进制 | 私有 OSS；生产不依赖 FC 本地磁盘 |
| 图片对象键、MIME、大小、校验和、宽高、公开使用确认 | MySQL `media_assets` |
| 短期上传状态 | MySQL `media_upload_intents` |
| 账号、会话、审计、缓存刷新任务 | 现有 MySQL 对应表 |

无需将整张网页或新闻 JSON/Markdown 文件存入 OSS；新闻正文以 MySQL 为事实来源，OSS 专门保存图片文件。“网页的数据入库”在本任务中指新闻内容，不扩展到首页、功能、团队、媒体、关于和政策页面。

保存草稿只推进 draft revision；显式发布后才推进 published revision。发布与缓存任务在同一数据库事务内提交，提交后再调用 ESA HTTPS 刷新；刷新失败进入既有重试流程，不把已经提交的新闻回滚。下线使用现有状态机，并令详情返回 410。

## 5. 最小体验补齐设计（新增提案）

### 5.1 管理员使用流程

登录 → 新建新闻 → 填标题、摘要（链接在首次保存时自动生成） → 编辑正文并插图 → 可选设置代表图 → 安全预览 → 保存草稿 → 发布 → 查看公开页。

继续使用 `/admin/news`、`/admin/news/new` 和 `/admin/news/[id]`，不增加第二应用。保留现有状态和历史版本能力，但界面用“草稿版本”“已发布版本”等中文说明。

### 5.2 正文编辑

- 2026-10-07 用户确认后的正文入口为单一 HTML textarea，新建/编辑共用，无可视化、格式工具栏或模式切换。
- 删除 Tiptap、可视化导入白名单/结构等价判断/确认图片列表及相应专用测试。sourceHtml 直接作为字符串显示和编辑，旧 HTML 不被重写或在编辑区域执行。
- 保留图片上传确认后追加安全 img 标签的辅助函数，不把此流程误删为可视化编辑；封面功能和服务端媒体校验保持原契约。
- 保存、预览和发布沿用服务端净化；客户端编辑器不是安全边界。
- 有未保存变更时，明确提示先保存再发布；离开页面提示未保存，不把正文或凭据写入 localStorage。网络错误或版本冲突保留当前输入。

### 5.3 图片上传与绑定

在 HTML 正文下方和代表图区各提供“上传图片”，复用同一上传组件。首期只处理本次上传结果及当前文章引用的图片，不新增通用媒体库、删除 API 或批量管理。

1. 选择 JPEG/PNG/WebP，客户端先检查 10 MB 上限，并计算 SHA-256；服务端继续做权威校验。
2. 携带现有 Session/CSRF 请求 `POST /api/admin/media/presign`，提交现有字段 `fileName/mimeType/byteSize/sha256`。
3. 使用响应中的 `authorization.url/method/headers` 直接 HTTPS PUT 文件到 OSS。签名链接只在请求期间使用，不持久化或写日志。
4. 上传成功后请求 `POST /api/admin/media/confirm`，提交 `intentId`，等待服务端校验并获得 `asset.id/publicUrl/width/height` 等现有响应字段。
5. 正文图片填写替代文本后插入已经确认的 ESA URL；不得插入 pending 对象或临时签名 URL。
6. 代表图显示预览、尺寸和大小，自动绑定 `coverMediaAssetId`；填写 `coverAlt`，经明确的“确认可公开使用”操作调用现有 `/api/admin/media/public-usage`。上传成功不能自动代替授权确认。
7. 代表图继续遵守 M5-01 的至少 1200×630、约 1.90:1、不高于 350 KB 等现有服务端规则；不合规时显示原因，让管理员更换文件，首期不引入自动裁剪或压缩管线。

上传组件显示授权中、上传中、校验中、成功/失败状态。confirm 超时先对同一 intent 有界重试；授权过期或内容失败时重新申请上传，禁止失败后绑定无效媒体。正文可继续保留为草稿，但不得保存/发布未确认的媒体引用。

本阶段不要求新增数据库表或更改公开接口。上传成功但未被文章使用的文件暂保留；后续若需要清理，必须先覆盖草稿、公开及历史 revision 引用，避免删除旧版本仍需要的对象。

### 5.4 部署与启用核对

- 依现有 Runbook 在发布步骤执行 MySQL migrations，再预创建管理员；不在请求或 FC 冷启动中自动迁移。
- 核对 RDS 私网连接、FC 数据库连接上限、管理员 Session/CSRF 配置。
- 核对 OSS 私有 Bucket、独立 ESA assets origin、允许管理站来源的上传 CORS，以及签名所需 headers；预签名 API 可用不能代替真实浏览器 PUT 验证。
- 当前 OSS provider 从环境变量读取有到期时间的 STS 凭据；部署必须落实临时凭据续期/替换机制。不能把一次手工注入视为长期可用，本次未验证自动续期。
- 核对 ESA 对 `/admin`、管理 API 的不缓存规则，公开页精确刷新及失败重试触发器。
- MySQL 备份与 OSS 对象保留需一起恢复演练，确保 revision 指向的文件存在。
- 若已存在真实内容，切换前盘点数量、slug、版本和媒体引用；不假设数据库为空，不覆盖现有数据。

具体云配置与成本仍以真实环境证据为准。现存 blocker 见 [M5-03 生产阻塞报告](../5-Evidence/m5-03/production-blockers.md)。

## 6. 实施边界与验收

推荐后续工作按一个小型 FR/Sprint 收口：明确图文自主编辑验收 → 文档 review-confirm → 上传控件与代表图自动绑定 → 受限正文编辑 → 联调与发布验证。复用新闻/案例共享组件时，需要回归案例授权流程，但不扩大案例业务范围。

验收必须包括：

1. 管理员从页面选择本机图片并发布一篇新闻，无需手写 HTML、调用 API 或查询媒体 ID。
2. 刷新后台、重启应用后数据仍存在；公开页首响应含标题、正文和正确图片，发布无需重新构建。
3. 修改已发布新闻并保存草稿，公开页仍显示旧版本；发布更新后内容、代表图和 metadata 同步变化。
4. 下线后公开详情为 410，列表与发现文件不再列出；重新发布恢复公开。
5. 上传/confirm 失败、过期、会话失效、版本冲突时不丢失正文、不引用未确认文件；已有 XSS、CSRF 和媒体校验规则继续有效。
6. 验证旧 HTML 载入/保存保真、当前代表图回显和未保存变更保护。
7. 按工程规则运行 `pnpm test`、`pnpm lint`、`pnpm build`，检查 320px、390px、768px、1440px 管理页面。
8. 真实 RDS 写入、OSS 私有上传/分发、STS 过期与续期、ESA 刷新和备份恢复单独留证；本地 fake/SQLite 测试不能替代这些证据。

暂不增加公开注册、多管理员审批、定时发布、视频/PDF 附件、通用图库、营销页搭建器、CMS 第三方平台或数据库替换。

## 7. 初次核查验证记录（2026-09-23，历史）

以下记录为初次核查阶段；后续实现与 2026-09-24 验收见文首链接。当时仅核查源码和新增本文，不修改运行时代码，不初始化生产数据库、不上传真实文件、不执行生产发布。

- 定向验证：12 个测试文件、50 项测试全部通过（内容状态机/repository/API/UI、媒体安全、已确认媒体、公开 SSR/查询、SQLite 管理闭环和内容集成、MySQL/SQLite 代表图 repository）。
- 工程检查：`pnpm test` 全量 68 个文件、378 项测试通过；`pnpm lint` 通过；`pnpm build` 及 standalone 打包通过。构建生成的 `next-env.d.ts` 路径变化已恢复，最终只保留本文档新增。
- 本文 10 个相对文档链接均可解析；`git diff --check` 通过。
- 这些结果证明既有本地行为与契约通过，不代表真实 MySQL 服务、OSS 或生产部署已完成验收。

## 2026-10-07 自动链接补充

新闻与案例不再人工输入 Slug；创建时由 FC 服务端 crypto 生成类型前缀与 16 位十六进制编号，不依赖标题转换或新服务。编辑页只读展示已保存路径，长路径在窄屏折行。创建/保存 API 可省略 slug；保存事务直接沿用当前 item.slug。保留旧 API 显式输入校验、首次发布冻结与数据库唯一约束；无需 schema 或历史链接迁移。
