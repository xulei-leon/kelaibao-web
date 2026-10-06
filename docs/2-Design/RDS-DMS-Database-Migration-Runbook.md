# 客来宝 RDS DMS 数据库迁移操作手册

| 字段 | 内容 |
| --- | --- |
| 文档版本 | `v1.0` |
| 更新日期 | `2026-08-15` |
| 适用项目 | `products/kelaibao/` |
| 目标地域 | 华南 1（深圳） |
| 目标数据库 | 阿里云 RDS MySQL 8.0 |
| 执行入口 | 阿里云数据管理 DMS 的 SQL Console |
| 当前迁移范围 | `001`～`004` |

## 1. 目的和适用边界

本文说明如何只使用阿里云 RDS DMS，将客来宝生产数据库结构创建或升级到当前代码要求的 `001`～`004` 版本。完成后的数据库结构应与在受控执行环境运行 `pnpm db:migrate` 的成功结果一致。

DMS 手工迁移适用于以下情况：

- 全新空库；
- `schema_migrations` 中已登记连续的完整版本，只需继续执行后续版本；
- 有明确维护窗口，且迁移期间不会运行第二个 migration；
- 操作者能够取得与待部署 FC ZIP 完全相同 Git commit 中的迁移文件。

遇到以下情况时停止 DMS 手工迁移，改用与 RDS 私网互通的临时 ECS 执行 `pnpm db:migrate`，或先由开发人员完成结构修复方案：

- `schema_migrations` 没有某个版本，但该版本包含的部分列、索引或约束已经存在；
- 之前的 DMS 执行曾在中途失败或被中断；
- 版本记录不是从 `001` 开始连续递增；
- 无法确认迁移 SQL 与 FC ZIP 来自同一 Git commit；
- 生产库结构被人工修改过，无法确定与仓库迁移文件的差异。

> 重要：MySQL 大多数 DDL 会隐式提交。DMS 中的 `START TRANSACTION` 不能将一整个迁移文件安全回滚。只有当某个版本的全部 SQL 都执行成功后，才能向 `schema_migrations` 写入该版本。

## 2. 迁移来源和版本映射

必须从与 FC ZIP 相同的 Git commit 取得以下文件，并严格按顺序执行：

| 版本 | 迁移名称 | SQL 文件 | 成功后登记的 `name` |
| --- | --- | --- | --- |
| `001` | 核心结构 | [`../../migrations/001_core_schema.sql`](../../migrations/001_core_schema.sql) | `core_schema` |
| `002` | 安全基础 | [`../../migrations/002_security_foundation.sql`](../../migrations/002_security_foundation.sql) | `security_foundation` |
| `003` | 内容发布 | [`../../migrations/003_content_publication.sql`](../../migrations/003_content_publication.sql) | `content_publication` |
| `004` | SEO 图片 | [`../../migrations/004_seo_images.sql`](../../migrations/004_seo_images.sql) | `seo_images` |

迁移文件中的下列内容只是项目 migration runner 的语句分隔注释，在 DMS 中可以保留：

```sql
-- statement-breakpoint
```

DMS 实际按照每条 SQL 末尾的分号依次执行。

## 3. 操作前门禁

开始前逐项确认：

- [ ] 已记录待部署 FC ZIP 对应的 Git commit SHA。
- [ ] 本地打开的四个迁移文件来自同一个 commit。
- [ ] 已确认目标为正确的阿里云账号、华南 1（深圳）地域、RDS 实例和数据库。
- [ ] 已建立维护窗口，暂停 FC 版本切换以及其他 migration、管理员初始化和数据库结构变更。
- [ ] 已确认 RDS 自动备份可用，并在重要生产数据场景创建迁移前手动备份或快照。
- [ ] 已准备独立迁移账号，不使用日常 `kelaibao_web` 账号。
- [ ] 如果 DMS 开启安全协同、审批或变更工单，所需工单已经批准。
- [ ] 已指定失败时的处理人；任何语句失败后不得继续登记版本。

迁移账号只授予目标数据库所需权限，建议至少包括：

- `SELECT`
- `INSERT`
- `CREATE`
- `ALTER`
- `INDEX`
- `REFERENCES`

不要为这次迁移授予不必要的全局管理员权限。迁移完成并验收后，回收或禁用一次性迁移账号。

## 4. 进入 DMS SQL Console

1. 登录阿里云控制台，进入目标 RDS MySQL 实例。
2. 选择“登录数据库”进入 DMS。
3. 使用独立迁移账号登录。
4. 新建 SQL Console。
5. 在 SQL Console 左上角选择目标数据库；不要只依赖实例名称判断当前库。
6. 后续操作尽量保持在同一个 SQL Console 会话中完成。

DMS 控制台文案可能随产品版本调整。如果结构变更必须通过“结构设计”或“普通数据变更”工单执行，应将本文的 SQL 和执行顺序填入对应工单，不得绕过当前实例的安全规则。

## 5. 建立执行上下文

先执行：

