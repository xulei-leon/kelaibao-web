# M4-01 MySQL Direct Dependency Inventory

## Scope

扫描范围：`products/kelaibao/src` 的非测试运行时代码。目标是让页面、Route Handler 和业务 runtime 只依赖 `repository-factory.ts`，MySQL concrete repositories 只在 factory 和各自实现文件中出现。

## 实施前命中面

文档 review 与实施前 `rg` 扫描确认以下类别直接实例化 `MySql*Repository`：

- auth login/logout/session 与 `auth/request.ts`。
- protected admin layout 与 HTML sanitize。
- content list/create/detail/update/revisions/publish/offline。
- media presign/confirm。
- internal cache purge 与 post-commit purge runtime。
- public SSR list/detail 与 discovery runtime。

## 迁移决定

| 类别 | 决定 |
| --- | --- |
| 页面、Route Handler、auth request、public/discovery/purge runtime | 改为调用 `src/server/db/repository-factory.ts` |
| MySQL repository 实现 | 保留，供 factory 的 `mysql` 分支使用 |
| SQLite repository 实现 | 新增，供 factory 的 `sqlite` local-test 分支使用 |
| 单元测试的显式 repository 注入 | 保留，不通过运行时环境选择 |

## 完成后扫描

命令：

```powershell
rg -n --glob '!node_modules/**' --glob '!.next/**' "new MySql|mysql-repository" src
```

预期及当前结果：只有 `src/server/db/repository-factory.ts` 导入和实例化 MySQL concrete repositories；factory 外非测试运行时命中数为 `0`。

该结果证明依赖收敛，不证明 RDS/FC/VPC、真实并发、备份或恢复能力。Production 相关门禁保持 `BLOCKED`。

