# Sprint M2-02 文档 Review by GPT-5.5

## Review 范围

- `docs/1-Requirement/Mainland-Website-FR/FR-10-single-admin-authentication-session-and-audit.md`
- `docs/1-Requirement/Mainland-Website-FR/FR-11-private-oss-media-and-html-sanitization.md`
- `docs/3-Plan/sprint-m2-02.md`
- 一致性参考：`AGENTS.md`、`docs/2-Design/Alibaba-Cloud-Fullstack-Architecture-Spec.md`、`docs/3-Plan/Mainland-Website-Sprint-Index.md`
- M2-01 实现基线：commit `d53bec6`

## 总体结论

M2-02 的方向与产品边界基本一致：继续使用 `ESA -> Function Compute -> RDS MySQL + 私有 OSS`，未引入公众账号、多管理员、通用 `webservice` 抽象或真实云证据伪 PASS；Sprint 也正确把 `M2-LEGACY-01`、`M2-LEGACY-02` 作为允许本地工程继续、但阻断 Production Live 的外部证据缺口。

需要在 review-confirm 前补强若干安全验收细节，主要集中在认证原子性、枚举与时序泄露、CSRF、重置/引导生命周期、Argon2id 参数与运行时约束、审计语义、sanitizer 版本化与预览 CSP、OSS 上传确认的 TOCTOU/归属/幂等边界，以及本地模拟和真实云证据的标签隔离。

## Findings

