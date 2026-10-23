# 公开页面搜索抓取策略 Review Confirm

日期：2026-10-23。方式：实施者对需求、架构、现行源码及正式域名 HTTP 响应复核，不声称独立评审。

用户要求：“检查本网站是否有 robots.txt 禁止搜索？要求不能禁止”。此要求覆盖 FR-07、FR-13 及历史 M2-04 中默认阻止公开页面索引的策略。

## 检查与决策

- 正式域名 `https://www.klinktool.com/robots.txt` 实测 HTTP 200 且 `Disallow: /`；首页实测 `noindex, nofollow, nocache`。
- 根因：公开抓取同时依赖 production 环境和 PUBLIC_CRAWL_STATUS=production-approved，默认 blocked；robots、全局 metadata 与静态新闻/案例共用此开关。
- 移除公开抓取开关：公开页面在所有站点环境允许抓取，robots 输出 Allow: / 和 sitemap；公开页面 metadata 输出 index,follow，不再受遗留 PUBLIC_CRAWL_STATUS 影响。
- `/admin`、`/api` 继续排除抓取，健康检查和已撤回 410 页面保留不索引处理；它们不属于公开获客内容。
- 同步现行需求、部署说明与环境模板；历史评审保持原时点事实，由本记录覆盖索引策略。
- 运行 pnpm test、pnpm lint、pnpm build；检查构建制品 robots 和各公开路由 HTML，执行 standalone HTTP 验证。没有交互或样式变更。
- 本轮修改与本地验证不等于线上部署，线上生效必须重建发布并复核正式域名与缓存。

结论：APPROVED_FOR_IMPLEMENTATION。依据用户明确要求实施此修正，不涉及云资源或其他生产验收门禁的批准。
