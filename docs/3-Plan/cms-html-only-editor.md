# CMS 仅 HTML 编辑补充计划

日期：2026-10-07。关联 FR-24、FR-11/12，覆盖 M5-04 原可视化设计；来源为用户明确要求删除可视化及相关代码和 test case。保留自动 Slug 和蓝色主操作按钮修改。

## 实施契约

- 新闻/案例新建与编辑共用 ContentEditor，直接放置受控 HTML textarea，保留 id=content-sourceHtml、HTML 正文可访问名称、500000 长度上限、required、editingDisabled、dirty/会话/导航保护及原 sourceHtml 字符串。
- 删除 rich-text-editor 组件、next/dynamic 加载、approvedImages 状态和从 sanitizedHtml 提取图片列表的逻辑；删除仅用于可视化的解析/链接检查/等价判断。保留上传确认后使用的 imageHtml 属性转义函数。
- 删除两份可视化专用测试，移除仍在 CMS UI 测试中的可视化/dynamic mock；保留并调整保存、冲突、会话、防丢稿、上传、安全净化、发布生命周期测试，针对 HTML 特殊格式和恶意源码补充实际控件回归。
- 移除五个 Tiptap 直接依赖及不再直接使用的 htmlparser2，使用 pnpm 更新 lockfile；sanitize-html 仍可保留其解析器传递依赖，不手工清除安全模块。
- 更新当前 FR/设计/README/运行说明，历史 Sprint/评审/证据保留原始记录并注明本次替代。

## 验收

pnpm test、pnpm lint、pnpm build；检查 src/tests/package 中无可视化组件与 Tiptap 引用；四视口 HTML 编辑和蓝色主按钮、安全预览、原样保存/重开、发布 SSR/下线/重发、错误保留输入。真实云配置缺失时不声称 OSS/生产通过。不部署生产。

## 交付

2026-10-07 已完成实现与本地核验，当前结果见 `docs/5-Evidence/cms-html-only-editor/README.md`。真实云和生产部署未纳入。
