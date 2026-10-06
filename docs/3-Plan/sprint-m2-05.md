# Sprint M2-05 询盘、运行安全与生产上线

> **状态：** `CODE_READY_WITH_EXTERNAL_LEGACY`；M2-04 已以提交 `a9a387e` 完成，GPT-5.5-only 文档与代码 review-confirm 均已完成，全部接受意见已应用并通过最终验证。外部证据缺失不阻断本地工程交付，但 Production Live 必须保持 `BLOCKED`。

## 1. Sprint 目标

实现 [FR-14](../1-Requirement/Mainland-Website-FR/FR-14-inquiry-observability-security-production-readiness.md)，并执行 [FR-08](../1-Requirement/Mainland-Website-FR/FR-08-mainland-production-readiness.md) 最终门禁，交付同域询盘、DirectMail 明确 HTTPS 边界、应用级滥用防护、无 PII 可观测性和自动化生产判定。

核心目标：

- 浏览器只向同域 `/api/inquiry` 提交最小白名单字段；服务端独立校验、限流、去重并调用 DirectMail，不建立线索数据库。
- 任何失败都不泄露供应商错误、凭据或询盘正文，并始终提供企业微信降级。
- 自动验证本地代码契约和脱敏证据清单；只有全部真实云、合规、恢复与成本门禁通过时才允许 Production Live。

## 2. 前置依赖

- `sprint-m2-04` 及 M2-00～M2-04 的本地工程、review-confirm、验证和独立提交门禁完成。
- FR-14、FR-08 与本 Sprint 完成 GPT-5.5-only 文档 review-confirm。
- 项目级 `AGENTS.md`、产品级 `AGENTS.md`、SRS、阿里云全栈架构、管理员安全/媒体 Runbook 与 FC 部署 Runbook 是约束来源。

路径与验证来源：

- `FR_DIR=docs/1-Requirement/Mainland-Website-FR`
- `SPRINT_DIR=docs/3-Plan`
- `REVIEW_DIR=docs/4-Reviews`
- `VERIFICATION_COMMANDS` 来自产品级 `AGENTS.md` 和本 Sprint：`pnpm test`、`pnpm lint`、`pnpm build`、`pnpm smoke:standalone`、`pnpm validate:release`

自动执行覆盖：

- `M2-LEGACY-01`：缺少隔离 ESA/FC/RDS/OSS/DirectMail 资源、probe 身份/token。
- `M2-LEGACY-02`：缺少真实报价、流量假设和预算硬上限。
- 两项统一记录为遗留待确认问题，不阻断可由本地测试、fake provider、静态扫描和结构化证据清单验证的工程开发。
- 该覆盖不把 fake、本地构建、示例配置或占位证据视为真实云、合规、恢复、回退或成本 `PASS`；遗留项以及 FR-08 真实主体/域名/备案/企业微信/专业审查门禁未关闭前，最高交付状态为 `CODE_READY_WITH_EXTERNAL_LEGACY`。

## 3. 纳入范围

本 Sprint 纳入以下 FR：

- `FR-14` 询盘、可观测性、安全与生产就绪。
- `FR-08` 中国大陆生产配置与上线门禁。
- `FR-05` 从浏览器直连 Preview endpoint 收敛到同域 `/api/inquiry` 的既定升级部分。

涉及包和目录：

- `src/app/api/inquiry/route.ts`、`src/server/inquiry/*`、`src/lib/submit-inquiry.ts`、`src/components/contact/inquiry-form.tsx`。
- `.env.example` 中 server-only DirectMail、询盘限流/超时/可信客户端地址配置；移除公开外部表单 endpoint。
- `scripts/validate-release.mjs`、`docs/5-Evidence/m2-05/*`、`docs/2-Design/*Runbook.md` 和对应测试。
- ESA WAF/限频、FC/RDS/OSS/DirectMail 监控、RDS 恢复、FC 回退、正式域名/合规/企业微信和成本的结构化判定。

## 4. 暂不纳入范围

- CRM、线索数据库、自动回复、营销自动化、短信、附件、预约、报价和支付。
- 通用 `webservice`、阿里云 SDK 包装层或浏览器直连 DirectMail。
- 用本地 fake 代替真实 ESA/FC/RDS/OSS/DirectMail、备案、专业审查、正式企业微信、恢复/回退或成本证据。
- 代办备案、法律意见、供应商采购和修改 `products/sino-en/src`。

原因：

- 保持最小、无持久化、可降级的询盘和可审计生产门禁。

## 5. 工作范围

### 5.1 工作包：同域询盘契约与服务端校验

目标：

- 只接受有界、明确、可验证的同域询盘请求，并保证任何无效请求都不会到达 DirectMail。

实现任务清单：

