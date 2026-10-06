# Sprint M3-03 客来宝媒体单页与旧路由收敛

> **状态：** `COMPLETE / 文档与代码 review-confirm、实现及本地验证已完成；Production 仍 BLOCKED`
>
> **For agentic workers:** 实施时使用用户明确指定的 `sprint-workflow`，按工作包执行 TDD、review-confirm 和验证；除非用户另行明确要求，不自动启用其他 superpower skill。

**Goal:** 交付 `/media` 单页、客来宝媒体企业微信咨询路径和五条旧顾问路由永久重定向。

**Architecture:** 将现有服务、职业和方法内容重新组合为一个 App Router 页面；使用 Next.js 原生永久重定向收敛旧路由，不建立 `/media/*`、子域名或独立品牌系统。

**Tech Stack:** Next.js App Router/redirects、React、TypeScript、Tailwind CSS、Vitest、Testing Library。

## Global Constraints

- 客来宝媒体属于客来宝，不得形成站中站。
- 保留直销、保险、证券的专业表达定位和合规边界。
- 媒体咨询只使用企业微信；产品免费体验只使用小程序。
- 不新增 CMS 类型、数据库表、子域名或 Host 路由。

---

## 1. Sprint 目标

实现 [FR-17](../../1-Requirement/Mainland-Website-FR/Done/FR-17-kelaibao-media-page-and-legacy-route-migration.md)。

核心目标：

- 在一个页面内保留原顾问业务价值和职业边界。
- 旧服务、职业和方法 URL 有明确永久迁移目标。
- 用户不会混淆 K-Link 体验与客来宝媒体咨询。

## 2. 前置依赖

- `sprint-m3-02` 完成全部门禁并提交。
- FR-17 与本 Sprint 文档 review-confirm 完成。
- 企业微信 Preview 配置可用；正式资产仍受 M3-05 发布门禁约束。

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

验证命令来自产品级 `AGENTS.md`；另运行 `pnpm smoke:standalone`、`pnpm validate:release` 和真实 HTTP 重定向 smoke。用户于 2026-07-31 明确要求文档和代码评审只运行第一 reviewer `gpt-5.5`（`high`），不运行第二 review 模型；`review-confirm` 仍逐条裁决全部评论。

## 3. 纳入范围

- 新建 `/media`。
- 永久迁移 `/services`、`/for/direct-sales`、`/for/insurance`、`/for/securities`、`/method`。
- 将既有顾问导航入口收敛到 `/media`，并更新联系页、metadata、canonical、sitemap 和相关内容模型；M3-03 不切换 M3-04 所属的最终六项产品主导航、首页或完整 Header/Footer 外壳。
- 产品二维码与企业微信二维码入口隔离。

关键文件：

- Create: `src/app/media/page.tsx`。
- Modify/Delete: `src/app/services/page.tsx`、`src/app/for/[profession]/page.tsx`、`src/app/method/page.tsx`。
- Modify: `next.config.ts`、`src/lib/route-metadata.ts`、`src/lib/site-content.ts`。
- Modify: `src/components/wechat-contact.tsx`、`src/components/contact/wechat-panel.tsx`、`src/app/contact/page.tsx`。
- Modify: `src/lib/analytics.ts`，企业微信匿名事件固定为 `open_media_wechat_contact`，与 `open_mini_program_trial` 隔离。
- Modify: `src/app/page.tsx`、`src/components/direct-sales-focus.tsx`、`src/components/service-overview.tsx`、`src/components/site-footer.tsx`、`src/components/mobile-contact-bar.tsx`，清除仍会发出旧路由的入口；最终六项外壳导航仍不在本 Sprint 切换。
- Modify: `src/app/sitemap.xml/route.ts`、`src/app/llms.txt/route.ts` 及 `src/server/discovery/files.ts` 使用的公开路由输入。
- Create: `scripts/smoke-media-redirects.mjs`，对构建后的服务执行 no-follow 永久重定向契约。
- Create tests: `tests/media-page-and-redirects.test.tsx`。
- Modify: `tests/routes-and-metadata.test.ts`、`tests/indexing-and-config.test.ts`、`tests/m2-discovery-files.test.ts`、`tests/wechat-contact.test.tsx`、`tests/site-header.test.tsx`。

## 4. 暂不纳入范围

- `/media/*` 子页面、独立 Logo、独立导航或 Organization。
- 顾问预约、报价、合同、支付和客户账号。
- CMS 内容品牌清理和宣传口径证据。
- 旧独立域名边缘重定向的实际云配置。

原因：

- 本 Sprint 只交付同一域名内的页面和路由迁移；真实域名由发布 Sprint 核实。

## 5. 工作范围

### 5.1 工作包：媒体单页内容契约

实现任务清单：

- [x] 先写失败测试，固定三类服务、四类适用人群、五步方法、代表性交付和合规边界。
- [x] 在集中内容模型中复用现有服务/职业定义，删除只为旧页面存在的重复投影。
- [x] 实现 `/media`，使用统一页头页脚和 Token，并建立 `services`、`direct-sales`、`insurance`、`securities`、`method` 稳定锚点。
- [x] 页面 JSON-LD 继续归属客来宝 Organization，不创建客来宝媒体组织实体。

测试要求：

- [x] 核心内容在 SSR 首响应中可见。
- [x] 页面无独立媒体导航、Logo 或主题配置。

### 5.2 工作包：企业微信咨询边界

实现任务清单：

- [x] 先扩展二维码测试，断言“咨询客来宝媒体”只打开企业微信配置，且不会记录小程序事件。
- [x] 更新企业微信对话框标题为“咨询客来宝媒体”、二维码 alt 为媒体咨询语义、匿名事件为 `open_media_wechat_contact`。
- [x] 更新 `/contact`，保持产品体验和媒体咨询两个独立区块。
- [x] 企业微信图片失败时只提供媒体咨询备用说明，链接固定到 `/contact#media-consultation`。

