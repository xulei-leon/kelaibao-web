# Sprint M2-02 管理员认证、媒体与 HTML 安全

> **状态：** `CODE_READY_WITH_EXTERNAL_LEGACY`；M2-01 已以提交 `d53bec6` 完成全部本地门禁；M2-02 文档 review-confirm、实现、GPT-5.5-only 代码 review-confirm 和本地验证均已完成。`M2-LEGACY-01`、`M2-LEGACY-02` 仍使 Production Live 保持 `BLOCKED`。

## 1. Sprint 目标

实现 [FR-10](../1-Requirement/Mainland-Website-FR/FR-10-single-admin-authentication-session-and-audit.md) 与 [FR-11](../1-Requirement/Mainland-Website-FR/FR-11-private-oss-media-and-html-sanitization.md)，提供安全的后台身份、富文本净化和私有媒体链路。

核心目标：

- 单管理员登录、Session、锁定、重置和审计可用。
- 原始 HTML 不可直接发布，图片通过短期授权进入私有 OSS。

## 2. 前置依赖

- `sprint-m2-01` 已完成文档/代码 review-confirm、完整本地验证和独立提交。
- FR-10、FR-11 与本 Sprint 完成文档 review-confirm。

协同说明：

- 本 Sprint 只建立安全基础，不交付新闻/案例完整 CRUD。
- `M2-LEGACY-01` 覆盖真实 OSS Bucket 私有性、真实短期授权、ESA assets 分发、云端限频/WAF 和同域 Cookie 链路证据；本 Sprint 必须完成可本地验证的鉴权、签名边界、对象键/MIME/大小校验与直接 HTTPS 客户端契约，但不得把模拟器或占位配置写成真实云 PASS。
- `M2-LEGACY-02` 的报价、流量和预算缺口继续保持 `DEFERRED`，不影响本地安全工程实施。

## 3. 纳入范围

本 Sprint 纳入以下 FR：

- `FR-10` 单管理员认证、会话与审计。
- `FR-11` 私有 OSS 媒体与 HTML 安全净化。

涉及包和目录：

- `/admin/login`、`/api/admin/auth/login|logout|session`、认证 Route Handlers 与服务端路由守卫。
- `src/server/auth/`、`src/server/audit/`、管理员/Session/CSRF/审计数据访问，以及受控 bootstrap/reset 脚本。
- `src/server/security/html/`、sandbox 预览组件、`/api/admin/media/presign|confirm` 与独立 OSS 直接 HTTPS provider。
- expand-only migration：单管理员/禁用状态、Session CSRF hash、sanitizer policy version、`media_upload_intents` 状态机。

## 4. 暂不纳入范围

- 多管理员、MFA、内容发布状态机、通用媒体库和非图片文件。

原因：

- 保持单人创业阶段的最小必要安全范围。

## 5. 工作范围

### 5.1 工作包：认证与会话

目标：

- 以 TDD 实现认证策略。

实现任务清单：

- [x] 先写密码、Session、Cookie、CSRF、并发锁定、退出、禁用、bootstrap 与重置事务失败测试。
- [x] 用 expand-only migration 增加单管理员 schema 不变量、`disabled_at`、Session CSRF hash 等字段；bootstrap 通过 MySQL advisory lock 保证并发下最多一个管理员。
- [x] 实现只在 Node.js/FC 服务端运行的 Argon2id；集中校验 `memoryCost >= 19456 KiB`、`timeCost >= 2`、`parallelism = 1`、32-byte hash、至少 16-byte salt 与安全上限，保存 PHC encoded hash，并在成功登录事务内升级旧 PHC 参数。
- [x] 不存在账号执行固定 dummy Argon2id verify；不存在账号、密码错误和锁定账号对外使用相同状态/响应体，内部只记录稳定、脱敏的失败类别。
- [x] 实现 8 小时 Session、256-bit 随机 Session、256-bit Session 绑定 CSRF 输出、`HttpOnly; Secure; SameSite=Strict` Cookie、固定到 canonical public origin 的 Origin/Host 校验和页面/API 双重服务端守卫。
- [x] 使用行锁事务或等价原子更新实现 5/15/30 锁定；并发失败不得漏记或产生不确定锁定状态。
- [x] 实现受控 reset/disable：密码或禁用状态、Session 撤销和成功审计同事务，失败整体回滚；无公众重置页面。
- [x] 建立审计 taxonomy 和 metadata allowlist；成功业务写入同事务审计，失败安全事件走独立脱敏路径。

