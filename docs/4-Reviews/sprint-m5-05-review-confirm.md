# Sprint M5-05 Review Confirm

日期：2026-10-20。复核方式：实施者静态复核，不声称独立评审。输入：FR-25、M5-05、静态内容设计、AGENTS.md、`sprint-m5-05-review-by-implementer.md` 与其指向的源码。

| No. | Severity | Type | Review Source | Original Comment Summary | Decision | Evidence | Follow-up Plan / Rejection Reason |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | High | Correctness | C1 | 发现文件仍查库 | Accept | discovery/runtime.ts 调用 repository | 页面与发现文件共用静态清单，发现路由强制静态构建，测试无数据库场景。 |
| 2 | High | Correctness | C2 | 静态页面需要真实 410 | Accept | FR-25 URL 契约 | 用 Next.js middleware 在详情前处理代码撤回/跳转清单，未知路径保持 404；以 standalone HTTP 测试验证。 |
| 3 | High | Risk | C3 | 缺真实历史内容清单 | Accept | 当前无 .local-data 内容库，未访问真实库 | 不导入草稿或补造文章；留存迁移 blocker 和只读盘点路径，生产校验继续阻断。 |
| 4 | Medium | Maintainability | C4 | CMS 专用调用需完整退场 | Accept | auth/media/audit 只被管理路由和内容事务引用 | 移除专用源码、脚本和测试，保留 SQL 历史、必要离线核对/迁移工具及询盘模块。 |
| 5 | High | Correctness | C5 | 健康检查与部署配置仍要求 CMS | Accept | config.ts Production 强制 DATABASE_URL | 健康检查仅检查实际应用运行配置；数据库工具单独校验连接。移除 FC CMS 密钥模板，补充无库 Production 健康测试。 |
| 6 | High | Requirement | C6 | 静态版本不能沿用 CMS gate 结论 | Accept | release-validator.mjs 与旧 inventory schema | 保留旧 gate 兼容用于历史证据；当前发布命令增加静态内容迁移证据检查，未核对真实数据时保持 BLOCKED。 |

结论：APPROVED_FOR_IMPLEMENTATION。用户已要求按规划完成代码，以上裁决落实到实现与验证；真实历史数据、云资源发布/缓存与视口证据分别报告。文档门禁通过不代表代码或生产上线完成。
