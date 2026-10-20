# M5-05 实施前文档复核

日期：2026-10-20。复核者：实施者；不是独立评审。输入：AGENTS.md、FR-25、M5-05、Static-News-and-Cases-Spec.md 与当前源码。

- C1（High/Correctness）：只改页面会遗漏 `src/server/discovery/runtime.ts` 的数据库查询，发现文件必须同源静态生成。
- C2（High/Correctness）：静态生成本身不能返回 410；应在公开页面前按代码清单处理历史撤回和永久跳转，并实测 HTTP 状态。
- C3（High/Risk）：本地没有内容数据库，不能把当前空清单视为真实内容已迁移。保留数据，记录外部盘点 blocker。
- C4（Medium/Maintainability）：CMS 专用 auth/media/audit/repository、管理脚本及测试应退场；migration 历史和受控备份/核对工具保留，不能按目录整批删除共享询盘代码。
- C5（High/Correctness）：Production 健康检查目前要求 DATABASE_URL；静态内容及健康检查不能继续以 CMS 数据库作为必填前提。部署模板和 smoke 应同步更新。
- C6（High/Requirement）：旧 release validator 的 CMS gate 需保留历史 schema 兼容，但新静态版本必须额外检查内容迁移清单，空 Preview 不可关闭生产门禁。
