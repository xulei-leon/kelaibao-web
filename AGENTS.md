# 客来宝统一中文官网工程规则

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
