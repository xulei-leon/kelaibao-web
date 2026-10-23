# 公开搜索抓取修正验证

日期：2026-10-23。对应 [Review Confirm](../../4-Reviews/public-search-crawl-review-confirm.md)。

## 正式域名检查（修改前）

- GET https://www.klinktool.com/robots.txt：HTTP 200，正文 User-Agent: * / Disallow: /。
- GET https://www.klinktool.com/：robots meta 为 noindex, nofollow, nocache。
- 以上仅为只读请求；本轮没有部署、修改云配置或刷新线上缓存。

## 修正

公开页面统一允许抓取和索引，移除 PUBLIC_CRAWL_STATUS 与环境双门禁，以及新闻/案例页面的 crawlEnabled 传递。robots 保留 /admin、/api 排除并声明 Sitemap；健康检查与已撤回页面继续不索引。同步现行需求、环境模板及部署说明。

## 本地验证

- pnpm test：45 个测试文件、294 项测试通过。
- pnpm lint：通过。
- pnpm build：通过，Next.js standalone 打包完成。
- 静态 HTML 检查：17 个构建页面具有允许索引的 robots meta；404/500 等错误页不计入。
- pnpm smoke:standalone：通过；HTTP 检查 robots.txt 的 Allow: /、Sitemap，遍历 Sitemap 的 16 个公开页面，核对 robots meta 和 X-Robots-Tag 均未禁止索引或跟随链接。
- pnpm validate:release：命令退出 0，localReady=true，productionReady=false；真实云、历史内容迁移和业务授权等既有证据仍未完成，不能视为生产就绪。
- git diff --check：通过。

首次主工作区构建遇到并行构建产物冲突（复制 edge-runtime-webpack.js 时 ENOENT），随后在隔离源码快照重新完成测试、构建与 HTTP 检查；不覆盖其他任务的工作区产物。快照未复制 .env.local，使用默认 Preview canonical，仅作本地验证，不作为生产发布制品。已核对本轮源码与测试快照一致。

HTTP smoke 首次还遇到并行文章跳转变更触发的既有 localhost/127.0.0.1 比较问题；保留并同步该任务的 smoke 修正后重新运行通过。该文章跳转不计入本轮实现范围。

## 线上生效待办

使用正式 HTTPS canonical 重新构建生产制品，按既有阿里云发布流程部署并刷新 robots.txt 和页面相关缓存，再复核正式域名。搜索引擎何时重抓和收录由其自身决定。
