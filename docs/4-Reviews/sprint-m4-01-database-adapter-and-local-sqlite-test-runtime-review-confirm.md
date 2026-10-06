# Sprint M4-01 数据库适配层与本地 SQLite 测试运行时 Review Confirm

**Reviewed Inputs**

- `docs/1-Requirement/Mainland-Website-FR/FR-19-database-adapter-and-local-sqlite-test-runtime.md`
- `docs/3-Plan/sprint-m4-01-database-adapter-and-local-sqlite-test-runtime.md`
- `docs/4-Reviews/sprint-m4-01-database-adapter-and-local-sqlite-test-runtime-review-by-gpt-5.5.md`
- `docs/4-Reviews/sprint-m4-01-database-adapter-and-local-sqlite-test-runtime-review-by-gpt-5.3-codex-spark.md`
- `AGENTS.md`
- `products/kelaibao/AGENTS.md`
- `docs/2-Design/Alibaba-Cloud-Fullstack-Architecture-Spec.md`
- `docs/2-Design/Admin-Security-and-Media-Runbook.md`

**Review Date**

- 2026-08-01

## Overall Conclusion

两份评审均确认 FR-19/M4-01 没有 Critical 或 High 阻断项，且生产固定 RDS MySQL、SQLite 仅限 local-test 的方向与项目架构一致。GPT-5.5 提出的 5 个 Medium 和 1 个 Low 均有现有代码或发布契约证据，应在实施前收紧；Spark 的 Info 结论作为交付后一致性核验要求接受。

接受项应用后，文档可进入代码实施。SQLite 结果只能形成 `LOCAL_PASS`，默认 release validation 不提升 Production 状态，强制 Production 验证必须继续失败，直至既有真实门禁具备证据。

## Decision Table

| No. | Severity | Type | Review Source | Original Comment Summary | Decision | Evidence | Follow-up Plan / Rejection Reason |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Medium | Consistency | `GPT-5.5 M1` | 默认与强制 Production release validation 的退出码、状态和 blocker 契约不明确。 | Accept | M3-05 已固定 `localReady/productionReady/status/blocker IDs` 双层语义；Runbook 禁止 local fake 满足 Production。 | 在 Sprint WP7/验证矩阵明确默认命令可在 Local gates 通过时退出 0，但保持 `productionReady=false`；`--require-production-live` 在真实门禁缺失或 SQLite/local fake 输入时退出 1，并记录完整状态与 blockers。 |
| 2 | Medium | Clarity | `GPT-5.5 M2` | SQLite local smoke 与 FC/standalone deployment 禁用 SQLite 的边界有歧义。 | Accept | FR 同时要求 local SQLite browser smoke 与部署 fail-closed；二者需要显式区分运行目的。 | 增加运行矩阵：Next dev/browser local-test 允许 SQLite；standalone packaging 可构建但部署/Production smoke 不得以 SQLite 作为成功数据库；FC Preview、Production 和强制发布验证拒绝 SQLite。 |
| 3 | Medium | Maintainability | `GPT-5.5 M3` | factory 收敛没有固化全部直接 MySQL 实例化面的可审计清单。 | Accept | 当前 auth、content、media、purge、public SSR、discovery 和 protected layout 均存在直接 `new MySql*Repository()`。 | WP2 新增 `docs/5-Evidence/m4-01/mysql-direct-dependency-inventory.md`，记录所有非测试命中、迁移决定和最终零命中扫描。 |
| 4 | Medium | Correctness | `GPT-5.5 M4` | SQLite/MySQL 方言漂移测试未点名大小写、时间、JSON、布尔/空值和枚举。 | Accept | MySQL `utf8mb4`、严格模式、UTC 与 SQLite 默认比较/类型行为不同。 | 在共享 contract 与 SQLite 专项测试中具名覆盖 slug 归一/唯一、revision tie-break、UTC 精度排序、JSON round-trip/allowlist、boolean/null、enum/check、长度拒绝和 immutable published revision。 |
| 5 | Medium | Security | `GPT-5.5 M5` | SQLite 允许路径和 reset 删除路径不一致，临时测试目录可能扩大删除边界。 | Accept | FR 允许受控相对/绝对路径，reset 只允许 `.local-data`；Sprint 又提及临时目录。 | 人工/开发 reset 仅允许项目 `.local-data`。自动测试临时根必须通过独立显式参数注入，验证 real path、拒绝 symlink/junction 越界，只删除主 `.sqlite` 与同 basename sidecars。 |
| 6 | Low | Requirement | `GPT-5.5 L1` | MySQL/SQLite 双向配置互斥没有完整枚举。 | Accept | 现有脚本以 `DATABASE_URL` 为入口，新配置若同时存在可能产生不确定选择。 | FR/Sprint 添加互斥矩阵；显式 adapter 与另一实现变量冲突时 fail-closed，未显式 adapter 且两类变量同时存在时不得猜测。 |
| 7 | Info | Consistency | `Spark I1` | 未发现关键不一致，建议交付后核对文档与实现。 | Accept | 评审确认架构、迁移、安全和证据分层一致。 | WP7 增加配置名、命令名、文件边界和文档示例的一致性核验；差异必须先更新文档并重新评审。 |

## Needs Immediate Action

- 将 1～6 项全部应用到 FR-19/M4-01 后才能开始代码实施。
- 实施时先完成配置 fail-closed 和 MySQL direct-dependency inventory，再接入 SQLite。

## Can Be Deferred

- 真实 RDS/FC/VPC、ESA、OSS、恢复和成本证据继续由既有 Production gates 管理；不能由 M4-01 本地证据关闭。

## Final Status

`ACCEPTED WITH REQUIRED DOCUMENT CHANGES`。上述文档修改应用并通过 `git diff --check` 后，可进入 M4-01 代码实施阶段。