```sql
SELECT
  DATABASE() AS current_database,
  VERSION() AS mysql_version,
  CONNECTION_ID() AS connection_id,
  @@character_set_database AS database_charset,
  @@collation_database AS database_collation;
```

确认：

- `current_database` 是客来宝目标数据库；
- `mysql_version` 是 MySQL 8.0 兼容版本；
- 数据库支持迁移使用的 `utf8mb4_0900_ai_ci`；
- 保存本次输出的 `connection_id`，用于判断 DMS 是否更换了会话。

设置与项目 migration runner 一致的会话参数：

```sql
SET SESSION sql_mode =
  'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

SET time_zone = '+00:00';
```

获取项目使用的 MySQL advisory lock：

```sql
SELECT GET_LOCK('saino_quanwang_schema_migrations', 10) AS acquired;
```

结果必须为 `1`。如果结果为 `0` 或 `NULL`，停止操作，排查是否有另一个 migration 正在执行或当前连接是否异常。

在后续步骤中如果 DMS 重新连接，`CONNECTION_ID()` 会改变，原连接持有的 lock 也会随连接关闭而释放。此时重新执行本节的会话设置和 `GET_LOCK`，确认返回 `1` 后才能继续。advisory lock 只协调使用相同 lock 名称的 migration，不替代维护窗口。

## 6. 迁移前检查

执行：

```sql
SHOW TABLES;
```

然后执行：

```sql
SELECT version, name, applied_at
FROM schema_migrations
ORDER BY version;
```

如果提示 `schema_migrations` 不存在，先执行：

```sql
CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR(64) NOT NULL PRIMARY KEY,
  name VARCHAR(191) NOT NULL,
  applied_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;
```

再次查询版本：

```sql
SELECT version, name, applied_at
FROM schema_migrations
ORDER BY version;
```

根据现有记录确定待执行范围：

| 已登记版本 | 本次执行 |
| --- | --- |
| 无记录 | `001`、`002`、`003`、`004` |
| 只有 `001` | `002`、`003`、`004` |
| `001`～`002` | `003`、`004` |
| `001`～`003` | `004` |
| `001`～`004` | 不执行迁移，直接进入验收 |

如果版本缺号、顺序异常，或者 `name` 与第 2 节映射不一致，停止操作，不要自行补写版本。

## 7. 执行迁移

每个版本都按照“执行完整 SQL 文件 -> 检查全部执行结果 -> 登记版本 -> 查询确认”的顺序操作。不得一次性先登记 `001`～`004`，也不得在前一版本失败时继续下一版本。

### 7.1 执行 `001_core_schema.sql`

如果 `001` 尚未登记：

1. 打开 [`../../migrations/001_core_schema.sql`](../../migrations/001_core_schema.sql)。
2. 将文件完整内容复制到 DMS SQL Console 的新查询页。
3. 全选文件内容，执行全部语句；不要只执行光标所在的单条语句。
4. 检查 DMS 的每条执行结果，确认没有失败、警告升级为错误或被跳过的语句。
5. 全部成功后，单独执行：

```sql
INSERT INTO schema_migrations (version, name)
VALUES ('001', 'core_schema');
```

6. 确认：

```sql
SELECT version, name, applied_at
FROM schema_migrations
WHERE version = '001';
```

### 7.2 执行 `002_security_foundation.sql`

只有 `001` 已成功登记且 `002` 尚未登记时才执行：

1. 完整执行 [`../../migrations/002_security_foundation.sql`](../../migrations/002_security_foundation.sql)。
2. 检查文件内所有语句均成功。
3. 单独执行：

```sql
INSERT INTO schema_migrations (version, name)
VALUES ('002', 'security_foundation');
```

4. 查询确认：

```sql
SELECT version, name, applied_at
FROM schema_migrations
WHERE version = '002';
```

### 7.3 执行 `003_content_publication.sql`

只有 `001`～`002` 已成功登记且 `003` 尚未登记时才执行：

1. 完整执行 [`../../migrations/003_content_publication.sql`](../../migrations/003_content_publication.sql)。
2. 检查文件内所有语句均成功。
3. 单独执行：

```sql
INSERT INTO schema_migrations (version, name)
VALUES ('003', 'content_publication');
```

4. 查询确认：

```sql
SELECT version, name, applied_at
FROM schema_migrations
WHERE version = '003';
```

### 7.4 执行 `004_seo_images.sql`

只有 `001`～`003` 已成功登记且 `004` 尚未登记时才执行：

1. 完整执行 [`../../migrations/004_seo_images.sql`](../../migrations/004_seo_images.sql)。
2. 检查文件内所有语句均成功。
3. 单独执行：

```sql
INSERT INTO schema_migrations (version, name)
VALUES ('004', 'seo_images');
```

4. 查询确认：

```sql
SELECT version, name, applied_at
FROM schema_migrations
WHERE version = '004';
```

## 8. 数据库验收

### 8.1 迁移版本

执行：

```sql
SELECT version, name, applied_at
FROM schema_migrations
ORDER BY version;
```

