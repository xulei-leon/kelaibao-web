# 客来宝统一中文官网视觉升级方案 Review Confirm

**Reviewed Inputs**

- `Kelaibao-Website-Design-Proposal.md`
- `Kelaibao-Website-Design-Proposal-review-by-gpt-5.5.md`
- `Kelaibao-Website-Design-Proposal-review-by-gpt-5.3-codex-spark.md`
- `FR-20-visual-style-upgrade-and-regression-protection.md`
- `sprint-m4-02-public-site-visual-style-upgrade.md`
- `Kelaibao-Unified-Website-Visual-Design-Spec.md`
- 当前 CSS Token、路由入口与公共/后台壳实现

**Review Date**

- 2026-08-02

## Overall Conclusion

设计方向与纯视觉边界成立，但方案需要把审阅结论标注为待 WP0 固化的设计判断，并把下游已经明确的覆盖层、后台隔离、无障碍和页面状态证据要求上收为设计约束。Spark 所报“视觉设计规格链接错误”与当前文件内容不符，予以拒绝。

## Decision Table

| No. | Severity | Type | Review Source | Original Comment Summary | Decision | Evidence | Follow-up Plan / Rejection Reason |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Medium | Documentation | GPT-5.5 C1 | “当前实现审阅”缺少构建、浏览器、视口和截图证据。 | Accept | 方案第 2.2 节只有日期和判断；FR/Sprint 已要求 WP0 生成正式 before 证据。 | 将现有结论标记为待 WP0 复核的设计判断，并链接 `docs/5-Evidence/m4-02/README.md` 作为后续正式证据位置。 |
| 2 | Medium | Maintainability | GPT-5.5 C2 | CSS 组织仍允许实施者直接修改全局样式，弱于下游独立覆盖层门禁。 | Accept | FR/Sprint 明确 `visual-refresh.css` 后置导入且默认不改 `globals.css`。 | 修改方案 8.2：固定独立覆盖层、App/Pages 两入口相同顺序、`globals.css` 例外条件与回退演练。 |
| 3 | Medium | Risk | GPT-5.5 C3 | 方案未显式排除 `/admin`，全局选择器可能污染后台。 | Accept | `src/app/layout.tsx` 同时服务公开页与后台；`PublicAppShell` 只控制 React 外壳，不阻止 CSS 级联。 | 增加公开站 class 作用域、禁止后台视觉改造和后台 smoke/契约要求。 |
| 4 | Medium | Requirement | GPT-5.5 C4 | 新增色彩和状态缺少明确对比度门禁。 | Accept | 方案强化深蓝、绿色 CTA、装饰金与交互状态；现有视觉规格要求 WCAG AA。 | 增加颜色/状态检查矩阵及 `4.5:1`、`3:1` 量化门槛。 |
| 5 | Low | Consistency | GPT-5.5 C5 | `#B98D3F` 未映射到现有 Token，可能形成第三强调色。 | Accept | 当前 `globals.css` 已存在 `--champagne: #c6a15b`；方案另写 `#B98D3F` 会产生不必要的第二金色值。 | 删除独立色值，改为复用现有 `--champagne`，仅用于编号、下划线和装饰，不用于 CTA 或媒体第二品牌。 |
| 6 | Low | Clarity | GPT-5.5 C6 | `/contact`、内容页和政策页缺少最小页面状态矩阵。 | Accept | Sprint 已把这些路由纳入范围，但方案仅用一段概括。 | 在方案中增加代表状态、关键表面和证据要求；动态详情无数据时以组件契约和空状态替代，不伪造 CMS 数据。 |
| 7 | Medium | Documentation | Spark C1 | “视觉设计规格”关联链接路径错误。 | Reject | 当前第 448 行链接为同目录相对路径 `Kelaibao-Unified-Website-Visual-Design-Spec.md`，实际文件也位于同一目录，链接有效；报告引用的 `../1-Requirement/...` 不存在于当前目标。 | 不修改该链接；保留同目录相对引用。 |

## Needs Immediate Action

- 收敛 CSS 覆盖层与 `/admin` 隔离边界。
- 把设计判断与 WP0 正式证据区分开。
- 复用现有 `--champagne` 并补齐对比度、页面状态矩阵。

## Can Be Deferred

- 不新增独立视觉稿、图片或远程参考资产；本 Sprint 以现有结构、CSS 与 before/after 证据完成。

## Final Status

`ACCEPT AFTER DOCUMENT UPDATES`。拒绝项不影响方案；接受项完成后方案可作为 M4-02 实施依据。
