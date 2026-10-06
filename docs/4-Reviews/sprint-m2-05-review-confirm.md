# Sprint M2-05 Review Confirm

**Reviewed Inputs**

- `docs/4-Reviews/sprint-m2-05-review-by-gpt-5.5.md`
- `docs/3-Plan/sprint-m2-05.md`
- `docs/1-Requirement/Mainland-Website-FR/FR-14-inquiry-observability-security-production-readiness.md`
- `docs/1-Requirement/Mainland-Website-FR/FR-08-mainland-production-readiness.md`
- `docs/1-Requirement/Mainland-Website-FR/FR-05-fallback-inquiry-form.md`
- `docs/1-Requirement/Saino-Quanwang-Mainland-Website-SRS.md`
- `docs/2-Design/Alibaba-Cloud-Fullstack-Architecture-Spec.md`
- `docs/2-Design/Admin-Security-and-Media-Runbook.md`
- `docs/2-Design/FC-Deployment-Runbook.md`

**Review Date**

- 2026-07-30

## Overall Conclusion

GPT-5.5 的三条 Medium 意见均由 FR、SRS 或架构/回退 Runbook 支持，并且都能通过收紧 Sprint 契约解决，不需要真实云资源或人工确认。

三项全部接受：明确 honeypot 使用 transport-only header 且 JSON body 仍保持 `MainlandLeadRequest`；将本地工程状态与 Production gate 状态拆成两个独立集合；把 previous-app/new-schema 兼容矩阵提升为独立强制门禁。应用下表行动后，M2-05 可以进入 TDD 实施。`M2-LEGACY-01/02` 与 FR-08 未获真实证据的门禁继续阻断 Production Live。

本轮按用户覆盖只使用 GPT-5.5，未调用 GPT-5.3 Codex Spark。

## Decision Table

| No. | Severity | Type | Review Source | Original Comment Summary | Decision | Evidence | Follow-up Plan / Rejection Reason |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Medium | Consistency | `GPT-5.5 M1` | 严格 JSON 字段白名单与 transport-only honeypot 的实际传输方式不明确。 | Accept | FR-05 要求隐藏 honeypot 且命中后不得发送到后续接收方；FR-14 又要求服务端执行 honeypot。SRS 的 `MainlandLeadRequest` 不包含 honeypot，因此不能把它含混地加入邮件 DTO。 | 固定 JSON body 仍为精确 `MainlandLeadRequest`；浏览器把隐藏 `company` 值放入有长度上限的 `X-Inquiry-Honeypot` header。服务端先检查该 header，非空时返回通用成功语义但不调用 DirectMail；header 不记录、不转发。测试必须从真实表单 input 贯通到 header，并证明其他未知 JSON 字段仍被拒绝。 |
| 2 | Medium | Requirement | `GPT-5.5 M2` | gate input 的 `PASS/BLOCKED/N/A` 与证据表中的 `LOCAL_PASS` 混用，可能让 fake 证据被编码为 Production PASS。 | Accept | FR-08 要求真实生产证据；Sprint 同时允许本地 fake 通过和 Production 阻断。如果共享一套 status enum，validator 无法可靠区分证据层级。 | 将 schema 拆成 `localChecks` 与 `productionGates`：前者只允许 `LOCAL_PASS/LOCAL_FAIL/NOT_RUN/N/A`，后者只允许 `PASS/BLOCKED/N/A`。validator 禁止 local/fake evidence 满足 production gate，并测试 `LOCAL_PASS + external BLOCKED => CODE_READY_WITH_EXTERNAL_LEGACY / Production BLOCKED`。 |
| 3 | Medium | Test | `GPT-5.5 M3` | rollback 泛化检查没有把 previous-app/new-schema 兼容矩阵作为一等强制 gate。 | Accept | 架构规格 8 节和 FC Runbook 明确要求迁移后 schema 与上一应用版本兼容矩阵通过，才能声称 FC 可安全回退；只有备份或回退说明不足以证明该条件。 | 新增 `fc_previous_app_new_schema_compatibility` production gate，要求 previous app version、migration version、schema state、command/probe、expected/actual result 和 evidence path。validator fixture 覆盖缺失、失败、占位和通过；任一非真实 PASS 时 `--require-production-live` 非零。 |

## Needs Immediate Action

- 固定 honeypot transport header、处理顺序、长度边界、零日志/零转发和端到端测试。
- 将 release input schema 拆成 `localChecks` 与 `productionGates`，禁止层级混淆。
- 增加 previous-app/new-schema 兼容矩阵强制 gate 和失败 fixture。

## Can Be Deferred

- `M2-LEGACY-01`：隔离 ESA/FC/RDS/OSS/DirectMail、probe 身份/token 及真实告警/WAF/恢复/回退/缓存证据。
- `M2-LEGACY-02`：真实报价、流量假设与预算硬上限。
- FR-08 的真实主体、域名/ICP备案、正式企业微信、政策/专业审查、授权和大陆网络证据。

## Final Status

`ACCEPTED_AFTER_CHANGES`

三项接受行动应用到 Sprint 后允许进入 M2-05 TDD 实施；Production Live 保持 `BLOCKED`。
