# M5-07 官网细节优化验收

验收日期：2026-10-22（Asia/Shanghai）。结论：**Local Code Ready，未部署**。需求：[FR-27](../../1-Requirement/Mainland-Website-FR/FR-27-website-detail-refinements.md)；[计划](../../3-Plan/sprint-m5-07-website-detail-refinements.md)；[文档确认](../../4-Reviews/sprint-m5-07-review-confirm.md)；[代码复核](../../4-Reviews/sprint-m5-07-code-review-confirm.md)。复核均由实施者完成，不声称独立评审。

## 交付与内容核对

- 首页长标题、现实区文案、数据区标题和媒体权益名称更新；Hero后新增静态“今日内容橱窗”，四类内容说明与小程序入口，不显示具体文章或日期。保留眉题、副文案、背景和原体验按钮。
- 试用页会员专区8+改9+，替换谨慎区与下一步文案；其他页面12个内容模块、权益与报价不推算修改。
- 新闻删除官方公告区并撤回article-e2，保留四篇新闻、共享图片。原URL及尾斜杠均直接410/noindex，普通URL保留308规范化及query；发布清单为4条200、1条410。
- 关于页四段公司介绍与review1逐段精确一致；窄栏左对齐。联系区四张二维码图片、标题、说明居中，手机单列、平板/桌面两列，删除小程序说明中的“移动端可长按识别”。
- 四篇保留新闻与HEAD修改前数据逐字段比较完全一致，未改日期、正文或图片；首页metadata、Open Graph与JSON-LD标题同步。

## 命令与HTTP

环境：本地macOS，Node.js 24.21.0、pnpm 10.34.5；浏览器脚本使用bundled Node.js 24.19.0与Playwright 1.62.1。无新增依赖，无锁文件变更。

| 检查 | 最终结果 |
| --- | --- |
| `pnpm test` | PASS，45文件、292测试 |
| `pnpm lint` | PASS，tsc --noEmit |
| `pnpm build` | PASS，26个静态页面，4条新闻详情，standalone打包完成 |
| `pnpm smoke:standalone` | PASS，新增撤回尾斜杠410/noindex与普通URL的308/query检查通过 |
| `MEDIA_REDIRECT_SMOKE_ORIGIN=http://localhost:3000 pnpm smoke:media-redirects` | PASS，五条旧媒体跳转、query/fragment保留及未知路径 |
| `pnpm validate:release` | 命令通过；CODE_READY_WITH_EXTERNAL_LEGACY，localReady=true，productionReady=false；0项本地阻断、22项生产阻断 |
| 新闻HTTP | 四篇200/NewsArticle；article-e2及尾斜杠410、X-Robots-Tag=noindex,nofollow；未知文章404 |
| 发现文件 | sitemap.xml、feed.xml、llms.txt返回200，均含四篇保留新闻且排除article-e2 |
| 内容首响应 | 自动化静态渲染和浏览器禁用JS检查通过，介绍条可读，小程序按钮降级到/about#contact |

最终命令日志：`/tmp/kelaibao-m5-07-test-final.log`、`/tmp/kelaibao-m5-07-lint-final.log`、`/tmp/kelaibao-m5-07-build-final.log`、`/tmp/kelaibao-m5-07-smoke-final.log`、`/tmp/kelaibao-m5-07-media-redirects.log`、`/tmp/kelaibao-m5-07-release-final.log`。日志是本机临时证据，不代表真实云验收。

首轮smoke发现Next内置尾斜杠跳转先返回308；修复为从撤回清单生成跳转例外后，通过真实HTTP复验。普通跳转Location允许相对形式，以请求origin解析后严格比对目标和query。初次工具默认pnpm 11包装器与项目不符，未安装依赖；切换项目现有pnpm 10.34.5后执行上述最终检查。

## 四视口与交互

Browser plugin not available；使用bundled Playwright与已安装Chrome，未安装新浏览器。目标流程：首页介绍条 → 打开小程序体验弹窗 → 关闭并恢复焦点；无JS时进入关于页联系区。

- 最终standalone地址：`http://localhost:3000`。
- 320、390、768、1440px，首页、试用、新闻、关于共**16次页面检查**；唯一H1、title、首屏、无框架错误覆盖层、Hero断点图片、全部图片加载及无横向溢出通过。
- **16个交互流程**：四视口各验证介绍条弹窗打开、焦点环绕、Escape恢复、关闭按钮；三种窄屏导航打开/Escape/焦点恢复/路由选择；四视口会员服务链接与原12模块口径；四视口首页咨询到联系锚点；另有无JS入口验证。
- 二维码实际尺寸170×170，图片中心相对卡片中心偏差小于1px，文字居中；768/1440px两列、320/390px单列。
- 浏览器Console error/warning、pageerror与失败资源请求均为**0**。
- **22张截图**：四页面×四视口16张，390/1440px介绍条、公司介绍、联系区6张；查看了320/768/1440首页、390试用/新闻、介绍条与公司介绍/联系区代表图。长段区域截图增大临时浏览器高度以减少固定导航遮挡，不修改页面样式。

浏览器脚本：`/tmp/kelaibao-m5-07-qa.cjs`；最终记录：`/tmp/kelaibao-m5-07-qa.json`，status=PASS、pages=16、interactions=16。截图目录：`/Users/xulei/.codex/visualizations/2026/10/22/01a162ea-e95a-7d21-869d-f736f638a5d9/`，前缀`m5-07-`。

## 未完成的外部验收

未部署、未生成Linux x86_64 / Node.js 20.x FC ZIP；本地Chrome不能代替大陆网络、真实微信、正式域名或ESA/FC/RDS/OSS/DirectMail验收。既有授权、历史内容迁移和22项生产阻断保留，本次没有查询或修改历史数据库、OSS或云资源。
