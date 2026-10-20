# FR-10 单管理员认证、会话与审计

> **2026-10-20 规格覆盖：** 本文仅服务新闻/案例 CMS 的要求已撤销，原完成状态仅描述历史版本；非 CMS 安全与既有数据/媒体保护继续有效。 现行依据为 [FR-25](FR-25-static-news-and-cases.md)；M5-05 已完成静态代码与本地验证，真实内容迁移和 Production 证据仍待补齐。

- `FR-ID`: `FR-10`
- `标题`: 单管理员认证、会话与审计
- `所属阶段`: 阶段 5 - 阿里云全栈升级
- `开发顺序`: 10
- `优先级`: P0
- `前置依赖`: `FR-09`
- `涉及包`: `/admin`、`/api/admin/auth`、管理员/会话/审计数据表、安全配置与测试
- `是否属于原型阶段`: 否
- `来源类型`: 新需求
- `原始 SRS 章节`: 6.11、7.3、8、11.5
- `相关 FR`: `FR-11`、`FR-12`、`FR-14`

## 目标

为唯一预创建网站管理员提供可审计、抗暴力破解的服务端认证，使后续 CMS 操作具备明确身份边界。

## 背景与问题

网站不开放公众注册，但后台仍需要完整认证。隐藏路径、前端密码或长期 Token 都不能保护内容发布能力。

## 影响范围

- 登录、退出、Session 校验和受控密码重置。
- `admins`、`admin_sessions`、`audit_logs`。
- `/admin/*` 路由守卫、`/api/admin/*` 服务端鉴权、ESA 限频规则。

## 需求描述

1. 只允许一个通过受控脚本/运维流程预创建的超级管理员，不提供注册接口；bootstrap 必须使用数据库 advisory lock 和单管理员 schema 不变量，重复执行只能幂等返回既有管理员或安全失败。
2. 密码最少 14 个字符并使用 Argon2id 哈希；只保存 PHC encoded hash。Argon2id 参数由服务端集中配置，最低为 `memoryCost >= 19456 KiB`、`timeCost >= 2`、`parallelism = 1`、hash 32 bytes、随机 salt 至少 16 bytes，并限制最大值避免配置型资源耗尽。
3. 登录成功创建随机服务端 Session；Cookie 为 `HttpOnly; Secure; SameSite=Strict`，有效期最长 8 小时。
4. 15 分钟内连续失败 5 次后锁定 30 分钟；同一管理员的密码校验结果、失败计数、锁定写入和成功审计必须使用行锁事务或等价原子条件更新，并发请求不得漏记或绕过锁定。
5. 退出、密码重置、管理员禁用或安全事件必须撤销相关 Session。
6. 密码重置不提供公众页面；重置密码、撤销既有 Session 和成功审计必须在同一事务完成，任一步失败都保留旧密码和旧 Session 状态。管理员禁用状态必须持久化并在每次 Session 校验时拒绝。
7. 所有后台写操作携带管理员身份并产生审计事件。最小事件分类包含 `login_success`、`login_failed`、`login_locked`、`logout`、`session_revoked`、`password_reset`、`admin_disabled`、`html_sanitized`、`media_presigned`、`media_confirmed`；成功业务写入与成功审计同事务，失败安全事件使用独立的脱敏审计路径。
8. `/admin/*`、`/api/admin/*` 禁止共享缓存并受 ESA WAF/限频保护。
9. 所有 `/api/admin/*` 变更请求必须同时校验可信 `Origin`/`Host` 与 Session 绑定的 CSRF token；登录、退出、重置或 Session 撤销后旧 token 失效。
10. 不存在账号、密码错误和锁定账号必须返回相同 HTTP 状态与通用响应体；不存在账号仍执行固定 dummy Argon2id verify 或等价哈希工作量。内部审计可使用稳定的脱敏失败类别，但不得把账号存在性返回给客户端。

## 高层要求

- 不使用 `localStorage`、URL 参数或浏览器可读 Cookie 保存认证 Token。
- 不使用阿里云主账号/RAM AccessKey 作为 CMS 身份。
- 服务端每次受保护请求都验证 Session 状态和过期时间。
- Argon2id 只运行在 Node.js/FC 服务端，不进入 Edge Runtime 或客户端 bundle；实现应能识别旧 PHC 参数并在受控登录/重置流程中升级。
- Session ID 与 CSRF token 至少具有 256-bit 随机性，只以哈希形式进入数据库；客户端只通过 `HttpOnly` Session Cookie 和同源页面提供的 CSRF token 工作。
- 审计 metadata 采用显式 allowlist，不得包含密码、哈希、完整 Session ID、CSRF token、完整签名 URL、原始不存在用户名或其他秘密。

## 输入

- 预创建管理员用户名与受控密码输入。
- 登录凭据、Session Cookie、重置运维指令。

## 输出

- 登录/退出状态、受保护管理员页面和审计记录。
- 可撤销、可过期的服务端 Session。

## 失败与降级

- 凭据错误/锁定：返回通用失败提示，记录脱敏安全事件。
- 数据库或 Session 服务不可用：拒绝访问，不降级为匿名后台。
- bootstrap 检测到已有管理员或并发创建：幂等返回既有管理员标识或安全失败，不创建第二个管理员。
- 重置/禁用事务失败：回滚密码、禁用状态、Session 撤销和成功审计，不产生半提交状态；输出不含秘密的诊断。

## 不纳入范围

- 公众注册、OAuth、短信/邮件自助重置、多管理员角色和细粒度权限。
- 将 IP 白名单作为唯一认证方式。

## 最小验证方式

- 单元/集成测试覆盖 Argon2id 配置下限/上限、PHC verify/rehash、Session、过期、撤销、禁用、锁定和通用错误。
- 并发 5 次失败测试必须得到确定锁定状态且不漏记；不存在账号、错误密码和锁定账号验证相同外部状态/响应并执行等价哈希路径，不使用易抖动的严格毫秒等值作为唯一证据。
- 验证 Cookie 属性、CSRF 缺失/错误/跨站/合法同源、缓存头、未认证访问、bootstrap/reset 事务回滚和日志脱敏。
- 实施阶段运行 `pnpm test`、`pnpm lint`、`pnpm build`。

## 验收要点

- 唯一预创建管理员可登录并在 8 小时内维持安全 Session。
- 第 5 次连续失败在并发条件下也原子触发锁定，30 分钟后按规则恢复。
- 退出/重置会撤销 Session，后台 API 不接受过期或伪造 Cookie。
- 后台变更 API 拒绝缺失/错误 CSRF 与跨站 Origin，请求在 Session 撤销后无法复用旧 CSRF token。
- bootstrap 不会创建第二个管理员；重置、禁用、Session 撤销和成功审计不存在半提交。
- 认证与重置事件按 taxonomy 可审计且 metadata 不泄露秘密或账号存在性。

## 备注

二次验证与多管理员权限属于后续范围。