测试要求：

- [x] 未认证、伪造、过期、撤销、禁用、锁定和重置场景全部覆盖。
- [x] 并发 5 次失败得到唯一确定锁定状态；三类登录失败外部输出和哈希工作量路径一致，不以严格毫秒相等作为唯一断言。
- [x] 缺失/错误 CSRF、跨站 Origin、合法同源、直连 FC/internal host、多标签页稳定 token、退出/重置后 token 失效全部覆盖。
- [x] Argon2 PHC verify/rehash/登录内升级、配置上下限、错误脱敏和客户端 bundle 不含认证秘密全部覆盖；真实 FC 内存/冷启动调优记为 `M2-LEGACY-01 / DEFERRED`。

### 5.2 工作包：HTML 净化与预览

目标：

- 阻止存储型 XSS。

实现任务清单：

- [x] 建立攻击语料与 allowlist 失败测试。
- [x] 用 expand-only migration 记录 sanitizer policy/version；实现服务端 source/sanitized 分离、当前 policy 的保存/预览/发布重净化和脱敏诊断摘要。
- [x] 实现最小权限 sandbox 预览：不允许 `allow-scripts`/`allow-same-origin`，使用 restrictive CSP 并禁止表单、顶层导航和非 allowlist 外联。

测试要求：

- [x] script、事件、iframe、form、SVG、危险 URL/CSS 均不能执行；policy 升级后旧 sanitized 不得直接复用。
- [x] 即使 sanitizer 漏拦测试 payload，sandbox/CSP 仍阻止脚本、表单、导航和外联能力。

### 5.3 工作包：私有 OSS 上传

目标：

- 安全上传受限图片。

实现任务清单：

- [x] 先写 MIME/魔数/SHA-256、10 MB 边界、对象键、intent 归属/过期/消费/幂等、CSRF、对象替换与 provider 失败测试。
- [x] 用 expand-only、可重入 migration 建立 `media_upload_intents`，绑定管理员、服务端对象键、MIME、最大大小、nonce、expiry、consumed/asset 结果与有期限的 confirmation claim。
- [x] 实现鉴权 + CSRF 后的短期单次预签名；授权生成并通过边界校验后才在同一事务落 intent 与成功审计，客户端只获得限定 method/key/MIME/size/checksum/expiry 的上传参数，不获得长期 AccessKey。
- [x] 实现独立 OSS 直接 HTTPS provider；confirm 在数据库租约内读取对象，在 10 MB 上限内验证 MIME、JPEG/PNG/WebP 魔数、大小和 SHA-256，以源 ETag 条件复制并复验目标后原子消费 intent、写入媒体记录和审计；staging cleanup 失败只记录 deferred audit，不回滚已确认资产。
- [x] 版本化本地 ESA assets URL/私有源站配置契约；真实 Bucket 私有性和 ESA 回源/分发仍为 `M2-LEGACY-01 / DEFERRED`。

测试要求：

- [x] 非 JPEG/PNG/WebP、HTML/SVG/JS/polyglot 伪装、扩展名/MIME/魔数不一致、超过 10 MB、未认证、缺失 CSRF、篡改/越权/过期 intent 和对象替换均失败。
- [x] 合法重复 confirm 幂等返回同一媒体结果，并发确认只允许租约持有者执行副作用；本地 fixture 只标记 `LOCAL_PASS`，不得作为真实 OSS/ESA 证据。

## 6. 验收标准

- 管理员身份策略完全符合 FR-10。
- 已知 XSS 载荷不能在预览或公开渲染执行。
- 原子锁定、统一外部失败、CSRF、禁用/reset 回滚和 Session 撤销契约通过。
- 当前 sanitizer policy/version、最小 sandbox/CSP 与重新净化契约通过。
- upload intent、对象确认、魔数/SHA-256、单次/幂等与对象归属契约通过。
- 本地配置和客户端契约禁止 OSS 公共读与长期云凭据并标记 `LOCAL_PASS`；真实 Bucket/ESA 证据继续归入 `M2-LEGACY-01 / DEFERRED`。
- 认证、重置、净化和媒体操作均按 taxonomy 产生 metadata allowlist 的脱敏审计/诊断。

