# Sprint M3-02 核心功能、团队方案与公司介绍

> **状态：** `COMPLETE / 文档与代码 review-confirm、实现及本地验证已完成；Production 仍 BLOCKED`
>
> **For agentic workers:** 实施时使用用户明确指定的 `sprint-workflow`，按工作包执行 TDD、review-confirm 和验证；除非用户另行明确要求，不自动启用其他 superpower skill。

**Goal:** 完成 `/features`、`/team`、`/about` 三个产品决策页面及可复用的小程序体验入口，使后续首页和导航均有稳定、可验证的目标。

**Architecture:** 内容继续集中在现有站点内容模块，页面使用现有 UI 原语和统一客来宝 Token。小程序体验使用独立配置和自包含的可访问对话框，与企业微信语义分离；每个页面独立路由、metadata 和测试，不为十项工具建立额外详情路由。M3-02 不切换 Header/Footer、首页或最终主导航，这些变更留给 M3-04。

**Tech Stack:** Next.js App Router、React、TypeScript、Tailwind CSS、Vitest、Testing Library。

## Global Constraints

- 工作目录为 `products/kelaibao/`。
- 不增加 CMS 页面类型、公众账号、团队权限或产品业务功能。
- 不虚构产品截图、Logo、案例、客户照片或统计数据。
- 所有页面提供 SSR 核心正文、唯一 metadata 和可访问标题层级。
- 产品 CTA 只打开小程序二维码；媒体咨询继续使用企业微信。
- 工作簿原文件当前不在本地工作树；只使用已批准设计、SRS、FR-16 中已经明确的名称与结构，未获发布许可的统计和素材默认隐藏。

---

## 1. Sprint 目标

实现 [FR-16](../../1-Requirement/Mainland-Website-FR/Done/FR-16-kelaibao-product-site-and-mini-program-trial.md) 的产品决策页面，为下一 Sprint 切换首页和统一导航提供可访问目标。

核心目标：

- 十项工具按四组集中展示。
- 团队方案区分产品能力、交付服务和非范围功能。
- 关于页面只展示已批准公司事实和授权素材。

## 2. 前置依赖

- `sprint-m3-01` 完成全部门禁并提交。
- 新版工作簿的“核心功能”“团队解决方案”“关于我们”内容已沉淀到已批准设计、SRS 与 FR-16；原始 `.xlsx` 当前缺失，不阻塞已明确结构的实现，也不授权推断额外文案或口径。
- FR-16 与本 Sprint 文档 review-confirm 完成。

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

验证命令来自产品级 `AGENTS.md`。用户于 2026-07-31 明确要求文档和代码评审只运行第一 reviewer `gpt-5.5`（`high`），不运行第二 review 模型；`review-confirm` 仍逐条裁决全部评论。

## 3. 纳入范围

- 新建 `/features`、`/team`。
- 重构 `/about`。
- 建立小程序体验配置、对话框和 `/contact` 的产品/媒体双入口。
- 集中功能组、团队价值、交付保障和公司事实内容。
- 三页 metadata、响应式、可访问性和内容契约测试。

关键文件：

- Create: `src/app/features/page.tsx`、`src/app/team/page.tsx`。
- Modify: `src/app/about/page.tsx`。
- Modify: `src/lib/site-content.ts`、`src/lib/route-metadata.ts`。
- Modify: `src/app/globals.css`、`src/server/discovery/files.ts`（通过 `PUBLIC_ROUTES` 输入覆盖 sitemap/llms 核心页面）。
- Reuse/modify: `src/components/ui/page-hero.tsx`、`section.tsx`、`boundary-note.tsx`。
- Create: `src/components/mini-program-trial.tsx`。
- Modify: `src/lib/site-config.ts`、`src/types/site.ts`、`src/app/contact/page.tsx`。
- Create: `public/wechat/k-link-mini-program-qr-placeholder.svg`；Modify: `.env.example`。
- Modify: `scripts/lib/release-validator.mjs`、`scripts/lib/release-validator.d.mts`、`tests/m2-release-validator.test.ts`（新增小程序 Production blocker，不改变其他 M2 门禁语义）。
- Create tests: `tests/product-pages.test.tsx`。
- Create test: `tests/mini-program-trial.test.tsx`。
- Modify: `tests/site-content.test.ts`、`tests/routes-and-metadata.test.ts`、`tests/indexing-and-config.test.ts`。

