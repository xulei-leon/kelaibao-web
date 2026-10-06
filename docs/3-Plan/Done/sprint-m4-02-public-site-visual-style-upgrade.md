# Sprint M4-02 公开站视觉风格升级

> **状态：** `COMPLETED / LOCAL_CODE_READY / PRODUCTION_BLOCKED`

**Goal:** 在保持当前 layout、全部用户可见文字和交互行为不变的条件下，完成客来宝公开站纯视觉升级：全站采用 Mindbody/HubSpot 风格原则，`/media` 局部采用 Profound 风格原则。

**Architecture:** 保留当前 React DOM、页面数据与业务组件，通过一个在既有 `globals.css` 后加载的可回退视觉覆盖层，以及只输出 class 的 `PageHero` variant 和现有 `Section.className` 完成换肤。以冻结 fixture、既有组件测试、四视口截图和人工对照共同阻止内容或 layout 漂移。

**Tech Stack:** Next.js 15、React 19、TypeScript、CSS、Vitest、Testing Library、现有 Tailwind 构建链与浏览器截图工具。不新增运行时 UI 框架、在线字体或视觉服务。

## Global Constraints

- 客来宝是唯一主品牌；K-Link 是产品，客来宝媒体是 `/media` 站内子业务。
- 只借鉴参考网站的视觉风格，不复制布局、文案、图片、品牌资产或产品界面。
- 页面路由、Section 数量/顺序、DOM 阅读顺序、桌面列数、移动重排和全部用户可见文字冻结。
- K-Link 小程序与客来宝媒体企业微信两套 CTA、Dialog、二维码和事件继续隔离。
- 不新增 GEO 产品、Dashboard、统计数据、客户 Logo、评价、价格、新 CTA 或新功能。
- 不修改后台、CMS、数据库、询盘 API、SSR、Metadata、JSON-LD、发现文件和生产架构。
- 未完成 FR/Sprint 文档 review-confirm 前不得实施代码。

---

## 1. Sprint 目标

实现 [FR-20](../../1-Requirement/Mainland-Website-FR/Done/FR-20-visual-style-upgrade-and-regression-protection.md)：

- 建立可回退的视觉覆盖层和明确的页面视觉变体。
- 升级 Header、Footer、Hero、Section、卡片、流程、CTA、Dialog 与二维码表面。
- 让首页、功能、团队、关于与内容页形成统一 SaaS 品牌感。
- 让 `/media` 在客来宝设计系统内形成深色科技与编辑气质。
- 用自动化和截图证据证明 layout、文案、交互和响应式无回归。

## 2. 前置依赖与门禁

- FR-20、本 Sprint 与视觉升级方案 v0.2 完成文档 review、review-confirm。
- 前序 active Sprint 按项目顺序规则完成或由用户明确调整计划顺序。用户已于 `2026-08-02` 明确授权先启动 M4-02；该覆盖不关闭或改写 M4-01。
- 开始实施前记录 clean/dirty worktree 边界，保留用户已有改动。
- 从同一构建基线采集冻结 fixture 与改造前截图。
- 基线命令通过：`pnpm test && pnpm lint && pnpm build`。

路径：

```text
FR_PATH=products/kelaibao/docs/1-Requirement/Mainland-Website-FR/Done/FR-20-visual-style-upgrade-and-regression-protection.md
FR_BACKLOG_DIR=products/kelaibao/docs/1-Requirement/Mainland-Website-FR/backlog
FR_DONE_DIR=products/kelaibao/docs/1-Requirement/Mainland-Website-FR/Done
DESIGN_PATH=products/kelaibao/docs/2-Design/Kelaibao-Website-Design-Proposal.md
SPRINT_PATH=products/kelaibao/docs/3-Plan/Done/sprint-m4-02-public-site-visual-style-upgrade.md
SPRINT_DONE_DIR=products/kelaibao/docs/3-Plan/Done
REVIEW_DIR=products/kelaibao/docs/4-Reviews
REVIEW_DONE_DIR=products/kelaibao/docs/4-Reviews/Done
EVIDENCE_DIR=products/kelaibao/docs/5-Evidence/m4-02
VERIFICATION_COMMANDS=pnpm test && pnpm lint && pnpm build
```

