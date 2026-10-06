# 客来宝统一中文官网阿里云全栈架构规格

| 字段 | 内容 |
| --- | --- |
| 文档版本 | `v0.2` |
| 文档状态 | M2 架构基线已实现；M3 品牌与信息架构迁移不改变运行协议；真实云与成本门禁仍为 `BLOCKED/DEFERRED` |
| 更新日期 | `2026-07-31` |
| 架构决策 | `ESA + Function Compute 全栈 Next.js + RDS MySQL + OSS + DirectMail` |
| 适用代码 | `products/kelaibao/` |

## 1. 目标与决策

本规格定义客来宝统一中文官网的中国大陆全栈运行架构。Function Compute（FC）是唯一 Next.js 运行时；ESA Pages 与 Vercel 不在目标架构内。客来宝、K-Link 和客来宝媒体共享一个应用、域名、管理后台、数据库和 CMS；不得增加第二应用、双二级域名、`site_key` 或按 Host 切换品牌。

```text
访客/管理员
    |
    v
Alibaba Cloud ESA
TLS / CDN / WAF / 限频 / 缓存 / 回源
    |
    v
Function Compute：全栈 Next.js
公开 SSR + /admin + /api
    |
    +--> RDS MySQL：管理员、内容、修订、会话、审计
    +--> 私有 OSS：新闻/案例图片
    +--> DirectMail HTTPS API：询盘通知
```

FC、RDS 与 OSS 默认统一使用华南 1（深圳）。RDS 使用 MySQL 基础版、单可用区与自动备份；MySQL 是针对当前小型官网的成本优先选择。正式上线前必须完成一次恢复演练。具体引擎版本、实例规格、存储与总费用由 M2-00 基于实际报价确认，不在文档中虚构采购结果。

## 2. 域名与路由

公开站、管理后台与 API 使用同一正式域名：

| 路径 | 运行位置 | 缓存 |
| --- | --- | --- |
| `/`、`/features`、`/team`、`/media`、`/about`、`/contact`、政策页 | FC Next.js | ESA 长缓存或按发布版本刷新 |
| `/news`、`/news/[slug]` | FC Next.js SSR | 最长 60 秒 |
| `/cases`、`/cases/[slug]` | FC Next.js SSR | 最长 60 秒 |
| `/services`、`/for/*`、`/method` | FC/Next.js 永久重定向 | 指向 `/media` 对应锚点，不生成旧 canonical |
| `/admin/*` | FC Next.js | 禁止共享缓存 |
| `/api/admin/*` | FC Route Handler | 禁止缓存，WAF/限频 |
| `/api/inquiry` | FC Route Handler | 禁止缓存，WAF/限频 |
| `/feed.xml`、`/sitemap.xml`、`/llms.txt` | FC Next.js | 最长 60 秒或发布后精确清除 |

媒体由 ESA 控制的 `assets` 域名或路径公开分发，源站为私有 OSS Bucket。不得暴露 OSS 公共读权限，也不得让浏览器持有长期 AccessKey。

## 3. 内容边界

- 代码管理：首页、核心功能、团队方案、客来宝媒体、关于、联系、隐私、条款与免责声明。
- CMS 管理：新闻与案例。
- 内容状态：`draft | published | offline`。
- 草稿及未知内容对公众返回 `404`；已下线内容返回 `410`。
- slug 在首次发布后不可修改，避免 canonical 漂移。
- 发布和下线后清除列表、详情、sitemap、RSS 和 `llms.txt` 的精确 ESA URL。
- 公开缓存可短暂陈旧，但不得超过 60 秒。
- 客来宝媒体只是站内子业务，不创建独立内容类型、数据库表、Organization 实体、origin 或缓存命名空间。

建议数据表：

```text
admins
admin_sessions
content_items
content_revisions
media_assets
audit_logs
```

MySQL 数据基线：

- 目标兼容 MySQL 8.0；最终可购版本由 M2-00 锁定。
- 表使用 InnoDB 与 `utf8mb4`，时间统一保存为 UTC。
- 启用严格 SQL 模式；迁移不得依赖宽松类型转换或静默截断。
- slug 在写入前规范化为小写，并使用唯一索引保证内容类型内唯一。
- FC 使用受限数据库账号、连接池和连接上限，避免弹性实例耗尽 RDS 连接。

