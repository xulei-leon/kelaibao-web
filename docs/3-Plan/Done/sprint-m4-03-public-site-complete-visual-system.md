# Sprint M4-03 公开站完整视觉系统

> **状态：** `DONE / Local Code Ready / Production BLOCKED`

**Goal:** 在保持现有文字、页面结构、路由、CTA 和业务功能不变的前提下，按已保存的七张效果图及其当前修订基线把公开站从框架式页面升级为完整的“可信增长网络”视觉系统，并建立可替换本地视觉素材机制。

**Architecture:** 延续 M4-02 的公开站视觉覆盖层和现有 React DOM，在共享 Token、字体、组件 variant 与页面 class 的边界内完成升级；新增内部 `VisualAssetSlot` 和静态资产注册表承载本地 WebP。以冻结 fixture、DOM/路由契约、四视口截图和 concept-to-browser fidelity ledger 防止视觉实施改变内容或功能。

**Tech Stack:** Next.js 15、React 19、TypeScript、CSS/Tailwind 构建链、`next/image` 或现有等价图片能力、Vitest、Testing Library、浏览器截图工具。不新增 UI 框架、远程字体、远程图片运行时或通用 webservice。

## Global Constraints

- 客来宝是唯一主品牌；K-Link 是产品，客来宝媒体是 `/media` 站内子业务。
- 全部现有用户可见文字、路由、Section 顺序、内容分组、CTA、Dialog、移动菜单、CMS 与功能冻结。
- 不新增营销文案、eyebrow、kicker、badge、pill、指标、Logo、评价、价格、Dashboard 或产品结果。
- 七张效果图完整保留设计演进；首页、功能页、媒体页、移动端修订版和团队页修订版是当前基线，初版不覆盖修订版。图中的生成文字与数据不得进入源码。
- 所有图片使用仓库内文件，不向远程图片服务发请求。
- 不修改后台、数据库、CMS 类型、API、SSR/发现契约或生产架构。
- M4-01 已由提交 `2583ff4` 完成并归档，前序硬门禁已满足；FR-21/M4-03 文档 review-confirm 完成前仍不得实施代码。

---

## 1. Sprint 目标

实现 [FR-21](../../1-Requirement/Mainland-Website-FR/Done/FR-21-public-site-complete-visual-system-and-replaceable-assets.md)：

- 建立“可信增长网络”完整设计 Token、中文字体层级和页面留白系统。
- 升级 Header、Footer、按钮、卡片、Hero、Section、Dialog、二维码卡和内容列表。
- 按当前效果图基线完成首页、功能页、团队页、媒体页和移动端视觉构图。
- 为首页 Hero、四类工具、十项功能、团队 Hero 和媒体 Hero 建立本地可替换素材槽。
- 统一关于、联系、政策、新闻和案例页面的排版与表面语言。
- 用自动测试和浏览器证据证明文案、结构、路由、交互、响应式和业务功能无回归。

核心目标：

- 公开站不再呈现为未完成的方框骨架，同时保持当前产品内容和功能边界原样。
- Provisional 素材在页面明显显示建议尺寸，替换为 final 素材后不需要修改页面布局。

## 2. 前置依赖

- FR-21 与本 Sprint 完成文档 review、review-confirm，并应用所有 Accept/Partial 项。
- `sprint-m4-01` 完成验证、提交和归档。该项是硬流程门禁，不因视觉工作没有技术依赖而跳过。
- M4-02 的 Local Code Ready 基线、冻结 fixture、公开站交互测试和视觉覆盖层保持可用。
- 开始实现前记录工作区 dirty/clean 边界，保护用户已有改动。
- 从同一提交采集文字、路由、DOM/Section 和四视口 before 基线。
- 基线命令通过：`pnpm test && pnpm lint && pnpm build`。

协同说明：

- M4-03 不重新打开或改写已归档的 FR-20/M4-02。
- Production 仍受主体、备案、真实云资源、内容授权和发布审查等既有门禁约束。
- 用户于 2026-08-02 显式委托 Sprint Workflow 启动并完成 M4-03，该委托已覆盖标准 document/code `review-start` 的双 reviewer 授权；只有增加标准流程之外的 reviewer 或扩大评审范围时才需要再次确认。

路径：