- [x] 先写 Route Handler 契约测试：仅接受 `POST` JSON、请求正文原始字节不超过 16 KiB、字段集合严格有界、服务端重新执行枚举/长度/联系方式/隐私同意校验，并在解析前处理明显超限。
- [x] JSON body 固定为精确 `MainlandLeadRequest`；隐藏 `company` 字段只通过最大 200 字符的 `X-Inquiry-Honeypot` transport header 传输，不属于 DTO、日志或邮件。服务端在 JSON 解析和白名单校验前检查该 header，非空时返回通用成功语义但不调用 DirectMail、不回显识别规则。
- [x] 浏览器提交从 `NEXT_PUBLIC_CONTACT_FORM_ENDPOINT` 改为固定同域 `/api/inquiry`，使用 `same-origin` 凭据策略、有限超时、`X-Inquiry-Honeypot` 和每次用户提交唯一的 `Idempotency-Key`；保留客户端字段校验和重复点击锁。
- [x] 所有响应使用 `private, no-store`；合法发送返回非承诺性成功，校验、超限、限频、DirectMail 失败和超时只返回稳定通用结构。
- [x] Route Handler 与 inquiry server modules 不导入数据库、内容 repository 或审计表；不得新增 lead/inquiry/CRM migration。

测试要求：

- [x] 覆盖合法、未知字段、非法 JSON、错误 Content-Type、超限/伪造 Content-Length、honeypot、未同意、非法联系方式、DirectMail 未配置和请求方法边界；从真实表单隐藏 input 贯通到 transport header，证明命中后服务端不发信且其他未知 JSON 字段仍被拒绝。
- [x] 断言客户端 URL 固定为 `/api/inquiry`，请求不进入 URL、Web Storage、分析或 console，且源码/客户端 bundle 不含 DirectMail 或限流秘密。

### 5.2 工作包：DirectMail 明确 HTTPS 边界与无 PII 可观测性

目标：

- 通过可测试的阿里云 DirectMail HTTP(S) 请求边界发送通知，同时只记录非敏感运行信号。

实现任务清单：

- [x] 建立 server-only DirectMail 配置：HTTPS endpoint、AccessKey、发信账号/别名、获批公司收件箱和有限超时；生产配置拒绝 HTTP、URL 凭据、query/fragment 与非批准 endpoint。
- [x] 用 Node 标准库实现 DirectMail RPC 参数规范化、签名与 `application/x-www-form-urlencoded` HTTPS `POST`；timestamp/nonce/fetch 可注入以便确定性测试，不引入 SDK 或通用 `webservice`。
- [x] 通知只使用纯文本正文，对所有用户字段执行长度边界和换行安全处理；单次调用超时不超过 5 秒且不自动重试，避免重复邮件。
- [x] 不读取或记录供应商响应正文；供应商非成功、网络错误、配置错误和超时统一映射为稳定 reason code，用户只看到通用失败与企业微信入口。
- [x] 建立 inquiry telemetry 白名单，只允许 server-generated request ID、route、outcome、duration bucket 和 stable reason；禁止原始 IP、Idempotency-Key、姓名、城市、联系方式、需求正文、邮件正文、Authorization、签名和供应商响应。

测试要求：

- [x] 使用 fake fetch 验证确定性签名、HTTPS POST、精确参数、5 秒超时、零自动重试、成功/非成功/网络错误和未读取 response body。
- [x] 用包含唯一 canary 的完整询盘和恶意供应商错误执行日志/分析/错误路径，断言 console、telemetry、响应和异常均不含任何 canary、PII 或 secret。

### 5.3 工作包：限流、重复提交与异常成本边界

目标：

- 在应用层提供有界防御，并把依赖真实 ESA/FC 配置的生产强度明确留在外部门禁。

实现任务清单：

- [x] 实现有容量上限和 TTL 清理的进程内滑动窗口：默认每个派生 client key 在 15 分钟内最多 5 次；原始地址只从 server-only 配置的可信 ESA header 读取，并以 HMAC 派生 key，不保存或记录原值。
- [x] 可信地址缺失时使用单一 fail-safe bucket，不回退信任任意客户端 header；生产 release validator 要求真实 ESA 覆盖/防伪证据，应用 limiter 只作为 defense-in-depth。
- [x] 用 `Idempotency-Key + client key` 建立有界 10 分钟去重窗口；重复提交返回相同通用成功语义且不再次调用 DirectMail，key 不进入日志。
- [x] 限流状态只保存在单 FC 进程内且不持久化 PII；跨实例强制限流、路径规则、并发/实例/费用上限仍由 ESA/FC 真实配置承担。
- [x] 配置值设安全上下界，禁止零/负数、无界窗口、无界 Map 或由浏览器公开变量覆盖。

测试要求：

