# FR-19 数据库适配层与本地 SQLite 测试运行时

- `FR-ID`: `FR-19`
- `标题`: 数据库适配层与本地 SQLite 测试运行时
- `所属阶段`: 阶段 4 - 本地全栈开发体验
- `开发顺序`: 19
- `优先级`: P1
- `前置依赖`: `FR-09`、`FR-10`、`FR-12`、现有 M2 MySQL 实现
- `涉及包`: 服务端数据库配置、repository factory、认证、Session、CMS、修订、发布/下线、审计、迁移和管理员维护脚本
- `是否属于原型阶段`: 否
- `来源类型`: 本地开发能力增强
- `原始 SRS 章节`: 现有 SRS 第 6.10、7.2、7.3、8、9 节；本 FR 不改变生产架构
- `相关 FR`: `FR-09`～`FR-14`
- `交付状态`: 完成 / Local Code Ready / Production BLOCKED

## 目标

在不改变 `ESA -> Function Compute -> RDS MySQL` 生产架构的前提下，为服务端数据访问增加明确的 repository 适配层，使以下运行目标共享同一套业务服务和安全规则：

1. 阿里云 RDS MySQL。
2. 开发机或部署服务器上的 MySQL。
3. 仅限本地测试的 SQLite 文件数据库。

SQLite 用于在不安装 MySQL、不访问阿里云资源时，完成管理员登录、CMS 写入、修订、发布/下线、审计和 Session 的本地集成测试；它不构成生产数据库候选，不得用于 Production Live、FC Preview、真实迁移或云门禁证据。

## 背景与问题

当前认证、内容、媒体与 purge 业务服务已经定义部分 repository 接口，但管理布局、请求鉴权、公开内容、发现文件、purge runtime 和维护脚本仍直接实例化 `MySql*Repository`。数据库配置也只接受 `mysql://`，迁移与管理员维护脚本直接依赖 `mysql2`。

因此，现状可以通过 fake repository 做单元测试，也可以连接 MySQL 做真实联调，但无法用轻量本地数据库启动完整后台。若直接把 MySQL SQL 改成 SQLite 方言，会破坏 RDS 契约；若引入通用 ORM，又会扩大迁移风险和个人项目维护成本。

## 架构边界

```text
认证 / CMS / 发布 / 审计 / Session 业务服务
                    |
            repository factory
              /             \
     MySQL repositories    SQLite repositories
       /          \              |
  RDS MySQL    本地 MySQL     本地测试文件
```

- RDS MySQL 与本地 MySQL 使用同一个 `mysql` adapter；连接目标只由 `DATABASE_URL` 决定，不建立 `rds` 专用实现。
- SQLite 使用独立 repository 实现和独立测试 schema，不尝试直接执行现有 MySQL migration。
- SQLite local-test 使用 Node 22.13+ 内置 `node:sqlite`，不增加生产数据库依赖；既有 MySQL/Production Node 20+ 基线保持不变。
- 适配层位于领域 repository/factory 边界，不创建跨业务通用 ORM、SQL builder、DAO 超类或通用 `webservice`。
- 业务服务、状态机、授权、Argon2id、Session、CSRF、净化和审计规则不得因数据库实现不同而分叉。

## 配置契约

新增服务端配置：

| 变量 | 允许值 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `DATABASE_ADAPTER` | `mysql`、`sqlite` | 配置了 `DATABASE_URL` 时为 `mysql`，否则不配置数据库 | 选择持久化实现 |
| `DATABASE_RUNTIME_SCOPE` | `deployment`、`local-test` | `deployment` | SQLite 必须显式为 `local-test` |
| `DATABASE_URL` | `mysql://...` | 空 | MySQL adapter 的连接地址；RDS 与本地 MySQL 共用 |
| `SQLITE_DATABASE_PATH` | 绝对路径或受控项目内相对路径 | 空 | SQLite 文件路径；不得使用客户端变量或网络 URL |

约束：

1. `DATABASE_ADAPTER=mysql` 时必须配置合法 `mysql://`，并继续执行现有连接池预算校验。
2. `DATABASE_ADAPTER=sqlite` 时必须同时满足 `DATABASE_RUNTIME_SCOPE=local-test`、`SINO_RUNTIME_MODE!=production`，且不得配置 MySQL 连接池变量作为运行依据。
3. `SINO_RUNTIME_MODE=production`、FC/standalone 部署验证或 Production release validation 检测到 SQLite 时必须失败关闭。
4. SQLite 数据文件默认位于被 Git 忽略的 `.local-data/`；不得写入 `public/`、`.next/`、源码、文档或版本控制目录。
5. 任何数据库密码、SQLite 数据文件内容、Session、CSRF、正文或审计 metadata 不得进入日志或构建输出。

