# FR-26 运营原型改版

日期：2026-10-20。输入：用户提供的 `var/web` HTML、CSS、图片，以及用户要求参考原型修改本项目的授权。范围为本地代码改版，不包含发布。

- 将原型的内容、摄影 Hero、蓝色配色、卡片、流程图和页面节奏应用到统一官网。保留客来宝主品牌、K-Link 产品层级、FC 架构、政策、询盘与二维码功能。
- 路由映射：index → `/`；trial → `/trial`；membership → `/features`；team → `/team`；media → `/media`；packages → `/media/packages`；about → `/about`；news → `/news`。不建立第二应用。会员开通仅为小程序功能说明，官网不提供支付。
- 原型五篇文章纳入 FR-25 静态清单，使用 `/news/article-*`，复用 canonical、JSON-LD、RSS、sitemap 和 llms。原型未给发布日期，本站首次导入发布日期记为 2026-10-20，不冒充原有 CMS 历史日期；旧内容核对仍独立待办。
- 原型中同图重复引用合并；未交付案例和视频不显示方括号占位。关于页到访入口使用现有图片灯箱，避免链接回自身。统计人数冲突暂统一为首页的 10000+；不代表真实性验收。
- 小程序 CTA 与媒体咨询 CTA 复用现有无障碍弹窗、二维码失败路径和无 JS 联系入口；首页、会员和团队咨询按原型跳转 `/about#contact`，不复制原型 DOM 操作脚本。照片和流程图使用本地静态资源，移动和桌面 Hero 使用 picture，无客户端换图脚本。
- 媒体咨询旧锚点继续可达；保留政策链接、无结果保证边界和 Preview 抓取限制。原型价格、统计、人物评价、投资叙事与图片授权须在生产前核实；既有发布门禁不豁免。
- 验收：`pnpm test`、`pnpm lint`、`pnpm build`，standalone smoke / release validator；320、390、768、1440px 页面、菜单、弹窗、FAQ、文章和锚点验证。

实施计划：[M5-06](../../3-Plan/sprint-m5-06-operations-prototype-refresh.md)。