## 3. 纳入范围

- 公开站视觉 Token、基础排版、背景、边框、圆角、阴影和动效。
- Header、Footer、PageHero、Section、CTA、Dialog、二维码和内容表面的换肤。
- 首页、核心功能、团队方案、客来宝媒体、关于、联系、新闻/案例与政策页面的样式覆盖。
- `PageHero` 纯视觉 variant 与现有页面/Section class 接线。
- 内容/layout 冻结 fixture、组件契约测试和 CSS 安全检查。
- 四个关键视口的改造前后截图、键盘与缩放检查。

## 4. 暂不纳入范围

- 修改任何用户可见文字、页面数据常量、Metadata、结构化数据或 CMS 内容。
- 新增、删除、合并、移动 Section 或改变 Grid 列数、DOM 顺序和交互路径。
- 管理后台视觉升级、组件库迁移、Tailwind 重写或 `globals.css` 全量重构。
- 新图片、远程字体、插画、视频、客户证明、统计数据或真实产品 Dashboard。
- 新产品、GEO 销售入口、账号、支付、CRM、预约、微信 API 或第二站点。

## 5. 工作范围与目标文件边界

计划新增：

- `src/app/visual-refresh.css`：本 Sprint 的可回退视觉覆盖层，按 Token、Shell、Primitive、Page、Responsive 分区。
- `tests/visual-style-contract.test.tsx`：PageHero variant、公开站 class 接线和 DOM 不变契约。
- `tests/fixtures/m4-02-public-page-baseline.json`：经人工确认的固定页面文本与结构基线。
- `docs/5-Evidence/m4-02/README.md`：环境、路由、视口、截图和人工验收索引。
- `docs/5-Evidence/m4-02/before/`、`after/`：同条件截图。

计划修改：

- `src/app/layout.tsx`：只在 `globals.css` 后导入 `visual-refresh.css`；不改变 layout DOM 或 metadata。
- `src/pages/_app.tsx`：只在 `@/app/globals.css` 后导入同一 `visual-refresh.css`，覆盖 Pages Router 的新闻/案例列表与详情；不改变外壳 DOM。
- `src/components/ui/page-hero.tsx`：增加只影响 className 的显式视觉 variant。
- `src/app/page.tsx`、`features/page.tsx`、`team/page.tsx`、`media/page.tsx`、`about/page.tsx`：只接入视觉 variant 或现有 Section 的样式 class，不修改文本、数组、顺序或嵌套。
- 必要时修改现有公开组件 className；不得改变 `SiteHeader`、`SiteFooter`、Dialog、二维码和 CTA 的行为。
- 既有布局/内容测试只允许增加断言，不允许为了视觉实现放宽或删除断言。

默认不修改 `globals.css` 的既有规则。只有覆盖层无法安全表达、且变更可由回归测试证明不改变 layout 时，才允许进行最小原位修正，并在 evidence 中说明原因。

## 6. 工作包

### 6.1 WP0：冻结基线与变更护栏

- [x] 记录 Git 状态、Node/pnpm/浏览器版本和基线构建结果。
- [x] 为 `/`、`/features`、`/team`、`/media`、`/about`、`/contact`、`/news`、`/cases`、`/privacy`、`/terms`、`/disclaimer` 建立规范化文本与结构 fixture。
- [x] 新闻/案例详情在本地存在已发布 fixture 时纳入；无数据时记录列表/空状态并以 `PublicDetailPage`、SSR 与 metadata 既有契约替代，不伪造 CMS 内容。
- [x] fixture 至少记录 H1/H2、Section 顺序、关键 Grid 项数、CTA label、导航项和页面边界说明。
- [x] 动态年份、CMS 数据和环境开关使用明确的稳定化规则，不通过删除断言规避差异。
- [x] 在 `320px`、`390px`、`768px`、`1440px` 采集改造前截图。
- [x] 固定 Chromium 版本、DPR `1`、`zh-CN`、`Asia/Shanghai`、系统字体、`prefers-reduced-motion: reduce`、相同本地数据和 full-page 截图规则。
- [x] 记录 Header、移动菜单、两类 Dialog、二维码和联系表单的当前行为。