```text
FR_DIR=products/kelaibao/docs/1-Requirement/Mainland-Website-FR
FR_BACKLOG_DIR=products/kelaibao/docs/1-Requirement/Mainland-Website-FR/backlog
FR_DONE_DIR=products/kelaibao/docs/1-Requirement/Mainland-Website-FR/Done
FR_PATH=products/kelaibao/docs/1-Requirement/Mainland-Website-FR/FR-21-public-site-complete-visual-system-and-replaceable-assets.md
DESIGN_DIR=products/kelaibao/docs/2-Design
CONCEPT_DIR=products/kelaibao/docs/2-Design/assets/m4-03/concepts
SPRINT_DIR=products/kelaibao/docs/3-Plan
SPRINT_DONE_DIR=products/kelaibao/docs/3-Plan/Done
SPRINT_PATH=products/kelaibao/docs/3-Plan/sprint-m4-03-public-site-complete-visual-system.md
REVIEW_DIR=products/kelaibao/docs/4-Reviews
REVIEW_DONE_DIR=products/kelaibao/docs/4-Reviews/Done
EVIDENCE_DIR=products/kelaibao/docs/5-Evidence/m4-03
VERIFICATION_COMMANDS=pnpm test && pnpm lint && pnpm build
```

## 3. 纳入范围

本 Sprint 纳入以下 FR：

- `FR-21` 公开站完整视觉系统与可替换素材。

涉及包和目录：

- `src/app`：公开 App Router 页面、全局样式和公开布局接线。
- `src/pages`：新闻/案例 Pages Router 页面样式接线。
- `src/components`：Header、Footer、Hero、Section、按钮、卡片、Dialog、二维码卡和视觉素材槽。
- `src/content` 或现有等价静态配置：仅增加视觉资产注册表，不修改业务文案。
- `public`：本地 WebP 结构插图和素材目录。
- `tests`：文案、路由、DOM/Section、交互、图片状态与响应式契约测试。
- `docs/2-Design/assets/m4-03/concepts`：七张设计效果图及初版/修订版演进记录。
- `docs/5-Evidence/m4-03`：before/after、fidelity ledger 和验证记录。

页面范围：

- 核心：`/`、`/features`、`/team`、`/about`、`/media`、`/contact`。
- 政策：`/privacy`、`/terms`、`/disclaimer`。
- CMS：`/news`、`/news/[slug]`、`/cases`、`/cases/[slug]`。
- 回归隔离：`/admin`、`/admin/login`、API、健康检查和发现文件。

## 4. 暂不纳入范围

- 修改现有文案、数据常量、Metadata、JSON-LD、RSS、sitemap、`llms.txt` 或 CMS 正文。
- 新增、删除、合并或移动 Section；改变 Grid 内容归属、DOM 阅读顺序或移动端重排顺序。
- 管理后台换肤、组件库迁移、Tailwind 全量重写或运行时主题编辑器。
- 数据库、CMS schema、公开 API、认证、询盘、OSS、DirectMail、ESA 或部署配置变更。
- 客户 Logo、评价、指标、排名、价格、真实产品 Dashboard、虚构办公室或人物素材。
- 使用远程 WebFont、远程图片、第三方图片运行时或通用 `webservice`。
- 关闭任何 Production 外部门禁或把本地截图作为 Production Live 证据。

原因：

- 本 Sprint 只负责现有公开站的完整视觉实现和可替换素材机制，扩大产品范围会破坏冻结契约和验收可比性。

## 5. 工作范围

### 5.1 WP0：门禁、冻结基线与设计输入

目标：

- 在任何代码改动前建立可复核的内容、结构、交互和视觉基线。

实现任务清单：

