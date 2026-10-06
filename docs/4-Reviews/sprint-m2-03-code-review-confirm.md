# Sprint M2-03 Code Review Confirm

**Reviewed Inputs**

- `docs/4-Reviews/sprint-m2-03-code-review-by-gpt-5.5.md`
- `docs/1-Requirement/Mainland-Website-FR/FR-12-news-case-cms-lifecycle-and-publication.md`
- `docs/3-Plan/sprint-m2-03.md`
- `src/server/content/mysql-repository.ts`
- `src/server/content/purge-jobs.ts`
- `src/server/content/purge-runtime.ts`
- `src/app/api/admin/content/[id]/publish/route.ts`
- `src/app/api/admin/content/[id]/offline/route.ts`
- `src/app/api/internal/cache-purge/route.ts`
- M2-03 tests and the M2-02 security/runtime baseline

**Review Date**

- 2026-07-30

## Overall Conclusion

GPT-5.5 的三条意见均有代码与 FR-12 证据支持。前两条会使刚提交内容的精确 purge 无法得到可靠的 post-commit 尝试或失败审计，不能按现状接受；第三条是同一契约的可执行测试缺口。

本轮按用户覆盖只使用 GPT-5.5，未调用 GPT-5.3 Codex Spark。下表三项行动均已应用；最终全量验证结果记录在 Sprint 交付结论中。

## Decision Table

| No. | Severity | Type | Review Source | Original Comment Summary | Decision | Evidence | Follow-up Plan / Rejection Reason |
|---|---|---|---|---|---|---|---|
| 1 | Medium | Correctness | `GPT-5.5 M1` | publish/offline 提交后只 claim FIFO 最老 job，未绑定本事务返回的 `purgeJobId`。 | Accept | `MySqlContentRepository.mutate()` 返回刚入队的 `purgeJobId`，但两个 route 未传递；`attemptPostCommitPurge()` 调用的 `claimNext()` 按 `next_attempt_at,id` 选择任意最老 ready job。FR-12 要求发布动作产生的精确 URL job 在 commit 后调用外部 HTTPS。 | 为 repository 增加 `claimById(jobId, now)`，post-commit 路径必须接收并处理 mutation 返回的 job id；定时 worker 继续使用 FIFO `claimNext()`。响应与测试必须核对实际 job id。 |
| 2 | Medium | Requirement | `GPT-5.5 M2` | ESA 配置/provider 初始化失败只写 console，没有更新已提交 job 或失败审计。 | Accept | `attemptPostCommitPurge()` 在 claim 前解析配置，失败返回 `deferred`；worker 也在顶层初始化 provider。FR-12 第 9、11 条及失败降级要求外部刷新失败更新 job、写脱敏审计并有限重试。 | 先 claim 受信任 job，再解析 ESA 配置；配置失败映射稳定 `esa_config_unavailable`，沿用 `nextPurgeRetry()` 和 `markFailed()` 写 `retry|failed` 及 `cache_purge_failed` 审计。worker 认证失败保持在 claim 之前。 |
| 3 | Low | Test | `GPT-5.5 L1` | 没有测试证明 mutation 的 `purgeJobId` 与 post-commit 实际处理 job 一致。 | Accept | 现有测试覆盖通用 FIFO claim、processor 和静态 API 文件，但两条 ready job 时处理错误 job 仍不会失败。 | 增加 exact-job processor/repository 测试，覆盖目标 job、旧 FIFO job 不被抢占、配置失败的稳定 retry/audit 输入，并让 route 显式传递 `result.purgeJobId`。 |

## Applied Changes

- 已实现 exact `purgeJobId` claim 与 post-commit 绑定，定时 worker 保持 FIFO `claimNext()`。
- 已将 ESA 配置失败映射为稳定 `esa_config_unavailable`，写回已 claim job 并进入有界重试/终止状态及失败审计。
- 已增加 executable exact-job、旧 FIFO job 不被抢占、配置失败和 processing lease 测试。

## Can Be Deferred

- 真实 ESA endpoint、隔离身份/token、FC timer 调用和 ≤60 秒缓存证据继续属于 `M2-LEGACY-01 / DEFERRED`。
- 真实报价、流量假设与预算硬上限继续属于 `M2-LEGACY-02 / DEFERRED`。

## Final Status

`ACCEPTED_AFTER_CHANGES`

三项已接受意见均已应用。最终提交仍以 Sprint 文档记录的全量测试、lint、build、standalone smoke、秘密扫描、禁止通用 `webservice` 扫描和视口检查为门禁。