- [x] 使用 fake clock 验证窗口边界、TTL、容量淘汰、未知 client fail-safe、重复 key、不同 client 隔离以及 DirectMail 最大调用次数。
- [x] 验证 429/`Retry-After`、duplicate 成功语义、无共享缓存和所有状态下无 PII 日志。

### 5.4 工作包：自动发布校验、恢复/回退与 Production 判定

目标：

- 用机器可读清单区分本地代码证据、真实生产证据和明确阻塞项，不等待人工确认也不伪造外部通过。

实现任务清单：

- [x] 新增无秘密的 `docs/5-Evidence/m2-05/gate-input.json`，分为 `localChecks` 与 `productionGates`：前者只允许 `LOCAL_PASS/LOCAL_FAIL/NOT_RUN/N/A`，后者只允许 `PASS/BLOCKED/N/A`；每项记录日期、验证命令或 HTTP(S) 请求、预期/实际结果、证据路径和敏感信息检查，production 项另需脱敏资源/地域，所有 `N/A` 必须有理由。
- [x] 新增 `pnpm validate:release`：校验两个集合的独立 schema、必填证据、重复/未知 gate、N/A 理由、遗留映射和 Production 逻辑；禁止 local/fake evidence 满足 production gate。默认验证清单完整性并允许明确 `BLOCKED`，`--require-production-live` 在任一强制 production gate 非 PASS 时必须非零退出。
- [x] 门禁至少覆盖同域询盘/DirectMail、PII 扫描、ESA WAF/限频/刷新、FC 5xx/延迟/并发/实例/回退、RDS 连接/容量/自动备份/恢复、OSS/DirectMail 失败告警、正式域名/ICP备案、政策/专业审查/案例授权、正式企业微信、大陆网络/微信内置浏览器和成本硬上限。
- [x] 将 `fc_previous_app_new_schema_compatibility` 设为独立强制 production gate，必须记录 previous app version、migration version、schema state、command/probe、expected/actual result 和 evidence path；仅有通用备份或回退说明不能满足该 gate。
- [x] 更新安全/媒体与 FC Runbook，写明 DirectMail、询盘日志字段、release validator、真实 HTTP(S) probe、恢复/回退兼容矩阵和自动判定顺序；示例不得包含 AccessKey、token、PII 或占位 PASS。
- [x] 当前无真实资源与成本输入时生成 `CODE_READY_WITH_EXTERNAL_LEGACY / Production BLOCKED` 结论；`--require-production-live` 的预期失败作为正确门禁证据，不冒充验证失败。

测试要求：

- [x] validator 测试覆盖完整 BLOCKED 清单、本地 PASS、`LOCAL_PASS + external BLOCKED`、缺字段、跨层状态、未知状态、无理由 N/A、伪造占位 PASS、缺成本、缺恢复/回退、兼容矩阵缺失/失败/占位和全 PASS fixture。
- [x] 静态扫描仓库与客户端 bundle，确认无真实凭据/PII、无通用 `webservice`、无 `products/sino-en/src` 依赖；真实云操作全部保留脱敏外部证据引用。

## 6. 验收标准

- 浏览器只提交到同域 `/api/inquiry`；服务端对请求大小、schema、honeypot、限流和去重 fail closed。
- 合法询盘最多触发一次 DirectMail HTTPS POST，不落库、不自动重试、不读取/回显供应商响应正文。
- 任何日志、分析、异常和响应都不包含姓名、城市、联系方式、需求、原始地址、Idempotency-Key 或秘密。
- DirectMail 失败、超时、配置错误和限频均保留企业微信降级；用户文案不承诺已签约或服务结果。
- `pnpm validate:release` 能自动区分本地通过、外部阻塞与 Production Live；缺少真实证据时 `--require-production-live` 必须阻断。
- ESA/FC/RDS/OSS/DirectMail、主体/域名/备案、正式企业微信、专业审查、恢复/回退和成本门禁全部有真实 PASS 证据后，才允许标记 Production Live。

## 7. 验证要求

项目声明的验证命令：

- `pnpm test`
- `pnpm lint`
- `pnpm build`
- `pnpm smoke:standalone`
- `pnpm validate:release`

专项验证：

- `/api/inquiry` 首次成功/duplicate/失败/超时/限频/超限/非法输入与 `no-store`。
- DirectMail 签名/HTTPS/timeout/no-retry、server-only 配置和客户端 bundle 秘密扫描。
- PII canary 扫描、数据库/migration 无 lead 存储、无通用 `webservice`。
- `pnpm validate:release -- --require-production-live` 在外部证据缺失时预期非零，并输出稳定 `Production BLOCKED`。
- `/contact` 在 320×568、390×844、768×1024、1024×768、1440×900 检查成功、失败、限频状态、企业微信降级、键盘操作、无横向溢出和 200% reflow。

