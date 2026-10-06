# Sprint M4-04 完整代码评审报告

- **评审对象**：`products/kelaibao` 从基线 `d5044511^` 到当前工作树的完整变更集，包括 `d5044511` 提交本身、后续未提交修改以及所有未跟踪文件。
- **评审类型**：Code Review
- **评审模型**：opencode-go / kimi-k2.7-code
- **评审日期**：2026-08-05
- **评审依据**：
  - `products/kelaibao/AGENTS.md`
  - `products/kelaibao/docs/1-Requirement/Mainland-Website-FR/FR-22-owner-approved-public-site-content-and-experience-update.md`
  - `products/kelaibao/docs/3-Plan/sprint-m4-04-owner-approved-content-and-experience-update.md`
  - `products/kelaibao/docs/5-Evidence/m4-04/decision-traceability.md`
  - `products/kelaibao/docs/5-Evidence/m4-04/production-blockers.md`
  - `products/kelaibao/docs/5-Evidence/m4-04/asset-provenance-ledger.md`
  - `products/kelaibao/docs/5-Evidence/m4-04/visual-qa.md`
  - 相关设计与证据引用（`docs/2-Design/assets/m4-04/`、`docs/4-Reviews/20260804-kelaibao-website-review-confirm.md`）
- **评审状态**：只读评审；未改动任何源码、测试、需求、计划、证据或 git 状态。

## 1. 变更范围概览

本次评审覆盖的完整范围为 `git diff d5044511^ -- products/kelaibao` 加上 `git status --short -- products/kelaibao` 中报告的所有未跟踪文件。

### 1.1 已提交变更（`d5044511` 及之前，相对 `d5044511^`）

- **需求与计划**：新增 `FR-22` 与 `sprint-m4-04` 文档；更新 `Mainland-Website-FR-Index.md`、`Mainland-Website-Sprint-Index.md`。
- **设计资产**：新增 `docs/2-Design/assets/m4-04/` 下 16 张评审概念图与 4 张候选素材。
- **评审确认**：新增 `20260804-kelaibao-website-review-confirm.md`，记录 56 项 `Accept` 决策。
- **证据与门禁**：更新 `claims-register.json`（引入 `accepted-blocked` 处置并新增 7 条 M4 口径），更新 `gate-input.json` 保持 `production_claims_authorization` 为 `BLOCKED`。
- **脚本**：`claims-validator.mjs` 支持 `accepted-blocked` schema；`m3-release-evidence.mjs` 按 register 中是否存在 `accepted-blocked` 自动判定 gate 期望状态。
- **公开页面**：`/`、`/features`、`/team`、`/media`、`/about`、`/contact`、`/privacy`、`/terms`、`/disclaimer` 的内容、结构与样式调整。
- **组件**：`site-header.tsx`（Logo 替换）、`site-footer.tsx`（政策入口与标语）、`mini-program-trial.tsx`（简化文案）、`contact/inquiry-form.tsx`（电话字段）、`public-content-list.tsx`（新闻中心）。
- **库**：`site-content.ts`、`route-metadata.ts`、`inquiry-validation.ts`。
- **样式**：`globals.css` 主色/辅色 token 与新增组件样式；`m4-03-visual-system.css` 痛点卡片白底。
- **测试**：`m4-04-owner-update.test.tsx` 等新增/更新测试；`m4-02-public-page-baseline.json` 更新 digest 与结构。
- **Public 资产**：`public/brand/kelaibao-k-link-logo.png`、`office-scenes.png`、`arrival-guide.jpeg`。

### 1.2 未跟踪变更（当前工作树）

