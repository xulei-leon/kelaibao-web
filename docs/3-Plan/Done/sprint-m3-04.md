# Sprint M3-04 客来宝统一外壳、首页与免费体验

> **状态：** `COMPLETE / 文档与代码 review-confirm、实现及本地验证已完成；Production 仍 BLOCKED`
>
> **For agentic workers:** 实施时使用用户明确指定的 `sprint-workflow`，按工作包执行 TDD、review-confirm 和验证；除非用户另行明确要求，不自动启用其他 superpower skill。

**Goal:** 交付客来宝统一站点外壳、新首页和直接打开小程序二维码的免费体验路径。

**Architecture:** 复用 M3-02 已交付的小程序配置/对话框、现有 App Router 页面、站点内容配置和匿名分析组件；本 Sprint 只把最终首页和全站外壳接入已验证能力，不引入新依赖。

**Tech Stack:** Next.js 15、React 19、TypeScript、Tailwind CSS、Vitest、Testing Library。

## Global Constraints

- 工作目录为 `products/kelaibao/`。
- 主品牌客来宝，产品名 K-Link，子业务客来宝媒体。
- “免费体验”只打开小程序二维码，不提交 Web 表单、不创建账号。
- CMS 继续只管理新闻/案例；不修改数据库。
- “全站外壳”仅指公开营销路由；`/admin`、`/api`、`/health`、CMS 管理表面和其他 server-only endpoint 不渲染公开 Header、Footer、免费体验 CTA 或移动联系栏。
- 关键视口：`320px`、`390px`、`768px`、`1440px`。

---

## 1. Sprint 目标

实现 [FR-16](../../1-Requirement/Mainland-Website-FR/Done/FR-16-kelaibao-product-site-and-mini-program-trial.md) 的统一外壳、首页和小程序体验部分。

核心目标：

- 首页完整表达新版工作簿的陌生拓客和社群经营销售路径。
- 全站主导航切换到统一客来宝 IA。
- 免费体验 CTA 在桌面端和移动端均可无注册使用。

## 2. 前置依赖

- `sprint-m3-03` 已完成文档/代码 review-confirm、验证并提交 `933b01b`。
- FR-16 与本 Sprint 完成文档 review-confirm。
- 已提供可用于 Preview 的客来宝小程序二维码、显示名和说明；正式资产仍由发布门禁确认。

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

验证命令来自产品级 `AGENTS.md`；另运行 `pnpm smoke:standalone`、`pnpm validate:release` 和 `git diff --check`。用户于 2026-07-31 明确要求文档和代码评审只运行第一 reviewer `gpt-5.5`，不运行第二 review 模型；随后将新启动 LLM 任务速度改为“标准”。`review-confirm` 仍逐条裁决第一 reviewer 的全部评论。

## 3. 纳入范围

- 全站页头、页脚、移动导航和首页/全局 metadata。
- `/` 新首页。
- 小程序体验 CTA 在首页、页头和移动联系栏的全站接入。
- 首页内容/路由/可访问性/匿名分析测试。

关键文件：

- Modify: `src/app/page.tsx`、`src/app/layout.tsx`、`src/app/globals.css`。
- Modify: `src/components/site-header.tsx`、`site-footer.tsx`、`mobile-contact-bar.tsx`。
- Modify: `src/components/mini-program-trial.tsx`。
- Modify: `src/lib/site-content.ts`、`src/lib/site-config.ts`、`src/types/site.ts`。
- Reuse/regression: `src/app/contact/page.tsx`；Modify: `src/lib/route-metadata.ts`。
- Test: `tests/site-header.test.tsx`、`tests/site-content.test.ts`、`tests/routes-and-metadata.test.ts`。
- Modify/regression: `tests/mini-program-trial.test.tsx`、`tests/product-pages.test.tsx`、`tests/indexing-and-config.test.ts`。
- Create: `tests/home-and-global-shell.test.tsx`。
- Create evidence: `docs/5-Evidence/m3-04/tdd-red.md`、`docs/5-Evidence/m3-04/visual-qa.md`。

## 4. 暂不纳入范围

- 小程序二维码底层配置/组件重建。
- `/features`、`/team`、`/about` 和 `/media` 的重新实现。
- CMS 内容、政策与发布口径，归 M3-05。
- 正式小程序二维码、Production 域名/备案或其他外部门禁的关闭。

原因：

- 先形成从首页到小程序的最小完整产品转化路径。

## 5. 工作范围

### 5.1 工作包：统一外壳契约

实现任务清单：

