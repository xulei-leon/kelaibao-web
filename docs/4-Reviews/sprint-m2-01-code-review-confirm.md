# Sprint M2-01 Code Review Confirm

**Reviewed Inputs**

- `docs/4-Reviews/sprint-m2-01-code-review-by-gpt-5.5.md`
- `docs/3-Plan/sprint-m2-01.md`
- `docs/1-Requirement/Mainland-Website-FR/FR-09-alibaba-cloud-fullstack-runtime-and-infrastructure-gate.md`
- `docs/2-Design/Alibaba-Cloud-Fullstack-Architecture-Spec.md`
- `migrations/001_core_schema.sql`
- `tests/m2-runtime-contract.test.ts`
- `tests/m2-migrations.test.ts`

**Review Date**

- 2026-07-29

**Reviewer Scope Override**

- 依用户指示，本轮只采用 GPT-5.5 报告；GPT-5.3 Codex Spark 已跳过。

## Overall Conclusion

GPT-5.5 的核心判断成立：当前 schema 没有阻止“未确认授权的案例进入 `published` 状态”，与架构规范中“案例首次发布前必须人工确认授权”的约束不一致。该项必须在 M2-01 接受前修复。

测试覆盖建议方向正确，但无需在本 Sprint 扩展为真实 MySQL/RDS 集成测试；以本地 SQL 契约测试覆盖高风险约束，真实 RDS 执行继续归入 `M2-LEGACY-01 / DEFERRED`。两项确认修改已完成并通过完整本地验证。

## Decision Table

| No. | Severity | Type | Review Source | Original Comment Summary | Decision | Evidence | Follow-up Plan / Rejection Reason |
|---|---|---|---|---|---|---|---|
| 1 | Medium | Correctness | `GPT-5.5 C1` | `content_items` 允许未确认授权的案例直接处于 `published`。 | Accept | `Alibaba-Cloud-Fullstack-Architecture-Spec.md` 明确要求案例首次发布前记录授权确认时间和操作者；当前 `chk_content_items_case_authorization` 只限制非案例字段为空，没有约束已发布案例。 | 修改 `migrations/001_core_schema.sql`：非案例授权字段必须为空；案例进入 `published` 时两个授权字段必须同时非空；草稿和下线案例允许保留或暂缺授权信息。 |
| 2 | Low | Test | `GPT-5.5 C2` | 现有测试没有验证 schema 的关键业务约束，因此未发现授权门禁缺失。 | Partial | 当前 M2-01 已把真实空 RDS 执行归入 `M2-LEGACY-01`，但 Sprint 要求本地验证关键约束；使用 SQL 契约断言即可覆盖当前阶段，不需要引入一次性 SQL parser 或真实数据库。 | 在 `tests/m2-runtime-contract.test.ts` 增加对已发布案例授权、内容类型内 slug 唯一、媒体大小、Session 过期、修订编号和登录失败上限约束的聚焦断言。真实 MySQL/RDS 行为验证继续延后，不扩展本 Sprint 的外部依赖。 |
| 3 | Info | Consistency | `GPT-5.5 I1` | 当前实现没有误报 Production PASS，也没有引入通用 `webservice`。 | Accept | Sprint、runbook 与部署示例均把真实云发布、告警、回退和预算证据标记为 `M2-LEGACY-01/02 / DEFERRED`，本地 smoke 的 `PASS` 仅描述本地候选制品。 | 在 Sprint 交付结论中继续使用 `CODE_READY_WITH_EXTERNAL_LEGACY`；M2-05 前不把 Production Live 标记为通过，并继续使用明确的 HTTP(S) 集成边界。 |

## Needs Immediate Action

- 修复已发布案例的数据库授权约束。
- 增加六类关键 schema 约束的本地契约断言。
- 完成修复后重新运行专项测试、`pnpm test`、`pnpm lint`、`pnpm build`、standalone smoke 和客户端秘密扫描。

## Can Be Deferred

- 在真实空 RDS 上执行 migration 和数据库行为测试，继续记为 `M2-LEGACY-01 / DEFERRED`。
- 真实 ESA/FC 发布、告警和回退证据以及真实成本证据，继续分别记为 `M2-LEGACY-01`、`M2-LEGACY-02`。

## Final Status

`ACCEPTED_AFTER_CHANGES`

- `migrations/001_core_schema.sql` 已要求已发布案例同时具有授权确认时间与操作者，非案例不得携带授权字段。
- `tests/m2-runtime-contract.test.ts` 已覆盖案例授权、内容类型内 slug 唯一、媒体大小、Session 过期、修订编号和登录失败上限约束。
- 提交前范围审计另补齐了 Sprint 原始要求中的结构化日志、5xx/延迟告警占位；所有真实阈值和云端激活继续标记 `M2-LEGACY-01 / DEFERRED`。
- `pnpm test`、`pnpm lint`、`pnpm build`、`pnpm smoke:standalone`、客户端 bundle 服务端变量扫描与 `git diff --check` 均通过。
