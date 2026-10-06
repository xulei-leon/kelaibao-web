# Sprint M3-05 内容、口径、发现与统一官网发布收口

> **状态：** `COMPLETE / 文档与代码 review-confirm、实现及本地验证已完成；Production 仍 BLOCKED`
>
> **For agentic workers:** 实施时使用用户明确指定的 `sprint-workflow`，按工作包执行 TDD、review-confirm 和验证；除非用户另行明确要求，不自动启用其他 superpower skill。

**Goal:** 清理全部公开旧品牌，落实宣传口径证据和政策边界，回归 CMS/发现能力，并给出统一官网的本地完成与 Production 门禁判定。

**Architecture:** 不修改数据库 schema；CMS 内容通过现有修订/发布/下线流程迁移。扩展现有 release validator 和发现测试执行品牌、路由、口径及外部门禁检查，不新增第二套发布系统。

**Tech Stack:** Next.js、现有 CMS/RDS/OSS/DirectMail/ESA 边界、Vitest、Node.js 发布校验脚本。

## Global Constraints

- 只允许客来宝、K-Link、客来宝媒体三种公开名称。
- CMS 仍只管理新闻与案例，不增加 `site_key` 或内容类型。
- 缺少真实口径、授权、备案或云证据时 Production 必须 `BLOCKED`。
- SEO/GEO 只交付技术基线，不承诺结果。
- 不用直接 SQL 批量改写已发布内容。

---

## 1. Sprint 目标

实现 [FR-18](../../1-Requirement/Mainland-Website-FR/Done/FR-18-claims-content-discovery-and-release-migration.md)，完成 M3 改版发布收口。

核心目标：

- 公开页面、邮件、CMS 内容和发现文件不混用旧品牌。
- 所有绝对/结果型宣传口径有证据或被弱化。
- M2 安全、CMS、询盘和恢复门禁不因改版退化。

## 2. 前置依赖

- `sprint-m3-04` 完成全部门禁并提交。
- FR-18 与本 Sprint 文档 review-confirm 完成。
- 可读取 CMS 已发布内容清单；真实口径/授权/域名输入缺失可记录为外部 `BLOCKED`，但不得伪造。

路径与验证来源：

```text
FR_DIR=products/kelaibao/docs/1-Requirement/Mainland-Website-FR
FR_BACKLOG_DIR=products/kelaibao/docs/1-Requirement/Mainland-Website-FR/backlog
FR_DONE_DIR=products/kelaibao/docs/1-Requirement/Mainland-Website-FR/Done
DESIGN_DIR=products/kelaibao/docs/2-Design
SPRINT_DIR=products/kelaibao/docs/3-Plan
SPRINT_DONE_DIR=products/kelaibao/docs/3-Plan/Done
REVIEW_DIR=products/kelaibao/docs/4-Reviews
REVIEW_DONE_DIR=products/kelaibao/docs/4-Reviews/Done
WORKFLOW_STATE_PATH=<未设置；按 sprint-workflow 不创建独立状态文件>
VERIFICATION_COMMANDS=pnpm test && pnpm lint && pnpm build
```

验证命令来自产品级 `AGENTS.md`；额外运行 `pnpm smoke:standalone`、`pnpm smoke:media-redirects`、两种 release validation、`git diff --check` 和浏览器矩阵。用户明确要求文档/代码评审只运行第一 reviewer `gpt-5.5`，新 LLM 任务速度为“标准”；不启动第二 reviewer。

## 3. 纳入范围

- Privacy、Terms、Disclaimer 的统一品牌与业务边界。
- 新闻/案例公开内容的旧品牌迁移清单。
- metadata、Open Graph、JSON-LD、robots、sitemap、RSS、`llms.txt`。
- 邮件、后台、健康/错误页的最终品牌扫描。
- 宣传口径、二维码、授权、域名、备案和既有 M2 外部门禁的发布判定。

关键文件：