## 7. 验证要求

项目声明的验证命令：

- `pnpm test`
- `pnpm lint`
- `pnpm build`

专项验证：

- 并发锁定、失败枚举、Cookie/CSRF、reset/disable 事务测试。
- XSS/policy 升级语料、sandbox/CSP、OSS intent/预签名/confirm、魔数/SHA-256 和本地 assets 访问契约。
- 客户端 bundle 扫描密码/hash、Session/CSRF、OSS AccessKey、完整签名 URL 和数据库秘密。
- 真实 ESA assets 访问、真实 OSS 签名过期/越权、WAF/限频和同域 Cookie 链路必须记录 `M2-LEGACY-01 / DEFERRED`，不得伪造 PASS。

## 8. 实施顺序

1. 写 migration/认证失败/并发/CSRF 测试，再实现 schema 与认证基础。
2. 写 sanitizer policy/攻击测试，再实现净化与版本记录。
3. 写 sandbox/CSP 测试，再实现最小权限预览。
4. 写 upload intent/内容确认/provider 测试，再实现 OSS 直接 HTTPS 边界。
5. 端到端本地安全路径、审计 taxonomy、客户端秘密扫描和 `LOCAL_PASS`/`DEFERRED` 分栏验证。
6. 代码 review-confirm、全量验证和独立提交。

## 9. 风险控制

- 认证绕过：页面守卫和 API 鉴权双重测试。
- 并发计数/重置半提交：单管理员行锁、事务和回滚测试。
- 账号枚举与 CSRF：等价哈希路径、统一外部失败、Origin/Host 与 Session 绑定 token 双重验证。
- sanitizer 配置过宽：默认拒绝，allowlist 版本化并用攻击语料回归。
- 预览二次防线失效：sandbox token 与 CSP 作为 sanitizer 之外的独立契约。
- OSS TOCTOU/凭据泄露：短期单次 intent、确认时直接 HTTPS 内容校验、原子消费并扫描客户端 bundle。
- 外部云证据被模拟结果替代：本地与真实云结果分栏记录，所有真实 OSS/ESA/WAF/Cookie 链路继续引用 `M2-LEGACY-01` 并在 M2-05 Production 判定前收口。

## 10. 交付结论

### 10.1 Review 门禁

- 文档审查：`docs/4-Reviews/sprint-m2-02-review-by-gpt-5.5.md`
- 文档确认：`docs/4-Reviews/sprint-m2-02-review-confirm.md`，状态 `ACCEPTED_AFTER_CHANGES`
- 代码审查：`docs/4-Reviews/sprint-m2-02-code-review-by-gpt-5.5.md`
- 代码确认：`docs/4-Reviews/sprint-m2-02-code-review-confirm.md`，7 条 `Accept` 已全部应用
- 用户明确覆盖：跳过 GPT-5.3 Codex Spark，不创建或伪造其报告

### 10.2 本地验证（2026-07-30）

- `pnpm test`：`20` 个测试文件，`85/85` PASS
- `pnpm lint`：`tsc --noEmit` PASS
- `pnpm build`：Next.js production build 与 standalone packaging PASS
- `pnpm smoke:standalone`：SSR、Route Handler、runtime env 与公开页面 smoke PASS
- 客户端 bundle 秘密标识扫描：`DATABASE_URL`、MySQL budget、管理员密码/dummy hash/CSRF secret、OSS STS AccessKey/security token 均未出现
- `src/`、`scripts/`、`migrations/` 通用 `webservice` 扫描：PASS
- `/admin/login` 320px、390px、768px、1440px：此前本 Sprint 浏览器复验均无横向溢出；代码审查修复未改动 UI

### 10.3 最终状态

- 本地代码状态：`CODE_READY_WITH_EXTERNAL_LEGACY`
- 本地 fake/fixture：仅 `LOCAL_PASS`
- `M2-LEGACY-01`：缺少隔离 ESA/FC/RDS/OSS/DirectMail 资源、probe 身份/token，真实 OSS/ESA/WAF/限频/同域 Cookie/FC Argon2 证据保持 `DEFERRED`
- `M2-LEGACY-02`：缺少真实报价、流量假设和预算硬上限，保持 `DEFERRED`
- Production Live：`BLOCKED`
