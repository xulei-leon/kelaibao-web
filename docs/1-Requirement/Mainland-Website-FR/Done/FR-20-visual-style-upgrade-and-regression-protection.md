# FR-20 官网视觉风格升级与回归保护

- `FR-ID`: `FR-20`
- `标题`: 官网视觉风格升级与回归保护
- `所属阶段`: 阶段 4 - 现有官网体验完善
- `开发顺序`: 20
- `优先级`: P1
- `技术输入依赖`: `FR-16`、`FR-17`、`FR-18`；现有公开站代码与内容布局基线
- `启动门禁`: 默认等待前序 active Sprint 关闭；用户已于 `2026-08-02` 明确调整顺序并授权启动 `sprint-m4-02`，不改变 `sprint-m4-01` 自身状态
- `计划 Sprint`: `sprint-m4-02`
- `交付状态`: 完成 / Local Code Ready / Production BLOCKED
- `涉及包`: `src/app` 公开页面与全局样式、`src/components` 公共站组件、公开页面契约测试、`docs/5-Evidence/m4-02`
- `是否属于原型阶段`: 否
- `来源类型`: 已批准设计方案的纯视觉实现
- `原始 SRS 章节`: 第 4 节信息架构与路由、第 5.1～5.4 节公开站功能、第 8 节非功能需求、第 10～11 节验收与测试；本 FR 不改变 SRS 功能范围
- `上游设计`: [客来宝统一中文官网视觉升级方案 v0.2](../../../2-Design/Kelaibao-Website-Design-Proposal.md)
- `布局基线`: [客来宝官网内容、结构与布局设计规格 1.2](../../../2-Design/Kelaibao-Website-Content-and-Layout-Spec-v1.2.md)
- `视觉基线`: [客来宝统一中文官网视觉设计规格](../../../2-Design/Kelaibao-Unified-Website-Visual-Design-Spec.md)

## 目标

在不改变当前网站整体 layout、用户可见文字、业务范围和交互行为的前提下，把公开站从“结构完整但视觉朴素”的状态升级为成熟、可信、有产品感的互联网服务企业官网：

1. 首页、核心功能、团队方案、关于及内容页面借鉴 Mindbody 的健康服务 SaaS 产品感与 HubSpot 的统一品牌系统。
2. `/media` 在同一客来宝品牌体系内局部借鉴 Profound 的深色科技、编辑式信息密度与 AI/GEO 视觉气质。
3. 通过视觉 Token、表面层、字体层级、色带、边框、圆角、阴影和克制动效完成升级，不重构页面。
4. 建立可执行的 DOM、文案、交互、响应式和截图回归门禁，防止“换肤”演变为内容或布局改版。

参考网站只用于风格方向，不复制其布局、文案、图片、品牌资产、产品界面或商业主张。

## 需求描述

当前公开站的页面、内容和交互已经完成，本轮只实施表现层升级。开发工作应在现有 React DOM、内容常量、路由、CTA 与响应式重排基础上增加可回退的视觉覆盖层和少量纯 class/variant 接线，并通过冻结 fixture、既有测试和同视口截图证明没有内容或 layout 漂移。

## 高层要求与不可变契约

本 FR 的最高优先级约束如下：

### 1. 内容冻结

- 所有现有 H1、H2、H3、正文、列表、引语、边界说明、CTA label、Dialog 文案、表单文案和可访问名称逐字不变。
- 不新增统计数字、客户 Logo、评价、案例证明、价格、GEO 评分、Dashboard、宣传口号或新 CTA。
- 不通过 CSS 隐藏、截断、替换或伪元素生成新的业务文字。
- Metadata、JSON-LD、RSS、sitemap、`llms.txt` 和 CMS 正文契约不因视觉升级改变。

### 2. Layout 冻结

- 路由、页面数量、Header/Footer、主导航项及顺序不变。
- 每页现有 Section 数量、DOM 顺序、内容分组、桌面列数、移动端重排顺序和 CTA 所在模块不变。
- Hero 的 copy、aside、actions、boundary 位置关系不变；没有 aside 的页面不得新增截图或面板。
- 卡片、列表、流程和左右分栏继续使用当前结构，不转换为新的 Bento Grid、轮播、Tab、折叠面板或站中站。
- 不删除移动端内容，不改变 `320px`、`390px`、`768px`、`1440px` 的既有响应式阅读顺序。