配置互斥规则：

- `DATABASE_ADAPTER=sqlite` 时拒绝 `DATABASE_URL` 以及显式设置的 MySQL pool/budget 变量。
- `DATABASE_ADAPTER=mysql` 时拒绝 `SQLITE_DATABASE_PATH` 和 `DATABASE_RUNTIME_SCOPE=local-test`。
- 未显式配置 adapter 时，只存在 `DATABASE_URL` 可兼容推导为 `mysql`；同时存在 MySQL 与 SQLite 变量时必须失败，不得猜测。
- SQLite 人工开发数据库只允许位于项目 `.local-data/`。自动测试临时目录必须通过测试专用参数显式注入并验证 real path；不得把系统临时根、工作区根、用户目录或 symlink/junction 越界路径作为数据库或 reset 目标。

## 功能需求

### 1. Repository factory

1. 提供 server-only factory，按已验证配置创建认证、内容、媒体上传和 cache purge repository。
2. 替换管理布局、请求鉴权、公开内容、发现文件、purge runtime 和 Route Handler 中对 `new MySql*Repository()` 的直接依赖。
3. factory 不接受浏览器输入、请求参数或公开环境变量选择数据库。
4. 单次请求内共享必要的数据库运行时；不得为每个方法无界创建连接。

### 2. MySQL adapter

1. 保留现有 `mysql2/promise`、有界进程级连接池、UTC、严格 SQL mode、事务和行锁行为。
2. RDS MySQL 与本地 MySQL 运行完全相同的 migration、repository 和管理员维护代码。
3. 不根据 hostname 猜测 RDS；连接目标、TLS/VPC 与凭据由部署环境配置。
4. 现有 MySQL schema、migration 历史和生产回退契约不得被 SQLite 改造重写。

### 3. SQLite local-test adapter

1. 支持管理员 bootstrap、密码验证、失败计数、锁定、Session 创建/读取/撤销、CSRF hash 和审计。
2. 支持新闻/案例的创建、更新、修订、预览、发布、下线、列表、详情、不可变 published revision 和案例首次发布授权。
3. 支持发布产生的 purge job/outbox 记录；本地测试不得向真实 ESA 发送请求。
4. 启用 foreign key，使用 UTC ISO 时间或等价可排序表示，并实现与领域模型一致的唯一约束、检查约束和级联/限制规则。
5. 涉及登录失败计数、Session、发布、修订和审计的一致性写入必须在事务中完成；SQLite 使用串行写入/`BEGIN IMMEDIATE` 或等价机制，避免本地并发测试丢更新。
6. SQLite 不模拟 RDS 网络、连接池、MySQL advisory lock、MySQL DDL 隐式提交、ESA、OSS、WAF 或恢复能力。

### 4. 迁移与维护命令

1. MySQL 继续使用现有 `pnpm db:migrate` 及现有 migration 历史。
2. SQLite 使用独立 schema/migration 目录和显式命令，例如 `pnpm db:sqlite:migrate`、`pnpm db:sqlite:reset`；不得把 SQLite SQL 混入生产 migration runner。
3. 人工 `reset` 只允许精确删除已解析且位于项目 `.local-data/` 的 SQLite 测试文件；自动测试临时根使用独立显式参数并验证 real path。两者均不得接受工作区根、用户目录、系统临时根本身、目录目标或 symlink/junction 越界，只可删除 `.sqlite` 主文件及同 basename 的 `-wal`、`-shm`、`-journal`。
4. `pnpm admin:bootstrap`、`admin:reset-password`、`admin:disable` 通过相同 adapter 配置执行，并保持单管理员、事务和审计语义。
5. 命令输出不得打印数据库 URL、密码、PHC hash、Session、CSRF 或内容正文。

### 5. 本地外部依赖降级

1. SQLite 模式只替代数据库，不自动把 OSS、ESA 或 DirectMail 伪装为真实服务。
2. 为完成发布/下线测试，可以使用明确命名的 local-test ESA purge fake；它只能记录受控结果，不发网络请求，证据只能标为 `LOCAL_PASS`。
3. 媒体上传与 DirectMail 若未配置真实测试资源，应保持受控不可用或使用既有独立 fake 契约，不得把本地结果标记为生产通过。

