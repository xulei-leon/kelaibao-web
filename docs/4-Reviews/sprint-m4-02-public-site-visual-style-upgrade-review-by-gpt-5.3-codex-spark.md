# Document Review Report

- Reviewed file: `D:\code\tokengate\products\kelaibao\docs\3-Plan\sprint-m4-02-public-site-visual-style-upgrade.md`
- Review type: document review
- Checks performed: requirements alignment, scope/验收一致性、风险闭环、可验证性、命名与交付路径完整性

## Findings

| Severity | Type | Location | Issue | Evidence | Recommendation |
| --- | --- | --- | --- | --- | --- |
| Medium | Requirement | 文档约束 vs. WP4 页面视觉重写 | 文档存在“用户可见文案冻结”与“强化标题/CTA、升级文案层次”等表述的冲突，存在不确定性，容易触发后续实施中误改文案。 | 全局约束与暂停项中写明“**不修改...全部用户可见文字**”。但 WP4 中写到“`首页：强化标题/CTA`”以及“`/team`、`/about`...升级...文本/机制层次”。 | 在 WP4 明确补充“仅限样式级改造，不更改文案与文本内容”。将验收加入“文本 fixture 差异为 0 的自动化断言”。 |
| Medium | Consistency | WP0 冻结基线与 `路由与风格矩阵` | 基线冻结/截图步骤只列了 `/`, `/features`, `/team`, `/media`, `/about`, `/contact`，但范围与路由矩阵仍包含 `/news`、`/cases`、政策页；若不覆盖这些页，可能漏检文字结构回归。 | WP0 仅列 6 个基线页面；路由与验收矩阵列出 `/news`、`/cases` 和政策页为本次视觉目标覆盖对象。 | 要么将 `/news`、`/cases`、政策页加入 WP0 的冻结 fixture 与 before/after 截图清单，要么在风险项中明确排除并给出替代验证机制。 |
| Low | Test | WP7、WP6.5、8 | 计划强调“自动化与截图证据”，但对截图可复现条件未给出固定参数（设备像素比、字体加载状态、时区/语言、动画禁用时机、对比判定规则），后续结果难以一致复现。 | WP7 要求采集 before/after 并逐项手工对照；WP6.5 要求 reduced-motion 与交互验收；8 节建议四视口检查，但未定义截图执行环境与对比标准。 | 补充一份截图与对比规范（同环境变量、固定 user agent/viewport DPR、字体策略、`prefers-reduced-motion` 状态、差异检查阈值与命名到路由映射规则）。 |
