# 客来宝统一中文官网工程规则

本文件适用于本仓库及其子目录。执行任务前先阅读相关需求、设计、Sprint 和已确认的评审结论。

## 协作与代码检索

- Codex 连接第三方服务时直接使用明确的 HTTPS 请求，代替 `webservice`；本地开发地址按项目配置使用 HTTP。
- 不要自动启用 Superpowers 技能，除非用户在提示词中明确要求启用。
- 项目使用 `codebase-memory-mcp` 知识图谱。代码发现优先依次使用 `search_graph`、`trace_path`、`get_code_snippet`、`query_graph`、`get_architecture`。
- 搜索字符串、错误信息、配置值或非代码文件时可使用 `rg`；图谱工具不可用或结果不足时，再使用 `rg` 和文件读取，并以当前源码为准。

## 项目与安全边界

- 本目录是独立的全栈 Next.js 项目。不得读取、复制、导入或依赖 `products/sino-en/src`，也不得共享账号、数据库、构建或部署配置。
- 客来宝是唯一主品牌，K-Link 是产品名，客来宝媒体是 `/media` 内的子业务；不得建立第二应用、双二级域名、`site_key`、独立媒体站或跨应用内容 API。
- 目标生产架构固定为 `ESA -> Function Compute 全栈 Next.js -> RDS MySQL + 私有 OSS`，询盘邮件使用 DirectMail。MySQL 是当前小型官网的成本优先选择，实际规格与总成本仍由 M2-00 验证；不得改用 ESA Pages、Vercel 或浏览器直连数据库。
- ESA 负责 TLS、CDN、WAF、限频、缓存和回源；Function Compute 是唯一的 Next.js 运行时，承载公开 SSR、`/admin` 和 `/api`。
- 首页、功能、团队、媒体、关于和政策页面继续由代码维护；CMS 只管理新闻与案例。不得擅自增加公众注册、支付、CRM、自动报价、预约或微信 API。
- 管理后台只有预创建的管理员账号，不开放注册。密码、Session、发布、上传和数据库操作必须由服务端处理；浏览器不得持有数据库、OSS 或阿里云长期凭据。
- 所有第三方集成直接使用明确的 HTTP(S) API，不得创建通用 `webservice` 抽象。DirectMail、OSS、ESA 缓存刷新等集成均应有独立边界和最小权限。
- 询盘通过同域 `/api/inquiry` 服务端校验、限频并调用 DirectMail；不建立线索数据库。姓名、联系方式和需求正文不得进入 URL、Web Storage、分析事件或应用日志。
- 新闻与案例必须服务端输出可抓取 HTML，并落实 canonical、metadata、结构化数据、sitemap、RSS 与实验性 `llms.txt`；SEO/GEO 只承诺技术基线，不承诺排名、推荐、AI 引用或流量。
- 视觉实现遵循 `docs/2-Design/Kelaibao-Unified-Website-Visual-Design-Spec.md`；技术实现遵循 `docs/2-Design/Alibaba-Cloud-Fullstack-Architecture-Spec.md`。
- 代码实施前必须完成目标 FR/Sprint 的文档 review-confirm。改动后至少运行 `pnpm test && pnpm lint && pnpm build`；交互或样式改动还需检查 320px、390px、768px 和 1440px 关键视口。

## 目录与文档入口

- `src/`：Next.js 应用与业务源码；服务端集成与数据操作位于 `src/server/`。
- `public/`：公开静态资源；`public/visual/generated/` 由资源构建脚本生成，不提交。
- `tests/`：自动化测试；`migrations/`：数据库迁移；`scripts/`：构建、维护与验证脚本。
- `deploy/`：部署配置示例；`spikes/`：技术验证。真实配置和凭据只放在被忽略的本地文件或服务端运行环境。
- `docs/1-Requirement/`：需求；`docs/2-Design/`：设计与运行手册；`docs/3-Plan/`：Sprint；`docs/4-Reviews/`：评审；`docs/5-Evidence/`：验收证据。
- 本地运行说明见 `README.md`；FC 制品与运行环境要求见 `FC-PACKAGING.md`。

## 开发与验证

- 使用 `package.json` 指定的 pnpm 版本和 Node.js 范围，依赖安装使用 `pnpm install --frozen-lockfile`，保留 `pnpm-lock.yaml`。
- 从 `.env.example` 配置 `.env.local`，不得提交真实密码、Session 密钥、云凭据、联系人或数据库文件。
- `pnpm dev` 启动开发服务；`pnpm test` 运行 Vitest；`pnpm lint` 和 `pnpm typecheck` 当前均执行 `tsc --noEmit`。
- `pnpm build` 生成静态资源并构建 Next.js standalone 制品。涉及打包或发布时追加 `pnpm smoke:standalone` 和 `pnpm validate:release`；发布门禁必须按文档保留真实证据。
- SQLite 仅用于 `local-test`，要求 Node.js 22.13+，本地数据放在 `.local-data/`。不得用于 FC 或 Production。
- FC ZIP 必须按 `FC-PACKAGING.md` 在 Linux x86_64、Node.js 20.x 环境中生成，不复用 Windows 原生依赖与构建产物。
- 验证结束报告修改内容、检查结果和未完成项；无法执行的检查明确说明原因，不将本地验证当作生产就绪证据。
