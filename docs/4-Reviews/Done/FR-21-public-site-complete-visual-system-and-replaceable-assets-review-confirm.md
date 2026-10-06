# FR-21 公开站完整视觉系统与可替换素材 Review Confirm

**Reviewed Inputs**

- `FR-21-public-site-complete-visual-system-and-replaceable-assets.md`
- `FR-21-public-site-complete-visual-system-and-replaceable-assets-review-by-gpt-5.5.md`
- `FR-21-public-site-complete-visual-system-and-replaceable-assets-review-by-gpt-5.3-codex-spark.md`
- `products/kelaibao/AGENTS.md`
- `Kelaibao-Unified-Website-Visual-Design-Spec.md`
- `Kelaibao-Website-Content-and-Layout-Spec-v1.2.md`

**Review Date**

- 2026-08-02

## Overall Conclusion

评审意见整体成立。FR-21 的品牌、架构、功能冻结和 Production 边界没有阻塞性错误，但素材槽引入的新尺寸提示与替代文本尚未被允许文案契约覆盖，17 个槽位也缺少逐项实施映射；这些问题会直接影响测试可执行性，必须在编码前补齐。

字体栈、fidelity 比较规则、注册表负向校验和 reviewer 授权规则同样应在本轮文档中收敛。完成下表 Accept/Partial 项后，FR-21 可进入实施。

## Decision Table

| No. | Severity | Type | Review Source | Original Comment Summary | Decision | Evidence | Follow-up Plan / Rejection Reason |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | High | Consistency | `GPT-5.5 F1` | 文案完全冻结与 provisional 尺寸叠层互相冲突。 | Accept | FR 同时要求现有文字逐字不变和公开显示尺寸提示，当前 fixture 没有例外规则。 | 在“内容、结构与行为冻结”中增加唯一允许格式 `建议尺寸 {width}×{height}`，明确仅存在于 provisional 槽并在 final 时消失；fixture 单独白名单该格式。 |
| 2 | High | Requirement | `GPT-5.5 F2` | 新增图片 alt/失败文案未纳入可访问名称冻结规则。 | Accept | `VisualAssetDefinition.alt` 为必填，而当前 FR 又冻结全部可访问名称。 | 为 17 个槽位逐项登记获准 alt；失败态复用同一 alt，不另造文案，并把这些字符串纳入 allowed-copy inventory。 |
| 3 | Medium | Test | `GPT-5.5 F3` | 17 个素材槽缺少稳定 ID、路由、组件、路径和验收映射。 | Accept | FR 只有分类计数，无法稳定断言槽位是否缺失或接错内容组。 | 增加 17 行素材注册表契约，固定 ID、路由/内容组、路径、尺寸、焦点、状态和 alt。 |
| 4 | Medium | Risk | `GPT-5.5 F4` | fidelity QA 未说明如何忽略概念图中的禁用生成文字、Logo 和数据。 | Accept | 概念图是构图基线但不是文案来源，像素级无差别比较会与冻结规则冲突。 | 明确只比较构图、比例、字体层级、配色、素材语言、留白和响应式；生成文字、Logo、数据及新控件区域必须忽略或遮罩，并由 allowed-copy/no-new-claim fixture兜底。 |
| 5 | Medium | Clarity | `GPT-5.5 F5` | 中文标题“轻微负字距”缺少具体 token，可能损害窄屏可读性。 | Accept | 视觉规格允许范围，但 FR 的强制表述没有语言范围或数值。 | 固定全局中文标题 `letter-spacing: 0`；仅拉丁/数字 display 片段允许 `-0.01em`，且必须通过 320px 与 200% 缩放验证。 |
| 6 | Medium | Test | `GPT-5.5 F6` | FR 缺少注册表的 remote URL、非法尺寸、未知状态等负向验证。 | Accept | Sprint 已要求 fail-closed，FR 不应弱于下游计划。 | 在最小验证方式中加入注册表完整性和负向测试，覆盖远程 URL、缺失文件、非 WebP、非法状态/尺寸、宽高比不一致和缺失槽位。 |
| 7 | Low | Documentation | `GPT-5.5 F7` | reviewer 人工确认规则与标准 review-confirm 流程关系不清。 | Accept | 用户已显式调用 Sprint Workflow 并要求启动完成 M4-03，足以授权本轮标准双 reviewer。 | 将规则改为：用户显式委托 Sprint Workflow 即视为标准 review-start 授权；仅额外 reviewer 或扩大评审范围需再次确认，并在 review-confirm 记录。 |
| 8 | Medium | Consistency | `GPT-5.3 F1` | `FR-19` 与 `M4-01` 双重门禁命名可能被误解为两个独立门禁。 | Accept | FR-19 是需求，sprint-m4-01 是其交付 Sprint，提交 `2583ff4` 同时完成两者。 | 在头部和高层要求增加明确映射，保留两个标识但说明不是两个独立门禁。 |
| 9 | Low | Requirement | `GPT-5.3 F2` | 系统中文字体栈未给出精确 `font-family`。 | Accept | FR 只禁止远程字体，没有固定跨 Windows/macOS/iOS 的回退顺序。 | 增加全局字体栈和适用范围，控件继承同一栈，不新增远程字体请求。 |

## Needs Immediate Action

- 补齐 allowed-copy 例外与 17 个 approved alt。
- 固定 17 个素材槽映射和 fail-closed 校验。
- 固定字体栈、字距和 fidelity ledger 规则。
- 澄清 FR-19/M4-01 与 reviewer 授权关系。

## Can Be Deferred

- 无。上述事项均可在不扩大产品范围的情况下于编码前完成。

## Final Status

FR-21 在上述 Accept 项应用后可接受并进入实现门禁；当前确认不改变 Production `BLOCKED` 状态。
