# M3-05 TDD RED 证据

生成时间：2026-08-01T01:25:00+08:00

## RED-01：M3 evidence 聚合器尚不存在

- 命令：`pnpm test -- tests/m3-release-evidence.test.ts`
- 预期：测试先因缺少待实现模块失败。
- 实际：退出码 `1`；Vitest 报告无法解析 `../scripts/lib/m3-release-evidence.mjs`，测试文件 `1 failed`、`no tests`。
- 后续实现：新增 `scripts/lib/m3-release-evidence.mjs`，串联公开品牌扫描、claims register、CMS inventory 与 M3 Production gate 一致性。

## RED-02：发布 CLI 仍未执行 M3 evidence

- 命令：`pnpm test -- tests/m3-release-cli.test.ts`
- 预期：默认命令必须读取 M3 schema v2，并输出可执行的 `m3Evidence` 结果。
- 实际：退出码 `1`；4 项中 1 项失败，输出缺少 `m3Evidence`，证明 CLI 仍停留在 M2 默认输入。
- 后续实现：将默认输入更新为 `docs/5-Evidence/m3-05/gate-input.json`，schema v2 调用真实 M3 evidence validator，同时保留 schema v1 `--input` 兼容。

## GREEN 结果

- `pnpm test -- tests/m3-release-cli.test.ts tests/m3-release-evidence.test.ts tests/m3-release-validator.test.ts tests/m3-brand-release-contract.test.ts tests/m3-claims-validator.test.ts tests/m3-content-inventory.test.ts`
- 结果：6 files / 36 tests PASS。
- 代码 review-confirm 接受项 RED：新增 live CMS 状态/决定矛盾测试后，`pnpm test -- tests/m3-content-inventory.test.ts` 退出 `1`，8 项中 1 项失败，证明 `unpublish + published` 未被拒绝。
- 接受项 GREEN：增加 `unpublish → offline`、`revise-and-republish → published` 不变量后，相关 3 files / 15 tests PASS。
- 最终全量结果：52 files / 271 tests PASS。