## 输入

- 现有 `AuthRepository`、`ContentRepository`、`MediaUploadRepository`、`CachePurgeJobRepository` 接口和 MySQL 实现。
- 现有 MySQL migration、管理员维护脚本、认证/CMS/purge 测试。
- 本地 SQLite 文件路径和只用于本地测试的管理员凭据。

## 输出

- 统一、server-only 的 repository factory 与经过配置验证的 adapter 选择。
- 保持生产行为的 MySQL adapter。
- 覆盖后台核心能力的 SQLite local-test adapter 与独立 schema。
- SQLite 初始化、重置、管理员 bootstrap 和本地启动说明。
- 同一组 repository contract tests 在 MySQL fake/现有契约与真实 SQLite 测试库上验证关键语义。

## 失败与降级

- 未配置数据库的 Preview：继续允许公开静态/数据库无关页面运行；后台和真实 CMS 路径明确不可用，不静默使用内存数据。
- SQLite 配置不完整或越界：启动/命令立即失败，不回退 MySQL 或临时内存库。
- Production 检测到 SQLite：构建、启动或 release validation 失败。
- SQLite schema 与 adapter 版本不匹配：要求显式迁移或重建本地测试库，不自动删除用户文件。
- MySQL 连接失败：保持现有 fail-closed 和错误脱敏行为，不回退 SQLite。

## 不纳入范围

- 将 SQLite、PostgreSQL 或其他数据库加入生产架构。
- 通用多租户数据库路由、运行中动态切换、读写分离或跨数据库同步。
- 自动把 SQLite 数据迁移到 RDS。
- 用 SQLite 结果替代真实 RDS、FC、VPC、备份、恢复或成本证据。
- 重写现有 MySQL migrations、引入通用 ORM 或建立第二套业务状态机。
- 在浏览器中运行 SQLite，或向客户端暴露数据库选择和凭据。

## 最小验证方式

- 配置矩阵测试：无数据库 Preview、MySQL、SQLite local-test、Production+SQLite 拒绝、错误/冲突变量拒绝。
- 共享 repository contract tests：认证、Session、CMS、修订、发布/下线、案例授权、purge job 和审计。
- SQLite 文件边界、foreign key、事务回滚、并发失败计数和重置安全测试。
- MySQL/SQLite 共享契约具名覆盖 slug 大小写归一与类型内唯一、revision 同时间排序 tie-break、UTC 时间精度、audit JSON round-trip/allowlist、boolean/null、status/content type 枚举拒绝、长度拒绝和 published revision immutability。
- MySQL 既有 migration、连接池、认证、CMS 和 release contract 全量回归。
- `pnpm test && pnpm lint && pnpm build && pnpm smoke:standalone && pnpm validate:release`。
- SQLite local-test 浏览器 smoke：登录、创建新闻、编辑、发布、退出、重新登录、下线、审计查询/断言。

## 验收要点

- 配置可在 RDS MySQL、本地 MySQL和 SQLite local-test 之间确定性选择；RDS/本地 MySQL 共用实现。
- 业务代码不再直接依赖 MySQL concrete repository，除 adapter/factory 与 MySQL 实现边界外。
- SQLite 可本地验证登录、CMS 写入、发布、审计和 Session，且不访问真实云服务。
- Production 和部署验证不能启用 SQLite，也不会静默回退。
- MySQL 生产 schema、迁移、事务、安全和发布行为无回归。

## 备注

本 FR 由 `sprint-m4-01` 实施。FR/Sprint 文档 review-confirm 完成前不得开始代码改造；代码完成后仍需 code review-confirm 和全部项目验证。

## 交付结果

- `mysql` adapter 同时支持 RDS 与开发机/部署服务器本地 MySQL；SQLite 仅在显式 `local-test` scope 启用。
- 本地 SQLite 已验证登录、Session、CMS 写入、revision、发布/下线、审计、媒体 metadata 与无网络 purge。
- Production/FC 和强制 Production 校验对 SQLite fail-closed，不存在自动 fallback。
- [M4-01 验收证据](../../../5-Evidence/m4-01/README.md)记录完整测试、构建、standalone、发布退出码、制品扫描和浏览器 smoke。
- 本 FR 于 2026-08-02 达到 `LOCAL_CODE_READY`；既有 Production 外部门禁继续 `BLOCKED`。
