# 管理员安全与私有媒体 Runbook

## 状态边界

- M2-02 本地认证、净化、upload intent、直接 HTTPS provider 和客户端秘密扫描：`LOCAL_PASS` 候选。
- 真实 OSS Bucket 私有性、真实 STS 签名过期/越权、ESA assets 回源、WAF/限频和同域 Cookie：`M2-LEGACY-01 / DEFERRED`。
- 真实规格、报价、流量和预算硬上限：`M2-LEGACY-02 / DEFERRED`。
- 本文命令和示例不得被用作 Production Live 证据。
- M4-01 SQLite 只用于 Node 22.13+ 本地集成测试，相关登录、CMS、媒体 metadata 和 purge fake 结果只能记为 `LOCAL_PASS`；FC/Production、RDS、OSS、ESA、WAF、恢复和成本证据仍必须来自真实隔离资源。

## 本地 SQLite 测试边界

- `DATABASE_ADAPTER=sqlite` 必须同时配置 `DATABASE_RUNTIME_SCOPE=local-test`、非 Production 的 `SINO_RUNTIME_MODE` 和项目 `.local-data/*.sqlite` 路径。
- SQLite 与 `DATABASE_URL`、显式 MySQL pool/budget 配置互斥；配置冲突立即失败，不做自动 fallback。
- 使用 `pnpm db:sqlite:migrate` 建立独立测试 schema，使用同一个 `pnpm admin:bootstrap|reset-password|disable` 维护单管理员。
- `pnpm db:sqlite:reset` 只删除解析后仍位于 `.local-data` 的精确数据库和同 basename `-wal/-shm/-journal`；不得对工作区、用户目录、目录目标或链接越界执行递归删除。
- SQLite 使用现有 Argon2id、CSRF、Session、内容状态机和审计规则；local purge provider 不访问网络，也不能关闭 Production ESA gate。

## Release 顺序

1. 执行 `pnpm test && pnpm lint && pnpm build`。
2. 在 release job 中执行 `pnpm db:migrate`，应用 `002_security_foundation.sql`。Migration runner 会在每个 expand-only DDL 前查询 `INFORMATION_SCHEMA`；MySQL 在某个 DDL 后隐式提交但版本尚未记录时，重跑会跳过已存在的列、索引或约束并继续剩余步骤。
3. 生成不存在账号使用的 dummy Argon2id PHC hash：

   ```bash
   pnpm admin:dummy-hash
   ```

   将输出写入受控运行时秘密 `ADMIN_DUMMY_PASSWORD_HASH`，不得写入 Git 或客户端变量。

4. 只在受控终端临时注入 `DATABASE_URL`、`ADMIN_USERNAME`、`ADMIN_PASSWORD` 和稳定的 `ADMIN_OPERATION_REASON_CODE`，执行：

   ```bash
   pnpm admin:bootstrap
   ```

   脚本使用 MySQL advisory lock、管理员 singleton 约束和事务；重复运行只能幂等返回或安全失败。

5. 配置 Node.js/FC 服务端 Argon2id 参数、数据库、至少 32-byte 随机值的 base64url `ADMIN_CSRF_SECRET`、临时 OSS STS 凭据和独立 ESA assets origin。除既有 canonical `NEXT_PUBLIC_SITE_URL` 外，秘密和云凭据变量不得使用 `NEXT_PUBLIC_` 前缀。

## 受控密码与禁用操作

密码重置：

```bash
pnpm admin:reset-password
```

禁用管理员：

```bash
pnpm admin:disable
```

两个动作都必须在同一事务更新管理员状态、撤销 Session 并写入成功审计；失败整体回滚。命令不接受 URL 参数，不输出密码、PHC hash、Session、CSRF 或数据库 URL。

## 认证与 CSRF

