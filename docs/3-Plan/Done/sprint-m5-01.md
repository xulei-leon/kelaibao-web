# Sprint M5-01 SEO 结构化数据与响应式图片优化

> **状态：** `COMPLETED / LOCAL CODE READY / Production BLOCKED`
>
> **来源问题：** SEO 审计 `P2-1`、`P2-2`
>
> **来源报告：** [2026-08-08 客来宝 SEO 审计](../../6-SEO/2026-08-08-kelaibao-seo-audit.md)

## 1. Sprint 目标

本 Sprint 覆盖以下既有 FR 的增量实现：

- [FR-07 Metadata、可访问性与发布质量](../../1-Requirement/Mainland-Website-FR/FR-07-metadata-accessibility-and-quality.md)
- [FR-11 私有 OSS 媒体与 HTML 安全净化](../../1-Requirement/Mainland-Website-FR/FR-11-private-oss-media-and-html-sanitization.md)
- [FR-12 新闻与案例 CMS 生命周期](../../1-Requirement/Mainland-Website-FR/FR-12-news-case-cms-lifecycle-and-publication.md)
- [FR-13 公开 SSR 与 SEO/GEO 技术基线](../../1-Requirement/Mainland-Website-FR/FR-13-public-ssr-seo-geo-technical-baseline.md)

核心目标：

- 为代码管理的公开页面补齐与可见内容一致的 WebPage、AboutPage、Service 等页面级结构化数据，同时保持全站只有一个客来宝 Organization。
- 为代码内 Hero、功能图和 Lightbox 预览建立确定性的构建期响应式 WebP 产物，显著降低 `/features` 图片传输量，且不在 FC 请求路径执行图片转码。
- 将新闻/案例代表图显式绑定到不可变 content revision，使可见图片、Open Graph 与 Article/NewsArticle ImageObject 使用同一已确认媒体。
- 保持普通图片服务端渲染、二维码长按保存、Lightbox 按需加载、私有 OSS、精确 ESA 刷新和现有索引门禁无回归。
- 只交付可验证的 SEO/GEO 技术基线，不承诺排名、收录、富媒体结果、AI 引用或流量。

路径与验证基线：

```text
FR_DIR=products/kelaibao/docs/1-Requirement/Mainland-Website-FR
FR_BACKLOG_DIR=products/kelaibao/docs/1-Requirement/Mainland-Website-FR/backlog
FR_DONE_DIR=products/kelaibao/docs/1-Requirement/Mainland-Website-FR/Done
DESIGN_DIR=products/kelaibao/docs/2-Design
SPRINT_DIR=products/kelaibao/docs/3-Plan
SPRINT_DONE_DIR=products/kelaibao/docs/3-Plan/Done
REVIEW_DIR=products/kelaibao/docs/4-Reviews
REVIEW_DONE_DIR=products/kelaibao/docs/4-Reviews/Done
EVIDENCE_DIR=products/kelaibao/docs/5-Evidence/m5-01
VERIFICATION_COMMANDS=pnpm test && pnpm lint && pnpm build
```

以上目录来自现有项目布局与 [Sprint 索引](../Mainland-Website-Sprint-Index.md)，验证命令来自产品级 `AGENTS.md`。`pnpm smoke:standalone` 作为本 Sprint 额外专项验证，不替代项目声明的完整命令。

## 2. 前置依赖

- M2-02、M2-03、M2-04 已建立私有媒体、CMS revision、公开 SSR、metadata、JSON-LD 和精确 purge 基线。
- M4-03、M4-04 已建立当前视觉资产槽、Hero、功能图、二维码和 Lightbox 行为基线。
- [阿里云全栈架构规格](../../2-Design/Alibaba-Cloud-Fullstack-Architecture-Spec.md)继续约束生产架构为 `ESA -> FC Next.js -> RDS MySQL + 私有 OSS`；不得切换至 Vercel 部署。
- [管理员安全与私有媒体 Runbook](../../2-Design/Admin-Security-and-Media-Runbook.md)继续约束媒体确认、直接 HTTPS OSS provider、凭据和审计边界。
- Logo、Hero、新闻/案例代表图只有在来源、权利人和公开使用授权形成 PASS 证据后才能进入相应结构化数据或专属社交图。
- 本 Sprint 文档必须先完成 `review-start`、`review-confirm`，并应用 Accept/Partial 决策；在此之前不得修改代码。
- 用户于 2026-08-08 明确启动 M5-01 完整开发任务，已授权本 Sprint 约定的 document/code 双 reviewer 流程；新增 reviewer 或改变评审范围仍需重新确认。

