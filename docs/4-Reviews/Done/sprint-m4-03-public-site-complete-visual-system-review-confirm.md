# Sprint M4-03 公开站完整视觉系统 Review Confirm

**Reviewed Inputs**

- `sprint-m4-03-public-site-complete-visual-system.md`
- `sprint-m4-03-public-site-complete-visual-system-review-by-gpt-5.5.md`
- `sprint-m4-03-public-site-complete-visual-system-review-by-gpt-5.3-codex-spark.md`
- `FR-21-public-site-complete-visual-system-and-replaceable-assets.md`
- `products/kelaibao/AGENTS.md`
- `Kelaibao-Unified-Website-Visual-Design-Spec.md`

**Review Date**

- 2026-08-02

## Overall Conclusion

Sprint 的范围、顺序和架构边界可执行，未发现阻塞性产品或技术方向错误。需要在实施前补齐五类验收细节：allowed-copy 例外、320px 固定证据视口、fidelity ledger 字段与判定、素材 provenance、以及标准 reviewer 授权记录。

`gpt-5.3-codex-spark` 的 Info 建议与 `gpt-5.5` 的 fidelity 建议方向一致但并非完全重复，保留为独立行并落实为 concept-to-section/slot 映射。

## Decision Table

| No. | Severity | Type | Review Source | Original Comment Summary | Decision | Evidence | Follow-up Plan / Rejection Reason |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Medium | Requirement | `GPT-5.5 F1` | 尺寸提示和新增 alt 未被 allowed-copy inventory 明确允许。 | Accept | Sprint 同时冻结所有文字并要求 public provisional overlay；FR confirm 已判定为真实冲突。 | WP0 固定允许格式与 17 个 alt 来源，并要求 final 状态无提示。 |
| 2 | Medium | Test | `GPT-5.5 F2` | 320px 只有即时检查，没有 before/after 可复核截图。 | Accept | 320px 是 AGENTS.md 强制视口，属于视觉变更验收范围。 | 将 `320×568` 加入 before/after、浏览器记录和 fidelity ledger，形成五个固定基准视口。 |
| 3 | Medium | Clarity | `GPT-5.5 F3` | fidelity ledger 缺少字段、分级和可修复判定。 | Accept | 当前“agency-signoff/无可修复差异”没有可审计定义。 | 在 WP6 增加最小表头、Severity、可修复定义、决定与确认来源；Critical/High/Medium 可修复项未关闭时不得完成。 |
| 4 | Medium | Risk | `GPT-5.5 F4` | 17 个 WebP 没有 provenance/授权/禁止内容证据。 | Accept | 本地生成资产仍受内容授权和虚假证据边界约束，Production 不能仅凭文件存在放行。 | WP5/WP6 增加素材 provenance ledger，记录来源、生成方式、禁用内容扫描、授权状态和 Production 可用性。 |
| 5 | Low | Consistency | `GPT-5.5 F5` | 多 reviewer 的人工确认适用范围和记录位置不清。 | Accept | 用户本次已显式调用 Sprint Workflow 并要求启动完成开发。 | 在前置依赖中记录本次授权；标准 document/code review-start 均由该委托覆盖，额外 reviewer 或扩大范围才需再次确认。 |
| 6 | Info | Documentation | `GPT-5.3 F1` | 建议增加概念图到页面/Section 的逐项映射。 | Accept | 五张当前基线分别覆盖不同页面/视口，若只按整页比较会降低差异定位能力。 | 在 WP0/WP6 建立 concept-to-section/slot 映射；17 个槽位直接引用 FR 固定注册表 ID。 |

## Needs Immediate Action

- 更新 WP0、WP5、WP6 和验收/验证章节，落实全部六项确认动作。
- 将文档状态改为 document review-confirm 完成后再进入代码。

## Can Be Deferred

- Production 素材授权可继续保持 `BLOCKED`，但每个素材的当前授权状态必须记录，不得伪造为已通过。

## Final Status

全部 Accept 项应用后，Sprint M4-03 可进入冻结基线与实现阶段；Production 仍为 `BLOCKED`。