验收：

- [x] 新基线测试在未改视觉代码时通过。
- [x] fixture 经人工检查，与当前页面文字和结构一致。
- [x] before 截图的命名、路由和视口可与 after 一一对应。

### 6.2 WP1：视觉 Token 与隔离覆盖层

- [x] 新建 `visual-refresh.css`，在既有 `globals.css` 后加载。
- [x] App Router 与 Pages Router 两个入口都紧随基础样式导入同一覆盖层，加载顺序一致且无重复冲突。
- [x] 以现有变量语义覆盖颜色、圆角、阴影、字体层级、focus 和动效，不创建第二套品牌 Token。
- [x] 文件分区固定为 `tokens/base`、`shell`、`primitives`、`pages`、`responsive`、`reduced-motion`。
- [x] 使用系统/现有中文字体栈，不发起字体或装饰资源网络请求。
- [x] 所有装饰伪元素使用 `aria` 无关的纯视觉 CSS，不生成业务文字。
- [x] 选择器以公开站组件 class 为边界，避免污染 `/admin`。
- [x] 禁止通过裸 `body`、标题、表单等基础元素选择器改变后台；记录 `/admin/login` 与一个受保护后台壳的结构/smoke 结果。

验收：

- [x] 删除单个覆盖层 import 可恢复原视觉。
- [x] 临时禁用两个入口的覆盖层 import，运行针对性契约测试和 `pnpm build`，确认可回退后恢复 import。
- [x] CSS 无解析错误、重复 `@import`、远程 URL、`content` 业务文字或全局 `!important` 滥用。
- [x] 后台关键页面没有新增公共站视觉覆盖。

### 6.3 WP2：Header、Footer 与交互表面换肤

- [x] Header 保持 Wordmark、导航、当前项、移动菜单和产品 CTA 原位置。
- [x] Footer 保持三组链接、品牌说明、边界文字和产品 CTA 原结构。
- [x] 统一按钮高度、圆角、边框、阴影、Hover、active 和 focus-visible。
- [x] 小程序与企业微信继续使用蓝/绿语义，不复用错误的视觉 class。
- [x] Dialog、遮罩和二维码卡只调整表面，不改变焦点、Escape、资源和失败路径。
- [x] MobileContactBar 若受全局规则影响，保持原内容与操作顺序。

验收：

- [x] `site-header`、小程序、企业微信、询盘和公共外壳测试通过。
- [x] 键盘打开/关闭菜单和 Dialog 后焦点恢复正确。
- [x] 200% 缩放及窄屏下无导航、按钮和二维码裁切。

### 6.4 WP3：PageHero 与 Section 视觉变体

- [x] 为 `PageHero` 增加 `product | solution | editorial-dark` variant；缺省值保持向后兼容。
- [x] variant 仅追加 class，不改变内部元素、空 eyebrow、actions、aside 或 boundary 条件。
- [x] 首页与 `/features` 接入 `product`；`/team` 与 `/about` 接入 `solution`；`/media` 接入 `editorial-dark`。
- [x] 保持 Section tone、数量和顺序，只用现有 `className` 做页面级样式边界。
- [x] 首页空 eyebrow 不出现可见空白胶囊或装饰标签。

验收：

- [x] variant 参数的 DOM before/after 只存在 class 差异。
- [x] 每页 H1、Hero actions、aside 与 boundary 和基线一致。
- [x] 不使用 pathname 客户端判断主题，不增加 hydration 风险。

### 6.5 WP4：产品与解决方案页面换肤