协同说明：

- 客来宝是唯一主品牌和 Organization；K-Link 是产品名，客来宝媒体是 `/media` 内的 Service，不增加第二站点、第二实体或 `site_key`。
- 本地构建、SQLite、fake OSS/ESA 和浏览器检查只能形成 `LOCAL_PASS`；真实 ESA/FC/OSS/RDS、大陆网络和微信浏览器结论继续受 `M2-LEGACY-01/02` 与 Production 门禁约束。
- 本 Sprint 吸收并取代此前的“SEO 结构化数据与响应式图片优化设计方案”，后续以本文件作为工作范围与验收入口。

## 3. 纳入范围

本 Sprint 纳入以下 FR：

- `FR-07`：代码管理页面 metadata、Open Graph、响应式、可访问性与构建质量增量。
- `FR-11`：已确认私有媒体的真实图片尺寸和公开使用授权门禁。
- `FR-12`：新闻/案例代表图随 revision 保存、发布和审计。
- `FR-13`：页面级 schema、Article 图片、SSR metadata 与缓存刷新增量。

涉及包和目录：

- `scripts`、`package.json`、`next.config.ts`：响应式素材生成、构建接线和 standalone 制品。
- `public/visual`：带源哈希的构建期响应式 WebP。
- `src/content`、`src/lib`：视觉资产 manifest、统一 route metadata 与稳定 schema ID。
- `src/app`：App Router Metadata API、页面级 JSON-LD、静态 OG 图片。
- `src/components`：Server Component 图片原语、VisualAssetSlot、Lightbox 和公开内容图片。
- `src/pages`、`src/server/discovery`：新闻/案例 SSR Head、Open Graph、Article/NewsArticle。
- `src/server/content`、`src/server/media`：代表图 revision、公开 DTO、尺寸解析、授权审计和 repository adapter。
- `migrations`、`migrations/sqlite`：MySQL/SQLite expand-only schema 变更。
- `tests`：生成器、组件、metadata、schema、CMS、缓存、SSR 和回归测试。
- `docs/4-Reviews`、`docs/5-Evidence/m5-01`：文档评审、代码评审与验证 Evidence。

## 4. 暂不纳入范围

- Next.js 请求期图片转码、依赖本机磁盘一致性的 ISR 或运行时图片缓存。
- ESA 图片处理查询参数、第三方图片 CDN、远程图片 loader 或通用 `webservice`。
- CMS 正文图片自动裁切、在线编辑、图库管理或全部媒体自动生成变体。
- CMS 代表图首期不生成 display variants；详情可见图、Open Graph 与 Article 使用同一不高于 350 KB 的不可变 1200x630 级图片。这是经 document review-confirm 接受的首期性能例外，不改变代码内视觉资产的响应式预算。
- 从正文第一张图片推断代表图，或使用通用占位图伪装 Article 图片和列表缩略图。
- Product、SoftwareApplication、Offer、AggregateRating、Review、客户 Logo 或未授权 Organization Logo schema。
- AVIF 首期依赖；只有中国大陆目标浏览器、微信内置浏览器和 ESA 缓存 Evidence 通过后才另行评估。
- 新 CMS 类型、第二应用、第二域名、公开 OSS Bucket、公众账号、CRM、支付、预约、自动报价或微信 API。
- 关键词排名监控、搜索提交 API、AI 引用追踪及任何效果保证。

原因：

- 本 Sprint 只解决审计 P2-1/P2-2，优先交付可控的结构化数据和图片性能闭环，不扩大产品、CMS 或生产架构。

## 5. 工作范围

### 5.1 WP0：文档、资产与技术路径门禁

目标：

- 在代码实施前固定来源 FR、资产授权、图片路径选择和验收 Evidence。

实现任务清单：

