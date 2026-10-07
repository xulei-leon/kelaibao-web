# CMS Slug 自动生成本地验收

日期：2026-10-07。范围：新闻/案例共享编辑器、创建/保存 service、旧 API 兼容；文档门禁见 `docs/4-Reviews/cms-auto-slug-review-confirm.md`。

## 已验证能力

- 新建页面不再有 Slug 输入，显示“链接将在保存草稿后自动生成”；预览/创建不要求 slug。
- 服务端生成 news-/case- 加 16 位小写十六进制编号；已保存页面只读展示路径。中文/同名标题可独立创建，后台 POST/PUT 不提交 slug。
- 保存省略 slug 时事务内沿用当前 item.slug；旧内容、显式输入 API、数据库唯一约束、版本冲突与首次发布冻结保持原契约。
- 自动重复候选最多尝试 3 次；SQLite 实际事务覆盖重复/上限/回滚，MySQL fake connection 覆盖 ER_DUP_ENTRY 映射、回滚后重试和唯一一次成功 revision/audit。非重复错误不重试。

## 检查结果

| 检查 | 结果与边界 |
| --- | --- |
| pnpm test | 77 文件 / 427 项通过（含 11 项新增行为/集成测试） |
| pnpm lint | tsc --noEmit 通过；浏览器启动造成的自动生成配置变动恢复后再次检查 |
| pnpm build | Next.js 15.5.21 生产构建、standalone 打包通过；无新依赖或 schema 迁移 |
| pnpm smoke:standalone | SSR、Route Handler、responsive WebP、OG PNG、运行时环境与公开页面通过 |
| 浏览器身份/可用性 | http://localhost:3107；Chrome 154.0.8037.98、zh-CN、Asia/Shanghai；正确路由/新建标题/编辑内容，未出现框架错误覆盖层 |
| 新闻生命周期 | 登录→可视化中文正文→安全预览→创建→发布 HTTP 200；标题修改保存不改变路径/公开 revision；重开保留标题；再次发布→下线 410→重新发布 200；首个 SSR HTML 含正文和 canonical 路径 |
| 案例生命周期 | 同上，并确认未勾选授权时发布不可用，显式授权后正常发布；修改/重开/下线/重发链接稳定 |
| 四视口 | 320/390/768/1440px，共享编辑器 document.scrollWidth 等于 viewport 宽度，关键 input/textarea/button 无横向越界；截图人工检查路径折行与正文工具栏布局 |
| 控制台 | 未发现应用异常；安全预览触发既有 CSP 诊断，详情见下文，未声明控制台完全无输出 |
| 清理 | 隔离服务已停止，原 3000 服务未停止；Next 自动改动的 tsconfig.json/next-env.d.ts 已恢复；任务专用数据库、临时账号配置/凭据及隔离构建目录已清理，不提交临时配置或凭据 |

## 浏览器证据与限制

本会话未列出 Browser 技能，按 frontend-testing-debugging 的可用性规则使用已安装的 Playwright 与本机 Chrome，没有安装依赖。后台登录、Session/CSRF、数据库、保存/发布、SSR 均使用真实本地接口，无 HTTP fixture。SQLite 仅 local-test，独立临时管理员和数据库不改动现有后台数据；Next 临时启动配置使用隔离构建目录。

实际路径：新闻 `/news/news-805a936812fa8293`；案例 `/cases/case-faf2d1b4f50779a2`。截图/JSON 保存在本机临时目录 `/private/tmp/kelaibao-auto-slug-EDjAWh/`，不纳入 Git：

- [320px](/private/tmp/kelaibao-auto-slug-EDjAWh/editor-320.png)
- [390px](/private/tmp/kelaibao-auto-slug-EDjAWh/editor-390.png)
- [768px](/private/tmp/kelaibao-auto-slug-EDjAWh/editor-768.png)
- [1440px](/private/tmp/kelaibao-auto-slug-EDjAWh/editor-1440.png)
- [结果 JSON](/private/tmp/kelaibao-auto-slug-EDjAWh/results.json)

安全预览的原组件 `src/components/admin/safe-html-preview.tsx` 在 meta CSP 中包含 frame-ancestors，Chrome 输出两次 “The Content Security Policy directive 'frame-ancestors' is ignored when delivered via a <meta> element.”。浏览器脚本先保留完整诊断，后核对其仅来自两次既有预览，且两类内容生命周期、四视口与请求不提交 slug 的断言已完成；最终结果为 PASS_WITH_EXISTING_PREVIEW_CSP_DIAGNOSTIC。本次没有扩展修改预览 CSP。

初次环境启动受到 Next dev 环境重载影响，改用显式进程环境与 @next/env 初始环境注册后重跑真实流程；页面 title 沿用网站默认 title，身份验证以正确 URL、客来宝 title 与新建/编辑标题为准。测试中的 crypto mock 对齐 Vitest CommonJS/ESM 互操作，MySQL revision 参数索引按源码纠正后均通过。没有修改应用行为来迁就验证脚本。

本次未部署或验证真实 FC/RDS/OSS/ESA，未执行生产发布；本地结果不代表 Production 门禁通过。
