# Sprint M2-01 FC Next.js 与 MySQL 基础

> **状态：** `CODE_READY_WITH_EXTERNAL_LEGACY`；文档与代码 review-confirm 已完成，本地实现和验证通过。M2-00 真实云门禁仍为 `BLOCKED`，`M2-LEGACY-01`、`M2-LEGACY-02` 保持 `DEFERRED`，不得据此标记 Production Live。

## 1. Sprint 目标

完成 [FR-09](../1-Requirement/Mainland-Website-FR/FR-09-alibaba-cloud-fullstack-runtime-and-infrastructure-gate.md)，把 M1 静态工程升级为 FC 可运行的全栈 Next.js 基础，并建立 RDS 数据层、迁移、部署和回退。

核心目标：

- 移除静态导出限制，保持现有公开页面行为。
- 建立服务端配置、数据库连接、核心表迁移和 FC/ESA 部署基线。

## 2. 前置依赖

- `sprint-m2-00` 已完成文档/代码 review-confirm，并以 `CONDITIONALLY_ACCEPTED` 记录显式开发顺序覆盖。
- FR-09 与本 Sprint 完成文档 review-confirm。

协同说明：

- 目标交付形态固定为 Next.js `standalone` 候选制品；在真实 FC 验证完成前只称为工程基线，不称为已验证生产形态。
- `M2-LEGACY-01` 覆盖真实 FC/ESA 发布、VPC/RDS、告警和回退演练；`M2-LEGACY-02` 覆盖成本规格锁定。两项均在 M2-05 Production 判定前重新收口。

## 3. 纳入范围

本 Sprint 纳入以下 FR：

- `FR-09` 阿里云全栈运行时与基础设施门禁（工程基础部分）。

涉及包和目录：

- `next.config.ts`、`package.json`、服务端配置与健康检查。
- `src/server/config.ts`、`src/server/db/`、`scripts/migrate.mjs` 与版本化 SQL migration。
- `admins`、`admin_sessions`、`content_items`、`content_revisions`、`media_assets`、`audit_logs` 六张表。
- FC/ESA 部署与回退说明。

## 4. 暂不纳入范围

- 登录 UI、内容 CRUD、媒体上传、DirectMail 正式接入和生产上线。
- 真实云资源采购、成本规格锁定以及实际 FC/ESA 发布/回退演练。

原因：

- 先建立可测试运行与数据基础，业务能力在后续 Sprint 串行实现。

## 5. 工作范围

### 5.1 工作包：全栈运行时迁移

目标：

- 让现有公开页面在 FC Next.js 中等价运行。

实现任务清单：

- [x] 先写现有路由与 metadata 回归测试。
- [x] 移除 `output: "export"` 及不再适用配置。
- [x] 增加健康检查、服务端配置校验和部署制品。
- [x] 配置 ESA 动静态缓存边界及 `/admin`、`/api` 不缓存规则。
- [x] 固定 Node.js 20+ 与 Next.js `standalone` 候选制品契约，禁止把未验证形态标记为生产 PASS。
- [x] 制品包含 `.next/standalone`、`.next/static` 和 `public`，以 `node .next/standalone/server.js` 启动并读取运行时 `PORT` 与服务端环境变量；本地 smoke 已验证 SSR 页面和 `/api/health` Route Handler。

测试要求：

- [x] 现有页面、robots、sitemap、微信与联系 UI 无功能回归。

### 5.2 工作包：MySQL 数据基础

目标：

- 建立私网、受控连接和可迁移的数据层。

实现任务清单：

- [x] 先写配置、连接失败和迁移失败测试。
- [x] 建立六张 InnoDB/`utf8mb4` 核心表、约束、索引与迁移命令，时间统一使用 UTC。
- [x] 启用并验证严格 SQL 模式，禁止静默截断和宽松类型转换。
- [x] 实现连接复用、事务边界、健康检查和日志脱敏。
- [x] 使用 `mysql2/promise` 的进程级有界连接池；单元测试通过可注入 executor 验证失败停止、事务提交/回滚与迁移顺序。
- [x] 服务端配置包含 `MYSQL_POOL_LIMIT`、`MYSQL_QUEUE_LIMIT`、`MYSQL_ACQUIRE_TIMEOUT_MS`、`MYSQL_MAX_APP_INSTANCES`、`MYSQL_CONNECTION_BUDGET`；启动校验 `MYSQL_POOL_LIMIT * MYSQL_MAX_APP_INSTANCES <= MYSQL_CONNECTION_BUDGET`。
- [x] migration 仅由显式 release command 执行，使用 MySQL advisory lock；禁止在冷启动、应用启动和请求路径运行。
- [x] migration 采用 expand-only/backward-compatible 规则，禁止 drop/rename/不兼容类型变化和无安全默认值的新必填列。
- [x] 编写备份/迁移/失败停止说明。

