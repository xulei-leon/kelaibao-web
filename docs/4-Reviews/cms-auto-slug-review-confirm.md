# CMS Slug 自动生成文档 Review Confirm

日期：2026-10-07。评审方式：本次实施者对已确认用户计划及当前源码进行静态复核；不声称完成独立或双代理评审。

## 输入

用户明确确认的自动唯一编号计划；FR-12、FR-24、CMS 设计、M5-04 与本次补充计划；当前 service/domain/admin-api、共享编辑器、MySQL/SQLite create/mutate 事务与公开路径逻辑。

## 复核与裁决

| 问题 | 裁决与实施契约 |
| --- | --- |
| 中文标题与 ASCII slug 约束 | crypto 生成类型前缀 + 16 位十六进制；保留 domain 严格 ASCII 规则，无依赖或迁移。 |
| 历史链接与 API 兼容 | UI 不提交 slug；API 省略触发自动行为，显式值仍执行原校验；原链接不重新生成。 |
| 并发保存与链接稳定 | 保存在 mutate 事务的 plan 回调中取得 item.slug，保留 expectedVersion；不在事务外查询。 |
| 创建重复与事务副作用 | 保留数据库唯一索引；repository 回滚后只对自动创建的 duplicate_slug 重试，最多 3 次，其他错误直接失败。 |
| 空值及无 slug 预览 | 只对 undefined 自动处理，null/空串不绕过校验；UI 移除 slug 必填检查，预览继续服务端 sanitizer。 |
| 文档与验收边界 | 更新 FR/设计/使用说明；验证 UI、事务与 SSR，四视口及全量检查；本地结果不代表真实云上线。 |

## 结论

APPROVED_FOR_IMPLEMENTATION：用户已确认本次完整方案，上述契约已写回需求、设计与补充计划，文档门禁完成。无需额外批准；完成后记录实际检查结果与限制。

## 实施后复核

实施者对最终差异再次静态复核：只有 undefined 触发自动行为；重试等待 repository 的拒绝/回滚，最多 3 次；保存从 mutate 事务读取当前 slug；UI dirty/预览/请求均不再包含 slug；持久化 schema 与响应未改。测试覆盖实际 SQLite 生命周期、回滚、旧值及版本/不可变规则，MySQL 连接 fixture 另验证自动重试事务顺序。未发现本次差异内需修复的问题；不声称独立代码评审。

自动测试、类型、构建和浏览器的实际结果及现有预览 CSP 诊断见 `docs/5-Evidence/cms-auto-slug/README.md`。
