# FR-20 官网视觉风格升级与回归保护 Review Confirm

**Reviewed Inputs**

- `FR-20-visual-style-upgrade-and-regression-protection.md`
- `FR-20-visual-style-upgrade-and-regression-protection-review-by-gpt-5.5.md`
- `FR-20-visual-style-upgrade-and-regression-protection-review-by-gpt-5.3-codex-spark.md`
- `products/kelaibao/AGENTS.md`
- `Kelaibao-Unified-Website-Visual-Design-Spec.md`
- 当前公开站、后台边界与测试文件

**Review Date**

- 2026-08-02

## Overall Conclusion

两份评审均认可 FR-20 的方向、纯视觉边界与品牌约束，没有 Critical/High 阻断项。主要缺口集中在验收可执行性：公开站覆盖层对后台的隔离、回退验证、冻结契约映射、截图复现条件和无障碍量化门槛尚需写清。

以下接受项全部在代码实施前补入 FR/Sprint；完成后 FR-20 可通过文档确认门禁。

## Decision Table

| No. | Severity | Type | Review Source | Original Comment Summary | Decision | Evidence | Follow-up Plan / Rejection Reason |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Medium | Test | GPT-5.5 C1 | 全局覆盖层可能污染 `/admin`，但最小验证未包含后台非回归。 | Accept | `products/kelaibao/AGENTS.md` 明确后台不在视觉升级范围；当前 `src/app/layout.tsx` 同时包裹公开站与 `/admin`，仅由 `PublicAppShell` 在运行时跳过公共外壳，因此裸全局选择器仍可能影响后台。 | 在 FR/Sprint 增加公开站选择器作用域、后台关键结构契约与 `/admin/login`、后台壳 smoke 证据要求。 |
| 2 | Medium | Requirement | GPT-5.5 C2 | “可删除覆盖层”没有可执行的 rollback 验证。 | Accept | FR 同时把独立覆盖层列为功能需求、输出与验收点，但最小验证尚未定义临时禁用 import 后的检查。 | 增加回退演练：临时禁用两个路由入口的覆盖层 import，运行针对性测试和 build，确认无编译错误且 DOM/行为契约保持；随后恢复 import。 |
| 3 | Medium | Test | GPT-5.5 C3；Spark C1 | 冻结项未与 fixture 字段和具体测试一一映射。 | Accept | 当前已有 `content-layout-v1.2.test.tsx`、`home-and-global-shell.test.tsx`、`product-pages.test.tsx`、`media-page-and-redirects.test.tsx`、`public-shell-boundary.test.tsx` 等，但 FR 未说明各冻结项由何证据负责。 | 在 FR/Sprint 增加“冻结项—证据”矩阵，覆盖路由、标题、Section、Grid、CTA、Hero 条件内容、移动阅读顺序、Dialog/菜单行为和发现文件。 |
| 4 | Medium | Clarity | GPT-5.5 C4；Spark C2 | before/after 截图缺少固定路由×视口矩阵与复现条件。 | Accept | FR 要求相同浏览器和四个视口，但没有固定 DPR、语言/时区、动画策略、full-page 规则与判定清单。 | 固定截图矩阵、命名、浏览器版本、DPR、语言、时区、字体、reduced-motion、full-page 与人工零漂移判定方法。 |
| 5 | Low | Requirement | GPT-5.5 C5；Spark C3 | WCAG AA 未量化对比度阈值和记录方法。 | Accept | 视觉规格要求 WCAG AA；新增深色 Hero、绿色 CTA 与 focus 状态需要明确门槛。 | 写明普通文字不低于 `4.5:1`，大号文字及非文本 UI/focus 边界不低于 `3:1`，并在 evidence 中记录抽样色值与结果。 |
| 6 | Low | Consistency | GPT-5.5 C6 | 技术依赖与单 Sprint 流程门禁表述容易混淆。 | Accept | FR-20 技术上依赖 FR-16/17/18，而 Sprint 索引将 M4-01 设为流程前序。用户已于 2026-08-02 明确授权启动 M4-02。 | 将技术输入依赖与流程启动门禁分列，并记录本次用户对 M4-01 前序顺序的显式覆盖；不改变 M4-01 自身状态。 |

## Needs Immediate Action

- 在 FR/Sprint 中补齐后台隔离、回退演练、冻结映射、截图复现和无障碍量化要求。
- 记录 M4-02 提前于尚未关闭的 M4-01 启动属于用户显式调整顺序。

## Can Be Deferred

- 无；以上均是实施前文档门禁的最小澄清，不扩大产品范围。

## Final Status

`ACCEPT AFTER DOCUMENT UPDATES`。完成上述接受项并通过 `git diff --check` 后，FR-20 可进入实施门禁。