- [x] 确认 M4-01 已由提交 `2583ff4` 完成、提交并移动到 `Done/`。
- [x] 完成 FR-21/M4-03 文档 review-start、review-confirm 和 Accept/Partial 修改。
- [x] 记录当前工作区边界，不覆盖用户已有变更。
- [x] 生成全部公开路由和页面来源清单。
- [x] 固化所有用户可见文字、导航、CTA、Dialog、表单和可访问名称 fixture。
- [x] 固化每页 Section 数量/顺序、关键 DOM 标记、内容分组和 Grid 列数。
- [x] 在 `320×568`、`390×844`、`768×1024`、`1280×800`、`1440×900` 采集 before 截图。
- [x] 把七张效果图登记为设计输入：`home-desktop.png`、`features-desktop.png`、`media-desktop.png`、`mobile-initial.png`、`mobile-revised.png`、`team-initial.png`、`team-revised.png`。
- [x] 明确 `mobile-revised.png` 与 `team-revised.png` 覆盖各自初版，初版只作为演进记录。
- [x] 建立 allowed-copy inventory，明确图中生成文字不在允许列表；新增可见文字只允许 provisional 槽内固定格式 `建议尺寸 {width}×{height}`，新增可访问名称只允许 FR-21 固定注册表中的 17 个 `alt`，加载失败态不得另造文案。
- [x] 建立 concept-to-section/slot 映射：五张当前基线逐页登记对应 Section、FR-21 素材 ID、需要对照的构图维度和必须忽略/遮罩的生成文字、Logo、数据或新控件区域。

测试要求：

- [x] 基线 `pnpm test && pnpm lint && pnpm build` 通过。
- [x] fixture 对当前源码通过，且对刻意改变的文字、Section 顺序或路由能 fail-first。
- [x] before 截图、五个固定视口、提交号和采集方式记录完整。

### 5.2 WP1：设计 Token 与完整字体系统

目标：

- 把已确认配色、字体、间距、边框、圆角、阴影和动效转化为共享设计系统。

实现任务清单：

- [x] 建立 `#102A56`、`#173A70`、`#2563EB`、`#0F6B50`、`#F5F8FC`、`#EDF4FB`、`#FFFFFF`、`#52657D`、`#CBD7E8`、`#C6A15B` 的语义 Token。
- [x] 明确画布、表面、文字、边框、CTA 和媒体语义映射，禁止页面级任意色值漂移。
- [x] 建立 H1/H2/H3、大正文、正文、导航/按钮和辅助信息的桌面/移动字体 Token。
- [x] 补齐字间距、阅读行宽、中文标点、中英文数字混排和控件字体规则。
- [x] 建立桌面 `80–104px`、移动 `56–72px` 的 Section 留白及约 `1200px` 容器规则。
- [x] 建立组件圆角、低强度阴影、关系线、层级和 motion timing。
- [x] 保持现有视觉 CSS 的低特异性和可回退结构；如需结构性重写，先在 Sprint 文档记录并重复文档门禁。

测试要求：

- [x] 自动检查关键 Token 存在且远程字体引用为零。
- [x] `prefers-reduced-motion` 下非必要位移和过渡被关闭。
- [x] 颜色对比、200% 缩放和长中文断行专项通过。

### 5.3 WP2：共享组件与资产接口

目标：

- 用共享 primitive/variant 完成全站组件语言，并建立可替换视觉素材机制。

实现任务清单：

- [x] 升级 Header、Footer、导航当前态、移动菜单和 sticky 层次。
- [x] 升级主/次/媒体按钮及 hover、active、focus-visible、disabled 状态。
- [x] 升级 Hero、Section、开放内容区、边框卡、重点卡、列表和链接状态。
- [x] 升级 Dialog 与二维码卡表面，不改变焦点、Escape、关闭和资源失败行为。
- [x] 新增内部 `VisualAssetDefinition` 注册表与 `VisualAssetSlot` 组件。
- [x] 字段固定为 `id/src/alt/width/height/status/focalPoint?`，状态仅为 `provisional | final`。
- [x] 为图片建立稳定宽高、`aspect-ratio`、焦点裁切、加载失败和替代文本行为。
- [x] `provisional` 在公开页面显示大字建议尺寸；`final` 自动隐藏该叠层。
- [x] 资产只从本地 `public` 读取，不增加远程 loader 或运行时配置接口。

测试要求：

- [x] 组件状态、键盘焦点、移动菜单、Dialog Escape 和焦点恢复保持通过。
- [x] `provisional`/`final`/加载失败三种素材状态有组件测试。
- [x] 注册表字段缺失、非法尺寸、未知状态或远程 URL 在开发/测试阶段 fail-closed。
- [x] 后台不加载公开站页面级样式或视觉素材。

### 5.4 WP3：核心页面视觉实现

目标：

- 按当前效果图基线完成首页、功能页、团队页、媒体页和移动端的页面级构图。

实现任务清单：