- 登录失败统一返回通用响应；不存在账号执行 `ADMIN_DUMMY_PASSWORD_HASH` verify。
- 第 5 次失败的计数、锁定和审计在管理员行锁事务中完成。
- Session token 使用 256-bit 随机值；CSRF token 使用 `ADMIN_CSRF_SECRET` 对随机 Session token 做 HMAC-SHA-256 派生，输出 256 bit 且数据库只存其 SHA-256。相同 Session 的多个标签页得到同一 token，不会因读取 Session 互相失效。
- Cookie 固定 `HttpOnly; Secure; SameSite=Strict; Path=/`，最长 8 小时。
- 所有 `/api/admin/*` 变更请求同时校验 Session、固定到 canonical `NEXT_PUBLIC_SITE_URL` 的 `Origin`/`Host` 与 `X-CSRF-Token`；直连 FC/internal host 即使请求字段彼此一致也必须拒绝。
- `/api/admin/auth/session` 从 HttpOnly Session Cookie 稳定派生并核对 CSRF 绑定，不覆盖数据库 hash；退出、重置、禁用或撤销后 Session 与旧 CSRF token 一并失效。
- 成功登录若发现 PHC 参数低于当前 Argon2id policy，会在 Session、计数复位和成功审计的同一事务内升级 `password_hash`。

## HTML 净化与预览

- `SANITIZER_POLICY_VERSION` 与 sanitized 产物一起保存；旧 policy 结果不能直接发布。
- source 只用于重新编辑和重净化，公开渲染只读取 sanitized HTML。
- allowlist 禁止脚本、事件、iframe、form、SVG、style、危险 scheme、data image 和非 ESA assets 图片。
- iframe 预览没有 `allow-scripts`、`allow-same-origin` 或其他提升 token，并带 restrictive CSP。
- 诊断只记录 policy、是否改变和稳定代码计数，不记录原始攻击 payload。

## 私有 OSS 流程

```text
authenticated admin + CSRF
  -> POST /api/admin/media/presign
  -> DB upload intent + short-lived STS signed PUT
  -> browser HTTPS PUT to pending/<admin>/<intent>
  -> POST /api/admin/media/confirm
  -> DB row-lock confirmation lease
  -> server direct HTTPS GET (<= 10 MB) + source ETag
  -> MIME + magic + SHA-256
  -> ETag-conditional immutable media/<admin>/<intent>-<hash> copy
  -> promoted target GET + MIME/magic/SHA-256 revalidation
  -> atomic media_assets + consumed intent + audit
  -> best-effort pending object cleanup; failure records media_cleanup_deferred
  -> ESA assets URL
```

- 浏览器不获得长期 AccessKey secret；签名 URL、security token 和 nonce 不进入日志。
- confirm 拒绝过期、他人、已篡改或内容不一致的 intent；并发 confirm 只有租约持有者能执行 OSS 副作用，合法重复 confirm 返回同一媒体结果或安全的 in-progress 失败。
- immutable copy 成功后的 staging DELETE 失败不得回滚 `media_assets`；该失败以稳定 reason code 独立审计，待受控维护重试。
- provider 使用明确的 OSS HTTPS GET/PUT/DELETE 边界，不存在通用 `webservice`。

## 本地验证

- `pnpm test`
- `pnpm lint`
- `pnpm build`
- `pnpm smoke:standalone`
- 客户端 bundle 扫描 `DATABASE_URL`、管理员秘密变量和 OSS STS 变量。
- 320px、390px、768px、1440px 检查 `/admin/login`；未认证 `/admin` 必须重定向登录。

真实 Bucket/ESA/WAF/Cookie 检查没有隔离资源，必须保持 `M2-LEGACY-01 / DEFERRED`，不得用本地 fake、示例 JSON 或构建成功代替。

## M2-03 内容发布与 ESA purge outbox

1. 在 release job 中执行 `pnpm db:migrate`，应用
   `003_content_publication.sql`；内容 item、immutable revision、pointer、成功审计和
   purge job 必须由同一事务提交。
2. 服务端注入 `ESA_PURGE_ENDPOINT`、`ESA_SITE_ID`、临时最小权限
   `ESA_ACCESS_KEY_ID`、`ESA_ACCESS_KEY_SECRET`、`ESA_SECURITY_TOKEN`，以及至少
   32 字符的 `PURGE_WORKER_TOKEN`。这些变量禁止使用 `NEXT_PUBLIC_` 前缀。