## 4. 暂不纳入范围

- 十个独立工具详情页或交互式产品演示。
- 团队小程序管理、成员权限和客户数据。
- `/media` 页面、旧路由重定向和 `/media` 页面内企业微信 CTA 迁移；`/contact` 的媒体咨询分区、既有企业微信配置隔离和降级文案仍属于本 Sprint。
- CMS/政策/发布收口。

原因：

- 本 Sprint 先交付稳定的产品说明和产品二维码入口；客来宝媒体页面仍由下一 Sprint 交付。

## 5. 工作范围

### 5.1 工作包：核心功能内容契约

实现任务清单：

- [x] 先写失败测试，固定五阶段流程、四个功能组和十个工具的名称与数量。
- [x] 在 `site-content.ts` 中建立最小只读功能组数据，避免页面重复文案。
- [x] 实现 `/features`，每项工具说明价值、典型使用场景和已批准能力边界。
- [x] 接入本 Sprint 建立的小程序免费体验 CTA，不创建工具详情 URL。

测试要求：

- [x] 十项工具无遗漏、无重复，标题层级连续。
- [x] 页面不宣称官网自身执行产品内客户跟踪。

### 5.2 工作包：团队方案

实现任务清单：

- [x] 先写失败测试，固定四类团队问题、K-Link 赋能体系和三类交付保障。
- [x] 实现 `/team`，区分团队小程序产品能力与人工交付服务。
- [x] 明确官网不提供团队登录、成员管理、业务统计或客户名单。
- [x] 接入免费体验和联系入口。

测试要求：

- [x] 页面不出现公众登录、Dashboard、成员权限或收益保证。
- [x] CTA 类型和目标统一读取 `MiniProgramConfig`，不依赖尚未改版的首页实现。

### 5.3 工作包：小程序体验配置与联系分流

实现任务清单：

- [x] 先写失败测试，覆盖小程序对话框打开、关闭、Escape、焦点恢复、二维码 alt、移动说明、图片错误和 `/contact` 备用链接。
- [x] 在 `site-config.ts`/`types/site.ts` 增加最小 `MiniProgramConfig`，与 `WechatContactConfig` 分离。
- [x] 创建 `mini-program-trial.tsx`，复用现有可访问对话框模式但不复制企业微信文案。
- [x] 更新 `/contact`，建立“体验 K-Link”和“咨询客来宝媒体”两个明确区块。
- [x] 将小程序资源状态纳入 Production 配置/发布校验；占位状态可以用于 Preview，但不得满足 Production Ready。

配置契约：

- `MiniProgramConfig` 至少包含固定本地二维码路径、显示名、桌面/移动说明和 `preview-placeholder | production-mini-program` 资源状态。
- `.env.example` 仅暴露 `NEXT_PUBLIC_MINI_PROGRAM_DISPLAY_NAME` 与 `NEXT_PUBLIC_MINI_PROGRAM_QR_STATUS`；二维码路径固定为版本控制内的本地资源，避免任意远程 URL。
- 对话框失败链接固定到 `/contact#klink-trial`，分析事件固定为 `open_mini_program_trial`；不得复用 `open_wechat_contact`、企业微信配置或 `/contact#inquiry-form`。

测试要求：

- [x] 小程序失败不得打开企业微信或自动提交询盘。
- [x] 两类二维码使用不同配置、alt、分析事件和失败提示。
- [x] `NEXT_PUBLIC_SITE_ENV=production` 与 `preview-placeholder` 组合必须被配置解析或发布校验拒绝；缺少正式资源证据时 `productionReady=false`。

### 5.4 工作包：关于我们与授权状态

实现任务清单：

- [x] 更新测试，固定公司介绍、企业文化、安全说明和联系入口。
- [x] 重构 `/about`，M3-02 不建立或展示 `100+`、`10万+`、`99.99%`；结构化口径证据和发布许可留给 FR-18/M3-05。
- [x] 未提供合作伙伴/案例授权时隐藏 Logo 区，不输出空的虚构轮播。
- [x] 为真实产品截图/场景图保留有界资产位，不生成伪造界面。