- [x] 首页：只强化标题/CTA 的视觉主次、弱化右侧问题卡，统一四类工具、五步路径、价值卡和最终 CTA 的产品化视觉语言；不得修改标题、CTA、正文或列表文字。
- [x] `/features`：统一五阶段轨道与十项结构示意，保留交替左右分栏。
- [x] `/team`：升级瓶颈矩阵、赋能体系、引语、机制和交付保障的解决方案视觉层次，文字保持冻结。
- [x] `/about`：升级事实型 Hero、文化卡、安全区、新闻入口与二维码表面的视觉层次，文字保持冻结。
- [x] `/news`、`/cases`、`/contact` 与政策页：只统一公共表面、标题、链接、表单和内容层级。

验收：

- [x] 页面 Section 数量、Grid 列数、卡片数量和 DOM 阅读顺序与 fixture 一致。
- [x] 没有文字、图片、Logo、数字、CTA 或新组件内容。
- [x] 产品区在不同页面有辨识度，但共享同一 Token 与组件语言。

### 6.6 WP5：客来宝媒体 Profound 风格换肤

- [x] `/media` Hero 使用深海军蓝、低对比网格/关系线、白色标题和绿色咨询 CTA。
- [x] 问题、长期影响、核心价值和内容支柱使用编辑面板、编号与精细边框。
- [x] 两个既有流程使用细线轨道和高对比节点，不改变节点数量与文字。
- [x] 深色只用于既有 Hero、重点区与最终 CTA；正文维持可读浅色表面。
- [x] 禁止新增 GEO/AEO 标签、评分、产品界面、排名图、结果承诺或第二 Logo。

验收：

- [x] `/media` 九个页面区块（含 Hero）、两个流程、卡片数量和两个企业微信 CTA 保持不变。
- [x] 客来宝 Header/Footer 与全站字体、按钮、圆角仍一致。
- [x] 深色文字、绿色 CTA、focus 和关系线通过对比检查。
- [x] 普通文字对比度 `>=4.5:1`；大号文字、非文本 UI/focus 边界 `>=3:1`，并记录抽样色值。

### 6.7 WP6：响应式、动效与无障碍收口

- [x] 保持现有 breakpoint 和 Grid 重排；不通过新增 breakpoint 改写信息架构。
- [x] `320px`、`390px` 收紧字体/间距/装饰，Hero aside 仍完整显示。
- [x] `768px` 检查双列到单列/双列的现有逻辑和菜单状态。
- [x] `1440px` 检查 Hero 主次、正文行宽和长页面背景节奏。
- [x] 动效限于 opacity/transform/color/shadow，避免 layout shift。
- [x] 为 reduced motion 关闭非必要进入和位移动效。
- [x] 检查键盘、焦点、Escape、200% 缩放、触控尺寸和颜色对比。

验收：

- [x] 四视口无横向滚动、裁切、重叠、内容隐藏或 CTA 跳位。
- [x] 动效不会改变布局尺寸；reduced motion 下功能完整。
- [x] 控制台无新增 hydration、CSS 或资源错误。

### 6.8 WP7：全量验证、证据与关闭

- [x] 采集与 before 完全同条件的 after 截图。
- [x] 为每条路由填写“文案、Section、Grid、CTA、响应式、风格目标”检查结果。
- [x] 运行 `pnpm test && pnpm lint && pnpm build`。
- [x] 运行公开站、SSR、Metadata、发现文件、CTA、Dialog、表单和 release contract 相关既有测试。
- [x] 手工 smoke Header、移动菜单、两个二维码 Dialog、联系表单和关键链接。
- [x] 手工 smoke `/admin/login` 与一个受保护后台壳，确认公开站覆盖层未污染后台。
- [x] 完成 code review 和 code-review-confirm，应用接受项后重跑全部验证。
- [x] 只有本 Sprint 全部门禁通过后，才能把 FR/Sprint 移入 `Done/`。

## 7. 路由与风格矩阵

