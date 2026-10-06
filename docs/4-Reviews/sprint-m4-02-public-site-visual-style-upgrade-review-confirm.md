# Sprint M4-02 公开站视觉风格升级 Review Confirm

**Reviewed Inputs**

- `sprint-m4-02-public-site-visual-style-upgrade.md`
- `sprint-m4-02-public-site-visual-style-upgrade-review-by-gpt-5.5.md`
- `sprint-m4-02-public-site-visual-style-upgrade-review-by-gpt-5.3-codex-spark.md`
- `FR-20-visual-style-upgrade-and-regression-protection.md`
- `Kelaibao-Website-Design-Proposal.md`
- `products/kelaibao/AGENTS.md`
- 当前 App Router、Pages Router、公共壳和测试实现

**Review Date**

- 2026-08-02

## Overall Conclusion

Sprint 的范围、工作包和退出门禁总体可执行，但存在一个实施阻断级正确性缺口：新闻/案例由 Pages Router 承载，只在 App Router root layout 导入覆盖层无法保证它们获得相同视觉。其余接受项用于补全冻结范围、文案零变更措辞与截图复现条件。

## Decision Table

| No. | Severity | Type | Review Source | Original Comment Summary | Decision | Evidence | Follow-up Plan / Rejection Reason |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | High | Correctness | GPT-5.5 C1 | 覆盖层只计划从 `src/app/layout.tsx` 导入，Pages Router 的新闻/案例可能漏加载。 | Accept | `src/app/layout.tsx` 当前导入 `./globals.css`；`src/pages/_app.tsx` 独立导入 `@/app/globals.css`；新闻/案例列表和详情均在 `src/pages/`。 | 将 `src/pages/_app.tsx` 加入目标边界，在两个入口都紧随 `globals.css` 导入同一 `visual-refresh.css`，并测试顺序一致、无重复冲突。 |
| 2 | Medium | Test | GPT-5.5 C2；Spark C2 | WP0 只冻结六条静态路由，漏掉新闻、案例与政策页。 | Accept | Sprint 纳入内容/政策页面，FR 要求新闻/案例状态与代表政策页证据；当前 Pages Router 还包含详情路由。 | fixture 与截图矩阵加入 `/news`、`/cases`、`/privacy`、`/terms`、`/disclaimer`；详情页在有已发布 fixture 时截图，否则用列表/空状态与 `PublicDetailPage` 契约证明，不制造内容。 |
| 3 | Low | Clarity | GPT-5.5 C3 | “统一……产品语言”可能被误读为改文案。 | Accept | 全局约束明确所有用户可见文字冻结，但 WP4 用词仍有歧义。 | 改为“产品化视觉语言”，明确标题、CTA、正文与列表文字不得修改。 |
| 4 | Medium | Requirement | Spark C1 | “强化标题/CTA、升级层次”可能被理解为内容重写。 | Accept | 同一 Sprint 的冻结契约优先，但工作包应避免与之冲突的动词。 | 将相关表述改为“强化视觉主次/视觉层次”，并把文本 fixture 零差异设为自动化退出门禁。 |
| 5 | Low | Test | Spark C3 | 截图缺少 DPR、语言/时区、字体、动画与差异判定条件。 | Accept | 当前仅给出视口与命名建议，不能保证 before/after 可复现。 | 在 evidence README 固定 Chromium 版本、DPR=1、`zh-CN`、`Asia/Shanghai`、系统字体、`prefers-reduced-motion: reduce`、full-page、同构建数据与人工判定清单。 |

## Needs Immediate Action

- 补入 Pages Router CSS 入口。
- 扩展冻结 fixture/截图矩阵并消除所有可能暗示改文案的表述。
- 固定视觉证据复现参数。

## Can Be Deferred

- 动态新闻/案例详情若本地没有已发布数据，不伪造内容；以现有组件/SSR 契约覆盖，证据中明确未截图原因。

## Final Status

`ACCEPT AFTER DOCUMENT UPDATES`。完成所有接受项后方可进入 WP0 与代码实施。
