# 新闻删除文档 Review Confirm

日期：2026-10-07。复核方式：实施者依据用户请求、FR-12、现有状态机、两种 repository、外键和 purge outbox 静态复核；不声称独立评审。

| 问题 | 裁决 |
| --- | --- |
| 物理删除破坏修订指针与 purge 外键 | 使用 deleted_at 逻辑删除，保留历史和媒体；公开状态不增加枚举。 |
| 已发布内容仍被访问或复活 | 删除切换 offline 并创建精确 purge job；管理读取与 mutate 过滤 deleted_at。 |
| 删除依赖图片配置或重新净化而失败 | 删除 revision 记录已有字段，不重新发布或校验媒体；仅删除操作豁免发布验证。 |
| 并发删除新版本 | expectedVersion 在原事务锁定行后检查；失败无 revision/审计/outbox 半提交。 |
| 新列与本地旧库 | 显式可重入 migration；schema 1/2 升级到 3，旧数据保持，管理员与 runtime 同步。 |
| 用户误点与请求失败 | 标题确认、取消无请求、成功后移除；失败保持列表，过期会话要求重新登录。 |

APPROVED_FOR_IMPLEMENTATION：上述契约与补充计划确认，用户请求已授权本次功能实施；不需要额外确认。验证仅操作独立测试内容，保留用户文章和已有工作区变更。

## 实施后复核

实施者复核最终删除差异：两种 repository 的读取及 mutation 排除 deleted_at；删除事务保留指针和媒体，写 revision/audit/outbox，版本冲突和审计/任务失败全部回滚。公开列表过滤删除，公开详情维持 draft 404 / 曾发布 410；案例由 domain 拒绝。已验证 Session/CSRF、重复点击、取消、冲突及删除后不可重发。432 项测试、lint/build/standalone smoke 和四视口本地浏览器通过；不声称独立评审或真实 MySQL/ESA 验收。