证据分栏：

| 验证项 | 本 Sprint 允许状态 | Production 状态 |
| --- | --- | --- |
| 同域 route、校验、DirectMail fake、限流/去重、PII canary、validator、runbook | `localChecks=LOCAL_PASS` | 不得自动转换为 production `PASS` |
| 真实 ESA/FC/RDS/OSS/DirectMail、probe 身份/token、告警、WAF、恢复、回退、缓存 | 不得由本地标 PASS | `M2-LEGACY-01 / BLOCKED` |
| 真实报价、流量假设和预算硬上限 | 不得由示例标 PASS | `M2-LEGACY-02 / BLOCKED` |
| 主体/域名/ICP备案、政策/专业审查/案例授权、正式企业微信、大陆网络/微信浏览器 | 只生成结构化清单 | FR-08 gate 非 PASS 时 `BLOCKED` |

## 8. 实施顺序

1. 完成 GPT-5.5-only 文档 review-confirm，并应用接受/部分接受项。
2. 先写同域 route、服务端校验、DirectMail、PII telemetry、限流/去重失败测试。
3. 实现浏览器同域迁移与 server-only inquiry 模块。
4. 写 release validator 和证据清单失败测试，再实现自动 Production 判定。
5. 更新 Runbook，运行全量测试、构建、standalone smoke、静态扫描与 `/contact` 浏览器 QA。
6. 完成 GPT-5.5-only 代码 review-confirm、修复、最终验证和独立提交。
7. 以真实证据自动输出 Production Live 或 `CODE_READY_WITH_EXTERNAL_LEGACY / Production BLOCKED`；不等待人工确认。

## 9. 风险控制

- PII 泄露：严格输入 DTO、无正文日志、telemetry allowlist、canary 测试和 bundle/仓库扫描。
- DirectMail SSRF/签名泄露：生产 HTTPS endpoint 限制、form body POST、server-only secrets、禁止响应正文和请求参数日志。
- 重试造成重复通知：客户端锁、Idempotency-Key、服务端 TTL 去重和 provider 零自动重试。
- 进程内 limiter 被多实例绕过：明确 defense-in-depth；Production 依赖真实 ESA WAF/限频和 FC 实例边界证据。
- 单可用区数据库故障：自动备份、恢复演练和明确 RTO/RPO；未演练时停止 Production。
- 回退遇到 schema 不兼容：保持 expand-only migration，先验证 previous-app/new-schema 兼容矩阵。
- 外部审批或云配置被误报完成：validator 拒绝缺字段、占位值和本地 fake 证据，自动保持 `BLOCKED`。
- 异常流量产生无界费用：本地只验证配置上下界；真实 ESA/FC 规则、报价与预算硬上限未证实时保持阻断。

## 10. 交付结论

最终交付状态为 `CODE_READY_WITH_EXTERNAL_LEGACY`：

- GPT-5.5-only 文档审查、代码审查及两份 review-confirm 均已完成；未调用 GPT-5.3 Codex Spark。
- 代码审查的 1 High、2 Medium、1 Low 共四项意见全部接受、修复并验证；浏览器 QA 额外发现并修复二维码在 hydration 前失败时不降级的问题。
- `pnpm test`：40 个测试文件、178 个测试全部通过。
- `pnpm lint`、`pnpm build`、`pnpm smoke:standalone`、`git diff --check` 全部通过。
- `pnpm validate:release` 返回 `CODE_READY_WITH_EXTERNAL_LEGACY`；`pnpm validate:release -- --require-production-live` 因真实外部门禁未满足按预期非零退出。
- `/contact` standalone 浏览器 QA 覆盖真实同域成功、供应商失败、第五次以内成功、第六次限频、输入保留和企业微信/表单降级；二维码初始 404 的 hydration 降级已复验通过。
- M2-05 没有修改 CSS 或布局规则；320×568、390×844、768×1024、1024×768、1440×900 与 200% reflow 沿用 M2-04 已通过的五视口基线，本轮当前 standalone 视口再次确认无横向溢出。
- 仓库与客户端 bundle 扫描确认无 DirectMail/限流秘密、无通用 `webservice`、无 `products/sino-en/src` 依赖，migration 中无 lead/inquiry/CRM 表。

Production Live 继续为 `BLOCKED`：

- `M2-LEGACY-01`：缺少隔离 ESA/FC/RDS/OSS/DirectMail 资源、probe 身份/token。
- `M2-LEGACY-02`：缺少真实报价、流量假设和预算硬上限。
- 其余尚无真实 `PASS` 证据的 FR-08 正式域名/ICP备案、政策与专业审查、正式企业微信和大陆网络/微信浏览器门禁。