3. FC 定时触发器通过 canonical HTTPS origin 调用
   `POST /api/internal/cache-purge`，携带
   `Authorization: Bearer <PURGE_WORKER_TOKEN>`。每次最多处理 10 个 ready job；
   每个 ESA 请求超时 5 秒，最多尝试 3 次，前两次失败后退避 5/15 秒。
4. 发布请求只在数据库 commit 后尝试外部 purge。ESA 失败不回滚内容，job
   保持 `retry|failed` 并写稳定 error code 和脱敏审计；不得保存完整
   Authorization 或供应商响应正文。
5. 刷新 URL 固定为类型列表、当前详情、`sitemap.xml`、`feed.xml` 和
   `llms.txt`，不允许 wildcard。真实身份、定时触发器和 ≤60 秒证据仍为
   `M2-LEGACY-01 / DEFERRED`，Production Live 保持 `BLOCKED`。

## M2-05 同域询盘与 DirectMail

请求边界：

```text
browser
  -> POST /api/inquiry
  -> 16 KiB raw-body cap + exact JSON DTO + privacy validation
  -> trusted ESA client header -> HMAC client key
  -> bounded per-process rate window + Idempotency-Key dedupe
  -> DirectMail RPC HTTPS form POST
  -> approved company inbox
```

- JSON body 只能是 `MainlandLeadRequest`；隐藏 `company` 字段只进入最大
  200 字符的 `X-Inquiry-Honeypot` header，不写入 JSON、邮件、日志或分析。
  服务端在 JSON 解析前检查该 header，命中时返回通用成功语义但不调用
  DirectMail。
- 浏览器固定请求同域 `/api/inquiry`，使用 `credentials=same-origin`、有限
  超时和每次用户动作唯一的 `Idempotency-Key`。不得恢复
  `NEXT_PUBLIC_CONTACT_FORM_ENDPOINT` 或让浏览器持有 DirectMail 配置。
- 服务端配置 `INQUIRY_CLIENT_IP_HEADER`，只读取 ESA 已证明会覆盖且防伪的
  header；缺失或非法地址进入单一 fail-safe bucket，不回退信任任意
  `X-Forwarded-For`。原始地址只在内存中用于 HMAC 派生，不保存、不记录。
- 应用 limiter 默认每个派生 key 15 分钟 5 次，dedupe TTL 为 10 分钟，Map
  有固定容量和过期清理。它只提供单 FC 进程 defense-in-depth；跨实例强制
  规则必须由真实 ESA WAF/限频证据满足。

DirectMail server-only 配置：

```text
DIRECTMAIL_ENDPOINT=https://dm.aliyuncs.com/
DIRECTMAIL_ACCESS_KEY_ID=<controlled secret>
DIRECTMAIL_ACCESS_KEY_SECRET=<controlled secret>
DIRECTMAIL_ACCOUNT_NAME=<approved sender>
DIRECTMAIL_FROM_ALIAS=<approved alias>
DIRECTMAIL_TO_ADDRESS=<approved company inbox>
DIRECTMAIL_TIMEOUT_MS=5000

INQUIRY_CLIENT_IP_HEADER=<ESA-overwritten header>
INQUIRY_RATE_KEY_SECRET=<at least 32 random characters>
INQUIRY_RATE_LIMIT_MAX=5
INQUIRY_RATE_LIMIT_WINDOW_MS=900000
INQUIRY_DEDUPE_TTL_MS=600000
INQUIRY_GUARD_MAX_ENTRIES=1000
```

- 所有值由 FC 运行时受控秘密/配置注入，不在 build 阶段注入，不得使用
  `NEXT_PUBLIC_` 前缀。
- DirectMail 使用 Node 标准库生成 RPC HMAC-SHA1 签名并直接执行
  `application/x-www-form-urlencoded` HTTPS `POST`；不引入阿里云 SDK 或
  通用 `webservice`。
- 通知只使用纯文本正文。单次调用最多 5 秒、零自动重试；应用不得读取、
  回显或记录供应商响应正文。