测试要求：

- [x] 小程序和企业微信组件、配置、事件及失败路径互不替代。
- [x] 询盘 DTO、DirectMail 和隐私校验无变化。
- [x] 企业微信 Dialog accessible name 为“咨询客来宝媒体”；焦点进入并限制在 Dialog 内，Escape/关闭按钮可关闭且焦点恢复。
- [x] 图片失败后破损图片消失，以 status 文字公告错误，只链接 `/contact#media-consultation`；不得出现小程序资源、事件或失败路径。

### 5.3 工作包：旧路由永久重定向

实现任务清单：

- [x] 先写五条路由测试，断言配置目标；再用构建后的真实 HTTP 响应断言永久状态、目标 fragment 和原 query 参数保留。
- [x] 使用 `next.config.ts` 的原生 redirects 或等效 App Router 原生能力实现，不增加依赖。
- [x] 删除不可达旧页面实现及仅由其使用的死代码。
- [x] 更新所有现有公开旧路径发射点：首页、页脚、移动联系条、直销聚焦、服务概览、集中导航和 metadata；五条旧 URL 只允许存在于 redirect 定义、测试和历史文档。
- [x] 保持 `/about`、`/contact`、新闻、案例和政策 URL 不变。

测试要求：

- [x] 旧路由不再返回旧页面或进入首页；未知 `/for/*` 保持 `404`，不得错误匹配任一职业锚点。
- [x] 构建输出和 sitemap 不列旧 canonical。

### 5.4 工作包：发现与视口回归

实现任务清单：

- [x] 更新 `/media` metadata/canonical、sitemap、`llms.txt`、适用的 RSS、Open Graph URL 与 JSON-LD；生成结果不得包含五条旧 canonical。
- [x] 把所有现有顾问/服务/方法导航和 CTA 目标最小收敛到 `/media` 或稳定锚点；最终六项 Header/Footer 主导航模型留给 M3-04。
- [x] 检查锚点落点、sticky header 偏移、键盘导航和四个关键视口。
- [x] 将 `320px`、`390px`、`768px`、`1440px` 的页面/锚点/CTA 结果与截图或可复核摘要写入 `docs/5-Evidence/m3-03/visual-qa.md`。
- [x] 完成代码 review-confirm 后运行全量测试和构建。

## 6. 验收标准

- `/media` 单页完整说明客来宝媒体业务及限制。
- 五条旧路由永久重定向到对应锚点。
- sitemap、`llms.txt`、适用的 RSS、metadata/canonical、Open Graph、JSON-LD 和所有现有顾问链接只使用 `/media` 或稳定锚点；最终六项 Header/Footer 主导航仍归 M3-04。
- 产品体验与媒体咨询不会混用二维码或分析事件。
- `/about` 继续是客来宝公司页面。

## 7. 验证要求

项目声明的验证命令：

- `pnpm test`
- `pnpm lint`
- `pnpm build`

专项验证：

- `pnpm test -- tests/media-page-and-redirects.test.tsx tests/routes-and-metadata.test.ts tests/indexing-and-config.test.ts tests/m2-discovery-files.test.ts tests/wechat-contact.test.tsx tests/site-header.test.tsx`
- 构建后运行 `node scripts/smoke-media-redirects.mjs`：脚本启动/连接 standalone 服务并禁止自动跟随；例如 `/services?utm_source=m3-03` 必须返回永久状态和 `Location: /media?utm_source=m3-03#services`，其余四条按相同顺序保留 query/fragment，`/for/other?x=1` 必须为 `404`。
- `/media` 在 `320px`、`390px`、`768px`、`1440px` 下的锚点和 CTA 检查。
- `pnpm smoke:standalone`、`pnpm validate:release`、`git diff --check`。

## 8. 实施顺序

1. 固定 `/media` 内容和锚点契约。
2. 实现媒体单页与企业微信咨询。
3. 实现旧路由永久重定向并删除死页面。
4. 更新发现文件并完成视口/全量回归。

## 9. 风险控制

- 压缩页面导致合规边界丢失：职业限制进入固定内容测试。
- 锚点被页头遮挡：统一使用 scroll margin 并做四视口检查。
- 重定向丢 query：加入真实 URL 契约测试。
- 二维码混用：使用独立配置类型和组件测试。

## 10. 交付结论

`COMPLETE / CODE_READY_WITH_EXTERNAL_LEGACY`。

- 文档 review 与 review-confirm：完成，仅运行用户指定的第一 reviewer `gpt-5.5`（`high`）。
- TDD red、`/media` SSR、五条 exact permanent redirects、旧页面/链接发射点清理、媒体企业微信语义与发现文件迁移：完成。
- 代码 review 与 code-review-confirm：完成；第一 reviewer 无可执行缺陷，确认结论为 `ACCEPTED_AS_IS_FOR_FINAL_VERIFICATION`。
- 最终本地验证：专项测试（7 files / 33 tests）、全量 `pnpm test`（44 files / 216 tests）、`pnpm lint`、`pnpm build`、`pnpm smoke:standalone`、`pnpm smoke:media-redirects`、`pnpm validate:release`、`git diff --check` 全部通过。
- 浏览器验证：`320px`、`390px`、`768px`、`1440px` 无横向溢出；媒体 Dialog、焦点恢复、inert、sticky-header 锚点和 reduced motion 通过。
- 证据：`docs/5-Evidence/m3-03/tdd-red.md`、`docs/5-Evidence/m3-03/visual-qa.md`。
- 发布状态：Local Code Ready；正式企业微信、小程序及其他真实外部门禁仍缺失，整体 Production 继续为 `BLOCKED`。
