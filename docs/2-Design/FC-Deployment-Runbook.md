# FC Standalone 部署与回退 Runbook

> 控制台创建 Web 函数、Linux 构建、ZIP 根目录、Node.js 20、启动命令、监听端口、环境变量和首次验证的逐步操作，见 [FC 3.0 控制台 ZIP 部署操作手册](./FC-Console-ZIP-Deployment-Manual.md)。

## 状态

- 本地制品与命令契约：M2-01 实现并自动验证。
- 真实 ESA/FC/VPC/RDS 发布、告警与回退：`M2-LEGACY-01 / DEFERRED`。
- 资源规格与预算：`M2-LEGACY-02 / DEFERRED`。

## 制品契约

1. 使用 Node.js 20+ 执行 `pnpm install --frozen-lockfile`。
2. 执行 `pnpm test && pnpm lint && pnpm build`。
3. `pnpm build` 生成 `.next/standalone/server.js`，并将 `.next/static` 与 `public` 复制到 standalone 根目录。
4. 运行时使用 `node server.js`。FC 自定义运行时的监听端口配置为 `9000`，函数环境变量显式设置 `PORT=9000`、`HOSTNAME=0.0.0.0`；`SINO_APP_VERSION` 和服务端秘密也由运行时配置提供。`SINO_RUNTIME_MODE`、`SINO_APP_VERSION` 是 M2 已实现的内部运行协议兼容名，M3-01 保留它们以避免改变部署契约；它们不得进入公开品牌文案，也不得用于创建旧品牌 origin、第二应用或双站配置。
5. 服务端秘密不得在 `next build` 阶段注入，也不得进入客户端 bundle、制品清单或日志。

## Migration release step

1. 发布前取得 RDS 备份证据；真实备份目前为 `M2-LEGACY-01 / DEFERRED`。
2. 在独立 release job 中注入 `DATABASE_URL`，执行 `pnpm db:migrate`。
3. migration 使用 MySQL advisory lock；锁获取失败或任何 statement 失败时停止发布。
4. migration 只允许 expand-only/backward-compatible DDL，不从应用启动、FC 冷启动或请求路径执行。
5. 只有上一应用版本与迁移后 schema 兼容矩阵通过，才允许应用版本回退。

MySQL DDL 会隐式提交，因此 migration 通过 `IF NOT EXISTS`、版本记录和 expand-only 规则保证可安全重试；事务只保护版本记录与可事务语句，不能假定 rollback 会撤销已执行 DDL。

## 本地 smoke

执行：

```bash
pnpm smoke:standalone
```

检查：

- `/api/health` 读取运行时版本且不输出秘密；
- `/health` 由 standalone server 动态 SSR；
- 现有首页仍可由 standalone server 返回；
- `/admin/*`、`/api/*` 和 `/health` 响应禁止共享缓存。

## FC 发布与回退命令契约

供应商命令参数必须来自版本化部署配置和受控秘密，禁止在文档或脚本硬编码 AccessKey。

```text
release:
  upload immutable artifact
  create FC version
  point test alias to new version
  verify /api/health and route smoke
  point production alias only after gates pass

rollback:
  verify previous-app/new-schema compatibility
  point alias to previous healthy version
  verify /api/health
  purge only affected ESA URLs
```

真实命令、资源 ID、版本号、告警和演练证据只能在 `M2-LEGACY-01` 关闭后回填，不得用占位值标记成功。

## 自动发布门禁（M3-05 当前输入）

版本化输入位于：

```text
docs/5-Evidence/m3-05/gate-input.json
```

`docs/5-Evidence/m2-05/gate-input.json` 只保留为历史 evidence；当前
`scripts/validate-release.mjs` 的默认输入是 M3-05，除非命令显式传入其他 `--input`。

输入严格拆成两个集合：

- `localChecks` 只允许 `LOCAL_PASS | LOCAL_FAIL | NOT_RUN | N/A`。
- `productionGates` 只允许 `PASS | BLOCKED | N/A`，且所有当前 gate 均为
  `mandatory=true`。

本地 fake、构建、示例配置和文档不得转换为 production `PASS`。每项必须记录
验证日期、命令或明确 HTTP(S) 请求、预期/实际结果、证据路径和敏感信息检查；
production gate 还必须记录脱敏资源引用与地域。`N/A` 必须给出理由。

执行：

```bash
pnpm validate:release
pnpm validate:release -- --require-production-live
```

- 第一条验证 schema、必填字段、未知/重复 gate、跨层状态、占位 PASS 和自动
  结论；清单明确 `BLOCKED` 时仍可零退出。
- 第二条是 Production 硬门禁；任一 mandatory production gate 非真实
  `PASS` 时必须非零退出。
- 当前缺少真实云、合规和成本输入，预期结论为
  `CODE_READY_WITH_EXTERNAL_LEGACY`，第二条预期非零。这是正确阻断证据，
  不是需要绕过的测试失败。

### Previous-app / new-schema 兼容矩阵

`fc_previous_app_new_schema_compatibility` 是独立 mandatory production gate，
不能由“已有备份”或“FC 可以切换 alias”的描述替代。至少记录：

```text
previousAppVersion
migrationVersion
schemaState
commandOrProbe
expectedResult
actualResult
evidencePath
```

自动判定顺序：

1. 对隔离 RDS 执行目标 expand-only migration，并记录 migration 版本与 schema
   状态。
2. 将 test alias 指向上一可用不可变 FC artifact。
3. 通过正式链路或受控 HTTPS probe 验证 `/api/health`、管理员认证、内容读写、
   公开查询和 inquiry 配置失败降级；probe 不提交真实 PII。
4. 兼容矩阵、RDS 恢复和 FC rollback 三项分别记录，任一失败都停止 production
   alias 切换。
5. 只在全部 mandatory production gate 为真实 `PASS` 时输出
   `PRODUCTION_LIVE_READY`。

真实 probe 身份/token、FC/RDS 版本和证据仍由 `M2-LEGACY-01` 提供；真实报价、
流量假设和预算硬上限由 `M2-LEGACY-02` 提供。命令示例不得硬编码 AccessKey、
token、数据库 URL、PII 或真实资源 ID。
