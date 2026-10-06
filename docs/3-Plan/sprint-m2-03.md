# Sprint M2-03 新闻与案例 CMS

> **状态：** `CODE_READY_WITH_EXTERNAL_LEGACY`；M2-02 已以提交 `da7c729` 完成，本 Sprint 的 GPT-5.5-only 文档与代码 review-confirm、接受项修复和最终验证均已完成，等待独立提交。

## 1. Sprint 目标

实现 [FR-12](../1-Requirement/Mainland-Website-FR/FR-12-news-case-cms-lifecycle-and-publication.md)，交付新闻/案例的后台生命周期、修订、授权、审计和发布刷新。

核心目标：

- 管理员无需重新构建整站即可维护新闻和案例。
- 状态、slug、案例授权和并发编辑边界可被自动验证。

## 2. 前置依赖

- `sprint-m2-02` 完成全部门禁。
- FR-12 与本 Sprint完成文档 review-confirm。

协同说明：

- 只使用 M2-02 的认证、净化和媒体能力，不复制安全逻辑。
- `M2-LEGACY-01` 覆盖真实 ESA purge endpoint/身份、ESA→FC→RDS 链路和 ≤60 秒缓存证据；M2-03 只可把数据库、状态机、outbox、精确 URL 和 direct HTTPS provider fake/contract 标为 `LOCAL_PASS`。
- `M2-LEGACY-02` 的真实报价、流量假设和预算硬上限继续 `DEFERRED`；Production Live 保持 `BLOCKED`。

## 3. 纳入范围

本 Sprint 纳入以下 FR：

- `FR-12` 新闻与案例 CMS 生命周期。

涉及包和目录：

- `/admin/news`、`/admin/news/new`、`/admin/news/[id]`、`/admin/cases`、`/admin/cases/new`、`/admin/cases/[id]`。
- `/api/admin/content`、`/api/admin/content/[id]`、`/publish`、`/offline`、`/revisions` Route Handlers。
- 内容工作副本、draft/public snapshot pointers、不可变修订、审计、乐观并发、案例授权、purge outbox 与独立 ESA direct HTTPS provider。
- 供 M2-04 使用的公开查询 DTO（`published | not_found | gone`）；不在本 Sprint 实现公开 SSR 或发现文件。

## 4. 暂不纳入范围

- 营销页 CMS、多管理员审批、排期发布、批量导入、评论和搜索。

原因：

- 只交付已确认的低频内容维护闭环。

## 5. 工作范围

### 5.1 工作包：内容模型与状态机

目标：

- 建立可审计、可并发保护的内容领域。

实现任务清单：

- [x] 先写 create/save/publish/offline/republish 状态矩阵、draft/public snapshot 隔离、唯一/不可变 slug、修订、案例授权和 stale version 失败测试。
- [x] 新增 expand-only、MySQL 可重入 migration：`content_items.draft_revision_id`、`published_revision_id`、`case_authorization_revision_id`，`content_revisions.slug`，以及 `cache_purge_jobs` outbox；为 pointer 增加可重入外键/索引，保持上一版本兼容。
- [x] 实现字段白名单：`news|case`、title 1～160、summary 1～320、kebab-case slug 1～191、source 最大 500,000；保存/预览/发布始终调用 M2-02 当前 sanitizer policy。
- [x] 实现一个 action 一个事务：`WHERE id = ? AND version = ?` 条件更新、version 只增 1、revision_number 等于新 version、pointer/状态/时间/授权、成功审计与 purge job 原子提交。
- [x] 实现稳定错误类别：`validation_error`、`duplicate_slug`、`version_conflict`、`invalid_transition`、`authorization_required`、`not_found`；失败无 revision/成功审计/purge。
- [x] 审计 taxonomy 至少增加 `content_created`、`content_draft_saved`、`content_published`、`content_offlined`、`content_republished`、`case_authorization_confirmed`、`cache_purge_enqueued|succeeded|failed`，metadata 只记录 item/revision/type/action/稳定 reason code。

测试要求：