| 路由 | Hero/页面方向 | 必须冻结 | 重点检查 |
| --- | --- | --- | --- |
| `/` | `product` / Mindbody × HubSpot | 七个页面区块（含 Hero）、左右 Hero、全部文案 | H1 主次、流程、最终 CTA |
| `/features` | `product` / 产品目录 | 五阶段、十项工具、交替分栏 | 结构示意统一、长页节奏 |
| `/team` | `solution` / HubSpot 解决方案 | 六个页面区块（含 Hero）、矩阵、引语、机制 | 编号、关系线、交付保障 |
| `/media` | `editorial-dark` / Profound 局部 | 九个页面区块（含 Hero）、两流程、咨询 CTA | 深色 Hero、编辑面板、品牌统一 |
| `/about` | `solution` / 事实型企业页 | 公司文字、文化/安全/新闻/二维码 | 长 Hero 可读性、事实层次 |
| `/contact` | 公共站双路径 | K-Link 与媒体入口、表单开关 | 蓝绿语义、表单与二维码 |
| `/news`、`/cases` | HubSpot 内容系统 | CMS 状态、列表/详情结构 | 编辑留白、链接和空状态 |
| 政策页 | 克制正文 | 窄正文、标题、链接、表格 | 200% 缩放、长文本与 URL |

## 8. 验证要求与证据矩阵

### 自动化

- 文本/结构 fixture：固定全部纳入路由的规范化文本、标题、Section、Grid、CTA；新闻/案例动态详情按可用数据或组件契约处理。
- 组件：PageHero variant、Header/Footer、按钮、Dialog、二维码与公共外壳。
- 页面：home、product pages、media、about/contact、内容与政策基线。
- 平台：SSR、metadata、JSON-LD、discovery、release validator 无回归。

### 视觉人工检查

| 视口 | 设备语义 | 必查项 |
| --- | --- | --- |
| `320px` | 最窄支持手机 | 长标题、菜单、按钮、卡片、二维码、无横向溢出 |
| `390px` | 主流手机 | Hero 高度、aside、单列节奏、触控与 Dialog |
| `768px` | 平板/窄桌面 | 导航折叠、Grid 重排、流程与内容密度 |
| `1440px` | 桌面 | 12 列关系、Hero 主次、行宽、长页节奏 |

截图环境固定为同一 Chromium 控制面、DPR、语言 `zh-CN`、时区 `Asia/Shanghai`、系统字体、`prefers-reduced-motion` 策略与相同本地数据。若 Browser 后端无法可靠完成 full-page 捕获，evidence 必须记录限制，并以同条件视口 PNG 加完整 DOM 的 overflow/结构检查替代，不得使用空白或截断截图。所有矩阵单元使用统一命名；人工结论逐项记录文字、Section、Grid、CTA、溢出、裁切、重叠与交互入口，非预期差异一律先按回归处理。

截图命名建议：

```text
{phase}-{route-slug}-{viewport}.png
before-home-390.png
after-media-1440.png
```

## 9. 实施顺序

1. 冻结测试、文本/结构 fixture 与 before 截图。
2. 新视觉覆盖层和 Token。
3. Header、Footer、CTA、Dialog、二维码。
4. PageHero variant 与 Section 页面边界。
5. 首页、功能、团队、关于及内容/政策换肤。
6. `/media` Profound 局部换肤。
7. 四视口、无障碍、after 截图与完整回归。
8. code review-confirm、最终验证和文档状态回填。

不得在 WP0 基线冻结前开始视觉实现；不得用更新 fixture 的方式消除实现造成的非预期差异。

## 10. 风险控制

