# Sprint M4-01 验收证据

验证日期：2026-08-02

## 结论

M4-01 的数据库适配层与 SQLite local-test 运行时达到 `LOCAL_CODE_READY`。SQLite 证据只记为 `SQLITE_LOCAL_PASS_ONLY`，Production 继续固定使用 RDS MySQL，并保持 `BLOCKED`。

## 自动验证

| 验证项 | 结果 |
| --- | --- |
| M4-01 专项：server config、release CLI、admin flow、auth、content、maintenance、media | 7 files / 26 tests PASS |
| `pnpm test` | 59 files / 320 tests PASS |
| `pnpm lint` | PASS（`tsc --noEmit`） |
| `pnpm build` | PASS；Next.js standalone 生成成功 |
| `pnpm smoke:standalone` | PASS；SSR、Route Handler、runtime env、公开页面通过 |
| 客户端秘密扫描 | PASS；`.next/static` 无数据库、管理员、OSS、DirectMail 秘密变量 |
| standalone SQLite 数据扫描 | PASS；制品无 `.sqlite/-wal/-shm/-journal` |
| 默认 `pnpm validate:release` | exit 0；`localReady=true`、`productionReady=false`、`CODE_READY_WITH_EXTERNAL_LEGACY` |
| `pnpm validate:release -- --require-production-live` | exit 1；17 项既有 Production blocker 保持 |
| SQLite + `--require-production-live` | exit 1；`SQLITE_LOCAL_PASS_ONLY`，包含 `m4_01_sqlite_local_test_active` |
| `git diff --check` | PASS |

## 浏览器与真实 SQLite smoke

使用 Node 内置 `node:sqlite`、独立 `.local-data/m4-01-completion-smoke.sqlite` 和 `http://localhost:3000` 完成：

- 管理员登录成功；刷新 `/admin` 后 Session 保持。
- 创建新闻草稿，列表显示 `draft`、version 1、draft revision 1。
- 首次发布后状态为 `published`、version 2、public revision 2，并产生本地 purge job。
- 发布后编辑并保存草稿，version 3、draft revision 3，public revision 仍为 2。
- 下线后状态为 `offline`、version 4；公开 URL 显示“该新闻已下线”。
- logout、Session 撤销和安全审计由 `sqlite-auth-integration.test.ts` 的真实 SQLite Route Handler 流程覆盖。
- smoke 后通过受控 `pnpm db:sqlite:reset` 删除临时 completion 数据库。

## 收口修复

最终制品扫描发现旧的本地 smoke 数据可能残留在 `.next/standalone/.local-data`。`scripts/package-standalone.mjs` 已改为在打包阶段删除该精确制品子目录，并递归拒绝任何 SQLite 主文件或 sidecar；修复后重新执行 build、standalone smoke 和制品扫描均 PASS。

## Production 边界

- SQLite 不允许 FC、Production 或真实发布验收。
- RDS 与本地 MySQL 继续使用同一个 `mysql` adapter。
- RDS、ESA、OSS、WAF、恢复、备案、专业审查和成本门禁均未被本地证据关闭。