测试要求：

- [x] 未授权 fixture 不渲染 Logo/客户名称。
- [x] 页面源码、SSR 文本和测试均不包含 `100+`、`10万+`、`99.99%`；缺少发布许可时不进入任何运行内容模型。

### 5.5 工作包：跨页面质量

实现任务清单：

- [x] 为三页增加唯一 metadata、canonical 和 sitemap 路由。
- [x] 检查四个视口、键盘顺序、语义标题、对比度和无横向溢出。
- [x] 将 `320px`、`390px`、`768px`、`1440px` 检查结果与截图/可复核摘要记录到 `docs/5-Evidence/m3-02/visual-qa.md`；若浏览器环境不可用，必须记录未验证项而不是判定通过。
- [x] Dialog 自动测试覆盖 Tab/Shift+Tab 焦点不逃逸、背景内容不可触发、遮罩关闭规则；视觉证据覆盖 200% 缩放、`prefers-reduced-motion` 和移动端无横向溢出。
- [x] 完成代码 review-confirm 后重跑目标与全量验证。

## 6. 验收标准

- `/features` 完整展示四组十项工具。
- `/team` 说明团队问题、赋能能力和交付保障，且不实现产品后台。
- `/about` 只展示已批准事实和授权素材。
- `/about` 在 M3-02 不展示三项未验证统计或合作 Logo/案例。
- 产品页面可以直接打开可访问的小程序体验二维码。
- `/contact` 明确区分产品体验和媒体咨询。
- 三页可通过稳定 URL 独立访问并具有唯一 metadata；首页和最终导航接入归 M3-04。
- 所有页面在关键视口和键盘操作下可用。

## 7. 验证要求

项目声明的验证命令：

- `pnpm test`
- `pnpm lint`
- `pnpm build`

专项验证：

- `pnpm test -- tests/product-pages.test.tsx tests/mini-program-trial.test.tsx tests/site-content.test.ts tests/routes-and-metadata.test.ts tests/indexing-and-config.test.ts`
- 三页 SSR 文本和 sitemap 检查。
- `320px`、`390px`、`768px`、`1440px` 视觉检查。

## 8. 实施顺序

1. 固定功能数据契约并实现 `/features`。
2. 固定团队方案契约并实现 `/team`。
3. 建立小程序体验与联系分流。
4. 重构 `/about` 与授权降级。
5. 完成跨页面 metadata、响应式和全量验证。

## 9. 风险控制

- 页面重复维护工具名称：以单一只读内容模型为源。
- 业务能力与官网能力混淆：每页显式写明介绍边界并用测试禁止后台能力。
- 未授权资产误发：默认隐藏，只有明确配置为已批准才渲染。

## 10. 交付结论

`COMPLETE / CODE_READY_WITH_EXTERNAL_LEGACY`。

- 文档 review 与 review-confirm：完成，仅运行用户指定的第一 reviewer `gpt-5.5`（`high`）。
- TDD red、产品页面、小程序体验、联系分流和 Production 门禁：完成。
- 代码 review 与 code-review-confirm：完成；两项接受项已按 TDD 修复。
- 最终本地验证：专项测试（7 files / 40 tests）、全量 `pnpm test`（43 files / 201 tests）、`pnpm lint`、`pnpm build`、`pnpm smoke:standalone`、`pnpm validate:release`、`git diff --check` 全部通过。
- 浏览器验证：`320px`、`390px`、`768px`、`1440px` 页面与 Dialog 检查、200% page scale、reduced motion、焦点、inert 和横向溢出检查通过。
- 证据：`docs/5-Evidence/m3-02/tdd-red.md`、`docs/5-Evidence/m3-02/visual-qa.md` 及其截图。
- 发布状态：Local Code Ready；正式 K-Link 小程序二维码及其他真实外部门禁仍缺失，`production_mini_program` 保持 `BLOCKED`，整体 Production 继续为 `BLOCKED`。
