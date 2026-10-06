# Sprint M5-04 独立文档评审（原生继承模型）

- 日期：2026-09-23。
- 评审身份：Codex 原生独立子代理，继承主代理模型（GPT-6 系列）；本轮未使用 `gpt-5.5`，不将该报告记为指定模型评审。
- 评审对象：`FR-24-news-cms-authoring.md` 与 `sprint-m5-04.md`，均为当前工作区文档待评审版本。
- 方法：先通过 codebase-memory-mcp 查找并读取编辑器、登录与 sanitizer；媒体目录图谱无结果，按项目规则直接读取实际接口、service 与 MySQL repository 补证。参考产品 `AGENTS.md`、全栈架构及新闻 CMS 核查设计。未修改运行时代码，未运行测试，未连接真实云资源。
- 结论：建议修订以下 1 项后进入实施。其余已承诺的正文保真、安全预览、封面授权和异步互斥设计方向可继续实施；本报告不是代码验收或生产可用证明。

| Severity | Type | Location | Issue | Evidence | Recommendation |
| --- | --- | --- | --- | --- | --- |
| High | Correctness | FR-24「失败与降级」第 52 行；Sprint §5.1 第 27–28 行、§5.2 第 37 行 | “会话失效要求重新登录并保留当前输入”尚无可执行的恢复路径和验收步骤。仅在接口失败时保持 React 表单不能兑现重新登录后继续保存：沿用同页登录跳转会卸载编辑器；另开页面重新登录后，原页面缓存的 CSRF 又已失效。该要求关系长时间编辑后的未保存正文，不能只靠离开警告收口。 | `src/components/admin/content-editor.tsx:69` 将表单存在组件 state；`:112` 的 `csrf()` 命中 `csrfToken.current` 后直接复用，当前没有失效清理或重新认证恢复。`src/components/admin/login-form.tsx:27` 登录成功执行 `window.location.assign("/admin")`。`src/app/api/admin/auth/session/route.ts` 从当前 session token 派生 CSRF；旧 token 不能用于新会话。此外 `media/presign`、`media/confirm` 路由把鉴权失败等错误统一返回 400，上传客户端不能仅凭 401 判断需登录。Sprint 当前只列“错误状态”和 CSRF 测试，没有重新认证后重试保存/上传的闭环。 | 在 FR/Sprint 固定一种最小方案，例如保留编辑页、显式在新标签页登录、回原页后通过 session endpoint 重新确认会话并清空/获取 CSRF；禁止通过自动跳转卸载未保存表单，不将正文写入 URL 或 Web Storage。明确如何识别上传接口的会话失效（可复查 session endpoint，无需扩大后端错误协议范围）。增加行为验收：编辑未保存正文与封面 → 会话失效导致保存或上传失败 → 重新登录 → 原页输入完整 → 新 CSRF 保存成功；未确认上传不绑定，过期 intent 提示重新上传。 |

本次未另列泛化问题：FR 已明确禁止原始危险 HTML 执行、要求不兼容内容留源码、图片仅使用服务器认可 URL；实现时仍须以实际旧 HTML 样例验证这些承诺。现有 sanitizer 允许表格、`pre/code`、图片尺寸等超过最小工具栏的内容，检查“加载、模式切换、仅改标题再保存”是否保留原始正文尤其重要，但当前文档已经要求无损降级，因此不重复列为缺陷。

已核对 scope 保持 MySQL/私有 OSS 和同一全栈应用，不新增图库、文件删除、迁移或真实云部署；真实 OSS/CORS/STS 证据缺失已在文档明确披露，不作为本轮新增问题。