允许对字体大小、行高、间距、内边距、圆角和视觉重量做有限调整，但不得改变上述结构关系、列数和内容顺序。

### 3. 行为冻结

- K-Link“免费体验”继续只打开小程序二维码流程。
- “咨询客来宝媒体”继续只打开企业微信咨询流程。
- 移动菜单、焦点恢复、Escape、Dialog、二维码失败降级、询盘表单、分析事件和 SSR 行为不变。
- 不新增登录、支付、预约、CRM、微信 API、GEO 产品或第二应用。

## 功能需求

### 1. 视觉 Token 与覆盖层

1. 保持现有变量语义，升级主品牌深蓝、产品行动蓝、媒体咨询绿、画布、表面、边框、圆角、阴影和动效 Token。
2. 新视觉规则应通过独立、可删除的覆盖层接入，例如在 `globals.css` 后加载 `visual-refresh.css`；不得在首轮实施中大范围重写约 4,900 行既有样式。
3. 覆盖层应按 `tokens/base -> shell -> primitives -> pages -> responsive/reduced-motion` 分区，避免无来源的页面末尾补丁继续累积。
4. 不引入运行时主题框架、CSS-in-JS、第二套组件库或客户端主题切换。
5. 不依赖在线字体、远程装饰图片或第三方视觉运行时；优先使用现有字体栈、CSS、现有图标和已批准资源。

### 2. 全站外壳

1. Header 保持当前 Wordmark、六项导航、移动菜单和“免费体验”位置，升级背景、字重、当前项、CTA、Sticky 阴影和焦点样式。
2. Footer 保持当前品牌、链接分组、边界说明和 CTA，升级深色层次、链接状态和列间视觉节奏。
3. 产品 CTA 始终使用产品蓝语义；客来宝媒体咨询始终使用绿色语义。
4. Dialog 与二维码卡只换肤，不改变 DOM、焦点管理、资源地址、二维码有效尺寸和失败路径。

### 3. PageHero 与 Section 视觉变体

1. `PageHero` 可增加仅生成 CSS class 的视觉 variant，不得改变 children、DOM 顺序或条件渲染契约。
2. 视觉变体固定为：
   - `product`: 首页、`/features`。
   - `solution`: `/team`、`/about`。
   - `editorial-dark`: `/media`。
3. 空 `eyebrow` 不得因此生成新的可见标签、装饰文字或胶囊。
4. `Section` 继续使用现有 tone 与 className 契约；只通过现有元素的 class 和 CSS 形成页面辨识度。
5. `/media` 的深色视觉限定在 Hero、既有重点区和最终 CTA；正文保持高可读的白色或冷浅色表面。

### 4. 页面视觉要求

#### 首页 `/`

- 保持七个页面区块（含 Hero）、Hero 左右关系、四类工具、五步路径、四项价值、媒体摘要、边界说明和最终 CTA 不变。
- 强化 H1 与 CTA 主导权；右侧问题卡处理为次级 SaaS 面板。
- 现有卡片、流程和结构占位升级为统一产品界面语言，不新增真实 Dashboard 暗示。

#### 核心功能 `/features`

- 保持五阶段路径、十项工具顺序、交替左右分栏和最终深色区不变。
- 统一现有结构示意的产品框、标题栏、内容线和“结构示意”视觉家族。
- 不压缩、合并或改成工具总览。

#### 团队方案 `/team`

- 保持六个页面区块（含 Hero）、瓶颈矩阵、赋能体系、引语、机制和交付保障不变。
- 通过表面层、编号和结构线形成 HubSpot 式解决方案节奏，不改变列数。

#### 客来宝媒体 `/media`

- 保持九个页面区块（含 Hero）、内容顺序、卡片数量、两个流程和咨询 CTA 不变。
- Hero 采用深海军蓝、高对比标题、低对比网格/关系线和绿色咨询 CTA。
- 正文卡片采用编辑面板、细线轨道、编号和出版页式边框；不得新增 GEO 入口、评分、界面或结果承诺。
- Profound 只提供视觉气质，客来宝仍是唯一主品牌，K-Link 与客来宝媒体不新增 Logo 或独立导航。

#### 其他公开页面

