# Sprint M4-01 数据库适配层与本地 SQLite 测试运行时

> **状态：** `COMPLETED / LOCAL_CODE_READY / PRODUCTION_BLOCKED`

**Goal:** 在保留 RDS MySQL 生产架构的同时，将数据访问收敛到可配置的 repository adapter，使开发者可用本地 MySQL或 SQLite 文件完整调试后台核心流程。

**Architecture:** RDS 与本地 MySQL 共用现有 MySQL repositories；新增 server-only repository factory 和 SQLite local-test repositories。SQLite 使用独立测试 schema，只在显式 local-test scope 下启用，Production fail-closed。

**Tech Stack:** Next.js 15、TypeScript、`mysql2/promise`、Node 内置 `node:sqlite`、Vitest、现有 Argon2id/Session/CSRF/CMS 服务。SQLite local-test 要求 Node 22.13+；MySQL/Production 继续保持既有 Node 20+ 基线。

## Global Constraints

- 生产架构仍为 `ESA -> Function Compute -> RDS MySQL + 私有 OSS`。
- `rds` 不是单独 adapter；RDS 与本地 MySQL 都是 `mysql` adapter。
- SQLite 仅用于本地测试，不允许 FC、Production 或 release evidence 使用。
- 不引入通用 ORM、跨业务 DAO 超类、动态多租户路由或通用 `webservice`。
- 不修改公开产品范围，不增加账号、角色、CMS 内容类型或客户 Dashboard。
- 未完成本文档 review-confirm 前不得实施代码。

---

## 1. Sprint 目标

实现 [FR-19](../../1-Requirement/Mainland-Website-FR/Done/FR-19-database-adapter-and-local-sqlite-test-runtime.md)：

- 统一运行时数据库选择与 repository 创建入口。
- 保持 MySQL/RDS 现有行为和迁移历史。
- 使用真实 SQLite 文件完成后台核心流程本地联调。
- 建立生产禁用 SQLite、无静默回退和测试证据分层。

## 2. 前置依赖与门禁

- FR-19 与本 Sprint 文档 review、review-confirm 完成。
- 现有 M2/M3 baseline 测试保持通过。
- SQLite local-test 使用 Node 22.13+ 自带 `node:sqlite`，不新增原生第三方依赖；Windows 本地、Next.js server-only bundling 与 Node 24 当前开发环境必须验证。Node 20/21 仍可运行 MySQL/Production，但不能启用 SQLite local-test。
- 开始实现前记录基线：`pnpm test && pnpm lint && pnpm build`。

路径：

```text
FR_PATH=products/kelaibao/docs/1-Requirement/Mainland-Website-FR/FR-19-database-adapter-and-local-sqlite-test-runtime.md
SPRINT_PATH=products/kelaibao/docs/3-Plan/sprint-m4-01-database-adapter-and-local-sqlite-test-runtime.md
REVIEW_DIR=products/kelaibao/docs/4-Reviews
SQLITE_SCHEMA_DIR=products/kelaibao/migrations/sqlite
SQLITE_DEFAULT_DATA_DIR=products/kelaibao/.local-data
VERIFICATION_COMMANDS=pnpm test && pnpm lint && pnpm build
```

## 3. 纳入范围

- 数据库 adapter 配置解析、冲突校验和生产保护。
- auth/content/media/purge repository factory。
- SQLite 认证、Session、内容、修订、发布/下线、案例授权、审计和 purge job 持久化。
- SQLite 独立 schema/migration、初始化和安全 reset。
- 管理员 bootstrap/reset/disable 对 adapter 的支持。
- 本地 no-network purge fake，使发布流程可完成但不伪报真实 ESA。
- 共享 contract tests、SQLite 集成测试、MySQL 回归和本地操作文档。

## 4. 暂不纳入范围

- SQLite Production/FC 部署。
- PostgreSQL、SQL Server、云 SQLite、读写分离和跨库复制。
- SQLite 到 RDS 的自动数据迁移。
- OSS/DirectMail/ESA 的生产替代实现。
- MySQL migration 历史重写或通用 ORM 引入。
- 使用 SQLite 关闭任何真实云、备案、恢复或成本 blocker。

## 5. 目标文件与模块边界

计划新增：