- Modify: `src/app/privacy/page.tsx`、`terms/page.tsx`、`disclaimer/page.tsx`。
- Modify: `src/server/discovery/metadata.ts`、`files.ts`、`src/lib/route-metadata.ts`。
- Modify: `src/components/public-content-*`、`src/server/content/public-page.tsx`。
- Modify: `src/server/inquiry/directmail.ts`、管理/健康/错误显示文案。
- Modify: `scripts/validate-release.mjs`。
- Modify: `scripts/lib/release-validator.mjs`；保留历史 schema v1，并为 M3 gate input 提供向后兼容的新 schema。
- Create: `docs/5-Evidence/m3-05/content-inventory.fixture.json`、`brand-content-migration.md`、`claims-register.json`、`gate-input.json`、`gate-report.md`。
- Modify tests: `m2-public-metadata.test.ts`、`m2-discovery-files.test.ts`、`m2-public-ssr.test.tsx`、`m2-release-validator.test.ts`。
- Create test: `tests/m3-brand-release-contract.test.ts`。

## 4. 暂不纳入范围

- 数据库 schema、CMS 状态机、管理员权限或新内容类型。
- 代办统计证明、客户授权、法律意见、备案和云采购。
- 订阅、CRM、支付、营销自动化和产品内分析。
- 自动关闭 M2-LEGACY 外部门禁。

原因：

- 本 Sprint 只实现可验证的软件/文档门禁，并如实记录外部缺口。

## 5. 工作范围

### 5.1 工作包：政策与品牌发布契约

实现任务清单：

- [x] 先写失败测试，扫描公开源码、SSR、metadata、邮件和发现文件中的旧品牌及双站配置。
- [x] 更新 Privacy、Terms、Disclaimer，覆盖官网、K-Link 产品介绍和客来宝媒体顾问服务。
- [x] 更新邮件、后台、健康/错误页的最终公开名称。
- [x] 保留询盘 DTO、限频、无 PII 日志和 DirectMail 安全协议。
- [x] 品牌扫描根固定为公开路由首响应、`src/app`/`src/pages` 的公开页面与 metadata/JSON-LD、发现文件、DirectMail 模板、可公开 build/runtime 输出和 CMS 已发布清单；排除历史 Review/Evidence、迁移清单中的历史说明、测试 fixture 和明确的内部兼容 allowlist。

测试要求：

- [x] 当前公开运行文件不出现“赛诺全网”、`saino` origin 或 `site_key`。
- [x] 历史 Review/Evidence 不纳入公开品牌失败扫描。
- [x] `SINO_RUNTIME_MODE`、`SINO_APP_VERSION` 只作为 SRS 已批准的内部兼容标识；测试必须同时覆盖公开泄漏失败和历史/内部允许匹配通过，allowlist 每项含理由且不得匹配第二 origin/站点身份。

### 5.2 工作包：CMS 内容迁移清单

实现任务清单：

- [x] Local/Preview 以脱敏 fixture 验证已发布新闻/案例清单契约；未连接真实 CMS 的事实与阻塞原因已写入处理清单。
- [x] Production 处置如实记录：当前没有 live CMS items 可逐条修订/下线，未伪造 revision、audit 或案例授权，`production_cms_brand_migration` 保持 `BLOCKED`。
- [x] 禁止直接 SQL 替换正文、slug 或净化快照。
- [x] 既有列表、详情、`404/410`、修订和缓存刷新回归通过；真实迁移后的逐条复验因无 live CMS 输入继续作为 Production blocker。
- [x] 清单顶层固定 `schemaVersion`、`generatedAt`、`sourceMode=fixture|live-cms`、`inventoryComplete`、`blockers`、`items`；item 固定 id、contentType、slug、title、status、publishedAt、oldBrandMatches、decision、revisionId、auditId、authorizationStatus。
- [x] 无数据库 Local/Preview 使用 `content-inventory.fixture.json` 验证导出/扫描/报告契约，并在 `brand-content-migration.md` 明示未扫描真实 CMS；fixture、空清单或 `inventoryComplete=false` 不得关闭 `production_cms_brand_migration`。
- [x] live CMS 只有逐条使用现有修订/重新发布或下线能力、保留 revision/audit ID 且案例授权有效时才可标记完成；脚本/报告不得输出正文、净化 HTML、凭据或其他非必要数据。

