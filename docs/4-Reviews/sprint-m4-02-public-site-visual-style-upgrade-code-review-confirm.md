# Sprint M4-02 公开站视觉风格升级 Code Review Confirm

## 输入

- 实现目标：`docs/3-Plan/sprint-m4-02-public-site-visual-style-upgrade.md`
- 需求依据：`docs/1-Requirement/Mainland-Website-FR/FR-20-visual-style-upgrade-and-regression-protection.md`
- 审查报告：
  - `sprint-m4-02-public-site-visual-style-upgrade-code-review-by-gpt-5.5.md`
  - `sprint-m4-02-public-site-visual-style-upgrade-code-review-by-gpt-5.3-codex-spark.md`

## 总体结论

两份代码审查均未发现当前视觉实现改变业务文案、DOM 顺序、路由行为或污染后台的已证实回归。需要在关闭 Sprint 前补强冻结 fixture，并把已经执行的截图、交互、对比度、后台与控制台检查写入 evidence。CSS 选择器的未来碰撞风险部分成立；本轮以更严格的静态边界契约和当前后台 smoke 收口，不引入通用 CSS 解析器或跨 Sprint 重构。

## 逐条确认

| Severity | Type | Review comment | Decision | Evidence / Reason | Follow-up |
| --- | --- | --- | --- | --- | --- |
| Medium | Test | GPT-5.5：fixture 未完整冻结规范化可见文字、H2/H3、导航、Section 身份/顺序、关键 Grid/Card 和 Hero 子结构。 | Accept | FR-20 §回归保护明确要求冻结规范化文本、标题、Section 顺序、关键 Grid、CTA 与交互类型；当前 fixture 主要依赖 marker，确有漏报空间。 | 扩展 fixture 与契约测试：记录每路由规范化可见文本摘要、H2/H3、Section 标识/标题顺序、关键集合数量，以及 Hero action/aside/boundary；补用 `global.navigation`。 |
| Medium | Documentation | GPT-5.5：evidence README 的 after 人工验收仍是待复核。 | Accept | 44 张 after、DOM 矩阵、菜单、两类 Dialog、Escape/焦点恢复、后台、缩放等已执行，但 README 尚未记录，退出门禁未闭环。 | 在最终干净构建和复核后填入具体 PASS/限制/色值，不提前把未完成项写成通过。 |
| Low | Documentation | GPT-5.5：evidence 中测试数量仍是 WP0 基线，未反映当前 59 files / 319 tests 与 25 个视觉契约。 | Accept | 该数字作为 before 基线本身真实，但 README 还缺 after/final 命令结果，容易误读为最终结果。 | 保留 WP0 数字并新增最终验证表，记录最终实际数量与构建结果。 |
| Low | Risk | GPT-5.5：CSS 隔离测试只拒绝裸元素选择器，不能阻止未来公共 class 与后台 class 碰撞。 | Partial | 当前代码通过 `.public-site-main`、Header/Footer/Dialog 等既有公共语义边界，浏览器证实 `/admin/login` 与 `/admin` 重定向页不渲染公共 shell，当前无已证实污染；但静态测试确实还能加强。要求所有规则都以单一根选择器开头会错误排除 Header/Footer/Portal Dialog 等合法公共根。 | 补强契约：禁止裸根、`:root`、`html/body`、`.admin-*` 目标和跨后台变量覆盖；要求 Token 声明块列出已批准的公共根；保留 `/admin/login` 与受保护入口 smoke 作为当前碰撞证据。不引入通用选择器解析器。 |
| Medium | Requirement | Spark：人工验收清单仍标记待复核，Sprint 门禁未闭环。 | Accept | 与 GPT-5.5 的 evidence 发现同向但独立：报告特别指出 Header/menu、两个 Dialog、admin、contrast、zoom、reduced-motion 和 console 仍未回填。 | 完成最终构建、回退演练与复核后，逐项回填 README 和 Sprint 交付结论。 |
| Info | Correctness | Spark：PageHero class-only variant、五页映射、双 Router import 和 `public-site-main` 边界符合 FR-20。 | Accept (no change) | 组件静态渲染对比、路由契约和浏览器证据一致；未发现需要修改的实现问题。 | 保持当前实现，不因正向评论扩大变更。 |
