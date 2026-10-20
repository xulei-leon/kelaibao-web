# FR-12 新闻与案例 CMS 生命周期

> **2026-10-20 规格覆盖：** 本文仅服务新闻/案例 CMS 的要求已撤销，原完成状态仅描述历史版本；非 CMS 安全与既有数据/媒体保护继续有效。 现行依据为 [FR-25](FR-25-static-news-and-cases.md)；M5-05 已完成静态代码与本地验证，真实内容迁移和 Production 证据仍待补齐。

- `FR-ID`: `FR-12`
- `标题`: 新闻与案例 CMS 生命周期
- `所属阶段`: 阶段 5 - 阿里云全栈升级
- `开发顺序`: 12
- `优先级`: P0
- `前置依赖`: `FR-10`、`FR-11`
- `涉及包`: `/admin/news`、`/admin/cases`、内容 API、RDS 表、修订、发布与 ESA 刷新
- `是否属于原型阶段`: 否
- `来源类型`: 新需求
- `原始 SRS 章节`: 5、6.12、7、10、11.5
- `相关 FR`: `FR-13`

## 目标

让网站管理员安全地创建、编辑、预览、发布和下线新闻与获授权案例，无需重新构建整站。

## 背景与问题

营销内容变化低频且应代码审查；新闻和案例需要更快维护。CMS 必须严格限制内容类型，避免演变成通用页面搭建器。

## 影响范围

- `content_items`、`content_revisions`、`audit_logs`。
- 后台列表/编辑/预览界面和服务端 CRUD。
- 状态机、slug、案例授权确认与缓存清除。

## 需求描述

1. 内容类型只有 `news | case`，状态只有 `draft | published | offline`。
2. 支持列表、创建、编辑、保存草稿、预览、发布、下线和查看修订历史。
3. `content_items` 保存工作副本和公开状态，`content_revisions` 保存不可变快照；新增 `draft_revision_id` 与 `published_revision_id` 指针。编辑已发布/下线内容只推进 draft pointer，不改变 public pointer；M2-04 公开查询只读取 `published_revision_id`。
4. 每次 create/save/publish/offline/republish 都生成可追溯 revision；`revision_number` 等于该事务提交后的 item `version`。写操作记录管理员、时间、动作和资源。
5. 后台无需人工输入 slug。首次创建草稿时，服务端使用 Node.js crypto 生成 `news-` 或 `case-` 加 16 位小写十六进制随机编号；创建后改标题不改变链接，旧内容保留原 slug。保存省略 slug 时在现有事务中沿用 item.slug。兼容旧 API 显式 slug：先规范化为小写 kebab-case，首次发布前可编辑，`first_published_at` 非空后不可变。唯一性最终由 `(content_type, slug)` 数据库约束保证；自动生成仅遇到 duplicate_slug 重试，总尝试次数最多 3 次，其他错误直接返回。
6. 新闻和案例发布都必须具备标题、摘要、经当前 FR-11 policy 重净化后非空的正文；发布时间由服务端发布动作生成。M2-04 从 title/summary 派生 metadata/Open Graph，从 canonical public origin、类型和 immutable slug 派生 canonical，并使用站点组织配置作为 author/publisher；M2-03 不增加自由 SEO 字段或提前实现公开 metadata。
7. 案例首次发布还需勾选授权确认，记录确认时间、管理员与首次公开 revision；未确认则拒绝发布。该确认是 item-level 的本阶段最小人工门禁：offline 不清除，后续 republish 可复用；它不代表法律意见，也不等于逐 revision 授权审批。
8. 公开内容查询契约只返回 `published` item 的 published revision；draft/未知为 `not_found`，offline 为 `gone`，republish 恢复 `published`。实际 HTTP `404/410`、列表、sitemap、RSS 与 `llms.txt` 输出由 FR-13/M2-04 实现。
9. 发布/下线/republish 事务必须把精确 ESA purge job 与内容、revision、pointer、授权字段和成功审计原子写入数据库；事务提交后才调用外部 HTTPS。外部刷新失败不得回滚内容，而是更新 job、写脱敏告警/审计并允许有界重试。
10. 精确刷新 URL 由 canonical `NEXT_PUBLIC_SITE_URL` origin 和固定 path 集合生成，不允许 wildcard：对应类型列表、当前详情、`/sitemap.xml`、`/feed.xml`、`/llms.txt`。slug 在首次发布后不可变，因此正常动作没有旧公开 slug；若受控修复显式提供旧公开 slug，必须同时刷新新旧详情。
11. ESA 集成使用独立 vendor provider 直接发出明确 HTTPS 请求，不创建通用 `webservice`。endpoint、短期/最小权限身份与签名材料只在服务端配置；超时、幂等键、有限次数重试和稳定错误分类必须可测试。
12. 每个 mutation（create 除外）必须携带 `expectedVersion`，数据库使用条件更新并只递增一次；stale version 返回稳定 conflict，不生成 revision、成功审计或 purge job。重复 slug 与 stale version 使用不同错误类别。

### 状态与动作矩阵

| 动作 | 允许前态 | 公开状态结果 | Revision / pointer | 时间与授权 | Purge |
| --- | --- | --- | --- | --- | --- |
| `create` | 不适用 | `draft` | 创建 version/revision `1`，设置 draft pointer | 不设置发布时间/授权 | 无 |
| `save_draft` | `draft/published/offline` | 保持原公开状态 | version +1，新 draft revision；public pointer 不变 | 不改变首次发布/授权 | 无 |
| `publish` | `draft`，或带 draft 的 `published` | `published` | version +1，以当前 policy 重净化 draft，创建 published revision，推进 public pointer并清空 draft pointer | 首次发布设置 `first_published_at`；每次设置 `published_at`；案例首次发布需确认 | 精确 URL job |
| `offline` | `published` | `offline` | version +1，创建 offline revision；保留最后 public pointer和可能存在的 draft pointer | 设置 `offline_at` | 精确 URL job |
| `republish` | `offline` | `published` | version +1；有 draft 时发布 draft，否则从最后 public snapshot 创建新 published revision | 保留 `first_published_at`/item-level 授权，更新 `published_at`，清空 `offline_at` | 精确 URL job |