- `src/components/image-lightbox.tsx`（公司实景 Gallery 组件）
- `tests/image-lightbox.test.tsx`（Gallery 开/关/焦点测试）
- `docs/5-Evidence/m4-04/decision-traceability.md`
- `docs/5-Evidence/m4-04/production-blockers.md`
- `docs/5-Evidence/m4-04/asset-provenance-ledger.md`
- `docs/5-Evidence/m4-04/visual-qa.md`
- `docs/5-Evidence/m4-04/screenshots/*.png`（20 张截图）
- 已存在的 `docs/4-Reviews/sprint-m4-04-code-review-by-opencode-go-glm-5.2.md` 与 `sprint-m4-04-code-review-by-opencode-go-kimi-k2.7-code.md`（本报告将覆盖写入后者）

## 2. 验证复现

在 Windows 宿主（当前工作目录）执行项目声明的验证命令：

| 检查 | 命令 | 结果 | 备注 |
|---|---|---|---|
| 单元测试 | `pnpm test` | **PASS** | 64 files，347 passed，2 skipped；跳过项为 Windows 无 symlink 权限的安全夹具用例 |
| 类型检查 / Lint | `pnpm lint`（`tsc --noEmit`） | **PASS** | 无类型或 lint 错误 |
| 空白检查 | `git diff --check` | **PASS** | 无 trailing whitespace 或冲突标记 |
| 完整构建 | `pnpm build` | **ENV BLOCKED** | Next.js 静态生成 16/16 通过；`package:standalone` 在创建 pnpm 软链时因 Windows `EPERM` 失败 |
| 发布证据 | `pnpm validate:release` | **PASS / BLOCKED** | `localReady: true`，`productionReady: false`，claims gate 保持 `BLOCKED` |

说明：Windows 宿主无法完成 standalone 打包是已知环境限制（`production-blockers.md` 已记录 WSL2 完整通过）。本报告不将其视为源码缺陷，但建议在本地门禁文档中明确 Windows 构建命令的降级方式。

## 3. 评审发现

### 3.1 发现总表

