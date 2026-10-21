# M5-06 运营原型改版验收

验收日期：2026-10-21（Asia/Shanghai）。结论：**Local Code Ready，未部署**。需求：[FR-26](../../1-Requirement/Mainland-Website-FR/FR-26-operations-prototype-refresh.md)；[文档评审](../../4-Reviews/sprint-m5-06-review-confirm.md)；[代码复核](../../4-Reviews/sprint-m5-06-code-review-confirm.md)。复核均由实施者完成，不声称独立评审。

## 交付

- 参考用户提供的 `var/web` 更新首页、会员服务、团队效率、媒体服务、媒体套餐、关于、新闻，并新增 `/trial`。会员服务继续使用 `/features`，保留原站 URL。
- 接入 14 张手机/桌面 Hero、4 张流程图、8 张文章配图（WebP）与运营 Logo；二维码与现有文件逐个 SHA-1 比对一致。Hero 首响应含 picture，下面的流程/正文图片懒加载。
- 五篇原型文章转为 FR-25 静态内容块，使用原型新闻列表中的完整短摘要，去掉重复配图；metadata、canonical、NewsArticle、sitemap、RSS、llms 同源生成。原型无日期，本站导入日期明确记录为 2026-10-20，不作为历史 CMS 首次发布日期证明。
- 保留手机菜单、试用二维码弹窗、媒体咨询弹窗、FAQ、办公室/到访灯箱、政策、询盘 API 与旧媒体跳转。团队/会员咨询按原型进入关于页联系区。
- 去掉空案例/视频占位；关于页不再链接回自身；人数冲突暂统一为 10000+。保留四档标准价、特供价、会员价，50% 的计算基准修正为特供价。

## 命令与 HTTP

执行环境：本地 macOS，Node.js 24.21.0、pnpm 10.34.5。没有新增依赖或修改锁文件。

| 检查 | 结果 |
| --- | --- |
| `pnpm test` | PASS，45 文件、289 测试 |
| `pnpm lint` | PASS，`tsc --noEmit` |
| `pnpm build` | PASS，生成 5 条静态文章路径及 standalone 制品 |
| `pnpm smoke:standalone` | PASS，静态内容、未知文章 404、旧 CMS 404、SSR、健康接口、资源与制品检查 |
| `pnpm validate:release` | 命令通过；`CODE_READY_WITH_EXTERNAL_LEGACY`，`localReady=true`、`productionReady=false`；22 项 Production blocker 保留 |
| 最终文章 HTTP | 五篇首响应正文、canonical、NewsArticle、返回链接、图标通过；sitemap/RSS/llms 均包含五篇 |
| 抓取状态 | 保持现有 `noindex, nofollow, nocache`，未擅自开放 Preview 抓取 |

命令日志：`/tmp/kelaibao-operations-final.log`；release 输出：`/tmp/kelaibao-operations-release-final.json`。日志为本机执行记录，不能替代真实云验收。

## 四视口与交互

Browser 插件未提供；使用已有 bundled Playwright 与已安装 Chrome，无额外浏览器安装。地址为 `http://localhost:3000`，运行最终 standalone 制品。

- 320、390、768、1440px，8 个入口页面和 5 篇文章，共 **52 次页面检查**。
- **19 项交互检查**：试用弹窗打开/Escape/焦点恢复；手机菜单打开/Escape/焦点/选择路由；团队咨询进入联系区；媒体咨询打开企业微信弹窗；FAQ 展开和办公室灯箱打开/Escape。
- **18 个内部链接及其跨页锚点**返回正确页面/内容。

| QA 项目 | 结果 |
| --- | --- |
| 页面身份、title 与唯一 H1 | PASS |
| 首屏有实际内容 | PASS |
| 无框架错误覆盖层 | PASS |
| 页面无横向溢出，全部正文图片加载，Hero 断点选图正确 | PASS |
| Console error/warning 与失败资源请求 | 0 |
| 截图 | 10 张，已查看桌面/手机首页及手机文章 |
| 交互与焦点 | PASS |

浏览器记录：`/tmp/kelaibao-operations-qa.json`。截图目录：`/Users/xulei/.codex/visualizations/2026/10/20/01a15a00-81a1-7400-9f4b-760afff35027/`，文件前缀 `operations-`。最终本地预览保留在 `http://localhost:3000`。

## 未完成的外部验收

- 未部署、未生成 Linux x86_64 / Node.js 20.x FC ZIP；本机 standalone 不能直接作为 FC 发布验收。
- 未核验新图片/人物评价授权、用户规模、投资叙事、市场比价与价格有效期。四项新增宣传口径记录为 accepted-blocked，claims 总数 26；既有授权/云门禁不豁免。
- 真实历史 CMS 内容、URL 与媒体授权迁移仍按 M5-05 单独核对；本轮未查询、修改或删除历史数据库/OSS。
- 未做真实 DirectMail、ESA/FC/RDS/OSS、正式域名、大陆网络或真实微信内置浏览器验收；不以 Chrome 本地通过代替这些结果。
