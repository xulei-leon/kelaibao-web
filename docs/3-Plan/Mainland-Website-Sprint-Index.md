# 客来宝统一中文官网 Sprint 索引

> **运营改版：** [M5-06](sprint-m5-06-operations-prototype-refresh.md) 按 [FR-26](../1-Requirement/Mainland-Website-FR/FR-26-operations-prototype-refresh.md) 迁入用户提供的 `var/web` 原型；2026-10-21 本地实现、文档/代码复核与验收完成，未部署。保留 FR-25 静态内容与既有生产门禁。[验收记录](../5-Evidence/m5-06/README.md)。

> **当前变更（2026-10-20）：** [M5-05](sprint-m5-05-static-news-and-cases.md) 按 [FR-25](../1-Requirement/Mainland-Website-FR/FR-25-static-news-and-cases.md) 将新闻/案例改为代码维护的静态页面。旧 Sprint 中的 CMS 交付仅是历史事实，冲突的功能与回归要求被替代；M5-05 已完成代码、文档/代码实施者复核和本地验收；真实历史内容/URL 与云端发布仍待验证。

| 字段 | 内容 |
| --- | --- |
| 文档版本 | `v1.2` |
| 文档状态 | M5-05 Local Code Ready；真实内容迁移及 Production BLOCKED |
| 实现状态 | M2/M3/M4/M5-01 已达到 Local Code Ready；Production 仍 `BLOCKED` |
| 更新日期 | `2026-10-20` |
| 上游 SRS | `../1-Requirement/Kelaibao-Unified-Website-SRS.md` |
| FR 索引 | `../1-Requirement/Mainland-Website-FR/Mainland-Website-FR-Index.md` |
| 上游变更设计 | `../../../../docs/superpowers/specs/2026-07-31-kelaibao-unified-website-design.md` |

## 1. 路径与验证基线

```text
FR_DIR=docs/1-Requirement/Mainland-Website-FR
FR_DONE_DIR=docs/1-Requirement/Mainland-Website-FR/Done
SPRINT_DIR=docs/3-Plan
SPRINT_DONE_DIR=docs/3-Plan/Done
REVIEW_DIR=docs/4-Reviews
REVIEW_DONE_DIR=docs/4-Reviews/Done
VERIFICATION_COMMANDS=pnpm test && pnpm lint && pnpm build
```

验证命令来自产品级 `AGENTS.md` 与 `package.json`。M2-01 已运行完整测试、类型检查、生产构建、standalone smoke 和客户端秘密扫描；后续 Sprint 不得静默降低验证范围。

当前工程为独立仓库 `D:/code/kelaibao-web`，以上路径相对于仓库根目录；旧文档中的 `products/kelaibao/` 是历史位置。已完成的 M1/M2 Sprint、Review 和 Evidence 保留当时名称与路径作为审计事实，不作为当前运行说明。

## 2. 里程碑结构