| Severity | Type | Location | Issue | Evidence | Recommendation |
|---|---|---|---|---|---|
| High | Requirement | `src/app/about/page.tsx`（lines 55–62） | `/about` 页面仍把公司介绍作为 `PageHero` 的单一长 `lead` 段落渲染，未形成独立的“公司介绍”模块，也未按审阅稿拆分为四段正文。 | FR-22 §7.1 要求：“`/about` Hero 改为‘关于我们’，公司介绍成为独立模块并采用审阅稿四段正文”；`decision-traceability.md` C52 状态为 `PRODUCTION_BLOCKED`（主体资历证据缺失），但模块结构要求仍应在本地实现中满足。 | 将当前 `PageHero.lead` 中的长段落提取为独立的 `<Section title="公司介绍">`，拆分为四段与审阅稿对应的正文；`PageHero.lead` 仅保留简短价值主张。同步更新 `m4-04-owner-update.test.tsx` 与 `m4-02-public-page-baseline.json` 断言该模块存在。 |
| Medium | Correctness | `src/app/media/page.tsx`（lines 136–144） | “百家主流媒体全覆盖”标题与下方仅列出的 11 家示例媒体（6 主流门户 + 5 地方官媒）在数量与范围上明显不一致，形成本地内容准确性缺口。 | `MEDIA_OUTLETS` 仅 11 项；`decision-traceability.md` C49 已标记为 `PRODUCTION_BLOCKED`（合作范围与名称授权缺失）。 | 将标题改为限定性表述，如“主流媒体资源示例”或“可对接媒体范围（示例）”，或在标题后显式补充“示例”字样；保持 C49 Production blocker 不变。同步更新 `m4-04-owner-update.test.tsx` 断言标题含限定词。 |
| Medium | Consistency | `src/components/contact/wechat-panel.tsx`（lines 21–22, 31, 65）；`src/components/wechat-contact.tsx`（lines 130–131, 146, 154） | 页面级文案已将“客来宝媒体”改为“媒体中心”/“人工服务咨询”/“咨询媒体报道”，但 `WechatPanel` 和 `WechatContactDialog` 内部仍多处使用旧称谓“客来宝媒体”“咨询客来宝媒体”。 | `contact/page.tsx` 第 21 行、44 行、45 行已使用新命名；`site-content.ts` 导航已改为“媒体中心”；`decision-traceability.md` C45/C46 标记为 `LOCAL_IMPLEMENTED`。 | 统一 Dialog 与 WechatPanel 内的标题、fallback 文案、可访问名称与页面/导航新命名一致；保留“客来宝媒体”作为企业微信账号/主体说明（如 `displayName` 来源），但咨询入口标题应改为“人工服务咨询”/“咨询媒体报道”。 |
| Medium | Test / Build | `package.json` `package:standalone`；Windows 构建 | 当前 Windows 宿主执行 `pnpm build` 时，Next.js 静态生成成功，但 `package:standalone` 因创建 pnpm 软链 `EPERM` 失败，退出码非 0。 | `pnpm build` 输出：`Failed to copy traced files ... EPERM: operation not permitted, symlink`。 | 在 `package.json` 中提供 Windows 兼容的构建脚本（如 `build:windows` 跳过 standalone），或在 `AGENTS.md`/Sprint 文档中明确 Windows 本地验证以 `next build` 成功为限，standalone 打包必须在 WSL2/Linux 执行。 |
| Low | Clarity | `src/app/page.tsx`（line 102） | Hero Aside 中使用 `“客来宝----让更多潜在客户添加你”`，四个连续连字符疑似排版错误，正常中文排版应为破折号“——”或独立短句。 | `page.tsx` 源码文本；`m4-04-owner-update.test.tsx` 未断言该字符串。 | 将 `----` 改为中文破折号 `——` 或按审阅稿改为其他分隔符；同步更新 `m4-02-public-page-baseline.json` 的 `textDigest`。 |
| Low | Accessibility | `src/components/image-lightbox.tsx`（lines 30–37） | 原生 `<dialog>` 缺少 `aria-modal="true"`，触发按钮内嵌的 `<Image>` 与 `<span>` 标签的 `alt`/`label` 文本重叠，可能导致可访问名称冗长。 | `image-lightbox.tsx` `<dialog aria-label={label}>` 无 `aria-modal`；触发按钮同时包含 `alt={alt}` 图片和 `<span>{label}</span>`。 | 为 `<dialog>` 添加 `aria-modal="true"`；将触发按钮内的图片改为装饰性 `alt=""`，由 `span` 单独提供按钮可访问名称，或在测试中明确断言计算后的可访问名称。 |
| Low | Maintainability | `src/app/media/page.tsx`（lines 14–26, 73–75） | `MEDIA_PROBLEMS`、`MEDIA_PROBLEM_ICONS`、`MEDIA_OUTLETS` 为相互独立的数据结构，图标通过索引隐式关联；新增/删除条目时只能在运行时发现错位。 | 页面中使用 IIFE `{(() => { const Icon = MEDIA_PROBLEM_ICONS[index]; return <Icon ... />; })()}` 渲染图标。 | 将 `MEDIA_PROBLEMS` 重构为 `{ problem: string; Icon: LucideIcon }[]` 或 `{ problem: string; icon: string }[]`（配合统一 IconMap），消除索引隐式依赖；将数据抽至 `src/content/media-content.ts` 并加类型约束。 |
| Low | Maintainability | `src/app/m4-03-visual-system.css`（lines 567–576） | C18 将痛点卡编号 `<span>` 替换为 Lucide 图标后，`.media-problem-grid article:nth-child(1)/(4) span` 选择器已无匹配元素；同区块 `background: #ffffff` 与基础规则 `.media-problem-grid article { background: #ffffff }` 重复。 | 源码中 `media/page.tsx` 的痛点 `article` 不再包含 `<span>` 子元素；grep 命中死选择器。 | 删除 573–576 行的死 `span` 规则；合并 567–571 与 559–565 的白底规则，避免样式来源歧义。 |
| Low | Accessibility | `src/app/media/page.tsx`（lines 71–79） | 四个痛点卡片由 `<div className="media-problem-grid">` 内嵌四个 `<article>` 组成，删除 01–04 编号后缺少列表语义，屏幕阅读器用户难以感知其为相关集合。 | 旧实现使用 `<span>` 编号，新实现使用图标 + `<p>`；无 `<ul>`/`<li>` 或 `role="list"`。 | 将网格改为 `<ul>` 包裹 `<li>`（保留现有 CSS 类），或给 `<div>` 加 `role="list"` 并在 `<article>` 上加 `role="listitem"`，保持视觉不变的同时恢复列表语义。 |
| Low | Performance | `src/app/about/page.tsx`（line 114）；`public/brand/office-scenes.png`（3.5MB） | 办公室场景图以 `next/image` + `unoptimized` 直接服务，3.5MB PNG 在每个关于页访客处完整下发；无 `sizes` 或多档资源。 | `office-scenes.png` 3535118 字节；`ImageLightbox` 固定传递 `unoptimized` 且未提供 `sizes`/`priority` 等 props。 | 提供 WebP/压缩版本或至少为缩略图与灯箱大图分层；为 `ImageLightbox` 增加 `sizes`、`priority`、`className` 等可选 props，在缩略图触发器上移除 `unoptimized` 让 Next.js 优化，仅在大图/原图保持 `unoptimized`。 |
| Low | Test | `tests/image-lightbox.test.tsx`（lines 7–31） | 测试仅通过 mock `showModal`/`close` 验证焦点恢复，未点击实际关闭按钮或 backdrop，也未断言“在新页面查看原图”链接的 `href`。 | 测试中对 `HTMLDialogElement.prototype.close` 打桩后调用 `dialog.close()`。 | 增加测试用例：点击“关闭”按钮和点击 backdrop 后焦点返回触发按钮；断言 `<a href={src}>` 的 `href` 与传入 `src` 一致。 |
| Low | UX | `src/components/image-lightbox.tsx`（line 41） | “在新页面查看原图” `<a href={src}>` 未设置 `target`/`rel`，点击会在当前标签页打开裸图，离开站点上下文。 | `image-lightbox.tsx` 第 41 行。 | 为原图链接添加 `target="_blank" rel="noopener noreferrer"`，保留当前页面上下文；同源图片也可使用 `noopener` 避免 opener 引用。 |
| Low | Documentation | `docs/5-Evidence/m4-04/decision-traceability.md` | 轨迹表全面但 C52 的实现文件列的是 `src/app/about/page.tsx` 与 `tests/m4-04-owner-update.test.tsx`，当前源码并未实现四段独立模块。 | 见上 High 项。 | 在 C52 行中补充说明“模块结构尚未完成，待本地实现后更新测试与 baseline”；或先完成本地实现再更新轨迹。 |
| Info | Scope | 全部 M4-04 变更 | 本次变更覆盖了 FR-22 的大部分工作包（WP1–WP5），但 WP0 中“更新 SRS、视觉规格、内容布局规格”等文档任务未在 diff 中体现；WP6 中“完成代码 review-confirm”正在进行（本报告）。 | `sprint-m4-04-owner-approved-content-and-experience-update.md` WP0/WP6 任务清单仍有未勾选项。 | 确认 SRS/视觉规格/内容布局规格更新是否已在其他提交或分支中完成；若尚未完成，应在归档 Sprint 前补齐或明确推迟。 |
| Info | Security / Risk | `docs/5-Evidence/m4-04/production-blockers.md`；`docs/5-Evidence/m4-04/asset-provenance-ledger.md` | 所有依赖外部证据的 Accept 项（结果口径、媒体覆盖、Logo、办公室图、到访图、政策正文、公司资历等）均保持 `BLOCKED`，未因本地测试或产品负责人决定而解除。 | `production-blockers.md` 与 `asset-provenance-ledger.md` 中 blocker 表完整；`claims-register.json` 中 `accepted-blocked` 计数与 `gate-input.json` 一致。 | 保持所有 blocker 直至对应证据、授权与专业审查完成；不要以本报告或任何本地验证结果作为 Production Ready 依据。 |
| Info | Consistency | `docs/5-Evidence/m3-05/claims-register.json`；`gate-input.json`；`tests/m3-claims-validator.test.ts` | `accepted-blocked` 处置贯穿 register、validator 脚本、release evidence 与测试；`claimsCount` 10→17、`approved` 0、`weakened` 2、`accepted-blocked` 15 全链路一致。 | `m3-claims-validator.test.ts` 通过；`m3-release-evidence.test.ts` 通过。 | 无需改动；该机制正确体现了“产品负责人接受公开表达但不解除 Production 门禁”的原则。 |
| Info | Test | `tests/m4-04-owner-update.test.tsx` | 新增的 M4-04 契约测试覆盖了 Header/Footer Logo、首页口径、功能/团队文案、媒体名单、关于页/联系页关键字符串，有效锁定本次 Accept 项。 | 该用例 5 个测试全部通过。 | 完成 High 项（关于公司介绍模块）和 Medium 项（媒体标题限定）后，同步扩展该测试断言。 |
| Info | Correctness | `src/lib/inquiry-validation.ts`；`src/components/contact/inquiry-form.tsx` | 电话字段 DTO 正确限制 `contactMethod=phone`、正则校验中国大陆手机号、长度 2–80、隐私同意必填；表单不再提供微信/电话单选。 | 测试 `inquiry-form.test.tsx`、`inquiry-validation.test.ts` 通过。 | 无需改动；C33 已满足。 |
| Info | Security | `src/app/about/page.tsx`（line 28） | 安全模块中保留“100%私域归属”“绝对保密”“谁分享，数据和客户就归谁”等绝对措辞，已在 `claims-register.json` 中登记为 `accepted-blocked`。 | `workbook-private-domain-ownership-100-percent` 为 `accepted-blocked`；`m4-absolute-private-domain-lock` 同样 `accepted-blocked`。 | 无需改动；作为本地实现保留，但不得进入 Production 直至完成归属与隔离证据审查。 |