- `/about`、`/news`、`/cases`、`/contact` 和政策页保留现有结构与内容，仅统一 Header、Footer、标题、表面、链接、表格、表单和内容卡片样式。
- `/contact` 的产品蓝与媒体绿双路径继续语义隔离。
- 管理后台 `/admin` 不纳入本轮品牌换肤；全局选择器不得意外改变后台布局或可用性。

### 5. 响应式与可访问性

1. 保留现有断点与重排逻辑；在 `320px`、`390px`、`768px`、`1440px` 验证无横向溢出、裁切或内容隐藏。
2. 移动端不得隐藏 Hero aside；可降低字号、间距、阴影和装饰强度，但保持阅读顺序。
3. 交互状态必须覆盖 Hover、focus-visible、active 和 disabled；焦点对比清晰且不得只依赖颜色。
4. 正文与关键控件满足 WCAG 2.1 AA 对比目标；深色媒体 Hero 和绿色 CTA 必须单独检查。
5. 动效只使用 opacity、transform、color、shadow 等不改变布局尺寸的属性，主时长控制在 `120–240ms`。
6. `prefers-reduced-motion: reduce` 时关闭非必要进入和位移动效。
7. 200% 缩放时 Header、菜单、Dialog、二维码、表单和正文可重排且不裁切。

量化门槛：普通文字与背景对比度不低于 `4.5:1`；大号文字、非文本 UI 边界和 focus-visible 指示不低于 `3:1`。在 evidence 中记录深色媒体 Hero、产品蓝 CTA、媒体绿 CTA、muted 文本、disabled 状态和焦点环的抽样色值与结论。

## 回归保护与证据

### 1. 自动化契约

- 在实施前为固定公开页面建立经过人工确认的语义基线，至少记录规范化文本、H1/H2 数量、Section 顺序、关键 Grid 项数、CTA label 与目标交互类型。
- 新增测试必须证明视觉 variant 只增加 class，不改变 PageHero 的 DOM 和条件内容。
- 复用并保持 `content-layout-v1.2.test.tsx`、`home-and-global-shell.test.tsx`、`product-pages.test.tsx`、`media-page-and-redirects.test.tsx`、`site-header.test.tsx`、`public-shell-boundary.test.tsx` 等既有契约通过。
- 基线 fixture 不能在实现过程中自动更新；任何差异先视为回归，只有新的人工 review-confirm 才能改变基线。

冻结项与证据的最小映射：

| 冻结项 | 必须记录/断言的证据 |
| --- | --- |
| 路由与标题 | 路由清单、H1/H2/H3 数量、规范化可见文字 |
| Section 与 Grid | Section 顺序、关键 Grid 项数、桌面列数、移动阅读顺序 |
| Hero | eyebrow/title/lead/actions/aside/boundary 的存在条件与 DOM 顺序 |
| CTA 与交互 | label、目标交互类型、产品蓝/媒体绿语义、菜单与 Dialog 行为 |
| 公共/后台边界 | 公开站 class 接线、`/admin/login` 与后台壳关键结构不受覆盖层影响 |
| 发现契约 | metadata、JSON-LD、RSS、sitemap、`llms.txt` 与 SSR 既有测试 |

视觉覆盖层选择器必须以公开站 shell、组件或页面 class 为边界；不得通过裸 `body`、标题、表单或其他基础元素选择器改变 `/admin`。除既有后台契约外，至少记录 `/admin/login` 和一个受保护后台壳的 smoke/结构检查。

### 2. 视觉证据

- 实施前后使用相同浏览器、相同路由和四个关键视口截图。
- 最少覆盖 `/`、`/features`、`/team`、`/media`、`/about`、`/contact`；新闻/案例各覆盖一个可用列表状态，政策页覆盖一个代表页。
- 证据写入 `docs/5-Evidence/m4-02/`，包含视口、路由、日期、构建版本和人工检查结论。
- 截图用于确认风格与 layout 漂移，不构成客户数据、效果或 Production Live 证据。

固定截图矩阵为 evidence README 中列出的公开路由状态 × `320/390/768/1440` × `before/after`。统一使用同一 Chromium 环境、DPR、`zh-CN`、`Asia/Shanghai`、系统字体栈、`prefers-reduced-motion` 策略和相同本地数据；文件名使用 `{phase}-{route-slug}-{viewport}.png`。若浏览器控制面不支持可靠的 full-page 捕获，必须记录工具限制，并以同条件视口 PNG 加完整 DOM 的 overflow/结构检查替代，不得保存空白或截断文件冒充全页证据。人工逐项确认文字、Section、Grid、CTA、溢出、裁切、重叠和交互入口，任何非预期差异先按回归处理。