- [x] 首页 Hero 接入 `1600×1200` 可信增长网络视觉，保持现有 copy/actions/aside 顺序。
- [x] 首页四类工具分别接入 `1200×800` 横向结构视觉，不改变四个内容分组。
- [x] 通过背景色带、关系线和开放留白连接现有首页区块，不新增 Section。
- [x] 功能页十项现有功能分别接入 `900×1500` 纵向结构视觉，保持现有顺序和语义。
- [x] 团队 Hero 接入 `1600×1000` 角色协作网络视觉，不使用人物或办公室假图。
- [x] 媒体 Hero 接入 `2400×1000` 横向媒体生态视觉，限制媒体绿与深色构图范围。
- [x] `/media` 继续共享客来宝 Header/Footer/字体/组件，不增加第二 Logo、导航或产品 CTA。
- [x] 每个页面逐 Section 对照概念图修复配色、字体、间距、素材框和下一 Section 预览差异。

测试要求：

- [x] 四页的 H1、CTA、Section 顺序、DOM 阅读顺序和交互 fixture 零差异。
- [x] 页面不得出现概念图中的生成文字、Logo、指标或新控件。
- [x] 图片尺寸、裁切、替代文本和加载失败行为在四视口可用。

### 5.5 WP4：其余公开页面与双路由体系

目标：

- 将完整字体和组件系统扩展到其余公开页面，保持 App Router/Pages Router 数据与运行时行为。

实现任务清单：

- [x] 统一 `/about`、`/contact` 的字体、内容宽度、表面、按钮和留白。
- [x] 统一 `/privacy`、`/terms`、`/disclaimer` 的长文阅读宽度、标题层级、列表和链接。
- [x] 统一 `/news`、`/cases` 列表的卡片、日期、摘要和空状态视觉。
- [x] 统一 `/news/[slug]`、`/cases/[slug]` 的正文、媒体、metadata 可见元素和返回链接。
- [x] App Router 与 Pages Router 引用同一 Token/primitive，避免重复或冲突样式。
- [x] 保持 CMS SSR、canonical、JSON-LD、RSS、sitemap、缓存刷新和发布状态行为。
- [x] 验证 `/admin`、登录页和受保护后台不受公开站页面样式影响。

测试要求：

- [x] 新闻/案例有数据、空列表、缺失详情和已发布内容路径无回归。
- [x] 政策长文在 320px、390px 和 200% 缩放下可读。
- [x] Pages Router SSR 输出、App Router metadata 和发现文件现有测试通过。

### 5.6 WP5：本地素材、响应式与性能

目标：

- 交付完整本地结构插图和稳定的桌面、平板、移动端表现。

实现任务清单：

- [x] 生成或整理 17 个素材槽：首页 Hero 1、首页工具 4、功能视觉 10、团队 Hero 1、媒体 Hero 1。
- [x] 所有素材优化为本地 WebP，记录源尺寸、压缩方式和文件大小。
- [x] 不生成客户、媒体 Logo、评价、指标、办公场景、人物或产品结果。
- [x] 为每个素材配置准确 `alt`、宽高、status 和 focalPoint。
- [x] 17 个素材严格使用 FR-21 固定注册表中的 ID、公开路径、路由/内容组、尺寸、焦点和获准 `alt`；任一缺失、重复或越界定义必须 fail-closed。
- [x] 桌面保持现有列关系，平板/移动转换为稳定单列且不改变阅读顺序。
- [x] 检查 Header、CTA、Dialog、长标题和素材在 `320px`、`390px`、`768px`、`1280px`、`1440px`。
- [x] 控制图片加载优先级、尺寸和布局稳定性；仅首屏关键素材可提高优先级。
- [x] 检查本地静态制品不包含临时提示以外的调试信息。
- [x] 建立素材 provenance ledger，逐项记录素材 ID、文件路径、来源/生成方式、原始尺寸、WebP 压缩方式、文件大小、人物/Logo/客户/指标/产品结果禁用内容检查、授权状态、审核结论和 Production 可用性；未知授权必须标记 `BLOCKED`，不得推断为可商用。

测试要求：

- [x] 无远程字体或远程图片请求。
- [x] 无横向溢出、文字裁切、图片遮挡、明显 CLS 或错误焦点裁切。
- [x] 所有 provisional 槽显示正确建议尺寸，切换 final 后尺寸叠层全部消失。
- [x] reduced motion、键盘、触控目标和图片失败降级通过。

### 5.7 WP6：验证、评审与关闭