### 3.2 详细说明

#### 3.2.1 关于页公司介绍模块（High）

FR-22 §7.1 明确要求：“`/about` Hero 改为‘关于我们’，公司介绍成为独立模块并采用审阅稿四段正文”。当前实现虽然把 `PageHero.title` 改为“关于我们”，但将整个公司介绍作为 `PageHero.lead` 渲染为一个超长段落（`page.tsx` 第 60 行）。这同时导致：

1. 模块结构未满足需求；
2. Hero 区域信息过载，可读性受损；
3. 无法通过测试断言四段正文存在。

由于 C52 的 `PRODUCTION_BLOCKED` 仅针对“主体资历和结果口径证据”，本地结构拆分不应被 blocker 豁免。建议在 Hero 下新增独立 `Section title="公司介绍"`，按审阅稿拆分为四段，并保留现有“服务数据”“企业文化”“安全与合规保障”等后续模块。

#### 3.2.2 媒体中心标题与示例名单（Medium）

“百家主流媒体全覆盖”与下方 11 家媒体名称在数量上明显不匹配。虽然页面已有“可对接的媒体范围以当期项目清单、媒体审核与实际发布结果为准”的限定说明，但标题本身仍属绝对化表述。在 C49 未解除 blocker 之前，本地实现也应避免内容自相矛盾。建议标题改为“主流媒体资源示例”或“可对接媒体范围（示例）”。

