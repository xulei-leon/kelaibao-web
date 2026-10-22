# Sprint M5-07 官网细节优化

日期：2026-10-22。需求：[FR-27](../1-Requirement/Mainland-Website-FR/FR-27-website-detail-refinements.md)。状态：Local Code Ready，未部署；292测试、lint/build、standalone/旧媒体smoke、四视口16页面及16交互流程通过，生产22项阻断保留。[验收记录](../5-Evidence/m5-07/README.md)。

1. 核对review1与已确认方案，登记静态介绍条、公告连同文章下线两项决策，完成文档review-confirm。
2. 更新首页、试用、关于页面及局部响应式样式；复用小程序弹窗，首页metadata/OG/JSON-LD同源。
3. 移除新闻公告区及公开文章，使用FR-25撤回清单返回410；同步发现文件与发布清单，保留共享图片。
4. 更新内容与新闻数量断言，验证撤回路径、首响应、SEO和无JS入口；完成代码复核。
5. 运行test/lint/build、standalone smoke/release validator；四页面×四视口、关键交互、HTTP与截图验收，记录实际结果和外部遗留。

不部署、不新增云资源、账号、支付、API或数据库，不修改其他页面报价与内容模块总数。复核由实施者完成，不声称独立评审。