测试要求：

- [x] migration 使用版本记录表保证幂等；本地测试验证 SQL 契约、顺序、失败停止、并发锁/失败释放、previous-app/new-schema 的 expand-only 兼容边界和关键约束；真实空 RDS 执行归入 `M2-LEGACY-01 / DEFERRED`。

### 5.3 工作包：部署、监控与回退骨架

目标：

- 形成可重复 FC 版本发布。

实现任务清单：

- [x] 建立测试/生产环境变量清单和秘密边界。
- [x] 建立 FC 版本发布、健康验证和上一版本回退流程。
- [x] 配置基础结构化日志、5xx/延迟告警占位；真实阈值和告警激活归入 `M2-LEGACY-01 / DEFERRED`。

测试要求：

- [x] 本地验证发布制品、健康检查、版本标识、observability 占位和回退命令契约；真实测试环境发布与回退记录归入 `M2-LEGACY-01 / DEFERRED`。

## 6. 验收标准

- 现有 M1 页面在全栈 Next.js 构建中无主要回归；真实 FC/ESA smoke 保持遗留未验证。
- 数据库配置只接受服务端变量，迁移/连接池/事务与约束契约可本地验证；真实 VPC/RDS 执行保持遗留未验证。
- 服务端秘密不进入客户端或日志。
- `standalone` 制品、发布/回退说明和自动化契约完成；真实 FC 发布/回退保持遗留未验证。
- 本地可启动 `.next/standalone/server.js`，并通过 SSR 页面、`/api/health`、`PORT` 和 runtime-only 环境变量 smoke。
- 本 Sprint 交付状态最多为 `CODE_READY_WITH_EXTERNAL_LEGACY`，不得标记 Production Live。

## 7. 验证要求

项目声明的验证命令：

- `pnpm test`
- `pnpm lint`
- `pnpm build`

专项验证：

- FC/ESA smoke、RDS 迁移/事务、客户端 bundle 秘密扫描、版本回退。
- 对 `M2-LEGACY-01` 无法执行的真实云专项检查必须记录 `DEFERRED`，不得伪造 PASS；其余本地测试、lint、build 和秘密扫描必须通过。

## 8. 实施顺序

1. 写运行时回归测试。
2. 切换 Next.js 服务端构建。
3. 建立数据层和迁移测试。
4. 生成并本地启动 FC `standalone` 候选制品，验证健康、SSR、API 和回退命令契约。
5. 将真实 ESA/FC 部署、smoke、告警和回退演练记录为 `M2-LEGACY-01 / DEFERRED`。
6. 代码 review-confirm、全量验证和独立提交。

## 9. 风险控制

- 静态转全栈引入回归：先锁定现有路由/metadata 契约。
- 数据库连接耗尽：连接复用、实例上限和监控同时建立。
- 不可逆迁移：每次迁移有备份、向前兼容和停止策略。
- 外部门禁被遗忘：所有 `DEFERRED` 项继续引用 `M2-LEGACY-01`、`M2-LEGACY-02`，并由 M2-05 Production checklist 强制收口。

## 10. 交付结论

交付状态：`CODE_READY_WITH_EXTERNAL_LEGACY`。

- 文档审查：`docs/4-Reviews/sprint-m2-01-review-by-gpt-5.5.md` 与 `sprint-m2-01-review-confirm.md` 已完成，状态 `ACCEPTED_AFTER_CHANGES`。
- 代码审查：`docs/4-Reviews/sprint-m2-01-code-review-by-gpt-5.5.md` 与 `sprint-m2-01-code-review-confirm.md` 已完成；已修复案例发布授权约束并补齐高风险 schema 契约测试。
- 本地验证：`pnpm test`、`pnpm lint`、`pnpm build`、`pnpm smoke:standalone`、客户端 bundle 服务端变量扫描和 `git diff --check` 均通过。
- 本地制品：SSR `/health`、Route Handler `/api/health`、运行时 `PORT`/版本变量、公开首页、缓存边界、迁移/连接池与回退命令契约已验证。
- 外部遗留：真实 ESA/FC/VPC/RDS/OSS/DirectMail 资源与 probe 证据仍为 `M2-LEGACY-01 / DEFERRED`；真实报价、流量假设和预算硬上限仍为 `M2-LEGACY-02 / DEFERRED`。
- Production 判定：`BLOCKED`。M2-05 前必须重新收口两项遗留，不得以本地 PASS 替代真实云证据。