#### 3.2.3 人工服务咨询入口文案不一致（Medium）

C45/C46 已将页面级命名统一为“媒体中心”“人工服务咨询”“咨询媒体报道”。但 `WechatPanel`（联系页企业微信区块）和 `WechatContactDialog`（/media 页面弹窗）内部仍使用“客来宝媒体”“咨询客来宝媒体”。这会导致用户从导航/CTA 点击后进入的 Dialog 标题与入口标签不一致，影响可预测性。建议统一内部标题为“人工服务咨询”/“咨询媒体报道”，同时可在联系事实或企业微信账号说明中保留“客来宝媒体”作为服务主体名称。

#### 3.2.4 Windows standalone 构建环境限制（Medium）

`pnpm build` 在 Windows 宿主因 `package:standalone` 创建软链失败而无法完整退出。Next.js 静态生成本身已成功（16/16 页），但 CI/本地门禁若以 `pnpm build` 为单一命令会被阻塞。建议在 `package.json` 增加 `build:windows` 脚本仅执行 `next build`，或让 `package:standalone` 在 Windows 非管理员环境下自动跳过并输出警告。同时更新 `AGENTS.md` 或 Sprint 文档，明确 Windows 本地验证以 `next build` 成功为准，standalone 验证在 WSL2/Linux 执行。

