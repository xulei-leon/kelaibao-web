# FR-18 宣传口径、内容发现与发布迁移

- `FR-ID`: `FR-18`
- `标题`: 宣传口径、内容发现与发布迁移
- `所属阶段`: 阶段 3 - 客来宝统一官网改版
- `开发顺序`: 18
- `优先级`: P0
- `前置依赖`: `FR-15`、`FR-16`、`FR-17`
- `涉及包`: 政策页、CMS 公开内容、metadata、JSON-LD、sitemap、RSS、`llms.txt`、发布校验、Evidence
- `是否属于原型阶段`: 否
- `来源类型`: 需求变更
- `原始 SRS 章节`: 现有 SRS 第 6.8～6.14、8～12 节；品牌与宣传口径以统一官网设计为准
- `相关 FR`: `FR-06`、`FR-07`、`FR-08`、`FR-12`～`FR-14`

## 目标

完成从赛诺独立顾问站到客来宝统一官网的跨页面内容、政策、发现文件和发布门禁迁移，保证旧品牌不泄漏、宣传口径可追溯、CMS 既有安全能力不退化，并形成可审计的上线判定。

## 背景与问题

新版工作簿引入 `24H`、效率、客户数量、团队数量、稳定性、隐私和增长结果等营销口径。现有公开内容、政策、邮件、metadata、RSS、sitemap 和 `llms.txt` 使用赛诺品牌。若只修改页面视觉，搜索结果、公开 CMS 内容和邮件仍可能混用旧品牌或发布未经证明的绝对声明。

## 影响范围

- `/privacy`、`/terms`、`/disclaimer`。
- 新闻/案例列表、详情、CMS 已发布内容和案例授权。
- 全站 metadata、Open Graph、JSON-LD、robots、sitemap、RSS、`llms.txt`。
- DirectMail 文案、管理员标题、健康/错误状态页。
- 发布校验脚本和 M3 发布证据。

## 需求描述

1. 公开站、邮件和发现文件只允许出现“客来宝”“K-Link”“客来宝媒体”三种已定义名称。
2. CMS schema、状态机、修订、不可变 slug、案例授权、HTML 净化、私有媒体和审计机制必须保持不变；不得增加 `site_key`。
3. 已发布内容中的“赛诺全网”必须在上线前完成逐条清单化处理：改写并重新发布，或下线；不得通过数据库批量替换绕过修订和审计。
4. 新闻/案例继续使用客来宝主品牌 metadata；媒体业务案例通过正文语义说明，不创建第二站点实体。
5. 工作簿中的以下口径在生产发布前必须记录定义、算法、来源、统计日期、适用范围、授权和复核负责人：
   - `24H`。
   - 每天至少一小时的重复劳动变成一分钟。
   - 每天一分钟、转发二十个群、`1%` 被吸引约等于近百个新客/年。
   - `100+`、`10万+`、`99.99%`。
   - `0` 隐私采集、`0` 业务干预、`100%` 私域归属。
6. 缺少证据的绝对或结果型口径必须在生产构建中替换为可验证的能力描述；不得用占位证据标记 PASS。
7. Privacy、Terms、Disclaimer 必须同时覆盖官网、K-Link 产品介绍和客来宝媒体顾问服务，且不承诺好友、客户、成交、收入、流量、排名或职业结果。
8. sitemap、RSS、`llms.txt`、canonical、Open Graph 和 JSON-LD 必须只使用新路由、新品牌和已发布内容。
9. 发布校验必须扫描公开源码/构建输出中的旧品牌、旧目录运行引用、旧路由 canonical、双站配置和未闭合口径门禁。
10. 未取得正式域名、备案、二维码、企业微信、案例/Logo 授权、口径证明和既有 M2 外部门禁证据时，Production 必须保持 `BLOCKED`。

## 高层要求

- 不修改 CMS 数据模型或迁移历史；内容品牌迁移通过现有修订、发布和下线流程完成。
- 只交付 SEO/GEO 技术基线，不承诺排名、推荐、AI 引用、收录或流量。
- 继续使用明确的 DirectMail、OSS、ESA HTTP(S) 边界，不增加通用抽象。
- 发布判定必须区分本地代码通过与真实生产证据通过。

## 输入

- 新版工作簿和统一官网设计。
- CMS 已发布内容清单；清单必须声明 `sourceMode=fixture|live-cms`。无数据库的 Local/Preview 可使用脱敏 fixture 验证软件契约，但 fixture、空清单或 `inventoryComplete=false` 不能作为 Production 内容迁移完成证据。
- 统计口径、产品隐私说明、稳定性数据、案例/Logo 授权。
- 正式域名、备案、小程序二维码、企业微信和既有 M2 生产证据。

## 输出

- 统一品牌的政策、邮件、metadata 和发现文件。
- `docs/5-Evidence/m3-05/content-inventory.fixture.json`：脱敏 Local/Preview 清单 fixture，至少包含 schema/version、生成时间、`sourceMode`、`inventoryComplete`、阻塞原因和 items；item 固定为 id、type、slug、title、status、publishedAt、oldBrandMatches、decision、revisionId、auditId、authorizationStatus。
- `docs/5-Evidence/m3-05/brand-content-migration.md`：记录清单来源、扫描日期、逐条决定、revision/audit 证据、授权状态、未解决项和敏感信息检查。只有 `sourceMode=live-cms`、`inventoryComplete=true` 且逐条处理完成时才可关闭 Production CMS 品牌迁移门禁。
- `docs/5-Evidence/m3-05/claims-register.json`：宣传口径登记与处置；每项必须明确批准使用或弱化/移除，不允许占位证明。
- `docs/5-Evidence/m3-05/gate-input.json` 与 `gate-report.md`：机器可读发布输入和人可读报告；报告固定记录命令/退出码、`localReady`、`productionReady`、status、全部 blocker IDs、证据路径和敏感信息检查。

