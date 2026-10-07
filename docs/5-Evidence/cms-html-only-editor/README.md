# CMS 仅 HTML 编辑本地验收

日期：2026-10-07。范围：新闻/案例共享新建与编辑页、可视化代码/依赖/测试清理；同时收尾后台蓝色按钮修改。此前自动 Slug 保留。

## 修改与清理

- 正文仅为带标签的 HTML textarea，id、500000 长度上限、required、禁用/会话/版本冲突/离开保护继续有效。没有 contenteditable、可视化入口、格式工具栏或模式切换。
- 删除 rich-text-editor.tsx、动态加载、approvedImages、可视化 HTML 白名单/链接检查/结构等价判断及图片提取逻辑。上传仍使用 imageHtml 对属性转义后追加 img 标签；封面与服务端 sanitizer 未移除。
- 删除 m5-04-rich-text.test.tsx（2 项）与 m5-04-editor-html.test.ts（13 项）；删除 CMS UI 测试中的 next/dynamic mock，改为真实 textarea。新增 2 项 HTML 原样保存/不生成活动 DOM、服务端净化预览/输入保留的回归测试，保留上传、事务、会话、冲突、发布测试。
- 移除 5 个 Tiptap 直接依赖和 htmlparser2 直接依赖；pnpm 移除 52 个相关包，lockfile 只有删除，无无关版本升级。sanitize-html 的传递解析器依赖按原锁文件保留。
- 黑底主操作的五处源码统一复用 cta--product-primary：#094092 背景、浅白文字、#3f6cc4 hover；原间距、圆角、禁用透明度和全局焦点规则不改。

## 检查

| 项目 | 结果与边界 |
| --- | --- |
| pnpm install --frozen-lockfile | 通过，lockfile 与 package.json 一致 |
| pnpm test | 75 个文件 / 414 项通过 |
| pnpm lint | tsc --noEmit 通过，临时 Next 配置恢复后再次检查 |
| pnpm build | Next.js 15.5.21 / standalone 制品通过；新建与编辑路由 First Load JS 从本次之前 176 kB 降到 115 kB |
| pnpm smoke:standalone | SSR、Route Handler、responsive WebP、OG PNG、运行时环境、公开页通过 |
| 源码与锁文件检索 | src/tests/package.json/pnpm-lock.yaml 无 RichTextEditor、rich-text-editor、@tiptap、safeVisualHtml、safeEditorLink、equivalentEditorHtml、htmlImageSources、approvedImages、next/dynamic 遗留 |
| 浏览器 | 本机 Chrome 154.0.8037.98、Playwright、http://localhost:3107、zh-CN、Asia/Shanghai，独立 local-test SQLite 和临时账号，真实 API/Session/CSRF/数据库/SSR，无 HTTP fixture |
| HTML 新建/编辑 | 新闻和案例均只有 textarea；旧格式表格/实体与危险脚本字符串保留在源稿，未创建活动表格/脚本/外部图片；编辑区域没有 contenteditable 或可视化/模式切换控件 |
| 安全预览/公开 | 净化后 iframe 不含危险脚本或未确认外部图片，textarea 不被净化响应覆盖；发布后首个 HTTP 200 HTML 包含安全正文与 canonical，不包含危险源稿 |
| 保存与生命周期 | HTML 更新保存后公开 revision 不变，刷新恢复原 HTML 字符串；显式再发布后更新公开内容；下线返回 410，再发布返回 200。案例首次授权门禁继续生效，链接保持稳定 |
| 蓝色按钮与布局 | 登录、首页、新闻/案例列表、新建/编辑、独立 HTML 预览，合计 34 个页面/视口样本；320/390/768/1440px 背景 rgb(9,64,146)、文字 rgb(248,251,255)、hover rgb(63,108,196)，页面和目标控件无横向溢出 |
| 键盘焦点 | 九种控件均可聚焦，最终检查 :focus-visible 为真、2px solid rgb(37,99,235)；焦点检查等待浏览器样式提交后采集，不修改产品焦点代码 |
| 控制台 | 没有应用异常或框架错误覆盖层；两次预览仍有既有 meta CSP 的 frame-ancestors 诊断，已单独记录 |

## 本机证据

截图、浏览器脚本、JSON 位于 `/private/tmp/kelaibao-html-only-GVEUVW/`，不提交 Git。结果 JSON 中两条生命周期分别对应 `/news/news-1681d7d3db7553af` 和 `/cases/case-62ca6066a0a104dd`。

- [结果 JSON](/private/tmp/kelaibao-html-only-GVEUVW/results.json)
- [HTML 编辑 320px](/private/tmp/kelaibao-html-only-GVEUVW/html-editor-320.png)
- [HTML 编辑 390px](/private/tmp/kelaibao-html-only-GVEUVW/html-editor-390.png)
- [HTML 编辑 768px](/private/tmp/kelaibao-html-only-GVEUVW/html-editor-768.png)
- [HTML 编辑 1440px](/private/tmp/kelaibao-html-only-GVEUVW/html-editor-1440.png)
- [蓝色登录按钮](/private/tmp/kelaibao-html-only-GVEUVW/login-320.png)
- [蓝色保存按钮](/private/tmp/kelaibao-html-only-GVEUVW/edit-news-1440.png)

浏览器首次公开页冷编译超过 APIRequest 默认 30 秒，延长测试等待至 90 秒后重跑；首次发布后尚无新 draft 时，发布草稿按钮本来不显示，脚本按实际状态机修正断言后重跑。这些是验收脚本修正，没有调整应用行为来迎合脚本。此前按钮验收使用临时 tsconfig 的路径别名配置不完整，改用项目真实 tsconfig 的隔离构建目录后完成复核。

历史 M5-04 的可视化设计/测试数仅代表历史版本，当前 FR、设计、README、Runbook 已更新为 HTML-only，旧 Sprint 追加了后续替代说明。

## 边界与清理

本会话未提供 Browser 技能，沿用已安装的 Playwright + 本机 Chrome。未安装浏览器依赖，未访问生产数据。隔离服务结束后清理临时账号配置/凭据、数据库和构建目录，恢复 Next 自动生成的 tsconfig.json/next-env.d.ts；保留既有工作区变更；只对本次 3107 验收服务发送停止信号，不对其他服务执行停止操作。最终检查时 3000 未监听，本次未重新启动日常开发服务。

没有执行生产部署，真实 RDS/OSS/FC/ESA 本次未验证。图片上传的原有自动测试继续通过，但本轮浏览器不包含真实 OSS 上传。既有预览 meta CSP 诊断为 “The Content Security Policy directive 'frame-ancestors' is ignored when delivered via a <meta> element.”，本次未扩展修改预览组件。