- `src/server/db/adapter-config.ts`：server-only adapter 配置和 fail-closed 校验。
- `src/server/db/repository-factory.ts`：创建领域 repositories；不暴露原始数据库连接给页面。
- `src/server/db/sqlite/runtime.ts`：SQLite 单例/生命周期、foreign key、事务入口。
- `src/server/auth/sqlite-repository.ts`。
- `src/server/content/sqlite-repository.ts`。
- `src/server/media/sqlite-repository.ts`（只覆盖数据库 metadata/intents，不替代 OSS provider）。
- `src/server/content/sqlite-purge-job-repository.ts`。
- `migrations/sqlite/001_local_test_schema.sql` 及版本表。
- `scripts/sqlite-maintenance.mjs` 或等价显式迁移/reset 脚本。
- `tests/database-adapter-config.test.ts`。
- `tests/sqlite-auth-integration.test.ts`。
- `tests/sqlite-content-integration.test.ts`。
- `tests/sqlite-admin-flow.test.ts`。
- `docs/5-Evidence/m4-01/mysql-direct-dependency-inventory.md`。

计划修改：

- `src/server/config.ts`、`.env.example`、`.gitignore`、`package.json`。
- `src/server/auth/request.ts`、`src/app/admin/(protected)/layout.tsx`。
- `src/server/content/public-page-server.ts`、`src/server/discovery/runtime.ts`。
- `src/server/content/purge-runtime.ts` 及直接创建 MySQL repository 的 Route/runtime。
- `scripts/admin-maintenance.mjs`、`scripts/migrate.mjs` 或其 provider dispatcher。
- 现有 auth/content/media/purge repository contract tests。
- `README.md`、管理员/部署 Runbook。

具体文件列表以实施前 graph trace 和文档 review-confirm 为准；不得遗漏任何 `new MySql*Repository()` 运行时入口。

## 6. 工作包

### 6.1 WP1：配置与生产保护

- [x] 先写配置失败测试。
- [x] 增加 `DATABASE_ADAPTER`、`DATABASE_RUNTIME_SCOPE`、`SQLITE_DATABASE_PATH` 解析。
- [x] 保留未配置数据库的 Preview 行为。
- [x] 验证 MySQL URL、连接池预算和冲突变量。
- [x] SQLite 必须同时满足 adapter=`sqlite`、scope=`local-test`、非 Production。
- [x] Production、standalone release 或强制生产验证检测 SQLite 时失败。
- [x] 错误消息脱敏，不输出完整 URL、密码或 SQLite 内容。

验收测试：

- [x] 无数据库 Preview 通过。
- [x] RDS 风格和本地 MySQL URL 均解析为同一 `mysql` adapter。
- [x] SQLite local-test 通过。
- [x] Production+SQLite、路径缺失、变量冲突和非法 adapter 失败。

### 6.2 WP2：Repository factory 与 MySQL 收敛

- [x] 新建 server-only repository factory。
- [x] 将 auth、protected layout、content、public SSR、discovery、media、purge runtime 的 concrete MySQL 实例化移入 factory。
- [x] 保留测试注入参数，避免破坏现有 unit tests。
- [x] 保持 MySQL pool、事务、`FOR UPDATE`、UTC、严格 SQL mode 和审计行为。
- [x] graph/search 扫描确认 factory 外不存在非测试运行时的 `new MySql*Repository()`。
- [x] 实施前生成 direct-dependency inventory，至少覆盖 auth login/logout/session、sanitize、content CRUD/revisions/publish/offline、media presign/confirm、internal cache purge、public SSR、discovery 和 protected layout；逐项记录迁移目标或 factory 内保留理由。

验收测试：

- [x] 现有 MySQL auth/content/media/purge 测试无行为变化。
- [x] repository factory 只消费 server-only 已验证配置。
- [x] 页面、Route Handler 不读取 adapter query/header/cookie。
- [x] 完成后 inventory 的 factory 外非测试运行时直接 MySQL repository 命中数为 0。

### 6.3 WP3：SQLite schema 与运行时

- [x] 评审并锁定 SQLite Node driver；记录 Node 20～24 和 Windows 安装验证。
- [x] 建立独立 SQLite schema 与 schema version 表。
- [x] 映射 admins、admin_sessions、content_items、content_revisions、media_assets、media_upload_intents、audit_logs、cache_purge_jobs 等本地流程所需表。
- [x] 启用 foreign key、busy timeout、UTC 时间和串行事务策略。
- [x] 为 MySQL 专有类型/函数提供显式 SQLite 实现，不使用字符串替换 SQL 方言。
- [x] 数据库文件只允许位于 `.local-data/` 或显式受控的临时测试目录。

验收测试：

- [x] schema 可幂等初始化，版本不匹配 fail-closed。
- [x] unique/check/foreign-key 高风险约束有真实 SQLite 测试。
- [x] 具名验证 slug 大小写归一/类型内唯一、revision tie-break、UTC ISO 精度排序、JSON round-trip/metadata allowlist、boolean/null、status/content type enum/check、字段长度拒绝和 published revision immutability。
- [x] rollback 后无半写入数据或审计记录。

### 6.4 WP4：SQLite 认证、Session 与审计