必须恰好包含以下连续版本和名称：

| version | name |
| --- | --- |
| `001` | `core_schema` |
| `002` | `security_foundation` |
| `003` | `content_publication` |
| `004` | `seo_images` |

### 8.2 表清单

执行：

```sql
SHOW TABLES;
```

至少应存在：

- `schema_migrations`
- `admins`
- `admin_sessions`
- `content_items`
- `content_revisions`
- `media_assets`
- `audit_logs`
- `media_upload_intents`
- `cache_purge_jobs`

可以使用以下查询一次核对必需表：

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = DATABASE()
  AND table_name IN (
    'schema_migrations',
    'admins',
    'admin_sessions',
    'content_items',
    'content_revisions',
    'media_assets',
    'audit_logs',
    'media_upload_intents',
    'cache_purge_jobs'
  )
ORDER BY table_name;
```

预期返回 9 行。

### 8.3 `004` 关键字段

执行：

```sql
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema = DATABASE()
  AND (
    (
      table_name = 'media_assets'
      AND column_name IN (
        'width_px',
        'height_px',
        'public_usage_confirmed_at',
        'public_usage_confirmed_by'
      )
    )
    OR (
      table_name = 'content_revisions'
      AND column_name IN (
        'cover_media_asset_id',
        'cover_alt'
      )
    )
  )
ORDER BY table_name, ordinal_position;
```

预期返回 6 行。

### 8.4 字符集和存储引擎

执行：

```sql
SELECT
  table_name,
  engine,
  table_collation
FROM information_schema.tables
WHERE table_schema = DATABASE()
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

项目迁移创建的表应使用 `InnoDB` 和 `utf8mb4_0900_ai_ci`。

## 9. 释放迁移锁和回收账号

验收成功后，在持有 lock 的同一个 DMS 会话执行：

```sql
SELECT RELEASE_LOCK('saino_quanwang_schema_migrations') AS released;
```

正常结果为 `1`。如果结果为 `NULL`，说明当前连接并未持有该 lock；检查 DMS 是否已经更换连接。连接关闭时 MySQL 也会自动释放该连接持有的 named lock。

随后完成：

- [ ] 保存 DMS 执行记录、工单号或必要截图，但不得记录数据库密码等秘密。
- [ ] 记录数据库实例、库名、Git commit SHA、迁移版本、操作者和完成时间。
- [ ] 回收或禁用一次性迁移账号。
- [ ] 恢复部署流程，但仍先发布到受控 alias 或测试入口。

## 10. 应用验收

在与数据库迁移相同 commit 的 FC 版本部署完成后：

1. 检查健康接口 `/api/health`。
2. 访问 `/news`，确认页面可返回且没有数据库结构错误。
3. 访问 `/cases`，确认页面可返回且没有数据库结构错误。
4. 检查 FC/SLS 日志中是否存在缺表、缺列、外键或数据库权限错误。
5. 如本次同时初始化后台，再按管理员维护 Runbook 使用专用命令执行，不要在 DMS 中直接写入明文密码或手工构造管理员密码 hash。

## 11. 失败处理

任何迁移语句失败后，立即执行以下动作：

1. 停止当前版本，不执行后续语句和后续版本。
2. 不向 `schema_migrations` 插入当前版本。
3. 保存失败语句、MySQL 错误码、错误信息、已成功语句清单和 DMS 工单/执行记录。
4. 保持应用发布冻结。
5. 使用 `SHOW CREATE TABLE <table_name>;` 和 `information_schema` 判断已经生效的列、索引和约束。
6. 由开发人员给出针对当前实际结构的恢复步骤，或在临时 ECS 上使用项目 migration runner 继续迁移。

不得采用以下处理方式：

- 不核对结构便从失败文件开头重复执行；
- 因为“大部分语句成功”而手工补写版本号；
- 删除现有列、索引、约束或业务表后重试；
- 直接修改历史迁移文件来适配单个生产实例；
- 将生产数据库连接串、密码或 DMS 登录凭据粘贴到工单、聊天、Git 或截图中。

项目的 [`../../scripts/migrate.mjs`](../../scripts/migrate.mjs) 会在执行 expand-only `ADD COLUMN`、`ADD INDEX` 和 `ADD CONSTRAINT` 前查询 `INFORMATION_SCHEMA`，从而跳过已经存在的对象。直接在 DMS 执行原始 SQL 文件没有这层自动恢复能力，这正是部分迁移状态必须停止并评估的原因。

## 12. 操作记录模板

执行结束后填写并保存到受控发布记录中：

```text
RDS 实例：
数据库名：
地域：华南 1（深圳）
FC ZIP Git commit：
迁移 SQL Git commit：
迁移前版本：
本次执行版本：
迁移后版本：
DMS 工单号/执行记录：
备份或快照标识：
执行人：
开始时间：
完成时间：
数据库验收：PASS / FAIL
/api/health：PASS / FAIL
/news：PASS / FAIL
/cases：PASS / FAIL
异常与处理：
```