测试要求：

- [x] CMS schema 和 migration 文件无变化。
- [x] 内容状态、修订、授权、HTML 净化、OSS 和 purge 回归通过。
- [x] fixture 可以通过 Local contract，但 Production gate 必须 `BLOCKED`；伪造 `sourceMode=live-cms`、缺 item 字段或声称空清单完整的 fixture 必须失败。

### 5.3 工作包：宣传口径登记与构建门禁

实现任务清单：

- [x] 建立 `claims-register.json` 的固定字段：id、claim、publicPattern、definition、calculation、source、sourceCapturedAt、asOfDate、scope、owner、reviewer、evidenceType、evidencePath、maxAgeDays、expiresAt、authorizationStatus、publicUseApproved、placeholder、disposition、replacementCopy、weakenedReason。
- [x] 为工作簿的 `24H`、效率、`1%`、`100+`、`10万+`、`99.99%`、隐私/归属口径逐项登记。
- [x] 扩展 `validate-release.mjs`：`disposition=approved` 时缺字段、超过 `expiresAt`/`maxAgeDays`、未授权、`publicUseApproved!=true` 或占位值必须失败；`disposition=weakened` 时原口径必须从公开输出消失，并要求 `publicUseApproved=false`、非占位替代文案和弱化理由。
- [x] 对无证据口径修改页面为可验证能力描述，并记录修改理由。

测试要求：

- [x] fixture 覆盖完整批准 PASS、缺来源、缺日期、过期、未授权、占位文本、伪造 Local 证据、原口径仍公开、有效弱化和本地通过/生产阻断。
- [x] 任何本地 fixture 不得被解释为真实生产证据。

### 5.4 工作包：发现文件与发布回归

实现任务清单：

- [x] 更新 Organization/WebSite、公开内容 metadata、RSS、sitemap 和 `llms.txt`。
- [x] 断言发现文件只包含新路由和已发布内容，不包含旧顾问路由。
- [x] 未取得旧独立域名仍真实公开的证据，因此未新增边缘重定向假设；正式域名/备案仍由 `production_domain_icp` 阻塞。
- [x] 运行全量验证并生成 M3-05 gate report，分别给出 Local Code 和 Production 状态。
- [x] M3 `gate-input.json` 必须完整继承现有 16 个 `PRODUCTION_GATE_IDS`，并追加 `production_cms_brand_migration` 与 `production_claims_authorization`；schema 校验必须拒绝遗漏/重复/未知 gate，不能用新 gate 替换旧 gate。
- [x] `production_claims_authorization` 只有每项口径已真实批准或已从公开输出弱化/移除时才可 PASS；无 live CMS 清单时 `production_cms_brand_migration` 保持 BLOCKED。因此当前预期 blocker 集至少含既有 16 项和 CMS 迁移门禁。
- [x] `gate-report.md` 固定记录生成时间、输入版本/路径、两条命令与退出码、`localReady`、`productionReady`、status、Local 检查表、全部 Production gate 表、继承 blocker 数量、证据路径、未解决项和敏感信息检查。

测试要求：

- [x] SSR、JSON-LD、RSS、sitemap、`llms.txt`、缓存刷新和 standalone smoke 通过。
- [x] 外部输入缺失时报告 `BLOCKED`，进程在 `--require-production-live` 下非零退出。
- [x] 默认 `pnpm validate:release` 预期退出 `0`、`localReady=true`、`productionReady=false`、`status=CODE_READY_WITH_EXTERNAL_LEGACY`；`--require-production-live` 预期退出 `1`；输入/schema 错误退出 `2`。

### 5.5 工作包：最终交互与视口 smoke

实现任务清单：