`content_items` 统一承载 `news | case`，内容源和服务端净化后的 HTML 分开保存。案例首次发布前必须勾选人工授权确认，并记录确认时间、操作者和审计事件；本阶段不建设授权文件上传或审批流。

## 4. 管理员认证与安全

- 仅一个预创建超级管理员，不提供注册与公众重置页面。
- 密码使用 Argon2id，最少 14 个字符。
- Session 最长 8 小时，随机 Session ID 仅写入 `HttpOnly; Secure; SameSite=Strict` Cookie。
- 15 分钟内连续失败 5 次，锁定 30 分钟。
- 密码重置为受控运维动作，必须撤销既有 Session 并写入审计日志。
- `/admin/*` 与 `/api/admin/*` 同时使用服务端鉴权、ESA WAF 与限频；固定办公出口可额外配置 IP 白名单，但不能替代登录认证。
- 凭据只存于阿里云受控秘密/环境配置中，不进入 Git、客户端 bundle、URL 或日志。

## 5. 编辑、净化与媒体

编辑器允许自由 HTML，但原始 HTML 永远不得直接发布。服务端必须净化并保存 source/sanitized 两种形式；预览在 sandbox iframe 中展示净化结果。

至少阻止：

- `script`、事件处理属性、`iframe`、`form`、SVG 与危险 URL scheme；
- 可执行或可逃逸的样式、外链脚本、内联事件和未知嵌入；
- 未列入允许集合的标签、属性和协议。

媒体仅接受 JPEG、PNG、WebP，单文件最大 10 MB。管理员先向 `/api/admin/media/presign` 申请短期、限定对象键与 MIME 的上传授权，浏览器再通过 HTTPS 直传私有 OSS；FC 记录最终媒体元数据。上传完成后仍需校验 MIME、大小和对象键。

## 6. 公开渲染与 SEO/GEO 技术基线

新闻与案例的首个响应必须包含可索引正文，不依赖客户端取数后才显示。每个公开内容页提供：

- 唯一 title、description、canonical 和 Open Graph；
- 语义 HTML、稳定标题层级、作者/发布时间/更新时间；
- `Organization`、`WebSite`、`BreadcrumbList` JSON-LD；
- 新闻使用 `NewsArticle`，案例使用 `Article`；
- `/sitemap.xml`、`/feed.xml` 与实验性 `/llms.txt`。

`llms.txt` 只列公开、稳定、允许抓取的入口，并明确为实验能力。不得在产品或验收中承诺搜索排名、精选摘要、推荐、AI 引用、收录速度或流量结果。

## 7. 询盘与 DirectMail

```text
浏览器 -> POST /api/inquiry
       -> 服务端白名单校验 / honeypot / 限频
       -> DirectMail HTTPS API
       -> 公司收件邮箱
```

- 不建立 lead/CRM 数据表，不持久化询盘正文。
- 日志只记录请求 ID、结果码、耗时和脱敏错误分类，不记录姓名、联系方式和需求正文。
- DirectMail 失败时不回显供应商细节，页面提示改用企业微信。
- 调用必须是明确的 HTTPS API；不得引入通用 `webservice` 封装。

## 8. 运行、恢复与可观测性

- FC 应配置健康检查、超时、并发/实例上限、日志和告警；避免故障或攻击导致无界费用。
- RDS 仅允许 FC 所在 VPC/安全组私网访问，不开放公网数据库入口。
- 数据库迁移必须向前兼容并有回退说明；部署前备份，首次上线前完成恢复演练。
- 数据库 migration 必须是 expand-only 且向后兼容上一应用版本：禁止破坏性 `DROP`、重命名、不兼容类型变化，以及没有安全默认值的新必填列。上一应用版本与迁移后 schema 的兼容矩阵未通过时，不得声称 FC 应用版本可安全回退。
- migration 只能作为显式 release step 执行，不得在 FC 冷启动、应用启动或请求路径自动运行；执行时使用 MySQL advisory lock，失败必须释放锁并停止发布。
- 应监控 FC 5xx/延迟、RDS 连接与容量、OSS 失败、DirectMail 失败、ESA WAF/限频命中和缓存刷新失败。
- 应用发布失败时回退上一可用 FC 版本；数据迁移失败时停止发布，不以删除生产数据作为回退手段。