- **样式覆盖污染后台：** 使用公开站现有 class 边界，测试 `/admin` 关键结构，避免裸元素全局选择器。
- **`globals.css` 历史规则冲突：** 独立后置覆盖层、明确分区和低特异性策略；不在首轮全量清理旧规则。
- **换肤导致 layout 漂移：** 冻结 Section/Grid/DOM 契约，四视口前后截图逐项对照。
- **文案被顺手优化：** fixture 锁定全部静态页面文字，任何差异 fail-first。
- **Profound 风格形成第二品牌：** `/media` 继续共享 Header/Footer、字体、Token 与绿色咨询语义，不新增 Logo/导航/GEO CTA。
- **伪产品证据：** 只美化现有结构示意，不新增截图、数据、排名或 Dashboard。
- **动效影响可访问性：** 限制属性与时长，提供 reduced-motion，键盘和 200% 缩放独立验收。

## 11. 验收标准与退出条件

- FR-20/Sprint 文档 review-confirm 与代码 review-confirm 均完成。
- 所有用户可见文字与冻结 fixture 一致。
- 路由、Section 顺序、Grid 列数、内容分组、CTA 和交互行为无变化。
- 全站达到已批准的 Mindbody/HubSpot 风格目标；`/media` 达到 Profound 局部风格目标。
- 四个关键视口无溢出、裁切、隐藏、重叠或阅读顺序变化。
- 键盘、焦点、Escape、200% 缩放、reduced motion 和颜色对比通过。
- `pnpm test && pnpm lint && pnpm build` 全部通过。
- `docs/5-Evidence/m4-02/` 包含可复核的 before/after 与验收记录。
- Production 状态继续由既有外部门禁决定；本 Sprint 不将站点标记为 Production Live。

## 12. 交付结论

文档门禁（2026-08-02）：

- FR-20、视觉升级方案 v0.2、M4-02 Sprint 的 gpt-5.5 与 gpt-5.3-codex-spark 评审均已完成。
- 确认文件：`FR-20-visual-style-upgrade-and-regression-protection-review-confirm.md`、`Kelaibao-Website-Design-Proposal-review-confirm.md`、`sprint-m4-02-public-site-visual-style-upgrade-review-confirm.md`。
- 所有 Accept 项已纳入文档；设计方案链接误报已基于当前文件 Reject。
- M4-01 尚未关闭；本 Sprint 依据用户于 `2026-08-02` 的明确授权调整实施顺序，不改变 M4-01 状态。

实施与验收结论（2026-08-02）：

- 文档 review 与 review-confirm 已完成：FR-20、视觉升级方案 v0.2 与本 Sprint 均由 gpt-5.5、gpt-5.3-codex-spark 独立评审，Accept/Partial 项均已应用。
- 实现已完成：新增 `src/app/visual-refresh.css` 可回退覆盖层，增加 `product | solution | editorial-dark` Hero variant，完成 App/Pages Router 接入和公开站语义边界；用户可见文案、路由、Section/Grid、CTA 与业务交互保持冻结。
- 代码 review 与 code-review-confirm 已完成；报告位于 `docs/4-Reviews/`，确认文件为 `sprint-m4-02-public-site-visual-style-upgrade-code-review-confirm.md`，接受项与部分接受项已修正。
- 自动验证通过：`pnpm test` 共 59 个测试文件、320 项测试通过；`pnpm lint`、`pnpm build` 与 `git diff --check` 通过，standalone 制品完成。
- 回退演练通过：临时移除 App Router 与 Pages Router 两个覆盖层 import 后，21 项定向 DOM/行为测试与生产构建通过，随后恢复 import。
- [验收证据](../../5-Evidence/m4-02/README.md)包含 44 张 before、44 张 after 截图，前后 DOM 矩阵各 44 行；H1/Section 差异、可见溢出和 localhost 控制台 warning/error 均为零。
- 浏览器 smoke 通过移动菜单、K-Link/媒体 Dialog 的焦点与 Escape 恢复、`/admin/login`/受保护后台隔离、1440px 视口 200% 缩放等检查；关键对比度均满足约定阈值。
- 交付状态：`Local Code Ready`。本次视觉升级不关闭既有主体、备案、真实云资源与发布审查等外部门禁，Production 明确保持 `BLOCKED`；M4-01 状态保持不变。
- 最终提交：本工作流提交 `feat: complete sprint-m4-02 code and change base on reviews`。