- inquiry telemetry 只允许 server-generated request ID、固定 route、
  outcome、duration bucket 和 stable reason。禁止原始地址、
  Idempotency-Key、姓名、城市、联系方式、需求、邮件正文、Authorization、
  签名、AccessKey 和供应商响应。

本地验证：

```bash
pnpm test -- tests/m2-inquiry-api.test.ts tests/m2-inquiry-guard.test.ts \
  tests/m2-directmail.test.ts tests/submit-inquiry.test.ts \
  tests/inquiry-form.test.tsx
```

本地 fake 只验证请求签名、超时、零重试、限流/去重和 PII canary，不发送真实
邮件。真实 DirectMail 发信、ESA header 防伪/WAF/限频、FC 告警与实例边界均为
`M2-LEGACY-01 / BLOCKED`，不得由上述测试标记 Production PASS。

## M5-04 浏览器图片上传与读取

- 浏览器从同域 presign 获取短期 PUT 授权，经 HTTPS 直接 PUT 私有 OSS，再同域 confirm；只有确认后的公开 assets URL 可以绑定正文/封面。临时签名、上传 intent 只留内存。
- OSS CORS 仅允许正式后台的精确 HTTPS origin，允许 PUT/OPTIONS 和授权实际需要的 Content-Type、x-oss-* headers；浏览器 PUT 使用 credentials=omit。按部署环境核对预检，不能以本地 fixture 代替真实 CORS。
- Session/presign 15 秒，PUT 60 秒，confirm 30 秒。confirm 最多自动尝试三次，普通退避 1/2 秒；处理中遵循 Retry-After（等待上限 30 秒）。达到次数后保留 intent，支持手动重试，不把两分钟认领租约中的“处理中”误判为文件无效。
- 预签名依赖服务端 STS 配置；运行环境必须在到期前轮换凭据。当前实现不自动续期 STS，不向浏览器下发长期凭据。过期或配置缺失以结构化失败返回，不回显供应商响应。
- `GET /api/admin/media/[id]` 要求有效 Session，返回 private,no-store 的 id/publicUrl/mimeType/byteSize/width/height/publicUsageConfirmedAt。仅读取已确认记录及 assets origin，不依赖 STS，不返回对象存储 key、checksum、创建人或上传意图。
- 封面授权仍是显式服务端操作；上传成功不等于授权。已有草稿与公开 revision 分离，图片绑定随文章版本保存/发布。
- 支持 Navigation API 的浏览器可编辑，并在同文档后退/前进前确认离开。不支持的旧引擎只读，避免依赖无法可靠阻断 App Router 的 popstate 补偿。
- 本次无 schema 变更；SQLite 运行时/管理员初始化的版本检查对齐既有迁移版本 2。测试使用真实迁移流程，生产仍为 MySQL。


## 2026-10-07 新闻删除

- 新闻列表的删除需标题确认、当前 Session/CSRF 和 expectedVersion；仅 news 可删除。
- 删除在原事务中写 deleted_at、version、修订、content_deleted 审计与曾发布内容的 offline purge job。记录、图片、slug 和旧 outbox 保留，后台不支持恢复。
- 删除后后台读取/变更排除该项，公开草稿 404、曾发布内容 410，公开列表和发现文件排除。ESA 失败保持 outbox 重试，不回滚已提交删除。
- MySQL 上线前显式应用 005 migration；SQLite 通过既有迁移命令升级 schema 1/2 到 3，runtime/bootstrap 同步版本检查。迁移不能自动在请求中执行。
- 本机升级前保存 SQLite 一致性备份；浏览器验证只创建并删除本次测试文章，用户已有文章保留。真实 MySQL/ESA 删除发布链路仍需外部验收。

## 2026-10-07 HTML 编辑入口

新建和编辑新闻/案例仅提供“HTML 正文”textarea，不再提供可视化或格式工具栏。加载旧文稿保持原 HTML 字符串；输入不会在编辑页执行。图片上传确认后追加转义后的 img 标签，封面上传/授权流程继续保留。安全预览使用服务端 sanitizer 与 sandbox；保存和发布的服务端校验、Session/CSRF 与版本冲突规则不变。