- [x] 对本 Sprint 执行 document `review-start` 与 `review-confirm`，将报告写入 `REVIEW_DIR`，应用全部 Accept/Partial 决策。
- [x] 记录用户于 2026-08-08 对本 Sprint document/code 双 reviewer 的人工授权；本授权不扩展到额外 reviewer 或其他 Sprint。
- [x] 建立代码视觉资产、Logo、Hero 和代表图的 provenance/authorization 清单；未通过资产保持 BLOCKED。
- [x] 对 `next/image`/`getImageProps()` + 项目内 custom loader 与原生 `<img srcset>` 做受控技术验证。
- [x] custom loader 只能把框架请求宽度映射到 manifest 已有变体；两条路径都不得产生 `/_next/image`、远程转换或 FC 请求期转码。
- [x] 如果 custom loader 无法可靠映射有限宽度、污染其他图片路径或 standalone/ESA 验证失败，记录 Evidence 后采用原生 `<img srcset>` 自托管例外。
- [x] 固定图片宽度、字节预算、`sizes` 命名契约、OG 字体和缓存头基线。

测试要求：

- [x] 技术验证覆盖首响应 HTML、`currentSrc`、网络 URL、standalone 制品和其他图片回归。
- [x] 文档链接、FR 映射、路径变量、review 输出目录和未决资产门禁检查通过。

### 5.2 WP1：构建期响应式素材流水线

目标：

- 从已登记本地原图生成确定、可审计、不可变缓存的多宽度 WebP。

实现任务清单：

- [x] 新增固定 `sharp` 版本的 `pnpm assets:build`，并在 `next build` 前执行。
- [x] 生成器只读取 `public/visual/image/` 内已登记文件，拒绝远程 URL、`..`、符号链接逃逸、零尺寸和未知类型。
- [x] 输出 `public/visual/generated/{asset-id}/{source-sha256}/{width}.webp` 和可供服务端读取的 manifest。
- [x] 只生成不超过源宽的变体：Hero 初始候选 480/768/1280/1600/2400，首页横图 320/480/640/960/1200，功能竖图 240/320/480/640，Lightbox 预览 320/640/960。
- [x] 构建验证源哈希、宽高、重复宽度、变体完整性和单文件预算；失败立即停止发布。
- [x] standalone 制品包含全部生成产物；必要 manifest 或变体缺失不得在生产组件自动回退原始大图。

测试要求：

- [x] 覆盖确定性输出、不放大、哈希路径、非法路径、远程 URL、损坏图片、缺变体和超预算 fail-closed。
- [x] 重复构建相同输入得到相同路径和 manifest；源图变化产生新哈希目录且不覆盖旧文件。

### 5.3 WP2：响应式渲染与客户端边界

目标：

- 让浏览器按真实布局选择合适图片，同时控制 LCP、CLS 和客户端脚本成本。

实现任务清单：

- [x] 普通 Hero、功能图和内容图由 Server Component 输出；只向客户端边界传递当前图片的原始字段，不序列化完整 registry/manifest。
- [x] 只有 Lightbox/Dialog 等真实交互保留 Client Component；普通图片不为统一 `onError` 状态加载客户端脚本。
- [x] 原始宽高用于稳定纵横比，图片失败保留可读 `alt` 和稳定空间，不再次请求原始大图。
- [x] 每页最多一个真实 LCP 图片使用 eager/high priority；其他图片 lazy/async，Lightbox 原图只在打开后进入 DOM。
- [x] `sizes` 根据最终 CSS 容器、padding、gap、最大宽度和 DPR 校准，不允许移动端有内边距时笼统使用 `100vw`。
- [x] 二维码继续使用适合微信长按保存/识别的原生 PNG/JPEG，不套用有损转换或装饰覆盖。
- [x] dominant color/极小 blur placeholder 只允许用于 Hero 或首屏代表图；独立 assets origin 只在当前路由 LCP 需要时输出 `preconnect`。
- [x] `/features` 主方案稳定后可单独验证 `content-visibility: auto`；无 intrinsic size、页内跳转和 CLS Evidence 时不启用。

测试要求：

