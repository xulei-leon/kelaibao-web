# Sprint M5-07 代码 Review Confirm

日期：2026-10-22。方式：实施者源码、自动测试、standalone HTTP与浏览器复核，不声称独立评审。需求：[FR-27](../1-Requirement/Mainland-Website-FR/FR-27-website-detail-refinements.md)；[文档确认](sprint-m5-07-review-confirm.md)。

| 检查 | 决策与结果 |
| --- | --- |
| 文案与范围 | 首页、试用、新闻、关于按已确认方案修改；公司介绍四段与review1原文逐段精确比较一致。其他四篇新闻记录与修改前逐字段一致，包含日期、正文和图片。 |
| 内容橱窗与组件边界 | 服务端静态介绍条，无日期、具体内容或动态取数；复用MiniProgramTrialButton和index来源、既有弹窗及无JS联系入口。React最佳实践复核未发现新增Hooks/客户端状态、重复取数或序列化负担。 |
| 长标题与二维码样式 | 首页独立ops-home作用域使用可撑开Hero；介绍条flex换行；公司介绍760px窄栏左对齐，contact-qr统一图片block/居中，原桌面/平板两列和手机单列保留。 |
| 公告撤回 | article-e2从公开ARTICLES移除，加入WITHDRAWN_CONTENT；列表、RSS、sitemap、llms同源排除。共享art-e1/art-e2图片保留。 |
| 尾斜杠先308导致410验收失败 | 首轮standalone smoke复现；Next内置跳转早于middleware。next.config关闭内置跳转，从同一撤回清单生成跳转例外，其余URL继续308。最终HTTP验证原地址和尾斜杠均直接410/noindex，普通页面保留308与query；旧媒体跳转追加回归通过。 |
| HTTP断言的相对Location | Next配置跳转返回相对Location；smoke以请求origin解析后比较完整目标，仍严格验证308、路径及query，不要求无意义的绝对Header形式。 |
| SEO一致性 | 首页H1、metadata与OG标题同步，JSON-LD通过原metadata源更新；canonical与Preview索引门禁保留。 |
| 旧断言 | 更新被FR-27替代的标题、描述和五篇数量断言；修正旧阅读顺序断言中找不到标题仍可能通过的问题，新增410/发现排除与静态内容回归。 |
| 技术及浏览器验收 | 45测试文件、292项通过，lint/build、standalone和旧媒体smoke通过；四页面×四视口、16交互流程、22截图，控制台与失败资源请求为0。 |

结论：LOCAL_CODE_READY。实现符合本轮授权与FR-25/FR-27边界，最终结果及证据位置见[M5-07验收](../5-Evidence/m5-07/README.md)。未部署，productionReady=false，22项生产阻断保留。
