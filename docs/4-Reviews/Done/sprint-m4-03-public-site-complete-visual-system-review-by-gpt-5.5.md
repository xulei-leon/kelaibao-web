# Sprint M4-03 公开站完整视觉系统文档评审报告

> 评审对象：`D:\code\tokengate\products\kelaibao\docs\3-Plan\sprint-m4-03-public-site-complete-visual-system.md`
>
> Review type: document review

## Findings

| Severity | Type | Location | Issue | Evidence | Recommendation |
| --- | --- | --- | --- | --- | --- |
| Medium | Requirement | `products/kelaibao/docs/3-Plan/sprint-m4-03-public-site-complete-visual-system.md:14`, `:37`, `:129`, `:174`, `:285` | 文档同时要求“全部现有用户可见文字”冻结，又要求 provisional 素材在公开页面显示建议尺寸，但没有把这些尺寸叠层文字和新增图片 `alt` 纳入 allowed-copy 例外。实施时严格文字 fixture 可能把合法占位提示判为回归，或反过来让未批准提示文字进入页面。 | Line 14 冻结全部用户可见文字；line 37 和 line 174 要求 provisional 素材显示建议尺寸；line 129 只要求建立 allowed-copy inventory；line 285 再次要求用户可见文字逐字不变。 | 在 WP0 或验收标准中明确 allowed-copy inventory 的例外项：仅允许素材槽内固定格式的尺寸提示和已登记 `alt` 文本，列出 exact strings/格式、适用槽位和 `final` 状态下必须消失的条件。 |
| Medium | Test | `products/kelaibao/docs/3-Plan/sprint-m4-03-public-site-complete-visual-system.md:7`, `:126`, `:242`, `:289`, `:313` | `320px` 被列为验收和检查视口，但 before/after 截图基线只定义了四个视口，不包含 `320px`。这会让最小宽度问题只能做即时检查，无法与冻结基线和 fidelity ledger 做可复核对比。 | Line 7 和 line 126 定义“四视口”截图；line 242、line 289、line 313 又要求检查 `320px`。 | 将 `320px` 明确加入 before/after 截图与 ledger，或明确它是独立的非截图断言并指定输出证据位置。更稳妥的是统一为五个视口：`320px`、`390×844`、`768×1024`、`1280×800`、`1440×900`。 |
| Medium | Clarity | `products/kelaibao/docs/3-Plan/sprint-m4-03-public-site-complete-visual-system.md:266`, `:276`, `:292`, `:315` | fidelity QA 的退出条件依赖“图像检查”“agency-signoff 差异”“无未处理的可修复问题”，但没有定义 ledger 字段、差异分级、接受人或可修复/不可修复判定标准。该门禁可能在实施收尾时变成主观判断，影响是否可以关闭 Sprint。 | Line 266 要求形成覆盖多维度的 fidelity ledger；line 276 要求达到 agency-signoff；line 292 要求 ledger 无未处理问题；line 315 要求同一 QA 阶段直接检查。 | 在 Sprint 文档中补充 fidelity ledger 最小模板：页面/视口/概念图/实现截图/检查维度/差异描述/Severity/是否可修复/处理决定/接受人或确认来源/证据路径。 |
| Medium | Risk | `products/kelaibao/docs/3-Plan/sprint-m4-03-public-site-complete-visual-system.md:51`, `:104`, `:238`, `:239`, `:277` | 文档承认 Production 仍受内容授权门禁约束，并要求生成或整理 17 个本地 WebP，但素材交付证据只覆盖尺寸、压缩和文件大小，没有要求记录素材来源、授权、生成记录或禁止内容检查结果。后续即使本地视觉通过，也可能无法证明素材可用于生产发布。 | Line 51 和 line 104 保留内容授权/Production 门禁；line 238 要求记录源尺寸、压缩方式和文件大小；line 239 限制不得生成虚假背书素材；line 277 只说 Production blocker 继续报告。 | 在 WP5/WP6 证据要求中增加素材 provenance ledger：素材槽位、文件路径、生成/整理来源、授权状态、是否含人物/Logo/指标/客户数据、审核结论和 Production 可用性状态。 |
| Low | Consistency | `products/kelaibao/docs/3-Plan/sprint-m4-03-public-site-complete-visual-system.md:52`, `:121`, `:268`, `:326` | 文档要求“启动多个 reviewer agents 前必须再次取得人工确认”，但同一计划又把 document review-start、code review-confirm 作为硬门禁。未定义哪些 review 流程需要人工确认、由谁确认、委托任务是否已经满足确认，容易造成执行流程卡住或不同执行者理解不一致。 | Line 52 添加人工确认要求；line 121、line 268、line 326 都要求完成 review/review-confirm。FR-21 也在相同位置保留该人工确认要求。 | 明确该要求的适用范围：例如仅适用于额外并行 reviewer，而标准 document/code review-start 由用户显式委托即视为确认；或写明确认记录应保存到哪个 review-confirm/证据文件。 |

## Checks Performed

- Read the reviewed Sprint document end to end.
- Cross-checked its FR link and core requirements against `FR-21-public-site-complete-visual-system-and-replaceable-assets.md`.
- Verified the seven referenced concept image files exist under `docs/2-Design/assets/m4-03/concepts/`.
- Checked the FR and Sprint indexes for `FR-21` / `M4-03` status references.
- Verified commit `2583ff4` exists and corresponds to an M4-01 completion commit.