回退演练必须临时禁用 App Router 与 Pages Router 两个入口的 `visual-refresh.css` import，运行针对性契约测试和 `pnpm build`，确认无编译错误且 DOM/行为契约保持，再恢复 import。该演练只验证覆盖层可移除，不要求旧视觉截图与新视觉相同。

## 输入

- 当前 `products/kelaibao/src/app` 与 `src/components` 公开站实现。
- 视觉升级方案 v0.2、内容布局规格 1.2 和既有视觉设计规格。
- 当前固定页面文案、路由、CTA、二维码和响应式行为。
- Mindbody、HubSpot 与 Profound 的公开页面风格参考。

## 输出

- 可回退的新视觉覆盖层与必要的纯 class/variant 接线。
- Mindbody/HubSpot 风格的统一公开站视觉系统。
- Profound 风格但仍属于客来宝的 `/media` 视觉变体。
- 内容、layout、交互、响应式和可访问性回归测试。
- 四个关键视口的实施前后截图与验收记录。

## 不纳入范围

- 任何用户可见文案、Metadata、CMS 内容或宣传口径修改。
- 页面、Section、Grid、CTA、导航或信息架构重组。
- 新插画、人物摄影、客户 Logo、评价、统计数据、产品截图或 Dashboard。
- 新字体授权采购、在线字体服务、视频、3D、视差、粒子和持续背景动画。
- 管理后台视觉重做、组件库迁移、Tailwind 重构或 `globals.css` 全量清理。
- 新业务、第二品牌、独立媒体站、GEO 产品、账号、支付、CRM 或微信 API。
- 使用参考网站的受保护素材或逐像素复制其页面。

## 最小验证方式

- `pnpm test && pnpm lint && pnpm build`。
- 既有公开页面、CTA、Dialog、菜单、表单、SSR、Metadata 和结构化数据测试全量回归。
- 语义基线测试与视觉 variant 组件测试。
- `320px`、`390px`、`768px`、`1440px` 的截图与人工 layout 对照。
- 键盘导航、Escape、焦点恢复、200% 缩放和 reduced motion 检查。
- `/admin/login` 与一个受保护后台壳的非回归检查。
- 临时禁用两个路由入口覆盖层 import 后的针对性测试与 build 回退演练。
- 浏览器控制台无 hydration、资源、CSS 解析和可访问性相关新增错误。

## 验收要点

- 所有用户可见文字与实施前基线逐字一致。
- 路由、Section 数量/顺序、Grid 列数、内容分组和交互行为一致。
- 首页、功能、团队和关于呈现统一的 Mindbody/HubSpot 式 SaaS 产品感。
- `/media` 具备 Profound 式深色科技与编辑气质，但未形成第二品牌或 GEO 产品。
- 产品蓝和媒体绿语义清晰，移动端与无障碍行为无回归。
- 新视觉覆盖层可单独移除并恢复原视觉；后台和生产架构不受影响。

## 交付结论

- `sprint-m4-02` 已完成文档 review/review-confirm、代码实现、代码 review/review-confirm 与接受项修正。
- 独立视觉覆盖层、三类 `PageHero` variant、公开站语义边界及内容/layout 冻结契约均已落地；未改变用户可见文案、路由、业务交互、CMS/发现或生产架构。
- 最终验证通过：`pnpm test` 为 59 个测试文件、320 项测试全部通过，`pnpm lint` 与 `pnpm build` 通过；覆盖层双入口回退演练、后台隔离、键盘/焦点/Escape、200% 缩放、四视口与颜色对比检查通过。
- [M4-02 验收证据](../../../5-Evidence/m4-02/README.md)包含 44 张 before、44 张 after 截图、44 行前后 DOM 矩阵、控制台与人工 smoke 结果。
- 本 FR 状态为 `完成 / Local Code Ready`。既有主体、备案、真实云资源等外部门禁未由本次视觉升级关闭，Production 继续为 `BLOCKED`。

## 备注

本 FR 已由 `sprint-m4-02` 完成。M4-01 的完成状态不构成本 FR 的技术依赖；用户已于 `2026-08-02` 明确调整实施顺序并授权先启动 M4-02，该覆盖仅适用于本次启动，不关闭或改写 M4-01。
