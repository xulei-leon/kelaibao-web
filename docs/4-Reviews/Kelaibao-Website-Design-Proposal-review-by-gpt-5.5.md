# 客来宝统一中文官网视觉升级方案 Review

| 字段 | 内容 |
| --- | --- |
| Review 对象 | `products/kelaibao/docs/2-Design/Kelaibao-Website-Design-Proposal.md` |
| Review 类型 | Document review |
| Reviewer | GPT-5.5 |
| 日期 | 2026-08-02 |
| 结论 | 有若干可修正的范围、证据和验收口径问题；未发现需要阻断方向性设计的 Critical/High 问题。 |

## Review Findings

| Severity | Type | Location | Issue | Evidence | Recommendation |
| --- | --- | --- | --- | --- | --- |
| Medium | Documentation | `products/kelaibao/docs/2-Design/Kelaibao-Website-Design-Proposal.md:74` | “当前实现审阅”缺少可复核证据，后续实现者无法确认视觉问题判断来自哪个构建、路由、视口或截图。 | 方案在 `:74-82` 声称已于 `2026-08-02` 检查当前开发站并列出 7 个视觉问题，但未记录 commit/build、访问地址、浏览器、视口、截图路径或人工检查记录。FR-20 要求视觉证据写入 `docs/5-Evidence/m4-02/`，且包含视口、路由、日期、构建版本和人工检查结论（`FR-20:140-145`）；Sprint 也要求从同一构建基线采集 fixture 与改造前截图（`sprint-m4-02:37-39`, `:91-104`）。 | 在方案中补充“审阅证据”小节，至少列出检查路由、视口、浏览器、构建版本/commit、截图或记录路径；如果这些检查只是设计判断，应明确标注为“待 WP0 基线确认的假设”。 |
| Medium | Maintainability | `products/kelaibao/docs/2-Design/Kelaibao-Website-Design-Proposal.md:371` | CSS 改造边界不够收敛，和下游 FR/Sprint 的“独立可删除覆盖层”门禁不完全一致。 | 方案允许修改“设计 Token 与全局基础样式”并将“是否拆分文件”留给实施阶段（`:371-395`）。但 FR-20 要求新视觉规则通过独立、可删除覆盖层接入，例如在 `globals.css` 后加载 `visual-refresh.css`，并按固定分区组织（`FR-20:63-69`）；Sprint 明确计划新增 `src/app/visual-refresh.css`，默认不修改 `globals.css`，只有覆盖层无法表达时才允许最小原位修正并在 evidence 中说明（`sprint-m4-02:71-87`）。 | 将方案 8.2 改为明确要求 `visual-refresh.css` 后置覆盖层，写清 `globals.css` 原位修改的例外条件、记录方式和回退验证；避免“是否拆分文件由实施阶段决定”被解读为可直接继续堆叠全局样式。 |
| Medium | Risk | `products/kelaibao/docs/2-Design/Kelaibao-Website-Design-Proposal.md:383` | 方案没有显式声明 `/admin` 不纳入视觉换肤及全局选择器隔离要求，存在公共站全局 CSS 污染后台的风险。 | 方案建议调整 `tokens/base`、`shell`、`primitives`、`pages` 等全局层级（`:383-395`），但未写明后台排除和选择器边界。Sprint 将“管理后台视觉升级”列为不纳入范围（`sprint-m4-02:61-67`），并要求覆盖层以公开站组件 class 为边界，避免污染 `/admin`（`sprint-m4-02:106-107` 之后的 WP1 约束）；FR-20 验收也要求“后台和生产架构不受影响”（`FR-20:187-188`）。 | 在实施边界中加入：`/admin`、后台组件、认证与 CMS 操作界面不纳入本轮换肤；新增视觉选择器必须以公开站 shell/page class 为边界；验收增加后台关键页 smoke 或快照检查。 |
| Medium | Requirement | `products/kelaibao/docs/2-Design/Kelaibao-Website-Design-Proposal.md:417` | 无障碍验收标准过粗，缺少对新增色彩、深色媒体 Hero、绿色 CTA、focus-visible/active/disabled 状态的明确对比度门禁。 | 方案只写到四视口无溢出、键盘焦点、Escape、200% 缩放和 reduced motion（`:417-420`），但本方案新增或强化了深蓝、绿色、金色、浅蓝背景等视觉角色（`:167-176`, `:328-331`）。FR-20 明确要求 Hover、focus-visible、active、disabled 状态覆盖，正文与关键控件满足 WCAG 2.1 AA，深色媒体 Hero 和绿色 CTA 单独检查（`FR-20:121-129`）；既有视觉规格也要求正文、按钮、链接和表单状态达到 WCAG AA（`Kelaibao-Unified-Website-Visual-Design-Spec.md:88-94`）。 | 在方案验收中加入颜色对比矩阵和状态清单：普通正文、muted 文本、深色区反白文字、绿色 CTA、蓝色 CTA、金色/香槟色装饰、focus ring、disabled 与错误/成功状态；明确每项需满足的 WCAG AA 或非文本对比目标。 |
| Low | Consistency | `products/kelaibao/docs/2-Design/Kelaibao-Website-Design-Proposal.md:176` | “克制金色 `#B98D3F`”未映射到既有视觉基线 Token，容易被实现为新的品牌强调色。 | 方案称“保持现有品牌色语义”但在色彩表中加入 `#B98D3F` 金色（`:163-176`），并将“产品蓝、媒体绿与金色”合并计入强调比例（`:178-183`）。既有视觉规格的核心 Token 只有 `brand/action/canvas/surface/line/text/muted/wechat/danger` 与少量补充色（`Kelaibao-Unified-Website-Visual-Design-Spec.md:68-86`），并强调全局 Token 位于统一样式层、组件不得内嵌第二套媒体主题（`:279-283`）。 | 明确该金色是否只是现有 `champagne`/当前项装饰的重命名；若保留，应写入现有 Token 映射、允许用法、对比度限制和不得作为第三主 CTA/第二品牌色的约束。 |
| Low | Clarity | `products/kelaibao/docs/2-Design/Kelaibao-Website-Design-Proposal.md:340` | 其他公开页面和 CMS 状态的视觉要求过于概括，不能直接支撑完整回归清单。 | 方案将关于、新闻、案例、联系与政策集中为一节，仅说明“不改变 layout 和内容，仅统一换肤”（`:340-343`）。但 FR-20 要求视觉证据最少覆盖 `/`、`/features`、`/team`、`/media`、`/about`、`/contact`，新闻/案例各覆盖一个可用列表状态，政策页覆盖一个代表页（`FR-20:140-145`）；Sprint 的路由矩阵也把 `/contact`、`/news`、`/cases` 和政策页列为独立检查对象（`sprint-m4-02:151-162`, `:224-238`）。 | 为 `/contact`、`/news`、`/cases` 和政策页补充最小页面状态矩阵：列表/空状态/详情或代表页、表单状态、双 CTA 语义、长正文/表格/链接、截图与验收视口。 |

## Checks Performed

- Reviewed the target proposal against `products/kelaibao/AGENTS.md`.
- Cross-checked the proposal with `FR-20-visual-style-upgrade-and-regression-protection.md`, `sprint-m4-02-public-site-visual-style-upgrade.md`, and `Kelaibao-Unified-Website-Visual-Design-Spec.md`.
- Spot-checked current public page implementation shape for Section usage to avoid raising speculative section-count issues.
- Focused findings on correctness, requirement alignment, risk, maintainability, accessibility, and evidence quality.