## 失败与降级

- 内容清单、授权或口径证据缺失时允许本地代码交付，但 Production 状态必须为 `BLOCKED`。
- CMS fixture 或空清单只能证明本地清单/校验流程可运行；不得声称已扫描或迁移真实已发布内容。
- 对无证明口径，登记项必须 `publicUseApproved=false`，并提供不含绝对/结果承诺的 `replacementCopy` 与 `weakenedReason`；公开源码、SSR、邮件和发现输出不得再出现被弱化的原始口径。
- 发现文件生成失败不得输出草稿、下线、旧路由或旧品牌内容。
- CMS 内容迁移失败时保留原修订并下线受影响内容，不进行不可审计的直接 SQL 修复。

## 证据与扫描契约

- `claims-register.json` 每项至少包含 id、claim、publicPattern、definition、calculation、source、sourceCapturedAt、asOfDate、scope、owner、reviewer、evidenceType、evidencePath、maxAgeDays、expiresAt、authorizationStatus、publicUseApproved、placeholder、disposition、replacementCopy、weakenedReason。
- `disposition=approved` 时证据、复核、授权和未过期日期必须完整；`disposition=weakened` 时必须禁止原口径公开、要求替代文案和理由，且不得把本地 fixture 作为批准证据。
- 品牌扫描覆盖公开路由首响应、metadata/JSON-LD、发现文件、邮件模板、可公开客户端/服务端构建输出和 live CMS 已发布清单；历史 Review/Evidence、迁移清单的历史名称、测试 fixture 和受控内部兼容标识不作为公开泄漏。
- 内部兼容 allowlist 至少逐项说明理由；`SINO_RUNTIME_MODE`、`SINO_APP_VERSION` 仅可作为 M2 运行协议保留，不能进入公开文案、第二 origin 或站点身份。
- M3-05 发布输入必须包含并保留现有 16 个 mandatory Production gate ID。没有真实 PASS 证据和 review-confirm，不得遗漏 gate 或降低 blocker 集；M3 新增 CMS/口径门禁只能追加，不能替换既有门禁。
- 默认 `pnpm validate:release` 仅在 Local gates 通过时退出 `0`；外部证据缺失时固定报告 `localReady=true`、`productionReady=false`、`CODE_READY_WITH_EXTERNAL_LEGACY`。`--require-production-live` 在任一 mandatory gate 非真实 PASS 时退出 `1`；输入/schema 错误退出 `2`。

## 不纳入范围

- 新 CMS 内容类型、数据库迁移、多站点字段或跨应用 API。
- 代办备案、法律意见、统计证明或客户授权。
- 订阅、CRM、支付、营销自动化和产品内客户分析。
- 搜索排名、AI 引用或流量结果保证。

## 最小验证方式

- 品牌/旧路径/双站配置静态扫描。
- metadata、JSON-LD、sitemap、RSS、`llms.txt` 和公开 SSR 测试。
- CMS 状态、修订、授权、HTML 净化、媒体和缓存刷新回归测试。
- 发布校验的 PASS/BLOCKED fixture。
- `pnpm test && pnpm lint && pnpm build && pnpm smoke:standalone && pnpm validate:release`。
- `pnpm validate:release -- --require-production-live`；外部证据不完整时预期退出 `1`，并保持完整 blocker IDs。
- 四个关键视口、二维码、企业微信、政策和主要转化路径 smoke。

## 验收要点

- 公开构建和发现文件不存在旧品牌混用。
- CMS 不做 schema 变化且安全/审计回归全部通过。
- 每项绝对或结果型口径均有证据或已被弱化。
- 旧路由不进入 sitemap/canonical，新闻案例继续可抓取。
- 本地工程状态和 Production 外部门禁状态明确分离。

## 备注

本 FR 由 `sprint-m3-05` 实施，是统一官网改版的发布收口 Sprint，不会自动关闭 M2 已记录的真实云、备案、成本和恢复遗留项。

只有文档/代码 review-confirm、接受项、完整本地验证、证据文件和 blocker 连续性全部完成后，FR/Sprint 才能移入 `Done/` 并创建独立提交。Local Code Ready 不等于 Production Live。

## 完成记录

- 2026-08-01：文档与代码 review-confirm、接受项、实现、52 files / 271 tests、lint、build、standalone/media smoke、release validation 与四视口/交互 QA 完成。
- Local 状态：`CODE_READY_WITH_EXTERNAL_LEGACY`；`localReady=true`。
- Production 状态：`BLOCKED`；16 个既有 mandatory gate 与 `production_cms_brand_migration` 共 17 项仍阻塞，`production_claims_authorization=PASS`。
- 真实 CMS、域名/备案、二维码、云资源、专业审查和授权证据均未伪造或代办；后续只能用真实外部证据逐项关闭门禁。