- [x] 复用现有 password hasher、CSRF derivation 和 AuthRepository contract。
- [x] 实现管理员 bootstrap、幂等/冲突 singleton、reset、disable。
- [x] 实现已知/未知用户登录、失败计数、第五次锁定和成功复位。
- [x] 实现 Session 创建、读取、过期、撤销和密码重置/禁用后失效。
- [x] 登录状态变化与审计在同一 SQLite 事务中提交。
- [x] 并发写入使用 `BEGIN IMMEDIATE` 或等价串行策略，测试不会丢失失败计数。

验收测试：

- [x] 真实 Argon2id 登录成功/失败。
- [x] 多标签页稳定 CSRF、过期/撤销 Session、Cookie 属性保持现有契约。
- [x] 5 次并发失败得到一个确定锁定状态。
- [x] 审计 metadata allowlist，不包含密码/hash/token。

### 6.5 WP5：SQLite CMS、发布与 purge job

- [x] 实现新闻/案例 create/update/list/detail/revision。
- [x] 保持 slug、status、sanitizer version、published immutable revision 契约。
- [x] 实现案例首次发布显式授权记录。
- [x] publish/offline 与 revision、content state、audit、purge job 同事务。
- [x] 实现 local-test purge provider：不发网络请求，返回明确本地结果。
- [x] 公开列表/详情和 discovery 使用同一个 selected content repository。

验收测试：

- [x] 新闻创建→编辑→发布→公开读取→下线完整通过。
- [x] 案例未授权不能首次发布，授权后可发布且审计完整。
- [x] 发布失败事务回滚，不留下孤立 revision/audit/purge job。
- [x] SQLite 模式无 ESA/OSS/DirectMail 外部网络访问。

### 6.6 WP6：命令、文档与安全 reset

- [x] 增加 SQLite migrate/init 和 reset scripts。
- [x] `admin:bootstrap`、`admin:reset-password`、`admin:disable` 支持 selected adapter。
- [x] reset 前解析绝对路径并验证位于允许的 `.local-data/`；拒绝工作区根、用户目录、空路径和目录目标。
- [x] `.gitignore` 排除 SQLite、journal、WAL、SHM 和本地秘密。
- [x] README 提供 Windows PowerShell 无 MySQL 本地启动流程。
- [x] Runbook 明确 SQLite 证据仅为 Local，Production/RDS 验收仍必须完成。

验收测试：

- [x] 新 clone 可按文档完成 SQLite 初始化、管理员创建和后台登录。
- [x] reset 仅删除精确测试数据库及其受控 sidecar 文件，不删除其他文件。
- [x] 人工 reset 只接受项目 `.local-data`；测试临时根使用独立显式参数，real path 校验拒绝系统临时根本身、目录目标与 symlink/junction 越界。
- [x] 命令输出与 `.next/static` 无数据库秘密和数据内容。

### 6.7 WP7：全量验证、代码评审与关闭

- [x] 运行共享 repository contract suite 和 SQLite 真实文件集成测试。
- [x] 运行 `pnpm test && pnpm lint && pnpm build`。
- [x] 运行 `pnpm smoke:standalone`、`pnpm validate:release` 和客户端秘密扫描。
- [x] 默认 `pnpm validate:release` 在 Local gates 通过时可退出 `0`，但必须报告 `localReady=true`、`productionReady=false`、`CODE_READY_WITH_EXTERNAL_LEGACY` 和完整 Production blocker IDs。
- [x] `pnpm validate:release -- --require-production-live` 在任何真实 Production gate 缺失或证据来自 SQLite/local fake 时退出 `1`；schema/输入错误保持退出 `2`。
- [x] 手工/自动浏览器 smoke：登录、Session 刷新、创建、编辑、发布、下线、退出。
- [x] 完成 code review 和 code-review-confirm，应用所有接受项后重跑验证。
- [x] 核对最终配置名、命令名、文件边界和 README/Runbook 示例与 FR/Sprint 一致；若存在实质差异，先更新文档并重复文档评审门禁。
- [x] 只有全部本地门禁通过后，才能把 FR/Sprint 移到 `Done/`；Production 状态仍取决于既有真实门禁。

## 7. 测试矩阵

| 场景 | 无数据库 Preview | MySQL | SQLite local-test |
| --- | --- | --- | --- |
| 公开代码页面 | 可用 | 可用 | 可用 |
| CMS 公开内容 | 明确降级/不可用 | 可用 | 可用 |
| 管理员登录 | 不可用 | 可用 | 可用 |
| Session/CSRF | 不可用 | 可用 | 可用 |
| CMS 写入/修订 | 不可用 | 可用 | 可用 |
| 发布/下线/审计 | 不可用 | 可用 | 可用，purge 为 local fake |
| Production/FC | 不适用 | 唯一允许实现 | 禁止 |