未列出的直接状态转换（包括 `draft -> offline`、把 published item 直接改为 draft、无 draft 的重复 publish）全部拒绝且不得产生数据库或外部副作用。

### 字段与验证契约

- `title`: trim 后 1～160 字符。
- `summary`: trim 后 1～320 字符。
- `slug`: 创建/保存请求可省略；显式提交仍要求 1～191 个 ASCII 字符，格式 `^[a-z0-9]+(?:-[a-z0-9]+)*$`。只有 undefined（JSON 未提供）触发生成/沿用；空串、null 或其他非法值仍拒绝。响应和持久化记录仍包含 slug。
- `source_html`: 最大 500,000 字符；保存、预览和发布都调用 FR-11 当前 sanitizer policy，公开 pointer 永远不得引用旧 policy 或空 sanitized HTML。
- 内容类型、状态、管理员、revision、sanitizer policy/version、媒体 URL 和授权字段均由服务端白名单校验；客户端不得直接提交 pointer、审计或 purge job 状态。

## 高层要求

- 营销、服务、职业和政策页不得进入 CMS。
- 公开内容只能使用 `FR-11` 净化 HTML 和已确认媒体。
- create/save/publish/offline/republish 的 conditional item update、revision、pointer、授权字段、成功审计和 purge outbox 必须在同一数据库事务内；验证/冲突失败无成功审计，purge HTTP 在 commit 后执行。
- purge outbox 至少记录 idempotency key、URL allowlist、committed revision、状态、attempt、next attempt、稳定错误分类与时间；原始凭据、完整 Authorization 或供应商响应正文不得进入数据库/日志。
- 不使用 OSS JSON/Markdown 或 ESA Edge KV 作为 CMS 主数据库。
- M2-03 只提供公开查询 DTO 与状态，不提前实现 FR-13 的 SSR、metadata、JSON-LD 和发现文件。

## 输入

- 新闻/案例字段、HTML source、已确认媒体引用、`expectedVersion`、状态动作和首次案例授权确认。

## 输出

- 工作副本、公开 snapshot pointer、不可变修订、审计事件与发布结果。
- 公开查询 DTO、精确 ESA purge job/HTTPS 请求和脱敏失败诊断。

## 失败与降级

- 验证或授权不足：保持草稿，不改变公开状态。
- 并发冲突：拒绝覆盖并提示重新载入/比较，保留客户端未提交输入。
- 数据库事务失败：全部回滚。
- 缓存清除失败：内容仍提交成功，job 标记 retry/failed 并写告警；本地只验证 outbox/HTTP contract。真实 ESA 最长 60 秒 TTL 与 purge 生效证据保持 `M2-LEGACY-01 / DEFERRED`。

## 不纳入范围

- 多管理员审批、排期发布、批量导入、翻译、评论、搜索和营销页编辑。
- 上传授权文件或自动判断案例授权有效性。

## 最小验证方式

- 状态机、唯一/不可变 slug、修订、并发冲突、授权和审计集成测试。
- 已发布内容保存 draft 不改变 public snapshot；publish/offline/republish 的 pointer、时间戳、revision 与事务回滚测试。
- 公开查询 `published/not_found/gone`、derived SEO input DTO、精确 URL、purge outbox、idempotency、超时/重试和 direct HTTPS provider 契约测试。
- 管理后台检查公开/draft 指示、sanitized preview、revision 历史、冲突 reload/compare、错误焦点与失败保留输入；检查 320px、390px、768px、1440px。
- 本地 DB fake/HTTP fake 只标记 `LOCAL_PASS`；真实 ESA/FC/RDS/OSS/WAF/DirectMail 与成本保持 `M2-LEGACY-01/02 / DEFERRED|BLOCKED`。
- 实施阶段运行 `pnpm test`、`pnpm lint`、`pnpm build`。

## 验收要点

- 管理员可完成新闻/案例全生命周期且不会修改代码管理页面。
- 未授权案例无法发布，授权确认可审计。
- 首次发布后 slug 不可变；保存已发布内容的 draft 不改变公开 snapshot，显式 publish 才推进 public pointer。
- stale version、重复 slug、非法状态和事务失败均无半提交或静默覆盖。
- M2-03 公开查询 DTO 对 draft/unknown/offline/published 给出稳定状态；M2-04 据此实现 HTTP `404/410/200` 与发现文件。
- 发布/下线无需重新构建整站；本地精确 purge/outbox 可验证，真实 ESA 60 秒收敛结论保持 `M2-LEGACY-01 / DEFERRED`。

## 备注

案例授权勾选是本阶段经确认的最小门禁，不代表法律意见或授权文件托管。

2026-10-07 新闻删除补充：新闻列表在“编辑”旁提供“删除”，确认后通过鉴权/CSRF/expectedVersion 服务端事务逻辑删除。deleted_at 标记删除并保留修订、审计、媒体与 slug；后台不可读取或修改，曾发布内容返回 410 并触发精确 purge，草稿返回 404。案例不提供删除。契约与验收见 `docs/3-Plan/cms-news-delete.md` 和对应 review-confirm。