- [x] published item 保存 draft 后 public pointer/DTO 不变；显式 publish 才推进 public pointer。
- [x] `draft -> offline`、无 draft 的重复 publish 等非法动作，重复 slug、首次发布后改 slug、旧版本 save/publish/offline 均失败且无副作用。
- [x] create/save/publish/offline/republish 的 revision、pointer、时间、授权、审计和 rollback 行为全部覆盖。

### 5.2 工作包：后台 UI 与预览

目标：

- 完成最小可用管理路径。

实现任务清单：

- [x] 实现新闻/案例列表、创建、编辑、保存草稿、sanitized preview、publish/offline/republish 和 revision 查看；CMS 类型由路由服务端硬编码，客户端不能扩展到其他页面。
- [x] API 全部复用 M2-02 Session、canonical Origin/Host、CSRF、sanitizer 与已确认 ESA media URL；禁止客户端写 pointer、状态时间、审计和 purge 字段。
- [x] 编辑页同时显示公开状态、draft/public revision、当前公开 revision 链接、item-level 案例授权记录和“非法律意见”说明。
- [x] 提供稳定验证消息、错误焦点、冲突 reload/compare 路径；API 失败不清空本地表单 source。

测试要求：

- [x] 键盘可完成创建、保存、预览、发布/下线和查看修订；验证错误聚焦到首个错误，冲突/网络失败不丢失未提交输入。
- [x] 320px、390px、768px、1440px 检查列表、编辑、preview、冲突和双 revision 指示，不出现关键控件横向溢出。

### 5.3 工作包：发布、授权与缓存

目标：

- 安全地发布/下线并更新公众缓存。

实现任务清单：

- [x] 新闻与案例 publish 均检查 title、summary、当前 policy sanitized body；canonical/OG/description 的 M2-04 输入分别由 immutable slug/title/summary 与组织配置派生。
- [x] 案例首次 publish 必须显式确认，事务记录 `case_authorization_confirmed_at/admin_id/revision_id` 和审计；offline 不清除，后续 republish 复用 item-level 记录并持续显示风险说明。
- [x] 实现公开查询 DTO：published 返回 public revision，draft/unknown 返回 `not_found`，offline 返回 `gone`；实际 HTTP `200/404/410` 和发现文件留给 M2-04。
- [x] 由 canonical `NEXT_PUBLIC_SITE_URL` 构造无 wildcard 精确集合：类型列表、当前详情、`/sitemap.xml`、`/feed.xml`、`/llms.txt`；验证 scheme/host、路径编码、去重和固定上限。
- [x] 内容事务内写 `cache_purge_jobs`：idempotency key、committed revision、URL JSON、`pending|processing|succeeded|retry|failed`、attempt/next_attempt/error_code；不保存完整 Authorization/供应商正文。
- [x] 实现独立 ESA direct HTTPS provider 和 job processor；每次请求 5 秒超时，使用 job idempotency key，最多 3 次，前两次失败后分别退避 5/15 秒，第三次失败终止。外部失败只更新 job并写脱敏审计/告警，不回滚已提交内容。
- [x] 真实 ESA endpoint、身份/token 和响应证据继续 `M2-LEGACY-01 / DEFERRED`，不得由 mock/fake 代替。

测试要求：

- [x] 未授权案例不能首次发布；授权字段、revision 和审计同事务，失败整体回滚。
- [x] publish/offline/republish 都原子入队精确 URL；相同 job 重试幂等，HTTP 成功/超时/429/5xx/无效响应和终止失败均覆盖。

## 6. 验收标准

- 管理员可完成新闻/案例全生命周期与修订查看。
- 非法状态、并发覆盖和未授权发布被阻止。
- 保存 draft 不改变当前公开 snapshot；publish/offline/republish 通过 pointer 和公开 DTO 原子改变公开数据状态，不需整站重建。
- 精确 purge/outbox/direct HTTPS 本地契约通过；真实 ESA 缓存最长 60 秒和 purge 生效仍为 `M2-LEGACY-01 / DEFERRED`。
- M2-04 可仅依赖稳定 DTO 实现 published 列表/详情、draft/unknown 404、offline 410 及发现文件过滤。
- CMS 没有获得营销、服务、职业或政策页编辑能力。

