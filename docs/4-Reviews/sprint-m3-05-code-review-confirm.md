# Sprint M3-05 Code Review Confirm

**Reviewed Inputs**

- `docs/4-Reviews/sprint-m3-05-code-review-by-gpt-5.5.md`
- `docs/1-Requirement/Mainland-Website-FR/FR-18-claims-content-discovery-and-release-migration.md`
- `docs/3-Plan/sprint-m3-05.md`
- `scripts/lib/content-inventory-validator.mjs`
- `scripts/lib/release-validator.mjs`
- `scripts/lib/m3-release-evidence.mjs`
- `src/server/content/domain.ts`
- M3-05 tests and Evidence

**Review Date**

- 2026-08-01

## Overall Conclusion

唯一 reviewer 的核心判断成立。FR-18 要求旧品牌已发布内容必须“改写并重新发布，或下线”，现有 CMS 状态机也明确使用 `published` / `offline`；当前 content inventory validator 未约束 `decision` 与 `status` 的对应关系，确实可能让仍为 `published` 的 `unpublish` 条目关闭 Production CMS gate。

因此当前实现不能原样接受。必须先增加最小状态/决定不变量及负向测试，再重跑完整门禁。其余 4 项 Info 结论均已由代码、输入与命令验证，无需额外改动。

## Decision Table

| No. | Severity | Type | Review Source | Original Comment Summary | Decision | Evidence | Follow-up Plan / Rejection Reason |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | High | Correctness | `GPT-5.5 C1` | `decision=unpublish` 但 `status=published` 的 complete live inventory 仍可使 CMS Production gate PASS。 | Accept | FR-18 需求 3 要求逐条“改写并重新发布，或下线”；`src/server/content/domain.ts` 将公开状态固定为 `draft/published/offline`，下线动作的 next status 为 `offline`；当前 `validateCompleteLiveInventory()` 只拒绝 pending 和缺失审计字段，未验证状态/决定一致性。 | 在 `content-inventory-validator.mjs` 中要求 `unpublish → offline`、`revise-and-republish → published`；在 `m3-content-inventory.test.ts` 增加两个矛盾组合的负向测试，并增加有效 offline/unpublish 的正向证明。 |
| 2 | Info | Requirement | `GPT-5.5 C2` | schema v2 完整继承 16 个 Production gate 并追加 2 个 M3 gate。 | Accept | `PRODUCTION_GATE_IDS` 为 16 项；`M3_PRODUCTION_GATE_IDS` 通过展开继承后追加两项；`inheritedProductionGateIds` 保持相同顺序，遗漏/重排测试通过。 | 无代码变更；最终验证继续运行 M3 release validator tests 与默认/强制 Production CLI。 |
| 3 | Info | Requirement | `GPT-5.5 C3` | schema v1 输入兼容性仍然保留。 | Accept | `validateReleaseGateInput()` 同时接受 1/2；`pnpm validate:release -- --input docs/5-Evidence/m2-05/gate-input.json` 退出 0 并保持 Local/Production 分离。 | 无代码变更；最终门禁继续保留 schema v1 CLI 测试。 |
| 4 | Info | Requirement | `GPT-5.5 C4` | checked-in CMS fixture 不能提升 Production。 | Accept | fixture 为 `sourceMode=fixture`、`inventoryComplete=false`；`evaluateContentInventory()` 返回 BLOCKED，M3 evidence 一致性校验拒绝把相应 gate 改为 PASS。 | 无代码变更；修复 live 状态不变量时不得放宽 fixture fail-closed 逻辑。 |
| 5 | Info | Test | `GPT-5.5 C5` | 审查时的 36 项 M3 专项与 release 命令均按预期通过。 | Accept | reviewer 实测 6 files / 36 tests PASS；默认 release exit 0，强制 Production exit 1，schema v1 exit 0。 | 修复 C1 后重跑专项、全量 test/lint/build、两项 smoke、两种 release validation 与 diff check；以修复后结果更新最终证据。 |

## Needs Immediate Action

- 修复 C1：complete live CMS inventory 的 `decision` / `status` 必须与现有 CMS 状态机一致。
- 增加 `unpublish + published`、`revise-and-republish + offline` 负向测试和 `unpublish + offline` 正向测试。
- 修复后重跑所有 M3-05 验证。

## Can Be Deferred

- 无。其余 Info 项均为已验证通过的契约，不产生后续改动。

## Final Status

`ACCEPTED_AFTER_CHANGES`。

## Applied Resolution

- `scripts/lib/content-inventory-validator.mjs` 已增加 `unpublish → offline`、`revise-and-republish → published` 不变量。
- `tests/m3-content-inventory.test.ts` 已增加有效 `unpublish + offline` 正向用例，以及 `unpublish + published`、`revise-and-republish + offline` 负向用例；新增测试先 RED 后 GREEN。
- 最终验证：52 files / 271 tests PASS；lint、build、standalone/media smoke、默认 release exit 0、强制 Production exit 1、schema v1 exit 0、diff check 均通过。
- `production_cms_brand_migration` 仍为 `BLOCKED`，接受项未改变 fixture 与 Production 的 fail-closed 边界。