目标：

- 以自动化、浏览器和独立评审证据证明功能冻结与视觉完成度。

实现任务清单：

- [x] 运行用户文字、路由、DOM/Section、CTA、Dialog、CMS、发现和后台隔离测试。
- [x] 运行 `pnpm test && pnpm lint && pnpm build`。
- [x] 按现有项目能力运行 standalone smoke、发布校验和客户端秘密扫描。
- [x] 使用 Browser/IAB 完成桌面与移动端逐页导航、滚动和核心交互检查；不可用时记录原因后使用 Playwright Chromium。
- [x] 在五个基准视口采集 after 截图并与 before 和对应概念图对照。
- [x] 对当前五张基线效果图（首页、功能页、媒体页、移动端修订版、团队页修订版）与最新实现截图分别执行图像检查；两个初版只验证已被修订版明确取代。形成至少覆盖文案、构图、字体、配色、素材、留白、响应式和交互的 fidelity ledger。
- [x] fidelity ledger 至少包含：页面、视口、概念图、before、after、Section/素材 ID、检查维度、差异描述、Severity、是否可修复、处理决定、确认来源和证据路径。`Critical`、`High`、`Medium` 的可修复差异未关闭时不得完成；不可修复差异必须引用冻结内容/结构或浏览器约束证据并显式接受。
- [x] 图像检查只评估构图、区域比例、字体层级、配色、素材语言、留白、响应式和交互状态；概念图中的生成文字、Logo、数据、指标和新控件区域必须遮罩或标记忽略，并以 allowed-copy/no-new-claim fixture 独立验收。
- [x] 运行 above-the-fold allowed-copy diff，新增、删除、改名或重排均必须修正。
- [x] 完成 code review、code-review-confirm，只应用 Accept/Partial 项并重跑全部验证。
- [x] 更新 FR/Sprint 状态和 `docs/5-Evidence/m4-03/README.md`。
- [x] 全部门禁通过后将 FR-21/M4-03 和对应 review 文件移动到 `Done/` 并独立提交。

测试要求：

- [x] 四个基准视口的 H1、Section、可见溢出和控制台 error/warning 记录可复核。
- [x] 键盘、焦点、Escape、焦点恢复、移动菜单、Dialog、200% 缩放和 reduced motion 通过。
- [x] 设计对照达到无可修复的 agency-signoff 差异；剩余偏差必须是显式接受的实现约束。
- [x] Production 继续报告既有 blocker，不能因视觉验收变为 Production Live。

## 6. 验收标准

- FR-21/M4-03 文档 review-confirm 与代码 review-confirm 均完成。
- M4-01 已在代码实施前完成并归档。
- 全站达到锁定的“可信增长网络”视觉方向，不再呈现为方框骨架或未完成线框稿。
- 色彩、字体、容器、Section 留白、按钮、卡片、导航和素材语言与 FR-21 一致。
- 所有现有用户可见文字逐字不变，不出现效果图中的生成文字或新增营销内容。
- 路由、Section 数量/顺序、内容分组、CTA、Dialog、移动菜单、CMS 和业务功能无变化。
- 首页 Hero、四类工具、十项功能、团队 Hero、媒体 Hero 共 17 个素材槽具备本地资源和注册表定义。
- Provisional 素材明显显示建议尺寸；Final 素材自动隐藏提示。
- `390×844`、`768×1024`、`1280×800`、`1440×900` 以及 `320px` 无溢出、裁切、遮挡或阅读顺序变化。
- 键盘、focus-visible、Escape/焦点恢复、200% 缩放、reduced motion、颜色对比和图片失败降级通过。
- App Router、Pages Router、后台、API、SSR、CMS、metadata 和发现文件无回归。
- 当前五张基线效果图与实现截图完成直接图像对照，fidelity ledger 无未处理的 `Critical`、`High`、`Medium` 可修复问题；两个初版保留在设计资产中且不作为相互冲突的验收基线。
- `pnpm test && pnpm lint && pnpm build` 全部通过。
- 最终状态最多为 `Local Code Ready / Production BLOCKED`。

## 7. 验证要求

项目声明的验证命令：

- `pnpm test && pnpm lint && pnpm build`

专项自动验证：