| Sprint | 标题 | 覆盖 FR | 交付状态目标 |
| --- | --- | --- | --- |
| [M1-01](sprint-m1-01-project-foundation.md) | 独立工程与内容基础 | `FR-01` | 独立工程、内容模型与测试基线可构建 |
| [M1-02](sprint-m1-02-sales-and-profession-pages.md) | 核心销售与职业场景 | `FR-02`、`FR-03` | 核心页面 Code/Preview Ready |
| [M1-03](sprint-m1-03-wecom-and-inquiry-flow.md) | 企业微信与备用询盘 | `FR-04`、`FR-05` | 双路径咨询闭环 Code/Preview Ready |
| [M1-04](sprint-m1-04-policy-and-launch-quality.md) | 政策与发布质量 | `FR-06`、`FR-07` | 全站内容、可访问性和构建质量收口 |
| [M1-05](sprint-m1-05-mainland-production-launch.md) | 原静态生产上线 | `FR-08` | 延期/被 M2 全栈生产路径取代 |
| [M2-00](sprint-m2-00.md) | 架构与基础设施可行性门禁 | `FR-09` | 8 项链路与成本 PASS/BLOCKED；外部缺口条件接受 |
| [M2-01](sprint-m2-01.md) | FC Next.js 与 MySQL 基础 | `FR-09` | 本地全栈制品与数据基础 Code Ready；真实云发布/回退 DEFERRED |
| [M2-02](sprint-m2-02.md) | 管理员认证、媒体与 HTML 安全 | `FR-10`、`FR-11` | 安全后台基础 Ready |
| [M2-03](sprint-m2-03.md) | 新闻与案例 CMS（历史） | `FR-12` | 旧版已实现；目标要求由 FR-25 替代 |
| [M2-04](sprint-m2-04.md) | 公开 SSR 与 SEO/GEO | `FR-13` | 公开发现技术基线 Ready |
| [M2-05](sprint-m2-05.md) | 询盘、运行安全与生产上线 | `FR-14`、`FR-08` | 全部门禁后 Production Live |
| [M3-01](Done/sprint-m3-01.md) | 客来宝工程与品牌基础迁移 | `FR-15` | 完成 / 新目录可构建，M2 能力无回归 |
| [M3-02](Done/sprint-m3-02.md) | 核心功能、团队方案与公司介绍 | `FR-16`（第一部分） | 完成 / 产品页面与小程序体验基础 Ready |
| [M3-03](Done/sprint-m3-03.md) | 客来宝媒体单页与旧路由收敛 | `FR-17` | 完成 / `/media` 与旧 URL 迁移 Ready |
| [M3-04](Done/sprint-m3-04.md) | 客来宝统一外壳、首页与免费体验 | `FR-16`（第二部分） | 完成 / 无断链首页到小程序转化路径 Ready |
| [M3-05](Done/sprint-m3-05.md) | 内容、口径、发现与发布收口 | `FR-18` | 完成 / Local Code Ready；Production 17 项门禁仍 BLOCKED |
| [M4-01](Done/sprint-m4-01-database-adapter-and-local-sqlite-test-runtime.md) | 数据库适配层与本地 SQLite 测试运行时 | `FR-19` | 完成 / Local Code Ready / Production BLOCKED |
| [M4-02](Done/sprint-m4-02-public-site-visual-style-upgrade.md) | 公开站视觉风格升级 | `FR-20` | 完成 / Local Code Ready / Production BLOCKED |
| [M4-03](Done/sprint-m4-03-public-site-complete-visual-system.md) | 公开站完整视觉系统 | `FR-21` | 完成 / Local Code Ready / Production BLOCKED |
| [M4-04](Done/sprint-m4-04-owner-approved-content-and-experience-update.md) | 产品负责人确认的内容与体验调整 | `FR-22` | 完成 / Local Code Ready / Production BLOCKED |
| [M5-01](Done/sprint-m5-01.md) | SEO 结构化数据与响应式图片优化 | `FR-07`、`FR-11`、`FR-12`、`FR-13` 增量 | 完成 / Local Code Ready / Production BLOCKED |
| [M5-02](Done/sprint-m5-02.md) | 核心页面搜索语义与站内链接优化 | `FR-07`、`FR-13` 增量 | 完成 / Local Code Ready / Production BLOCKED |
| [M5-03](sprint-m5-03-v3-3-public-content-and-media-packages.md) | V3.3 公开内容与媒体套餐 | `FR-23` | 完成 / Local Code Ready / Production BLOCKED |
| [M5-04](Done/sprint-m5-04.md) | 新闻 CMS 自主图文编辑（历史） | `FR-24` | 旧版已实现；目标要求由 FR-25 替代 |
| [M5-05](sprint-m5-05-static-news-and-cases.md) | 新闻与案例普通静态页面 | `FR-25`、`FR-13` 增量 | Local Code Ready / 真实内容迁移及 Production BLOCKED |

### 2.1 建议工期与容量假设

以下为 1 名全职开发者、已有页面基线、每个 Sprint 严格完成文档/代码评审门禁的计划估算，不包含备案、发信域审核、采购等待和专业审查时间：

