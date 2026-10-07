# 新闻管理删除按钮补充计划

日期：2026-10-07。关联 FR-12；来源：用户要求在新闻管理的“编辑”旁增加“删除”。保留当前工作区已有的自动链接、HTML 编辑器和配色改动。

## 实施契约

- 仅新闻列表提供删除按钮。删除前显示含文章标题的确认提示；取消不请求服务端，处理中禁用重复操作，失败保留列表并显示错误。
- DELETE /api/admin/content/[id] 复用 Session、Origin/Host、CSRF 和 expectedVersion；服务端在事务内拒绝案例和旧版本。
- 采用逻辑删除：content_items 新增 nullable deleted_at；删除生成 revision、递增 version、写 content_deleted 审计。后台列表、详情、历史接口与后续变更均排除已删除项。
- 公开状态仍为 draft/published/offline。曾发布的新闻删除后为 offline，公开详情保持 410，列表和发现文件移除；未发布草稿保持 404。保留 slug、历史、媒体和已有 purge job，不提供恢复入口。
- 曾发布内容删除与精确 offline purge outbox 同事务提交，提交后尝试刷新。图片和 OSS 文件不删除，不访问云资源验收生产。
- MySQL 使用新增 expand-only migration；SQLite 升级到 schema 3，兼容已有 schema 1/2 数据，运行时与管理员脚本同步检查版本。本地迁移显式执行，不能在请求中自动迁移。
- 覆盖确认/取消、失败/冲突、草稿/发布/下线删除、拒绝案例/匿名/CSRF、不可重新发布、审计/outbox 与回滚；pnpm test、pnpm lint、pnpm build；浏览器 320/390/768/1440px 验证按钮、列表移除和公开响应。

## 范围边界

逻辑删除保留修订和审计；不提供物理清除、图片回收、案例删除、批量删除或生产部署。真实 MySQL/ESA 未连接时如实记录本地证据边界。

## 本地验收

2026-10-07：78 个测试文件 / 432 项通过；pnpm lint、pnpm build、pnpm smoke:standalone 通过。MySQL 使用事务连接 fixture，SQLite 使用真实数据库；schema 1/2 升级、可重入迁移、审计/outbox 回滚与不可复活均通过。

本机 Chromium/Playwright 在 localhost:3000 完成确认/取消、删除后刷新、公开 410/404、版本冲突保留文章和刷新重试。320/390/768/1440px 无页面级横向溢出，表格内部保持横向滚动，按钮可点击；截图和临时脚本位于 /tmp，未提交。页面无框架报错或 pageerror，唯一控制台 409 来自预期版本冲突。

本机 SQLite 升级前保存一致性备份，已有两篇用户文章保留；仅创建并逻辑删除本次验证文章。真实 MySQL migration/ESA purge 未执行，生产部署仍需显式应用 005 migration 并留存真实验收证据。