运行/命令矩阵：

| 运行目的 | MySQL | SQLite local-test | 预期 |
| --- | --- | --- | --- |
| `next dev` / 本地浏览器 smoke | 允许 | 允许 | SQLite 证据仅 `LOCAL_PASS` |
| `pnpm build` / standalone packaging | 允许 | 构建不得依赖读取 SQLite 文件 | 制品不能携带 SQLite 数据；不代表部署通过 |
| standalone deployment/FC Preview smoke | 允许 | 拒绝 | 部署验证必须使用 MySQL/RDS |
| 默认 `pnpm validate:release` | 允许 | 可验证 Local contract | Local 通过可退出 0，但 Production 仍 blocked |
| `--require-production-live` / `SINO_RUNTIME_MODE=production` | 仅 MySQL/RDS | 拒绝 | 未满足真实门禁退出 1，配置/schema 错误退出 2 |

配置互斥矩阵：

- SQLite adapter 拒绝 `DATABASE_URL` 和显式 MySQL pool/budget 变量。
- MySQL adapter 拒绝 `SQLITE_DATABASE_PATH` 与 `DATABASE_RUNTIME_SCOPE=local-test`。
- 未显式 adapter 且两组变量同时出现时 fail-closed；只存在 `DATABASE_URL` 时保持 MySQL 向后兼容。

共享 contract suite 至少覆盖：

- singleton admin、密码策略、登录锁定、Session 撤销。
- 内容唯一性、revision 顺序、发布授权、immutable published revision。
- 事务原子性、审计关联、purge job 精确关联。
- 错误脱敏和无敏感数据日志。

SQLite 专项覆盖：

- foreign key、busy/并发策略、文件重开持久化。
- 迁移幂等、schema version、WAL/sidecar 清理边界。
- `local-test` 以外配置拒绝。

MySQL 专项继续覆盖：

- connection pool budget、advisory migration lock、严格 SQL mode。
- `FOR UPDATE` 并发语义、真实 MySQL migration contract。
- RDS/FC/VPC 真实证据仍保持独立 Production gate。

## 8. 实施顺序

1. 配置失败测试与生产保护。
2. repository factory 收敛，确保 MySQL 行为不变。
3. SQLite schema/runtime。
4. SQLite auth/Session/audit。
5. SQLite CMS/publish/purge job。
6. 命令、reset、文档和浏览器 smoke。
7. code review-confirm 与完整验证。

不得在 factory 收敛和生产保护完成前将 SQLite 接入页面或 Route Handler。

## 9. 风险控制

- **双实现漂移：** 使用共享领域接口、contract tests 和相同业务 service；SQLite 不复制状态机判断。
- **SQLite 被误部署：** 配置双门禁、生产验证、部署扫描和 fail-closed 启动检查。
- **SQL 方言伪兼容：** 独立 schema/repository，不对 MySQL SQL 做正则替换。
- **并发语义差异：** SQLite 只验证本地功能一致性；RDS 并发/锁仍由 MySQL 专项和真实环境验证。
- **维护成本扩大：** 只实现后台核心表与现有 repository 契约，不演变为通用数据库平台。
- **误删本地文件：** reset 解析并验证精确绝对路径，只允许受控目录。
- **fake 被误报 Production：** local purge/SQLite 结果只能记 `LOCAL_PASS`，release validator 不接受其关闭 Production gate。

## 10. 退出标准

- FR-19/Sprint 文档 review-confirm 与代码 review-confirm 均完成。
- RDS 与本地 MySQL 使用同一 adapter；现有 MySQL 全量回归通过。
- SQLite local-test 可完成登录、Session、CMS 写入、发布/下线和审计。
- Production/FC 无法启用 SQLite，且不存在自动 fallback。
- 所有测试、lint、build、standalone smoke 和 release validation 按预期通过。
- README/Runbook 可由一名开发者在 Windows 上复现本地 SQLite 后台调试流程。

## 11. 完成记录

- 完成日期：2026-08-02。
- repository factory 已收敛 auth、Session、content、public SSR、discovery、media 与 purge runtime；RDS 和本地 MySQL 共用 `mysql` adapter。
- SQLite local-test 已覆盖管理员维护、登录/Session、CMS create/update/revision、发布/下线、审计、媒体 metadata 与无网络 purge。
- 两份文档评审、review-confirm、两份代码评审和 code-review-confirm 均完成，接受项已应用。
- [M4-01 验收证据](../../5-Evidence/m4-01/README.md)记录 59 files / 320 tests、lint、build、standalone smoke、release 退出码、秘密/SQLite 制品扫描和浏览器 smoke。
- Local 状态为 `LOCAL_CODE_READY`；Production 仍由既有 17 项真实门禁控制并保持 `BLOCKED`。