- [x] 先更新 `site-header.test.tsx`，断言六个主导航项及精确目标：首页 `/`、核心功能 `/features`、团队解决方案 `/team`、客来宝媒体 `/media`、新闻动态 `/news`、关于我们 `/about`；同时断言客来宝首页标签和小程序“免费体验”按钮。
- [x] 更新 route/metadata 与首页外壳测试，断言首页主品牌、K-Link 产品定位、canonical/Open Graph 和新 IA，确认旧顾问首页契约先失败。
- [x] 为六项主导航建立 route/metadata 与服务端或 standalone smoke 契约：`/`、`/features`、`/team`、`/media`、`/news`、`/about` 均可访问且 canonical 正确；`/news` 在无已发布内容时仍输出可抓取列表/空状态，不要求本 Sprint 增加新闻内容。
- [x] 最小修改页头、页脚、移动导航、layout metadata 和 CSS Token 使测试通过；Footer 同时保留案例、联系和政策链接，但不增加第七个桌面主导航项。

测试要求：

- [x] 键盘可到达导航和 CTA；移动菜单按钮具备 `aria-expanded`/`aria-controls`，打开后焦点顺序正确，选路由、Escape 或再次激活按钮均可关闭，并把焦点返回菜单按钮。
- [x] 页头页脚不出现独立赛诺或独立媒体品牌。
- [x] 回归 `/admin` 布局及 `/api`、`/health` 响应，确认非公开营销表面不渲染免费体验 CTA、公开 Footer 或移动联系栏，且现有认证、CMS、询盘和健康检查行为不变。
- [x] Header 高度、移动触控目标和 action-blue CTA 符合统一视觉规格；不得把产品体验渲染为企业微信绿色按钮。

### 5.2 工作包：小程序体验全站接入

实现任务清单：

- [x] 扩展既有 `mini-program-trial` 与外壳测试，先断言页头、首页和移动联系栏统一调用同一 `MiniProgramConfig`/Provider 体验入口。
- [x] 页头、首页和移动联系栏复用 M3-02 的 `MiniProgramConfig` 与 `mini-program-trial.tsx`。
- [x] 删除旧企业微信主 CTA 的全站默认角色；全局 Header 和移动栏在 `/media` 仍为产品“免费体验”，但 `/media` 页面内局部主 CTA 继续是独立的企业微信“咨询客来宝媒体”。
- [x] 回归打开、关闭、Escape、焦点恢复、二维码 alt、图片错误和 `/contact` 备用链接。

测试要求：

- [x] 小程序失败不得打开企业微信或自动提交询盘。
- [x] 小程序二维码失败后破损图片从可访问树和页面中移除，以 `role="status"` 或等价 live-region 暴露错误；降级只指向 K-Link 产品联系路径，且不出现企业微信文案或企业微信分析事件。
- [x] 匿名分析事件固定为 `open_mini_program_trial`，只含事件名和页面来源标识；不得含 query、hash、联系方式、需求正文或小程序用户信息。
- [x] Preview placeholder 保持清晰测试标识；`production-mini-program` 正式资源缺失时 Production 继续 `BLOCKED`，不得由 M3-04 静默创建占位正式文件。

### 5.3 工作包：新版首页

实现任务清单：

- [x] 先更新首页内容测试，断言一站式拓客、陌生拓客/社群经营问题、产品内使用说明、查找/转发/复制、四项价值、四组十项工具摘要、团队方案、媒体/新闻/案例摘要和最终体验入口。
- [x] 按已批准设计与 FR-16 顺序重构 `page.tsx`，复用现有 `PageHero`、`Section`、`ActionLink`、产品内容模型和小程序 CTA；不得因原始工作簿本地缺失推断新增统计、Logo、案例或产品截图。
- [x] 不创建十个工具页，不加入登录、账号、Dashboard 或虚构截图。
- [x] 接入产品小程序 CTA，并为 `/features`、`/team`、`/media`、`/about` 使用稳定链接。

测试要求：

- [x] 首个服务端响应包含核心销售文案。
- [x] 公开首页不包含结果保证或未获授权 Logo。
- [x] “登录即可使用”等产品内语义不得渲染为官网 Web 登录入口；首页不得出现 `/login`、公众账号、Dashboard、价格或支付入口。

### 5.4 工作包：联系降级与视口验证

实现任务清单：