- [x] 验证“首页→免费体验小程序”“首页→功能/团队”“导航→媒体→企业微信”“新闻/案例→联系”路径。
- [x] 检查 `320px`、`390px`、`768px`、`1440px`、键盘、200% 等效 CSS 像素视口、减少动效契约和二维码失败；受控浏览器不支持原生 zoom/emulate-media，限制已在 `visual-qa.md` 明示。
- [x] 完成代码 review-confirm 后应用接受项并重跑所有验证。

### 5.6 工作包：工作流关闭与提交

- [x] 文档 review、document review-confirm、代码 review、code-review-confirm 均存在且非空；只运行用户指定的第一 reviewer。
- [x] 所有接受/部分接受项已应用或显式说明，证据文件完整，既有 16 项 Production gate 连续性得到验证。
- [x] `pnpm test`、`pnpm lint`、`pnpm build`、standalone/media smoke、默认/强制 Production release validation、`git diff --check`、四视口/交互 smoke 全部按预期完成。
- [x] Production 只有在全部 mandatory gate 具备真实 PASS 证据时才可提升；否则保持 `CODE_READY_WITH_EXTERNAL_LEGACY / BLOCKED`。
- [x] 通过全部本地门禁后才将 FR-18 与本 Sprint 移入各自 `Done/`；只暂存 M3-05 相关文件并提交 `feat: complete sprint-m3-05 code and change base on reviews`。

## 6. 验收标准

- 公开构建和发现文件不混用旧品牌或旧路由。
- CMS schema 不变，既有安全/审计/发布能力全部通过。
- 宣传口径逐项有证据或已弱化。
- 产品体验与媒体咨询两条路径在正常和失败状态均可用。
- Local Code 状态与 Production 外部门禁状态明确分离。

## 7. 验证要求

项目声明的验证命令：

- `pnpm test`
- `pnpm lint`
- `pnpm build`

专项验证：

- `pnpm smoke:standalone`
- `pnpm smoke:media-redirects`
- `pnpm validate:release`
- `pnpm validate:release -- --require-production-live`（外部证据不完整时预期退出 `1`）
- `git diff --check`
- `pnpm validate:release` 当前预期：退出 `0`、`localReady=true`、`productionReady=false`、`CODE_READY_WITH_EXTERNAL_LEGACY`，Production blockers 保留既有 16 项并追加未完成 M3 gate。
- 四关键视口、键盘、200% 缩放、reduced motion、政策页和两条二维码路径 smoke；证据写入 `docs/5-Evidence/m3-05/visual-qa.md`。

## 8. 实施顺序

1. 固定公开品牌和政策契约。
2. 清理 CMS 旧品牌内容并回归安全能力。
3. 建立宣传口径登记和发布校验。
4. 更新发现文件并生成双层状态报告。
5. 完成最终交互、视口和全量验证。

## 9. 风险控制

- 旧品牌藏在 CMS/发现文件：使用运行输出扫描加内容清单，不只扫描源码。
- 宣传口径无法证明：默认弱化或 Production `BLOCKED`，不得带病上线。
- 内容迁移破坏审计：只走现有修订/发布/下线流程。
- 改版掩盖 M2 遗留：发布报告单独保留 M2 外部门禁，不自动提升状态。

## 10. 交付结论

`COMPLETE / CODE_READY_WITH_EXTERNAL_LEGACY`。

- 文档 review 与 review-confirm：完成；唯一 reviewer 为 `gpt-5.5`、thinking `medium`。
- 代码 review 与 review-confirm：完成；接受的 High CMS 状态/决定一致性问题已通过 TDD 修复。
- 最终验证：52 files / 271 tests、lint、build、standalone/media smoke、默认/强制 Production release validation、schema v1 兼容、`git diff --check` 和四视口/交互 QA 均按预期通过。
- Release：`localReady=true`、`productionReady=false`、`CODE_READY_WITH_EXTERNAL_LEGACY`；16 个既有 Production gate 与 `production_cms_brand_migration` 共 17 项保持 `BLOCKED`，`production_claims_authorization=PASS`。
- 未连接真实 CMS/RDS，未伪造域名、备案、二维码、授权、云资源或客户证据。Production 只有在全部 mandatory gate 获得真实证据后才能提升。