## 9. M2-00 可行性门禁

在业务实现前必须用隔离测试资源证明：

1. ESA 可以稳定回源 FC，并保留正确 Host、HTTPS 与客户端地址信息。
2. FC 能运行 Next.js SSR、Route Handler 与流式/非流式常规响应。
3. FC 可通过 VPC 私网连接 RDS MySQL。
4. 私有 OSS 可由受限短期授权上传并经 ESA 分发。
5. 同域 Session Cookie 在 ESA 回源链路正确工作。
6. DirectMail HTTPS API 可用测试发信域完成受控调用。
7. 发布/下线能精确刷新 ESA URL。
8. 得到开发、测试与预估生产资源成本，并验证不超过版本化记录的预算硬上限。

任一项失败时，M2-01 不开始；记录证据、候选调整和新的人工决策，不静默切换到 ESA Pages、Vercel 或公开数据库。

本项目没有人工负责人参与门禁确认，因此采用证据驱动的自动判定：

- 每项记录验证日期、脱敏资源标识与地域、执行命令或 HTTP(S) 请求、预期结果、实际结果、证据路径、敏感信息检查、`PASS/BLOCKED` 结论和后续动作。
- 成本记录必须包含版本化流量假设、成本口径、报价时间/来源、预算硬上限和总成本计算。
- 8 项全部有可复核真实证据且成本不超过预算硬上限时，自动允许进入 M2-01。
- 任一字段、预算、报价、云资源或证据缺失，或任一验证失败时，自动 `BLOCKED`；不得由实现者用假设补齐。

私有 OSS 可行性至少验证 Bucket 公共读关闭、OSS 直连拒绝、ESA 受控回源、短期授权过期失效、对象键越权失败以及浏览器/日志无长期 AccessKey。MIME 与文件大小的完整攻击矩阵由 M2-02 实施。

### 9.1 当前自动门禁结论

- 执行时间：`2026-07-29`（Asia/Shanghai）。
- 证据：`../5-Evidence/m2-00/gate-report.md`。
- 结论：`BLOCKED`。
- 原因：当前执行环境没有隔离 ESA/FC/RDS/OSS/DirectMail 端点、probe 身份/token、真实报价、流量假设或预算硬上限；RDS probe 也尚缺可执行 `SELECT 1` 和连接复用的受审数据库驱动。G1～G8 均不得判定为 `PASS`。
- 后续：提供上述真实隔离输入、完成 RDS 查询 probe 后，重新执行 `pnpm m2:00:gate -- --config spikes/m2-00/config.local.json`。默认在报告整体状态为 `PASS` 前不得开始 M2-01；第 9.2 节记录了用户对“仅继续本地工程开发”的显式覆盖。

### 9.2 显式开发顺序覆盖

用户于 2026-07-29 明确接受以下两项作为遗留待确认问题，并授权继续 M2-01～M2-05：

- `M2-LEGACY-01`：缺少隔离 ESA/FC/RDS/OSS/DirectMail 资源、probe 身份/token。
- `M2-LEGACY-02`：缺少真实报价、流量假设和预算硬上限。

该覆盖仅允许继续可本地验证的工程开发，不改变第 9 节任何门禁的 `BLOCKED` 状态，不允许虚构供应商、成本或网络证据，也不允许在遗留项关闭前标记 Production Live。所有依赖真实云资源的 smoke、发布、回退、告警、缓存和恢复演练统一在 M2-05 Production 判定前重新执行。

## 10. 明确不纳入范围

- 公众账号、客户工作台、支付、订单、订阅、CRM、预约和微信 API。
- 通用页面搭建器、营销/政策页 CMS、多管理员角色与审批流。
- 授权文件存档、站内搜索、评论、推荐、内容自动生成或 AI 自动发布。
- 排名、收录、流量、推荐或 AI 引用保证。
- `products/sino-en/` 代码、数据库、域名或部署整合。