| Sprint | 建议开发时间 | 退出门禁 |
| --- | --- | --- |
| M2-00 | 3～5 个工作日 | 8 项链路与成本形成证据；外部缺口按显式遗留规则处理 |
| M2-01 | 5～8 个工作日 | 本地 FC 候选制品、迁移与回退命令契约通过；真实云证据归 M2-LEGACY-01 |
| M2-02 | 7～10 个工作日 | 认证、XSS、私有 OSS 安全测试通过 |
| M2-03 | 7～10 个工作日 | CMS 状态、修订、授权、刷新通过 |
| M2-04 | 5～7 个工作日 | SSR、schema、发现文件和缓存通过 |
| M2-05 | 5～8 个工作日 + 外部等待 | 询盘、告警、恢复、备案/审查门禁通过 |
| M3-01 | 3～5 个工作日 | 目录/品牌迁移后全量基线通过 |
| M3-02 | 6～8 个工作日 | 功能、团队、关于、小程序体验和联系分流通过 |
| M3-03 | 4～6 个工作日 | 媒体单页、二维码隔离和五条重定向通过 |
| M3-04 | 4～6 个工作日 | 统一外壳、首页和既有小程序体验全站接入通过 |
| M3-05 | 5～8 个工作日 + 外部等待 | 品牌/口径/CMS/发现/发布门禁完成 |
| M4-01 | 6～9 个工作日 | adapter 收敛、SQLite 本地后台流程、生产 fail-closed 与完整回归通过 |
| M4-02 | 6～9 个工作日 | layout/文案零变化；四视口截图与完整回归通过 |
| M4-03 | 8～12 个工作日 | 完整视觉、17 个可替换素材槽、五张当前效果图 fidelity QA 与全量回归通过 |
| M5-01 | 8～12 个工作日 | 页面级 schema、构建期响应式图片、revision 代表图、分层缓存与完整回归通过 |
| M5-02 | 2～4 个工作日 | 核心页 metadata/H1、新闻命名、语义内链、四视口与完整回归通过 |

纯开发建议预留约 6～9 周；若 M2-00 或生产外部门禁未通过，计划在对应 Sprint 停止，不消耗后续 Sprint 的实现预算。

M3 纯开发建议预留约 4～6 周。真实二维码、企业微信、口径证明、Logo/案例授权、域名和备案等待不计入开发时间。

## 3. 严格实施顺序

```text
M1 Preview baseline
  -> sprint-m2-00
      -> sprint-m2-01
          -> sprint-m2-02
              -> sprint-m2-03
                  -> sprint-m2-04
                      -> sprint-m2-05
                          -> sprint-m3-01
                              -> sprint-m3-02
                                  -> sprint-m3-03
                                      -> sprint-m3-04
                                          -> sprint-m3-05
                                              -> sprint-m4-02（经用户明确调整顺序，已完成）
                                                  -> sprint-m4-01（已完成）
                                                      -> sprint-m4-03
                                                          -> sprint-m4-04
                                                              -> sprint-m5-01
                                                                  -> sprint-m5-02
```

每个 Sprint 必须依次完成：FR/Sprint 文档评审与 review-confirm、按确认文档实现、代码评审与 review-confirm、验证以及独立提交。不得并行实施多个 Sprint。M4-04 的文档评审由用户于 2026-08-05 明确跳过，中止报告未保留且不计为 PASS；代码评审与其余门禁已完成。

## 4. 状态边界

- [固定图片 OSS + ESA 分发方案](static-assets-oss-esa-delivery-plan.md)处于 `PROPOSAL`：仅覆盖固定视觉素材，不能以本地构建或配置草案关闭 `M2-LEGACY-01`。
- [FC Node.js 20 运行时依赖层实施方案](fc-node20-runtime-layer-plan.md)处于 `PROPOSAL`：仅规划缩小应用 ZIP，不承诺改善冷启动，也不能关闭 `M2-LEGACY-01`。
- M1 只作为现有静态 Preview 基线；M1-05 不再执行为生产路径，也不得标记已完成。
- M2-00 默认是强制门禁；用户已于 2026-07-29 明确接受 `M2-LEGACY-01`（真实云资源与 probe 输入）和 `M2-LEGACY-02`（报价、流量和预算）作为遗留项，允许继续本地工程开发，但不改变门禁的 `BLOCKED` 状态。
- M2-01～M2-04 最多达到全栈 Preview Ready，不代表已获准公开推广。
- M2-05 必须使用真实主体、备案、企业微信、DirectMail、政策和专业审查证据。
- 外部信息不完整时状态保持 `BLOCKED` 或 `Preview`，不得用占位值标记 `Production Live`。
- 调用多个 reviewer agents 前必须先获得人工确认。
- M3-01～M3-04 最多提升本地改版能力，不关闭 M2 外部遗留；M3-05 必须同时报告 Local Code 与 Production 状态。
- M4-01 只增强本地数据库适配与测试能力；SQLite 不得进入 FC/Production，也不得关闭任何真实 RDS/云门禁。
- M4-02 只升级现有公开站视觉；不得修改 layout、用户可见文字、业务交互、CMS/发现或生产架构，也不得用截图关闭 Production 门禁。
- M4-03 补齐完整视觉系统、中文字体和本地可替换素材；七张效果图全部留档，当前五张基线用于 fidelity QA；仍不得修改文字、结构、路由、功能或 Production 状态。
- M5-01 已完成 SEO 结构化数据、响应式图片和 CMS 代表图的本地代码闭环；真实 ESA/FC/OSS/RDS 与大陆/微信 Evidence 缺失时不得关闭 Production blocker。
- M5-02 只优化核心页面搜索语义与站内链接；不解除 Production 索引门禁，也不把未经搜索平台数据验证的关键词方向或 SEO 效果标记为已证实。