- 用户可见文字、导航、CTA、Dialog 和可访问名称 fixture。
- 公开路由、Section/DOM 顺序、Grid 内容归属和移动阅读顺序契约。
- `VisualAssetDefinition` 校验及 provisional/final/加载失败组件测试。
- App Router/Pages Router 公开内容、CMS SSR、metadata 与发现文件回归。
- 远程字体/图片请求扫描、客户端秘密扫描、standalone smoke 和 release validation。

浏览器验证：

- Browser/IAB 优先；不可用或不稳定时才使用 Playwright Chromium并记录原因。
- 视口：`320×568`、`390×844`、`768×1024`、`1280×800`、`1440×900`；补充 200% 缩放。
- 路径：Header 导航、移动菜单、K-Link Dialog、媒体 Dialog、联系表单、新闻/案例列表与详情、政策长文、后台登录隔离。
- 对照：当前五张基线效果图、before 截图和 after 截图必须在同一 QA 阶段直接检查；另核对两个初版的替代关系记录。

文档阶段验证：

- `git diff --check`
- FR/Sprint 编号、相对链接、索引状态、依赖顺序和概念图片存在性检查
- Sprint Workflow acceptance gates

## 8. 实施顺序

1. 确认 M4-01 已完成并归档（已由提交 `2583ff4` 满足）。
2. 完成 FR-21/M4-03 文档 review-confirm 并应用确认项。
3. 建立冻结 fixture、allowed-copy inventory、DOM/路由基线和 before 截图。
4. 先以失败测试锁定内容、结构、素材状态和后台隔离。
5. 实建设计 Token、字体系统和共享组件。
6. 接入 `VisualAssetSlot`、资产注册表和本地结构插图。
7. 依次实现首页、功能页、团队页、媒体页，再扩展其余公开页。
8. 完成响应式、可访问性、性能和图片失败降级。
9. 执行完整自动验证和浏览器 fidelity QA。
10. 完成 code review-confirm，应用确认项并重跑验证。
11. 更新证据与状态，移动完成文档并创建独立提交。

不得在 M4-01、文档 review-confirm 和冻结基线完成前修改公开站代码。

## 9. 风险控制

- **视觉升级再次停留在框架层：** 当前五张基线效果图作为页面级/移动端验收输入，逐 Section 对照，不以 Token 或构建通过代替视觉完成度。
- **图像模型文案进入站点：** allowed-copy inventory 和 fixture 逐字锁定；概念图中的文字、Logo 和数据全部禁止使用。
- **换肤导致结构漂移：** 冻结路由、Section、DOM、Grid 和移动阅读顺序，四视口 before/after 自动与人工对照。
- **Provisional 素材被误报完成：** 状态为 provisional 时强制显示建议尺寸，只有真实替换并改为 final 后才能隐藏。
- **结构插图形成虚假产品证据：** 只表达关系和信息组织，不生成 Dashboard、客户数据、指标或产品结果。
- **媒体页形成第二品牌：** `/media` 只使用绿色业务语义，继续共享客来宝外壳、字体、Token 和组件。
- **图片造成性能或布局问题：** 固定宽高与 aspect ratio、使用本地 WebP、限制首屏优先级并验证 CLS。
- **双路由体系样式不一致：** App Router 与 Pages Router 共用设计 Token/primitive，分别执行 SSR 和浏览器回归。
- **公开样式污染后台：** 页面级 selector 和入口隔离，后台截图/DOM 回归作为退出条件。
- **动效影响可访问性：** 限制属性与幅度，提供 reduced motion，键盘和 200% 缩放独立验收。
- **绕过 Sprint 顺序：** 索引、FR 和 Sprint 同时标记 M4-01 硬门禁，未归档时停止在文档阶段。

## 10. 交付结论

已完成。最终状态为：

- FR-21 与 M4-03 已完成双模型 document review、review-confirm 及全部 Accept 项修改。
- 七张设计效果图、17 张 provisional WebP、allowed-copy、provenance、before/after 与 fidelity ledger 已归档。
- 实现已完成双模型 code review、code-review-confirm，所有 Accept/Partial 项已应用。
- `pnpm test`（60 files / 331 tests）、`pnpm lint`、`pnpm build`、standalone/media smoke、release validation、客户端秘密扫描和 `git diff --check` 全部通过。
- 本 Sprint 达到 `Local Code Ready`；生成素材授权与既有外部门禁使 Production 状态继续保持 `BLOCKED`。
