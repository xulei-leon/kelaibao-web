# Sprint M2-01 Document Review Confirm

**Reviewed Inputs**

- `docs/1-Requirement/Mainland-Website-FR/FR-09-alibaba-cloud-fullstack-runtime-and-infrastructure-gate.md`
- `docs/2-Design/Alibaba-Cloud-Fullstack-Architecture-Spec.md`
- `docs/3-Plan/sprint-m2-01.md`
- `docs/3-Plan/Mainland-Website-Sprint-Index.md`
- `docs/4-Reviews/sprint-m2-01-review-by-gpt-5.5.md`

**Review Date**

- 2026-07-29

## Overall Conclusion

GPT-5.5 的 6 条意见均与 FR-09、架构规格和显式遗留规则一致。当前文档需要先补齐 rollback 兼容、迁移单实例执行、连接预算、standalone 制品契约和跨文档措辞，之后才能进入实现。

本次按用户要求只使用 GPT-5.5 报告，不调用 GPT-5.3 Codex Spark。`M2-LEGACY-01`、`M2-LEGACY-02` 仍只允许外部验证 `DEFERRED`，不影响本地代码实施。

## Decision Table

| No. | Severity | Type | Review Source | Original Comment Summary | Decision | Evidence | Follow-up Plan / Rejection Reason |
|---|---|---|---|---|---|---|---|
| 1 | High | Risk | `GPT-5.5 C1` | 旧 FC 版本可能不兼容迁移后的 schema，应用回退不安全。 | Accept | 架构要求回退上一 FC 版本，但 Sprint 只写“向前兼容”，没有禁止破坏性 DDL。 | 在架构与 Sprint 中要求 expand-only migration，禁止 drop/rename/不兼容类型变化及无默认值必填列，并增加 previous-app/new-schema 兼容矩阵检查。 |
| 2 | Medium | Correctness | `GPT-5.5 C2` | migration 没有显式 release-only 边界和并发锁。 | Accept | `scripts/migrate.mjs` 已列入范围，但未禁止启动/请求路径执行，也未定义锁。 | 固定 migration 仅作为显式 release step，使用 MySQL advisory lock，测试并发拒绝与失败释放。 |
| 3 | Medium | Performance | `GPT-5.5 C3` | 连接池没有 limit、queue、timeout 和 FC/RDS 总预算约束。 | Accept | 架构只写有界连接池；Sprint 无可测试参数。 | 增加 `MYSQL_POOL_LIMIT`、`MYSQL_QUEUE_LIMIT`、`MYSQL_ACQUIRE_TIMEOUT_MS`、`MYSQL_MAX_APP_INSTANCES`、`MYSQL_CONNECTION_BUDGET`，启动时验证乘积不超预算，并测试复用、耗尽、超时和脱敏错误。 |
| 4 | Medium | Requirement | `GPT-5.5 C4` | `standalone` 没有可执行制品契约和本地 server smoke。 | Accept | 当前只声明 `standalone` 候选，未列复制静态资源、启动命令、`PORT` 或 runtime env 行为。 | 固定 `.next/standalone`、`.next/static`、`public`、`server.js`、`PORT` 和 runtime-only env 契约；本地启动制品并 smoke SSR 与 Route Handler。 |
| 5 | Medium | Consistency | `GPT-5.5 C5` | 实施顺序和 Sprint Index 仍把真实云发布/回退写成“通过”。 | Accept | Sprint 其他段落已明确真实云 `DEFERRED`，但实施顺序和 Index 未同步。 | 统一改为“本地制品/回退命令契约通过；真实 FC/ESA 发布、smoke、告警和回退证据归 M2-LEGACY-01”。 |
| 6 | Low | Clarity | `GPT-5.5 C6` | FR-09 的绝对停止措辞与显式本地开发覆盖并存。 | Accept | FR-09 requirement 6/验收仍可被解读为禁止本地移除静态导出。 | 在 requirement 6 和验收说明覆盖只允许本地 `CODE_READY_WITH_EXTERNAL_LEGACY`，不代表 FR-09 生产完成。 |

## Needs Immediate Action

- 应用 6 条文档修订后才开始代码。
- 实现必须先建立对应测试骨架。

## Can Be Deferred

- 真实 FC/ESA/RDS 发布、网络、告警、回退和成本验证继续归 `M2-LEGACY-01`、`M2-LEGACY-02`，M2-05 Production 判定前必须关闭。

## Final Status

状态为 `ACCEPTED_AFTER_CHANGES`。6 条确认修改已应用，文档链接、关键契约和 `git diff --check` 已通过，可以进入 M2-01 实现。