- [x] 320/390/768/1440 记录实际 CSS 宽度、`currentSrc`、候选固有宽度、DPR、请求数和传输字节。
- [x] `/features` 390px 全页图片滚动传输不高于 2.0 MB，1440px 不高于 3.0 MB；Hero 390px 不高于 120 KB、1440px 不高于 250 KB，功能图 320/480 单张不高于 100 KB。
- [x] 验证 LCP、CLS、200% 缩放、键盘 Lightbox、二维码长按/保存/识别和图片失败降级。

### 5.4 WP3：App Router 页面级 schema 与静态社交图

目标：

- 为代码管理页面补齐稳定、真实且不重复实体的 metadata 与结构化数据。

实现任务清单：

- [x] 继续通过 Next.js `metadataBase`、`Metadata`/`generateMetadata` 和适用的 `opengraph-image` 文件约定管理 App Router metadata，不建立平行 Head 系统。
- [x] Root Layout 保留唯一 Organization/WebSite；页面通过稳定 `@id` 引用全局节点。
- [x] `/`、`/features`、`/team` 输出 WebPage，`/about` 输出 AboutPage，`/media` 输出 WebPage + Service，政策页输出无 primary image 的 WebPage。
- [x] Service provider 指向客来宝 Organization；不得把客来宝媒体创建为第二 Organization。
- [x] Organization Logo 只有来源、权利人、公开使用授权、方形版本、HTTPS URL 和可见品牌全部通过时才输出。
- [x] Hero 只有 `socialCropApproved=true` 且 focal point 通过 1200x630 裁切检查时才生成专属 OG；否则使用已验证通用图。
- [x] 中文 OG 优先构建期使用许可通过的本地字体生成；如使用 `ImageResponse`，显式加载字体并验证 standalone 打包，不依赖 FC 通用 `sans-serif`。
- [x] Product/SoftwareApplication 等未通过事实与授权审查的 schema 保持省略。

测试要求：

- [x] App Router 首响应包含 route metadata 和页面级 JSON-LD，绝对 URL、canonical、schema 类型和可见内容一致。
- [x] 全站只有一个 Organization；未授权 Logo、虚构实体、评价、指标或效果保证不能进入 schema/OG。
- [x] OG 中文字体、换行、缺字、1200x630 裁切和通用回退稳定。

### 5.5 WP4：CMS 代表图 revision 与媒体授权

目标：

- 让新闻/案例代表图成为与标题、摘要和正文一致发布的 revision 数据。

实现任务清单：

- [x] MySQL/SQLite expand-only 增加 `media_assets.width_px`、`height_px`、`public_usage_confirmed_at/by`，以及 nullable `content_revisions.cover_media_asset_id`、`cover_alt`。
- [x] 媒体 confirm 在现有 MIME、魔数、大小、SHA-256 校验上解析真实宽高；不得信任浏览器声明尺寸。
- [x] 公开使用授权作为独立管理员动作和固定 reason code 审计，不记录签名 URL、图片正文或自由文本授权文件。
- [x] 授权审计固定使用 action `media_public_usage_confirmed`；`audit_logs.metadata_json` 只保存 media ID 与版本化 `reasonCode=editor_confirmed_public_use_v1`，不得接受管理员自由文本 reason。
- [x] `cover_media_asset_id` 与 `cover_alt` 同时为空或同时存在；`cover_alt` trim 后 1～240 字符且不得复用文件名。
- [x] `cover_media_asset_id` 建立指向 `media_assets(id)` 的 FK 和查询索引；repository 在 revision 写入事务内校验字段成对、媒体已确认和授权。仅在目标 MySQL/SQLite 版本确认实际执行 CHECK 时增加可移植成对 CHECK，否则以应用事务校验为权威并记录兼容原因。
- [x] 代表图只允许已确认、已授权、JPEG/WebP（透明需求下允许合规 PNG）、至少 1200x630、约 1.90:1 且不高于 350 KB 的媒体。
- [x] 更换已发布内容代表图必须生成新 revision；不得修改旧 published revision，也不得自动绑定正文第一张图。
- [x] `PublicContentSnapshot.coverImage` 只输出由服务端 `OSS_ASSETS_BASE_URL` 和已确认 `media/` object key 构造的 URL、宽高、alt 和 MIME；拒绝手填 URL、HTTP、查询参数、外部 Host 和临时签名 URL。
- [x] 确认媒体继续使用 `media/<admin>/<intent>-<hash>` 内容寻址对象键并禁止覆盖；换图必须产生新媒体 URL 和新 revision。
- [x] `cover_alt` 是 HTML/OG 替代文本，不等同可见 caption；首期没有独立图注字段，不得复制成 JSON-LD `caption`。

