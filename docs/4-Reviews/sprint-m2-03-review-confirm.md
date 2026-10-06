# Sprint M2-03 Document Review Confirm

**Reviewed Inputs**

- `docs/4-Reviews/sprint-m2-03-review-by-gpt-5.5.md`
- `docs/1-Requirement/Mainland-Website-FR/FR-12-news-case-cms-lifecycle-and-publication.md`
- `docs/3-Plan/sprint-m2-03.md`
- `docs/1-Requirement/Mainland-Website-FR/FR-13-public-ssr-seo-geo-technical-baseline.md`
- `docs/3-Plan/sprint-m2-04.md`
- `docs/2-Design/Alibaba-Cloud-Fullstack-Architecture-Spec.md`
- M2-02 baseline commit `da7c729`

**Review Date**

- 2026-07-30

## Overall Conclusion

GPT-5.5 的 10 条意见均指出了真实的可实现性或验收歧义。其中 7 条完整接受，3 条部分接受：SEO/发现文件的公开渲染仍属于 M2-04；案例授权继续遵循 FR-12 已批准的“首次发布、item-level 人工确认”最小门禁，不扩展为每次内容变更的法律复核。

文档在应用下表行动前不可进入实现。`M2-LEGACY-01`、`M2-LEGACY-02` 继续只允许本地工程开发；真实 ESA purge、FC/RDS/OSS 链路和成本不得标为 PASS，Production Live 保持 `BLOCKED`。本轮按用户覆盖只使用 GPT-5.5，跳过 GPT-5.3 Codex Spark。

## Decision Table

