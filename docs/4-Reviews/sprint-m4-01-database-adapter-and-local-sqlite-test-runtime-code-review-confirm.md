# Sprint M4-01 Code Review Confirm

**Reviewed Inputs**

- `docs/4-Reviews/sprint-m4-01-database-adapter-and-local-sqlite-test-runtime-code-review-by-gpt-5.5.md`
- `docs/4-Reviews/sprint-m4-01-database-adapter-and-local-sqlite-test-runtime-code-review-by-gpt-5.3-codex-spark.md`
- `docs/1-Requirement/Mainland-Website-FR/FR-19-database-adapter-and-local-sqlite-test-runtime.md`
- `docs/3-Plan/sprint-m4-01-database-adapter-and-local-sqlite-test-runtime.md`
- M4-01 implementation, tests, scripts, and evidence

**Review Date**

- 2026-08-01

## Overall Conclusion

两位 reviewer 均未发现 Critical 或 High 问题。两份报告对同一个 SQLite 路径边界缺口形成交叉确认：当前校验能够阻止词法路径和父目录逃逸，但没有拒绝已经存在且指向允许目录外的目标文件符号链接。GPT-5.5 另外确认了数据库适配配置在服务端与管理员维护脚本之间存在不一致，部分或混合 SQLite 配置可能被忽略或退回 MySQL。

这两项均与 FR-19 的 fail-closed 和 real-path 边界直接相关，全部接受并在完成 Sprint 前修复。其余事务、并发、Session、审计、无网络 purge、schema drift 与 repository factory 范围未发现需要修改的问题。

## Decision Table

| No. | Severity | Type | Review Source | Original Comment Summary | Decision | Evidence | Follow-up Plan |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Medium / Low | Security / Path Safety | GPT-5.5 C1；Spark C1 | `.local-data/*.sqlite` 已存在目标文件若为 symlink/reparse point，可能被 `node:sqlite` 打开到允许目录外。 | Accept | `src/server/config.ts` 仅做 `resolve/relative` 词法校验；`assertSafeExistingSqlitePath()` 只解析父目录 realpath，未对已存在目标执行 `lstat/realpath`。该行为不满足 FR-19 的 real-path 防逃逸要求。 | 在运行时配置与脚本 helper 中校验已存在目标自身；拒绝 symlink/reparse point，并确认 regular file realpath 仍位于 `.local-data`。增加目标文件 symlink 与父目录链接负向测试。 |
| 2 | Medium | Correctness / Fail-Closed Config | GPT-5.5 C2 | 未显式设置 adapter 的 SQLite path/scope 可能被服务端忽略；管理员脚本默认 MySQL，混合配置可能没有报错。 | Accept | `resolveServerConfig()` 在无 `DATABASE_URL` 时可返回无数据库 preview；`admin-maintenance.mjs` 使用 `DATABASE_ADAPTER || \"mysql\"`，没有执行完整互斥矩阵。FR-19 只允许由 `DATABASE_URL` 推断 MySQL，SQLite 必须显式声明。 | 服务端与 CLI 统一规则：SQLite-specific 变量要求显式 `DATABASE_ADAPTER=sqlite`；MySQL 与任意 SQLite path/scope 互斥；管理员命令只允许由 `DATABASE_URL` 推断 MySQL。增加服务端与 CLI 负向测试。 |

## Needs Immediate Action

- 修复已存在 SQLite 目标文件的 symlink/reparse point 与 realpath 边界检查。
- 统一服务端、SQLite 脚本和管理员维护脚本的数据库适配配置互斥与推断规则。
- 补充上述路径与配置的负向回归测试，并重跑完整 Sprint 门禁。

## Can Be Deferred

- 无。

## Final Status

`ACCEPTED_AFTER_CHANGES`。

## Applied Resolution

- 已在运行时配置与 SQLite maintenance helper 中增加目标文件 `lstat/realpath` 校验，拒绝 symlink/junction 和 real-path 越界；目标文件 symlink、父目录 junction 负向测试通过。
- 服务端配置、SQLite helper 与管理员维护脚本已统一 fail-closed 互斥规则；SQLite-specific 配置必须显式声明 `DATABASE_ADAPTER=sqlite`，混合配置在数据库访问前失败。
- 最终制品扫描发现并修复 standalone 残留 `.local-data` 的风险；打包脚本现在删除精确制品子目录并递归拒绝 SQLite 主文件和 sidecar。
- 最终验证：M4-01 专项 7 files / 26 tests、全量 59 files / 320 tests、lint、build、standalone smoke、客户端秘密扫描、standalone SQLite 数据扫描全部 PASS。
- 默认 release validation exit 0 且 `productionReady=false`；强制 Production exit 1；SQLite 强制 Production 同样 exit 1 并报告 `SQLITE_LOCAL_PASS_ONLY` 与 `m4_01_sqlite_local_test_active`。
- 浏览器真实 SQLite smoke 已覆盖登录、Session 刷新、创建、发布、编辑、下线与公开 410 页面；logout/撤销由真实 SQLite 认证集成测试覆盖。

最终状态：`RESOLVED_AND_VERIFIED`。