测试要求：

- [x] MySQL/SQLite migration、repository、DTO、revision 指针和上一应用版本兼容矩阵通过。
- [x] 授权审计 action/reason code、cover FK/索引、repository 事务校验及目标数据库 CHECK 支持判定均有自动化测试。
- [x] 未确认、未授权、尺寸/比例/类型/体积不合规、路径非法和字段不成对的代表图全部拒绝。
- [x] 已发布 revision 在新草稿保存、换图和发布前后保持公开一致性。

### 5.6 WP5：新闻/案例 SSR、Open Graph 与 Article 图片

目标：

- 让公开代表图在 SSR HTML、Open Graph、可见页面和 Article schema 中保持一致。

实现任务清单：

- [x] Pages Router 新闻/案例继续使用 SSR `<Head>`；与 App Router 共同消费统一、纯数据的 route metadata 模型。
- [x] 有 `coverImage` 时详情页显示代表图，并让 `og:image`、secure URL、width、height、alt 与 Article/NewsArticle ImageObject 使用同一绝对 URL 和尺寸。
- [x] 详情代表图首期直接使用不高于 350 KB 的合规社交图片，不生成 display variants；在真实 CMS 图片性能数据证明必要前，不扩大 OSS 多对象事务和 FC 衍生任务。
- [x] Twitter 使用 `summary_large_image`；图片与 Open Graph 相同时复用模型或继承，不维护第二份易漂移配置。
- [x] 没有代表图时 Article/NewsArticle 省略 `image`；OG 可使用通用分享图，但不得把通用图写成 Article 代表图。
- [x] 新闻/案例列表首期保持文本卡片，不下载多个 1200x630 原图或生成虚构缩略图。
- [x] JSON-LD 序列化失败时正文仍返回 200、写脱敏告警并省略无效 JSON-LD。

测试要求：

- [x] 首响应 HTML 检查 title、canonical、OG、可见图片、JSON-LD 和绝对 URL，不依赖客户端 JS。
- [x] 有图、无图、未知/草稿 404、offline 410、republish 和代表图 ESA 不可用降级全部覆盖。
- [x] `cover_alt` 不进入 JSON-LD caption；没有真实代表图时不存在虚构 Article image 或列表占位缩略图。

### 5.7 WP6：缓存、可观测性与生产验证

目标：

- 建立不可变图片、可变 HTML/发现文件和真实 ESA 行为的分层缓存证据。

实现任务清单：

- [x] `/visual/generated/*` 使用 `public, max-age=31536000, immutable`，源哈希变化生成新 URL；先部署图片再刷新 HTML。
- [ ] 已确认 `media/` 对象同样使用内容寻址、禁止覆盖和 `public, max-age=31536000, immutable`；ESA edge TTL 与浏览器缓存语义一致，源 OSS 继续私有。
- [ ] 分别记录浏览器缓存头、ESA edge TTL/命中/Age、源 OSS 私有访问控制，不以“长缓存”或控制台截图代替网络 Evidence。
- [x] HTML、sitemap、RSS、`llms.txt` 与哈希图片使用不同策略；发布/下线只刷新合同列出的精确 URL，禁止无依据全站 purge。
- [x] 换代表图只生成新图片 URL 并精确刷新引用它的 HTML/发现 URL，旧不可变图片不覆盖刷新；第三方社交平台自有缓存不计为 ESA purge 可控范围。
- [ ] 验证 ESA 可用的 stale/last-good 行为及下线例外；不得让已下线 HTML 因 stale 策略长期公开。
- [x] 不在多 FC 实例中引入依赖本机磁盘一致性的 ISR 或 Next.js 运行时图片缓存。
- [ ] 增加构建失败、公开图片错误、JSON-LD 序列化、代表图拒绝、ESA 4xx/5xx、命中率、回源量和 purge 范围指标；不得形成个人浏览轨迹。
- [ ] 在真实 ESA/FC/OSS/RDS、大陆移动网络和微信浏览器形成 Evidence；缺少隔离云资源时保持 `DEFERRED/BLOCKED`。