| No. | Severity | Type | Review Source | Original Comment Summary | Decision | Evidence | Follow-up Plan / Rejection Reason |
|---|---|---|---|---|---|---|---|
| 1 | High | Correctness | `GPT-5.5 H1` | 未定义已发布内容继续编辑时的 draft/public snapshot 语义。 | Accept | FR-12 同时要求保存草稿、预览和发布；现有单行 `content_items` 无法保证保存草稿不覆盖公开版本。 | 在 FR/Sprint 明确 `draft_revision_id` 与 `published_revision_id` 指针：编辑只推进 draft，公开查询只读 published pointer，发布事务才切换公开 pointer；offline 保留最后公开 pointer 与 slug 用于 410。 |
| 2 | High | Correctness | `GPT-5.5 H2` | 缺少完整状态/action 转移矩阵和字段副作用。 | Accept | 只有状态枚举，没有 `offline -> published`、禁止 `published -> draft` 等动作规则，也未定义时间戳、revision、audit、purge。 | 增加 create/save/publish/offline/republish 的允许前态、expectedVersion、字段变化、修订、审计和 purge 表；所有未列动作拒绝且无副作用。 |
| 3 | Medium | Requirement | `GPT-5.5 H3` | SEO 必填与 schema/派生规则不清晰。 | Partial | FR-13/M2-04 承担 metadata、JSON-LD、发现文件渲染；M2-03 只需提供稳定内容输入。现有 title、summary、immutable slug、发布时间与站点组织配置足以形成最小 metadata，暂不需要额外自由 SEO 字段。 | FR-12 明确新闻与案例发布都必须有 title/summary/sanitized body；M2-04 从 title 派生 title/OG title，从 summary 派生 description/OG description，从 public origin + type + immutable slug 派生 canonical，组织配置作为 author/publisher。M2-03 测试数据契约，实际公开输出留给 M2-04。 |
| 4 | High | Integration | `GPT-5.5 H4` | ESA purge 缺少 URL 集合、HTTP 边界、认证、重试和证据分栏。 | Accept | FR-12 要求精确刷新，产品规则禁止通用 `webservice`；真实 ESA 仍由 `M2-LEGACY-01` 阻断。 | 增加 canonical origin + path-to-URL 契约，无 wildcard；发布/下线包含类型列表、当前详情、sitemap、feed、llms，必要时含旧 slug；实现独立 ESA direct-HTTPS provider、超时、幂等键和有界重试任务。具体真实 endpoint/身份只从服务端配置注入并保持 `DEFERRED`。 |
| 5 | Medium | Consistency | `GPT-5.5 M1` | 内容、修订、授权、审计与 post-commit purge 的事务边界不明确。 | Accept | FR-12 要求数据库一致性，同时明确 purge 失败不能回滚已提交内容。 | 为 create/save/publish/offline 定义单事务：conditional item update + revision/pointer + authorization fields + success audit；purge job 在同一事务入队，外部 HTTP 在 commit 后执行；失败只更新 job/脱敏告警，不回滚内容。 |
| 6 | Medium | Requirement | `GPT-5.5 M2` | 案例授权在编辑、下线和重新发布后的生命周期不明确。 | Partial | FR-12 和架构只批准“首次发布”的人工 checkbox，并明确不建设授权文件/自动法律判断；现有 schema 也是 item-level 时间与管理员。 | 明确 item-level 最小假设：首次发布必须确认并记录时间、管理员和首次公开 revision；offline 不清除，后续无内容变更 republish 可复用；本阶段内容变更后仍复用 item-level 确认，但 UI 必须持续展示确认记录和“非法律意见”风险，不扩展为逐 revision 审批。 |
| 7 | Medium | Requirement | `GPT-5.5 M3` | 404/410 与列表、sitemap、feed、llms 的包含规则不完整。 | Partial | FR-13/M2-04 负责实际公开 route 与发现文件；M2-03 必须提供可被其消费的状态查询和 purge 契约。 | M2-03 定义并测试 repository/query DTO：仅 published 进入公开列表/发现查询，draft/unknown 为 not_found，offline 为 gone，republish 恢复 published；实际 HTTP 404/410、列表与发现文件输出在 M2-04 实现。 |
| 8 | Medium | Correctness | `GPT-5.5 M4` | slug 与 expectedVersion 未绑定到具体数据库写契约。 | Accept | 基线已有 `(content_type, slug)` 唯一索引和 `version`，但 FR/Sprint 未要求每个 action 的条件更新。 | 明确小写 slug 规范、首次发布冻结；每个 mutation 必须携带 expectedVersion，使用条件更新并只增 1，revision_number 等于新 version；重复 slug 与 stale version 映射为不同稳定错误且无审计成功记录。 |
| 9 | Medium | Verification | `GPT-5.5 M5` | M2-03 未延续 LOCAL_PASS 与真实云 DEFERRED 分栏。 | Accept | M2-02 已以 `CODE_READY_WITH_EXTERNAL_LEGACY` 结束，架构禁止用 mock 替代真实云证据。 | Sprint 增加证据矩阵和最终状态上限；本地状态机/DB fake/HTTP contract 可为 `LOCAL_PASS`，真实 ESA/FC/RDS/OSS/WAF/DirectMail/成本保持对应 legacy `DEFERRED/BLOCKED`。 |
| 10 | Low | Usability | `GPT-5.5 L1` | UI 未要求区分公开与草稿、冲突恢复和错误焦点。 | Accept | snapshot 模型和 optimistic concurrency 会产生用户可见双版本与冲突，现有“失败不丢输入”不足。 | 增加公开/草稿状态、当前公开 revision、sanitized draft preview、冲突 reload/compare、错误焦点和失败保留本地输入的可访问 UI 验收与 320/390/768/1440 视口检查。 |

## Needs Immediate Action

- 更新 FR-12 与 Sprint M2-03，写清 snapshot/pointer schema、状态矩阵、事务/outbox、slug/version、授权、公开查询 DTO、ESA purge 和证据矩阵。
- 文档变更应用后，再按确认后的范围进行 TDD 实现。

## Can Be Deferred

- M2-04：实际公开 SSR、metadata、JSON-LD、HTTP `404/410`、sitemap、feed 和 `llms.txt` 输出。
- 每 revision 法律授权审批、授权文件存档和自动授权判断。
- `M2-LEGACY-01`、`M2-LEGACY-02` 对应的真实云/成本证据与 Production Live 判定。

## Final Status

`ACCEPTED_AFTER_CHANGES`

上述 7 条 Accept 与 3 条 Partial 行动已写回 FR-12 与 Sprint M2-03：snapshot/pointer、动作矩阵、字段/版本、item-level 授权、事务 outbox、公开 DTO、精确 ESA URL/direct HTTPS 和证据分栏均已明确。文档门禁完成，可进入 TDD 实现；M2-04 渲染边界、两项 external legacy 和 Production Live `BLOCKED` 状态不变。