## 5. 全局技术边界

- 当前独立仓库使用 Next.js、React、TypeScript、Tailwind CSS、Vitest、Testing Library 与 jsdom；不导入英文站代码。
- 生产固定为 ESA→FC 全栈 Next.js→RDS MySQL + 私有 OSS；DirectMail 发送询盘通知。MySQL 以降低小型官网数据库成本为选型目标，M2-00 仍需确认实际总价。
- RDS MySQL 与本地 MySQL 可共用 MySQL repository adapter；SQLite 仅作为显式 local-test adapter，不能成为生产部署选项。
- 同域包含公开站与询盘 API；旧 CMS `/admin` 和 `/api/admin` 在 M5-05 中退场，不使用 ESA Pages 或 Vercel。
- 全部公开内容由代码维护，FR-25 撤销新闻/案例 CMS 与专用管理员入口；不引入公众账号、CRM、在线支付、小程序产品实现或微信 API。小程序只通过二维码引导体验。
- `/api/inquiry` 只调用 DirectMail，不建立线索数据库；个人信息不得进入 URL、浏览器存储、分析或日志。
- 所有外部集成直接使用明确 HTTP(S) API，不创建通用 webservice。
- SEO/GEO 只交付 SSR、metadata、JSON-LD、RSS、sitemap 和实验性 `llms.txt`，不承诺结果。
- 对直销、保险和证券的限制是产品验收条件，不是上线后补充事项。
- 客来宝是唯一主品牌，K-Link 是产品名，客来宝媒体只使用 `/media` 单页；不配置双站、双二级域名、`site_key` 或跨应用内容 API。

## 6. 里程碑验收

| 里程碑 | 完成条件 |
| --- | --- |
| 工程基础 | 项目可独立安装、测试、类型检查和构建，内容配置集中且不引用英文站 |
| 销售体验 | 首页、服务、方法、关于和三个职业页形成完整、无结果承诺的销售路径 |
| 线索转化 | 企业微信主入口与直接 HTTPS 备用表单均可用且互相降级 |
| Preview Ready | 政策、metadata、响应式、可访问性、匿名分析与自动测试全部通过 |
| 架构可行 | ESA/FC/RDS/OSS/DirectMail/purge/成本 8 项门禁通过 |
| 旧后台安全（历史） | 仅适用于 CMS 退场前；FR-25 迁移验证入口关闭、正文安全和秘密隔离 |
| 内容维护（FR-25 现行） | 静态新闻/案例、同源发现文件、授权与旧 URL 核对通过；代码部署和缓存刷新可用，CMS 退场 |
| SEO/GEO 基线 | SSR、metadata、JSON-LD、RSS、sitemap、`llms.txt` 可验证 |
| Production Live | 大陆部署、备案、正式二维码、DirectMail、专业审查、恢复和回退证据全部完成 |
| M3 工程迁移 | `products/kelaibao/` 可独立构建，M2 全栈能力无回归 |
| 客来宝产品体验 | 首页、功能、团队、关于和小程序体验路径完整 |
| 客来宝媒体 | `/media` 单页保留顾问定位，旧路由永久迁移且二维码语义隔离 |
| M3 发布收口 | 旧品牌清零、口径可审计、CMS/发现回归通过，Local/Production 状态分离 |
| 公开站视觉升级 | Mindbody/HubSpot 全站风格与 Profound 媒体页局部风格落地，layout、文案和交互零回归 |
| 公开站完整视觉 | “可信增长网络”设计系统、中文字体、17 个本地素材槽和五张当前效果图 fidelity QA 完成，文案、结构、路由与功能零回归 |
| SEO 与响应式图片优化 | 页面级 schema 与可见内容一致；构建期响应式图片达到预算；代表图随 revision 发布；缓存、二维码、Lightbox、SSR 与索引门禁无回归 |
| 核心页面搜索语义与内链 | 核心页 Title、Description、H1 与页面主题一致；新闻命名统一；页脚和正文语义链接可抓取、可访问且无断链 |