- [x] 回归 M3-02 已交付的 `/contact` 分流，确认“体验 K-Link”和“咨询客来宝媒体”仍保持独立。
- [x] 保留既有询盘安全和企业微信机制，不改变 DTO/API。
- [x] 检查四个关键视口、200% 缩放、减少动效和二维码错误状态。
- [x] 在 `docs/5-Evidence/m3-04/visual-qa.md` 建立紧凑路由矩阵，对 `/`、`/features`、`/team`、`/media`、`/news`、`/cases`、`/about`、`/contact`、`/privacy`、`/terms`、`/disclaimer` 检查四个关键视口的页面身份、非空/无框架 overlay、console、共享外壳 CTA 语义和无横向溢出；在存在对应交互的代表路由抽样验证键盘、移动菜单、Dialog、Escape、焦点恢复、200% 缩放和 reduced motion。

## 6. 验收标准

- 首页和全站外壳使用客来宝主品牌与新导航。
- 首页完整呈现新版工作簿的核心销售路径。
- 免费体验 CTA 直接打开小程序二维码且可访问。
- 二维码失败只进入客来宝产品联系降级。
- 六项主导航精确使用已确认路径，Footer 保留案例、联系和政策入口；共享外壳不会覆盖 `/media` 的局部企微咨询语义。
- 共享营销外壳不进入 `/admin`、`/api`、`/health` 或 CMS 管理表面，既有认证、询盘与健康检查边界无回归。
- 不存在 Web 登录、公众账号或产品后台。

## 7. 验证要求

项目声明的验证命令：

- `pnpm test`
- `pnpm lint`
- `pnpm build`

专项验证：

- `pnpm test -- tests/home-and-global-shell.test.tsx tests/mini-program-trial.test.tsx tests/site-header.test.tsx tests/site-content.test.ts tests/routes-and-metadata.test.ts tests/indexing-and-config.test.ts tests/product-pages.test.tsx`
- `320px`、`390px`、`768px`、`1440px` 页面检查。
- 六项主导航 `/`、`/features`、`/team`、`/media`、`/news`、`/about` 的 route/metadata/SSR 或 standalone smoke；`/news` 包含可抓取列表/空状态和 canonical。
- 视觉 QA 路由矩阵覆盖 `/`、`/features`、`/team`、`/media`、`/news`、`/cases`、`/about`、`/contact` 与三个政策页。
- 键盘、移动菜单 Escape/焦点恢复、Dialog Escape/焦点恢复、二维码错误、200% 缩放和减少动效检查。
- `pnpm smoke:standalone`、`pnpm validate:release`、`git diff --check`。
- 当前外部正式资产与云门禁未齐时，`pnpm validate:release` 的 M3-04 预期为退出码 `0`、`localReady=true`、`productionReady=false`、`status=CODE_READY_WITH_EXTERNAL_LEGACY`，并列出 Production blockers；不得为使本 Sprint 通过而修改外部门禁或伪造 `PRODUCTION_LIVE_READY`。若额外执行 `pnpm validate:release -- --require-production-live`，预期退出码为 `1`，不作为本地代码失败。

## 8. 实施顺序

1. 固定统一外壳和路由契约。
2. 将既有小程序体验入口接入全站外壳。
3. 实现新版首页。
4. 更新联系降级并完成视口回归。

## 9. 风险控制

- 小程序与企业微信语义混用：配置、组件、分析事件和错误路径完全分离。
- 共享外壳误入管理/API 表面：以公开营销路由边界和 `/admin`、`/api`、`/health` 回归测试隔离。
- 首页过度堆叠：只实现工作簿已确认区块，详情留给既定页面。
- 缺少真实截图：隐藏图片位或使用流程说明，不伪造界面。

## 10. 交付结论

`COMPLETE / CODE_READY_WITH_EXTERNAL_LEGACY`。

- 文档 review 与 review-confirm：完成，仅运行用户指定的第一 reviewer `gpt-5.5`。
- TDD red、统一公开外壳、新首页、六项导航、小程序体验全站接入、Preview 无数据库新闻/案例空状态和公开/管理边界：完成。
- 代码 review 与 code-review-confirm：完成；唯一 reviewer 无可执行缺陷，Info 验证建议已由主流程满足。
- 最终本地验证：专项测试、全量 `pnpm test`（46 files / 234 tests）、`pnpm lint`、`pnpm build`、`pnpm smoke:standalone`、`pnpm smoke:media-redirects`、`pnpm validate:release`、`git diff --check` 全部通过。
- 浏览器验证：11 routes × 4 viewports = 44/44 PASS；移动菜单、产品/媒体 Dialog、Escape、焦点恢复、200% 等效重排、reduced motion 规则和 admin/health 外壳隔离通过。
- 证据：`docs/5-Evidence/m3-04/tdd-red.md`、`docs/5-Evidence/m3-04/visual-qa.md`。
- 发布状态：Local Code Ready；16 项真实外部门禁仍未关闭，整体 Production 继续为 `BLOCKED`。