## 7. 验证要求

项目声明的验证命令：

- `pnpm test`
- `pnpm lint`
- `pnpm build`

专项验证：

- 状态机/snapshot pointer/事务/并发、案例授权、sanitizer/current policy、审计、public DTO、ESA purge outbox/direct HTTPS 和后台关键路径。
- 客户端 bundle 扫描数据库、CSRF、ESA endpoint identity/Authorization、OSS STS 与完整 purge URL payload 秘密。
- `src/`、`scripts/`、migration 扫描无通用 `webservice`。

证据分栏：

| 验证项 | 本 Sprint 允许状态 | Production 状态 |
| --- | --- | --- |
| 状态机、revision/pointer、slug/version、授权、事务、public DTO | `LOCAL_PASS` | 仍需真实 RDS/FC 证据 |
| purge URL、outbox、fake HTTP、超时/重试/idempotency | `LOCAL_PASS` | `M2-LEGACY-01 / DEFERRED` |
| 真实 ESA purge、≤60 秒缓存、ESA→FC→RDS、真实身份/token | 不得标 PASS | `BLOCKED` |
| 真实报价、流量和预算上限 | 不得标 PASS | `M2-LEGACY-02 / BLOCKED` |

## 8. 实施顺序

1. expand-only/retry-safe migration、snapshot/state/transaction 失败测试。
2. 内容 validation、CRUD、revision/pointer、public DTO 服务实现。
3. 后台 UI、M2-02 安全 preview/media 复用与冲突恢复。
4. 案例授权和 publish/offline/republish。
5. purge outbox、精确 URL、ESA direct HTTPS processor 与失败告警。
6. 代码 review-confirm、全量验证和独立提交。

## 9. 风险控制

- CMS 范围蔓延：内容类型硬编码为 news/case，页面配置不开放。
- 并发丢稿：所有 mutation 使用 expectedVersion 条件更新，冲突无副作用并保留客户端输入。
- 草稿覆盖公开内容：public SSR 只消费 immutable published pointer，save_draft 永不推进它。
- 数据已发布但刷新失败：事务内 outbox + commit 后有限重试/脱敏告警；真实 ≤60 秒 TTL 结论保持 `M2-LEGACY-01`。
- M2-04 范围提前：M2-03 只提供 query DTO/derived metadata inputs/purge paths，不实现公开 route、JSON-LD 或发现文件。

## 10. 交付结论

实现与 GPT-5.5-only 代码 review-confirm 已完成，三项接受意见均已应用：

- post-commit purge 精确绑定 mutation 返回的 `purgeJobId`，定时 worker 继续 FIFO；
- ESA 配置缺失映射为 `esa_config_unavailable` 并写回有界 retry/failed 与脱敏审计；
- exact-job、配置失败和 processing lease executable tests 已补齐。

最终验证：

- `pnpm test`：PASS，30 个测试文件、121 项测试全部通过；
- `pnpm lint`：PASS；
- `pnpm build`：PASS，standalone artifact 已重新打包；
- `pnpm smoke:standalone`：PASS，覆盖 SSR、Route Handler、runtime env 和公开页；
- `git diff --check`：PASS；
- `.next/static` 数据库、ESA、purge worker、OSS、管理员 session/password、DirectMail secret 标识扫描：PASS，无匹配；
- `src/`、`scripts/`、`migrations/` 的通用 `webservice` 扫描：PASS，无匹配；
- 320px、390px、768px、1440px 后台编辑视口与 390px 安全预览失败路径：PASS，无横向溢出、无 framework overlay，未认证错误显示稳定用户消息。

本 Sprint 状态为 `CODE_READY_WITH_EXTERNAL_LEGACY`。`M2-LEGACY-01`（隔离 ESA/FC/RDS/OSS/DirectMail 资源、probe 身份/token、真实 purge 与 ≤60 秒证据）和 `M2-LEGACY-02`（真实报价、流量假设与预算硬上限）继续 `DEFERRED`，不阻断本地代码提交；Production Live 保持 `BLOCKED`。