测试要求：

- [ ] 精确 purge URL、幂等、失败重试、异常范围、缓存命中下降和 Origin 异常回源可测试/可告警。
- [ ] 验证浏览器响应头、ESA 实际命中/Age、图片 URL 不覆盖更新、HTML 404/410 与允许的 stale 行为。

## 6. 验收标准

- [x] 文档评审报告和 review-confirm 存在，Accept/Partial 行动已应用后才开始代码实施。
- [x] `next/image`/`getImageProps()` 本地 custom loader 与原生 `srcset` 的选择有 Evidence，生产不存在 `/_next/image` 请求或 FC 请求期转码。
- [x] 代码视觉素材按实际视口加载哈希变体，必要变体缺失阻止构建，普通组件不自动请求原始大图。
- [x] `/features` 达到 390px <= 2.0 MB、1440px <= 3.0 MB 图片滚动传输预算，或存在经 review-confirm 接受的逐项例外。
- [x] 每页最多一个高优先级 LCP 图片，CLS 不因图片加载增加，普通响应式图片保持 Server Component。
- [x] 二维码长按/保存/识别和 Lightbox 打开后才请求原图均无回归。
- [x] App Router 使用 Metadata API/文件约定，Pages Router 使用 SSR Head，并共同消费统一 route metadata 模型。
- [x] 静态页输出与可见内容一致的 WebPage/AboutPage/Service，全站只有一个客来宝 Organization。
- [x] 未授权 Logo 不进入 Organization schema，Product/SoftwareApplication 等未确认 schema 保持省略。
- [x] 新闻/案例代表图显式绑定 revision，且来自已确认、已授权和尺寸合规媒体。
- [x] Open Graph、Article ImageObject 和可见代表图使用同一 URL 与尺寸；`cover_alt` 与可见图片一致且不冒充 JSON-LD caption。
- [x] 没有代表图时不输出 Article image，也不生成虚构列表缩略图。
- [x] Preview/Production 索引门禁、404/410、sitemap、RSS、`llms.txt` 和精确缓存刷新无回归。
- [ ] 浏览器缓存、ESA edge、源站访问、精确 purge 和异常回源具有真实网络 Evidence；本地结果不冒充 Production PASS。
- [x] 文档确认后完成代码 review-start、code-review-confirm，并应用全部 Accept/Partial 行动。
- [x] `pnpm test && pnpm lint && pnpm build && pnpm smoke:standalone` 全部通过。

## 7. 验证要求

项目声明的验证命令：

- `pnpm test`
- `pnpm lint`
- `pnpm build`

专项验证：

- `pnpm smoke:standalone`，确认 standalone 制品包含生成图片和批准字体，且无 `/_next/image` 运行时依赖。
- 对生成器、manifest、migration、repository、DTO、metadata、JSON-LD、SSR、purge 和错误降级运行定向测试。
- 在 320、390、768、1440 视口及适用 DPR 记录 CSS 宽度、`currentSrc`、固有宽度、请求数、传输字节、LCP、INP、CLS。
- 200% 缩放、键盘、微信内置浏览器二维码长按/保存/识别和 Lightbox 操作检查。
- Google Rich Results Test 与 Schema.org Validator 只作为语法/一致性辅助，不把出现富结果作为 PASS 条件。
- 在正式域名检查首响应 HTML、图片 URL、缓存头、ESA 命中/Age、OSS 私有链路、精确 purge 和 404/410；缺少真实资源时记录 `DEFERRED/BLOCKED`。
- 运行 `git diff --check` 并扫描客户端制品，确认无数据库、OSS、ESA 凭据或完整签名 URL。

## 8. 实施顺序