#### 3.2.5 ImageLightbox 与媒体页低优先级改进

`ImageLightbox` 组件功能正确（原生 dialog、焦点恢复、backdrop 关闭、原图降级链接），但缺少 `aria-modal`、`target`/`rel`、触发图片装饰性处理等 polish。媒体页图标渲染使用 IIFE 可读性较差，且存在索引隐式依赖与死 CSS 选择器。这些不影响本地门禁，但建议在合并前小修，以降低后续维护成本。

## 4. 结论与建议

### 4.1 总体结论

本次 M4-04 变更集在以下方面表现良好：

- **需求追踪完整**：C01–C56 映射到文件、测试与 `LOCAL_IMPLEMENTED` / `PRODUCTION_BLOCKED` 状态，符合 FR-22 第 8 节要求。
- **测试与类型检查通过**：`pnpm test` 347 passed / 2 skipped，`pnpm lint` 无错误。
- **Production blocker 未被绕过**：所有结果型/绝对口径、媒体覆盖、图片授权、Logo、政策文本均保持 `BLOCKED`。
- **PII 与架构边界保持**：电话表单、DirectMail、PII 不进入 URL/Storage/日志/analytics 的实现与测试一致。
- **双咨询路径隔离**：K-Link 小程序体验与企业微信人工服务在资源、事件、Dialog 上保持分离。

### 4.2 需要修复后方可进入 code-review-confirm 的项目

1. **High**：将 `/about` 公司介绍拆分为独立模块并四段化（FR-22 §7.1 / C52）。
2. **Medium**：将 `/media` “百家主流媒体全覆盖”标题改为限定性表述（C49 本地一致性）。
3. **Medium**：统一 `WechatPanel` 与 `WechatContactDialog` 内的标题/文案与页面新命名（C45/C46）。

### 4.3 建议在小迭代中处理的 Low 项

- 修正首页 Hero 中 `----` 连字符排版。
- 为 `ImageLightbox` 添加 `aria-modal`、调整触发按钮可访问名称、原图链接 `target`/`rel`、扩展测试覆盖。
- 重构媒体页痛点/图标数据结构，移除死 CSS 选择器，恢复列表语义。
- 优化办公室场景图的体积与加载策略（缩略图优化 + 大图 unoptimized）。

### 4.4 最终评审建议

**Conditional Pass**：本地实现与显式 Production blocker 体系基本成立；但在完成上述 3 项 Medium/High 修复并重新运行 `pnpm test && pnpm lint && pnpm build`（Windows 以 `next build` 成功为准）之前，不建议将本 Sprint 标记为 `Local Code Ready`。Production 发布必须在 `production-blockers.md` 与 `asset-provenance-ledger.md` 中全部外部证据与授权补齐后，由独立审查确认。

---

**报告写入文件**：`products/kelaibao/docs/4-Reviews/sprint-m4-04-full-code-review-by-opencode-go-kimi-k2.7-code.md`
