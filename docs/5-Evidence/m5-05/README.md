# M5-05 静态新闻与案例本地验收

日期：2026-10-20。状态：`LOCAL_CODE_READY_WITH_EXTERNAL_LEGACY`；Production `BLOCKED`。范围：FR-25 代码迁移、文档/代码实施者复核及本地验证。未使用独立 reviewer，未连接真实内容库、阿里云或线上站点。

## 已实现

- `src/content/articles.ts` 为唯一公开内容源，支持受控正文块、稳定 slug、日期、图片，以及代码维护的撤回/跳转清单；无本地已核实的文章，保持空列表。
- 新闻/案例列表、详情使用 getStaticProps/getStaticPaths，fallback=false；构建路由清单为 SSG。未知 URL 返回 404。middleware 对代码清单给出 410 或 308；当前真实撤回/跳转清单为空，410/308 已用注入的测试清单验证 Response，尚无真实历史 URL 的云端 HTTP 证据。
- 页面、摘要、metadata、JSON-LD、sitemap、RSS、llms 共用静态来源；发现路由为 force-static。不查询内容 repository，不依赖数据库失败降级。
- 移除 CMS 管理路由/API、认证/Session、HTML 编辑、上传、内容事务/修订、审计与 outbox worker 等专用代码/工具/测试，以及 argon2、sanitize-html 和对应类型依赖。MySQL 仅保留受控离线盘点/历史 SQL 工具所需依赖和基础设施校验；SQL migration 与原数据保留。
- Production 健康检查不要求 CMS 配置；FC 模板只保留当前实际运行依赖。构建生成 URL manifest 并随 standalone/FC 制品打包；缓存工具默认 dry-run，真实 apply 要求上版清单并独立 HTTPS 调用 ESA。
- 发布校验保留历史 schema 兼容，以静态迁移 gate 替代旧 CMS 品牌迁移 gate；云资源/备案/授权/口径/恢复等其余门禁保留。

## 命令结果

| 检查 | 实际结果 |
| --- | --- |
| 依赖 | 删除 CMS 直接依赖后，`pnpm install --offline --frozen-lockfile --ignore-scripts` 通过，移除 33 个已不需要的安装包；保留其余锁定版本 |
| `pnpm test` | 45 个测试文件，295 项通过；原 CMS 专用测试已随功能撤销，不能继续引用原 432 项作为本次结果 |
| `pnpm lint` | 通过（tsc --noEmit） |
| `pnpm build` | 通过；新闻/案例为 SSG，三个发现文件为 Static，无 CMS 后台/API 路由；最终 CSS 包含长标题断行修复 |
| `pnpm smoke:standalone` | 通过；production runtime、空 DATABASE_URL/管理员配置下健康、新闻/案例、发现文件正常；未知文章及旧 CMS 入口为 404；图片与询盘缺配置安全失败回归通过 |
| `pnpm validate:release` | 退出 0；localReady=true、productionReady=false、CODE_READY_WITH_EXTERNAL_LEGACY |
| `pnpm validate:release --require-production-live` | 按预期退出 1，保留真实数据盘点及云/备案等 blocker |
| `pnpm cache:refresh` | 在 preview.example.invalid 上 dry-run 退出 0，列出 7 个当前需刷新入口；未执行 apply，没有外部请求 |
| 源码与脚本检查 | 公开源码没有退休 CMS 模块导入；package 脚本入口均存在，原 migrations 未修改 |

构建和 smoke 在 Windows、Node.js 24.15.0、pnpm 10.34.5 完成；FC 要求的 Linux x86_64/Node.js 20 ZIP 和真实 test alias 尚未验证。Next.js 正常构建已重新生成旧路由类型缓存；未通过手工删除绕过校验。

## 浏览器验证

环境：`http://127.0.0.1:4180` standalone，Playwright + 本机 Edge headless。Browser 插件未列出；捆绑 Chromium 可执行文件不存在，使用已安装 Edge，没有安装浏览器或新增项目依赖。

320、390、768、1440px 各验证 `/news`、`/cases` 真实空状态与新闻/案例的非空列表、长标题/正文/图片夹具，共 24 场景。夹具由真实共享组件服务端渲染，通过浏览器测试请求拦截展示，不写入 ARTICLES、不进入制品，不能当作真实文章迁移证据。

| 项目 | 结果 |
| --- | --- |
| 页面标题、H1、有效内容与 HTTP | 24 场景通过，真实列表为对应标题，无空白页或框架报错层 |
| 横向溢出、标题/正文内部裁剪 | 修复长英文标题后，24 场景均为 0 |
| 图片与控制台 | 无坏图，无 pageerror/console error |
| 交互 | 390px 打开导航 aria-expanded=true，Escape 后 false；详情面包屑返回 /news 成功 |
| 人工截图检查 | 已查看桌面新闻页与 390px 长标题详情；修复前标题越界，修复后完整换行，图片在正文列内 |

截图和脚本位于任务外部可视化目录：[完整结果](C:/Users/xulei/.codex/visualizations/2026/10/20/01a159b2-fc2d-7032-92b7-8617705afd39/m5-05/results.json)、[桌面新闻页](C:/Users/xulei/.codex/visualizations/2026/10/20/01a159b2-fc2d-7032-92b7-8617705afd39/m5-05/news-1440.png)、[390px 详情夹具](C:/Users/xulei/.codex/visualizations/2026/10/20/01a159b2-fc2d-7032-92b7-8617705afd39/m5-05/__qa-news-detail-390.png)。

## 外部未完成项

1. 未提供真实旧 CMS 数据和 URL 清单，无法核对实际 published/草稿/下线/删除条目、图片授权和最终 200/410/308 映射；`static-migration.json` 刻意保持未完成。可在受控环境用只读身份运行 content:inventory 后逐条审查。
2. 未创建 Linux FC ZIP、部署 test alias、执行真实 ESA 刷新/任务完成检查或 DirectMail 发信；域名备案、微信浏览器、云恢复、成本与其他既有生产证据继续按门禁补齐。
3. 未清库、删除 SQL/审计/媒体或退役 RDS/OSS。回退所需旧 FC 版本、数据库与媒体须继续保管。

当前结果证明代码完成及本地可运行；不能宣称真实内容迁移完成或 Production Live。