1. 完成 Sprint 文档 review-start、review-confirm，并应用确认的文档修改。
2. 先编写技术路径 spike 与可执行测试，确认 custom loader 或原生 `srcset` 决策。
3. 先写失败测试，再实现构建期生成器、manifest、预算和 standalone 接线。
4. 实现 Server Component 图片原语、VisualAssetSlot、Lightbox、优先级和 `sizes`。
5. 实现 App Router metadata、页面级 schema 和确定性 OG 图片。
6. 以 expand-only migration 扩展 MySQL/SQLite 媒体与 revision 字段，再实现授权、DTO 和后台选择。
7. 实现 Pages Router 代表图 SSR、Open Graph、Article ImageObject 和无图降级。
8. 实现缓存头、精确刷新指标、告警和生产验证脚本/Evidence。
9. 运行全量与专项验证，形成 Local/Production 分离结论。
10. 对实现变更执行 code review-start、code-review-confirm，应用 Accept/Partial 行动并重新验证。
11. 只有全部门禁通过后，按 Sprint workflow 规则独立提交并更新交付结论；Production 外部门禁仍单独判定。

## 9. 风险控制

- **框架路径风险：** 全局 `images.unoptimized: true` 或 custom loader 可能影响 CMS、二维码、Logo。先用隔离 spike 验证所有图片类别，失败后采用有 Evidence 的原生 `srcset` 例外。
- **性能静默回退风险：** manifest/变体缺失一律构建失败；运行时加载失败只显示稳定替代内容，不请求原始大图。
- **客户端负载风险：** 普通图片不使用统一 `onError` 客户端状态，完整 registry/manifest 不跨 RSC 边界。
- **布局选择风险：** `sizes` 以真实 CSS 宽度、DPR 和 `currentSrc` 验证，不能只依赖手写近似值。
- **数据一致性风险：** 代表图随 immutable revision 发布，旧 published pointer 不因保存草稿或换图而改变。
- **数据库回退风险：** migration 只新增 nullable/向后兼容字段，不执行破坏性 down migration；上一应用版本兼容测试不通过则停止发布。
- **授权风险：** 案例 item 授权与单张图片公开使用授权是两个独立门禁；任一缺失都不得输出代表图或 Logo schema。
- **结构化数据失实风险：** `alt` 不冒充 caption，不从正文首图猜测，不用通用 OG 图伪装 Article image。
- **字体与社交图风险：** 中文字体缺失、缺字或换行变化时阻止专属图发布，回退已验证通用静态图。
- **缓存风险：** 哈希图片与可变 HTML 分层管理，只刷新精确 URL；stale 行为必须排除下线内容长期公开。
- **生产证据风险：** 本地 fake、构建通过和配置截图只记为 `LOCAL_PASS`，不能关闭 ESA/FC/OSS/RDS 或大陆/微信 Production blocker。
- **回退：** 保留原始资产供构建器、Lightbox 和显式发布回滚使用；按 route/asset ID 回滚必须通过可审计配置重新发布，浏览器失败不得触发。

## 10. 交付结论

`LOCAL CODE READY / Production BLOCKED`。文档确认、实现、双代码评审确认、Accept 修复、本地全量验证和独立提交门禁均已完成；未勾选条目均依赖真实生产资源或生产观测，不影响本地代码完成状态，也不得据此提升 Production。

- Local Code 状态：`READY`
- Production 状态：`BLOCKED`
- 文档 review 报告：`docs/4-Reviews/Done/sprint-m5-01-review-by-gpt-5.5.md`、`docs/4-Reviews/Done/sprint-m5-01-review-by-gpt-5.3-codex-spark.md`
- 文档 review-confirm：`docs/4-Reviews/Done/sprint-m5-01-review-confirm.md`
- 代码 review 报告：`docs/4-Reviews/Done/sprint-m5-01-code-review-by-gpt-5.5.md`、`docs/4-Reviews/Done/sprint-m5-01-code-review-by-gpt-5.3-codex-spark.md`
- 代码 review-confirm：`docs/4-Reviews/Done/sprint-m5-01-code-review-confirm.md`，两个 Accept 项已实施并重新验证
- 验证结果与 Evidence：`docs/5-Evidence/m5-01/README.md`；369 tests、lint、build、standalone smoke、四视口和 SSR JSON-LD 均为 `LOCAL_PASS`
- Git commit：`feat: complete sprint-m5-01 code and change base on reviews`
- 剩余 blocker：真实 ESA/FC/OSS/RDS、正式域名、大陆网络、微信浏览器、资产授权及既有 M2 Production 门禁按实际 Evidence 更新。