| Severity | Type | Location | Issue | Evidence | Recommendation |
| --- | --- | --- | --- | --- | --- |
| High | Security | `FR-10` lines 34, 59-70; `sprint-m2-02` lines 56-63; M2-01 schema `migrations/001_core_schema.sql` lines 1-14 | 登录失败计数与锁定规则没有明确要求原子更新，可能在并发登录尝试下丢失失败次数或绕过第 5 次锁定。 | FR 只规定“15 分钟内连续失败 5 次后锁定 30 分钟”，Sprint 只要求覆盖锁定测试；基线 `admins` 表把 `failed_login_count`、`failed_login_window_started_at`、`locked_until` 放在单行，但文档没有要求事务、行锁、条件更新或并发测试。 | 在 FR-10/Sprint 增加验收：同一用户名的登录校验、失败计数、锁定写入和审计必须在单个事务或等价原子条件更新内完成；测试至少覆盖并发 5 次失败只产生一个确定锁定状态且不会漏记。 |
| High | Security | `FR-10` lines 34, 59; `sprint-m2-02` lines 56-63 | 账号枚举只覆盖错误文案，未覆盖不存在账号、锁定账号和密码错误之间的耗时、哈希工作量与审计差异。 | FR 要求“不因错误信息泄露账号是否存在”和“返回通用失败提示”，但没有要求不存在账号也执行等价 Argon2id dummy verify、统一响应码/耗时区间、统一审计分类脱敏；单管理员场景下用户名是否存在仍是敏感边界。 | 明确登录失败路径必须统一响应码、响应体和可观测行为；不存在账号应执行固定 dummy Argon2id 校验或等价工作量；锁定状态不得返回可枚举提示；测试覆盖 username 不存在、密码错误、锁定三类路径的输出和审计脱敏一致性。 |
| High | Security | `FR-10` lines 33, 37-38, 70-71; `sprint-m2-02` lines 56-63, 112-115 | Cookie 与服务端 Session 边界没有明确 CSRF 防护要求，后台写操作仅靠 `SameSite=Strict` 不足以定义完整验收。 | FR 规定 `HttpOnly; Secure; SameSite=Strict` Cookie 和“所有后台写操作携带管理员身份”，但未要求 CSRF token、Origin/Referer 校验或非简单请求约束；Sprint 专项验证列出 Cookie/锁定，但没有 CSRF。 | 增加 CSRF 验收：所有 `/api/admin/*` 写操作必须校验可信 Origin/Host，并使用服务端绑定的 CSRF token、双提交 token 或等价机制；测试覆盖缺失/错误 CSRF、跨站 Origin、同源合法请求和登出/重置后的 token 失效。 |
| Medium | Requirement | `FR-10` lines 31, 35-36, 49-61; `sprint-m2-02` lines 56-59 | 预创建、重置、禁用与安全事件的生命周期定义不足，容易在实现时出现重复管理员、重置失败半提交或禁用后仍可登录的边界空白。 | FR 要求“只允许一个预创建管理员”“密码重置不提供公众页面”“管理员禁用或安全事件必须撤销相关 Session”，但基线 `admins` 表没有 `disabled_at` 或重置状态字段，Sprint 也未定义 bootstrap 脚本的幂等条件、唯一管理员不变量、重置事务边界、禁用状态如何持久化。 | 在 Sprint 中补充 bootstrap/reset 接口契约：只能在无管理员或显式维护模式下创建；重复执行必须安全失败或幂等；重置密码、撤销 Session、写审计必须同事务完成；禁用状态需要持久化并纳入 Session 校验；重置失败保留旧哈希和旧 Session 撤销状态。 |
| Medium | Security | `FR-10` lines 32, 68-70; `sprint-m2-02` lines 56-58; M2-01 `package.json` dependencies | Argon2id 只定义算法名称和密码长度，未定义运行时、参数、hash 格式迁移或性能上限。 | M2-01 基线依赖中尚无 Argon2 库；FR/Sprint 未指定 `memoryCost`、`timeCost`、`parallelism`、salt 长度、hash encoded format、Node.js runtime 限制或 FC 冷启动/内存预算。 | 增加 Argon2id 配置要求：仅服务端 Node/FC 运行，不进入 Edge/客户端；参数集中配置并有最低门槛、性能预算和测试固定值；保存 PHC encoded hash 以支持参数升级；测试覆盖过短密码拒绝、hash verify、参数识别和错误脱敏。 |
| Medium | Correctness | `FR-10` lines 36-37, 45, 59-61; `sprint-m2-02` lines 59, 102 | 审计语义过宽，缺少事件分类、事务一致性、失败事件策略和敏感字段规则。 | FR 要求重置和后台写操作产生审计事件，且日志不得包含密码/哈希/完整 Session ID；M2-01 `audit_logs` 表有 `action`、`entity_type`、`entity_id`、`request_id`、`metadata_json`，但文档没有列出必须审计的动作、哪些失败也要记录、审计与业务写入是否同事务提交、metadata 允许字段。 | 定义最小审计 taxonomy：login_success/login_failed/login_locked/logout/session_revoked/password_reset/admin_disabled/html_sanitized/media_presigned/media_confirmed 等；业务写入和审计应同事务或有明确补偿；metadata 使用 allowlist，禁止密码、哈希、完整 Session ID、完整 OSS 签名 URL。 |
| Medium | Security | `FR-11` lines 31-34, 44, 70-82; `sprint-m2-02` lines 73-79, 121-123; M2-01 schema `content_items`/`content_revisions` | sanitizer allowlist 版本化只出现在 Sprint 风险控制，没有进入 FR 验收或数据契约，无法验证“规则升级后旧内容重新净化”。 | FR 要求每次发布都重新净化并备注 allowlist 应可测试配置维护；Sprint 风险提到 allowlist 版本化，但基线 `content_items`、`content_revisions` 只有 source/sanitized HTML，没有 sanitizer 版本、诊断摘要或重新净化标记。 | 把 sanitizer 配置版本纳入 FR-11/Sprint 验收：保存 sanitized 产物时记录 sanitizer policy/version；发布时用当前版本重净化；测试覆盖版本升级后旧 sanitized 不被直接沿用；诊断只保存脱敏摘要。 |
| Medium | Security | `FR-11` lines 31-34, 54, 76; `sprint-m2-02` lines 73-79 | sandbox 预览缺少 CSP、`srcdoc`/origin 和 sandbox token 约束，可能让“预览不能执行”停留在 sanitizer 单点防护。 | FR 只写“预览在 sandbox iframe 中显示净化结果，不允许提升权限”，Sprint 只要求 script/事件/iframe/form/SVG/危险 URL/CSS 不能执行；没有规定 `sandbox` token、预览响应 CSP、禁止 `allow-scripts`/`allow-same-origin` 组合、禁外联网络等。 | 明确预览必须使用最小权限 iframe：默认无 `allow-scripts`、无 `allow-same-origin`，或有严格解释的例外；预览响应/`srcdoc` 使用 restrictive CSP；测试覆盖 sanitizer 失误时脚本仍不能运行、表单提交/导航/外链加载受限。 |
| High | Security | `FR-11` lines 35-38, 42-45, 59-61, 70-79; `sprint-m2-02` lines 87-95 | OSS 上传确认缺少上传意图、对象归属、HEAD/校验和确认、单次使用和幂等语义，TOCTOU 与对象键复用风险没有被验收覆盖。 | FR 要求 presign 限定对象键/MIME/大小，浏览器直传后服务端“确认对象后记录大小、MIME、对象键、操作者和时间”；M2-01 `media_assets` 有 `object_key` 唯一和 `checksum_sha256`，但 FR/Sprint 未要求服务端在确认时通过直接 HTTPS HEAD/metadata 校验 Content-Length、Content-Type/checksum，也未要求 presign intent 表、actor 归属、过期/单次确认、重复确认幂等。 | 增加媒体上传状态机：presign 创建短期 upload intent，绑定 admin、object_key、MIME、max size、nonce/expiry；confirm 必须用直接 HTTPS 查询 OSS 对象元数据并匹配 intent；成功后 intent 标记 consumed，重复 confirm 返回同一结果或安全失败；测试覆盖篡改 key、复用他人 intent、过期 intent、大小/MIME/checksum 不匹配。 |
| Medium | Consistency | `FR-11` lines 38, 61, 79; `sprint-m2-02` lines 21-23, 91, 101, 114-115; architecture lines 160, 177 | Sprint 已正确声明真实 OSS/ESA 证据 deferred，但实现任务“配置 ESA 资产分发”和 FR 验收“公开媒体只通过 ESA 分发”容易被实现者用本地占位误标为真实通过。 | 架构明确真实云缺口在 `M2-LEGACY-01`，Sprint 第 2 节和第 7 节也要求不得伪造 PASS；但工作包仍写“配置 ESA 资产分发”，FR 验收也使用绝对语气，没有区分本地 assets 契约 PASS 与真实 ESA PASS。 | 在 Sprint 验收中把结果分栏：`LOCAL_PASS` 只代表客户端 URL 构造、禁止 OSS 公共读配置占位、无长期凭据扫描和本地 assets contract；真实 Bucket 私有性、ESA 回源/分发、签名过期越权和 WAF/限频只能记录 `M2-LEGACY-01 / DEFERRED`，不得作为 M2-02 本地 PASS。 |
| Low | Test | `FR-11` lines 35, 70-71; `sprint-m2-02` lines 89, 95 | 媒体类型验收偏向声明 MIME，缺少文件内容魔数与 polyglot/扩展名欺骗测试。 | FR 要求 JPEG/PNG/WebP 与伪造 MIME 测试，但没有明确服务端确认时检查真实文件头或拒绝 HTML/SVG/polyglot 伪装；FR 同时要求不信任扩展名。 | 增加文件签名/内容嗅探测试：`Content-Type` 合法但文件头为 HTML/SVG/JS 应失败；扩展名合法但 MIME/魔数不一致应失败；允许类型需要匹配 MIME、魔数和大小。 |

## 额外一致性检查

- 与 `AGENTS.md` 一致：目标架构仍为 ESA、FC、RDS MySQL、私有 OSS；未引入公众注册、支付、CRM、微信 API；第三方集成要求直接 HTTP(S)，未出现通用 `webservice` 抽象。
- 与架构规格一致：M2-02 继续承认 `M2-LEGACY-01` 和 `M2-LEGACY-02` 只允许本地工程继续，不允许标记 Production Live。
- 与 Sprint Index 一致：M2-02 位于 M2-01 之后、M2-03 之前；Sprint 当前仍是文档门禁阶段，未要求并行实施后续 Sprint。
- 与 M2-01 baseline 一致：`admins`、`admin_sessions`、`media_assets`、`audit_logs` 已有基础表，但 M2-02 需要通过后续迁移或代码契约补齐禁用状态、sanitizer 版本、upload intent/确认状态等安全语义。
