# Sprint M4-04 完整代码评审报告

- **评审对象**：`products/kelaibao` 从基线 `d5044511^` 到当前工作树的完整变更集，含 checkpoint 提交 `d5044511`、其后的未提交修改以及所有未跟踪文件。
- **评审范围**：`git diff d5044511^ -- products/kelaibao` 与 `git status --short -- products/kelaibao` 报告的全部未跟踪文件。
- **评审类型**：Code Review（只读）
- **评审模型**：opencode-go / glm-5.2
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
- **评审状态**：只读评审。未改动任何源码、测试、需求、计划、证据或 git 状态；仅新增本报告文件。
- **accepted-blocked 处理原则**：按评审指令，`accepted-blocked` 的 Production 口径视为有意阻塞，除非仓库证据与之矛盾；下文不以“证据未齐”本身作为 Critical/High 缺陷，仅校验阻塞记录、本地契约与等义约束的一致性。

## 1. 变更范围概览

### 1.1 已提交变更（`d5044511` 及相对 `d5044511^`）

- 需求与计划：新增 `FR-22` 与 `sprint-m4-04` 文档；更新 `Mainland-Website-FR-Index.md`、`Mainland-Website-Sprint-Index.md`。
- 设计资产：新增 `docs/2-Design/assets/m4-04/` 下 16 张评审概念图与 4 张候选素材。
- 评审确认：新增 `20260804-kelaibao-website-review-confirm.md`（56 项 `Accept`）。
- 证据与门禁：更新 `claims-register.json`（引入 `accepted-blocked` 处置；将原有 6 条 `approved`/部分 `weakened` 转 `accepted-blocked`；新增 7 条 M4 口径，共 17 条）、`gate-input.json`（`production_claims_authorization` 改 `BLOCKED`）。
- 脚本：`claims-validator.mjs` 新增 `assertAcceptedBlocked`；`m3-release-evidence.mjs` 按 register 是否含 `accepted-blocked` 动态判定 claims gate 期望状态。
- 公开页面：`/`、`/features`、`/team`、`/media`、`/about`、`/contact`、`/privacy`、`/terms`、`/disclaimer` 的内容、结构与样式。
- 组件：`site-header.tsx`（Logo 替换）、`site-footer.tsx`（政策入口/标语/案例入口）、`mini-program-trial.tsx`（简化文案、迁移边界）、`contact/inquiry-form.tsx`（电话字段）、`public-content-list.tsx`（新闻中心）。
- 库：`site-content.ts`、`route-metadata.ts`、`inquiry-validation.ts`。
- 样式：`globals.css` 主色 `#094092`/辅色 `#3f6cc4`、新增 Gallery/媒体样式、导航文字色；`m4-03-visual-system.css` 痛点卡片改白底。
- 测试：新增 `m4-04-owner-update.test.tsx`；更新 `m4-02-public-page-baseline.json`、`policy-page-copy.test.tsx`、`inquiry-*.test.*`、`content-layout-v1.2.test.tsx`、`m3-claims-validator.test.ts`、`m3-release-evidence.test.ts`、`m3-release-cli.test.ts`、`sqlite-maintenance.test.ts`/`m2-server-config.test.ts`（Windows symlink skip）等。
- Public 资产：`public/brand/kelaibao-k-link-logo.png`、`office-scenes.png`、`arrival-guide.jpeg`。

### 1.2 未提交/未跟踪变更（当前工作树）

- 新增 `src/components/image-lightbox.tsx` 与 `tests/image-lightbox.test.tsx`（公司实景 Gallery）。
- 新增 `docs/5-Evidence/m4-04/`（`decision-traceability.md`、`production-blockers.md`、`asset-provenance-ledger.md`、`visual-qa.md`、`screenshots/*.png` 20 张）。
- 已修改（未提交）：`about/page.tsx` 接入 Gallery；`media/page.tsx` 新增媒体覆盖模块；`globals.css`/`m4-03-visual-system.css` 新增样式；`m4-02-public-page-baseline.json` digest；部分测试与 evidence JSON。

## 2. 验证复现

在 Windows 宿主（当前工作目录）复现项目声明的验证命令：

| 检查 | 命令 | 结果 | 备注 |
|---|---|---|---|
| 单元测试 | `pnpm test` | **FLAKY / 部分超时** | 复现到 `sqlite-maintenance.test.ts`、`product-pages.test.tsx`、`m3-release-cli.test.ts` 出现 “Test timed out in 5000ms”，逐次跑不同用例超时；与 `production-blockers.md` 记录的 “347 passed, 2 skipped” 不一致。属环境/超时 flake，非断言失败（详见 F-06）。 |
| 类型检查 / Lint | `pnpm lint`（`tsc --noEmit`） | **PASS** | 无类型或 lint 错误。 |
| 空白检查 | `git diff --check -- products/kelaibao` | **PASS** | exit=0。 |
| 发布证据 | `pnpm validate:release` | **PASS / Production BLOCKED** | `localReady: true`、`productionReady: false`、`claimsGate: "BLOCKED"`、`claimsCount: 17`；与证据记录一致。 |

说明：Windows 宿主无法稳定跑完整套件属已知环境差异（`production-blockers.md` 已记录 WSL2 完整通过）。本报告不把超时 flake 视为稳定源码缺陷，但指出证据记录的 “PASS” 具宿主特异性（见 F-06/F-07）。

## 3. 评审发现汇总

| Severity | Type | Location | Issue | Evidence | Recommendation |
|---|---|---|---|---|---|
| Medium | Requirement / Consistency | `src/server/inquiry/service.ts:49`；`src/types/site.ts:95` | 电话字段在客户端已收敛为 `phone`（`inquiry-validation.ts` 的 `contactMethods=["phone"]`，`inquiry-form.tsx` 删除微信单选），但服务端 `parseLeadRequest` 的 `contactMethods` 仍是 `new Set(["wechat","phone"])`，`ContactMethod` 类型联合仍含 `"wechat"`。FR §4.5 明确要求“同步 DTO、服务端校验”。 | `git diff` 显示 `inquiry-validation.ts`、`inquiry-form.tsx` 已改 phone-only；`service.ts` 与 `site.ts` 不在本次改动文件中（`git status` 未列出），仍保留 wechat。`service.ts:90` 仅在 `contactMethod === "phone"` 时校验手机号正则，`wechat` 分支只限长度 2–80。 | 将服务端 `contactMethods` 收敛为 `["phone"]` 并统一 `ContactMethod` 类型；或在计划中显式登记“服务端保持 wechat 兼容”的理由。否则一个 `contactMethod:"wechat"` 的请求仍可绕过电话正则，削弱 FR 要求的 phone-only 边界。 |
| Medium | Risk / Consistency | `src/app/media/page.tsx`（`MEDIA_OUTLETS` 与 “百家主流媒体全覆盖” 标题） | 媒体中心展示“百家主流媒体全覆盖”，但 `MEDIA_OUTLETS` 仅列 11 家（6 门户 + 5 地方）。“百家”量级与可见名单不一致。 | 该口径已登记 `m4-mainstream-media-coverage` 并为 `accepted-blocked`，`production-blockers.md` C49 列为 BLOCKED。`decision-traceability.md` C49 = PRODUCTION_BLOCKED。 | 维持 Production BLOCKED；在证据审查前不得用可见 11 家名单暗示“百家”已落地。建议在页面对“百家”补充“以当期项目清单为准”的等义限定（现仅一句通用说明），或在 claims 解除前临时改用与名单范围一致的口径，降低 Local/Preview 误读风险。 |
| Medium | Test | `pnpm test`（Windows 复现） | 本机复现 `sqlite-maintenance.test.ts`、`product-pages.test.tsx`、`m3-release-cli.test.ts` 超时（5000ms），逐次跑不同用例超时，与 `production-blockers.md` 记录的 “347 passed, 2 skipped” 不一致。新增 `m4-04-owner-update.test.tsx` 在单测内渲染 8 个页面 + Header/Footer，加重 SSR 套件负载。 | `production-blockers.md` “Local 验证记录” 写 PASS；本机 `pnpm test` 实际存在超时 flake。`m4-04-owner-update.test.tsx` 一个 `it` 内连续 `renderToStaticMarkup` 多页。 | 对重 SSR 集成测试显式设置更宽松 `testTimeout` 或拆分为多个 `it`；在证据记录中区分 Windows/WSL2，避免 “PASS” 单值掩盖宿主差异。不影响 Production 门禁结论。 |
| Low | Maintainability | `src/components/boundary-note.tsx`；`src/app/globals.css:2075`、`m4-03-visual-system.css:580`、`visual-refresh.css:305` | M4-04 删除 `/`、`/features`、`/team` 三个独立边界模块后，`BoundaryNote` 不再被任何页面 import，成为死代码；其 `.boundary-note` 样式仍保留。 | `grep` 全 `src`：`boundary-note`/`BoundaryNote` 仅剩组件定义文件自身与 CSS 引用，无页面消费者。 | 删除 `BoundaryNote` 及其专用 CSS，或在 ADR/AGENTS 中标注“有意保留供未来等义约束使用”，避免后续误以为仍被使用。 |
| Low | Test / Consistency | `scripts/lib/claims-validator.mjs` `assertAcceptedBlocked` | `assertAcceptedBlocked` 校验 `publicUseApproved=false`、`authorizationStatus="not-authorized"`、`weakenedReason` 非空、`placeholder=false`，但未校验 `replacementCopy === null`。`accepted-blocked` 表示公开文案按原文展示，`replacementCopy` 应为 `null`。 | `claims-register.json` 全部 `accepted-blocked` 条目 `replacementCopy: null`，但验证器不强制。`assertApproved` 有 `replacementCopy===null` 校验，`assertAcceptedBlocked` 缺失。 | 在 `assertAcceptedBlocked` 增加 `claim.replacementCopy === null` 断言，与 `assertApproved` 一致，防止未来误填。 |
| Low | Clarity / Risk | `src/app/about/page.tsx`（到访指引正文） | 关于页硬编码具体地址“数字创新中心B座 E门，进入大堂后前往 18 层，按现场标识到访客来宝。”作为文本版路线。该地址授权未完成（C56 PRODUCTION_BLOCKED）。 | `decision-traceability.md` C56 = PRODUCTION_BLOCKED（地址、电话、二维码、公开授权未确认）；`asset-provenance-ledger.md` 标注 `arrival-guide` BLOCKED。 | 文本路线符合 FR §7.5“提供文本版到访路线”，属 accepted-blocked 范畴。在 Production 解除前，确保文本地址与到访图一致并经场所/隐私审查；不要在 Local/Preview 之外发布未核验地址。 |
| Low | Maintainability | `src/components/public-content-list.tsx` | 新闻 `description: ""`，并通过 `config.description ? (...) : null` 条件渲染。空字符串作为“无描述”信号是代码异味。 | `git diff`：`title:"新闻中心"`、`description:""`，并改为条件渲染。 | 用 `description: null`/可选字段或专用 `hasDescription` 标志更清晰；当前实现可工作，属轻度可读性改进。 |
| Info | Test / Requirement | `tests/content-layout-v1.2.test.tsx`（`GATED_CLAIMS`） | 从首页与媒体测试删除 `expect(html).not.toMatch(GATED_CLAIMS)`，因这两页现在有意展示 accepted-blocked 口径（“1%被吸引≈近百个新客/年”、“百家主流媒体全覆盖”）。功能/团队测试保留该断言（这两页不含此类口径）。 | `GATED_CLAIMS` 正则含 `1%[^<]{0,24}近百`、`百家[^<]{0,24}全覆盖` 等；首页/媒体现在匹配，故断言被移除。功能/团队测试仍保留 `not.toMatch(GATED_CLAIMS)` 且不匹配。 | 删除一致且符合 accepted-blocked 语义；Production 强制现完全依赖 claims gate（`production_claims_authorization: BLOCKED`）与 `validate:release`，而不再依赖页面内容断言。建议在证据中显式声明该边界迁移，避免后续误判“本地测试不再守护这些口径”为门禁丢失。 |
| Info | Evidence | `docs/5-Evidence/m4-04/production-blockers.md`（Local 验证记录） | 该文件记 Windows `pnpm test` 为 “PASS”（347 passed, 2 skipped），但本机复现出现超时 flake（不同用例逐次超时）。 | `production-blockers.md:12` 与本机 `pnpm test` 输出不一致（非断言失败，而是 5000ms 超时）。 | 将 Windows 行标注为“受宿主超时影响，WSL2 为完整门禁”，或附复现命令与 timeout 配置，使证据更可复现。`pnpm lint`、`pnpm validate:release`（localReady true / productionReady false / claimsGate BLOCKED）复现一致。 |
| Info | Security | `src/components/contact/inquiry-form.tsx`、`src/server/inquiry/service.ts` | PII 边界保持：电话字段 `autoComplete="tel"`、`inputMode="tel"`、`Cache-Control: private, no-store`、honeypot、限频、零自动重试；未发现 URL/Web Storage/analytics/log PII 路径。 | `service.ts` 响应头 `PRIVATE_NO_STORE`；`inquiry-form.tsx` 删除 wechat 单选、固定电话输入。 | 保持现状；注意 F-01 的服务端 wechat 残留不影响 PII 边界（仍限 2–80 字符），但削弱 phone-only 契约。 |
| Info | Requirement | `docs/5-Evidence/m4-04/decision-traceability.md` | C01–C56 56 项均可映射到实现文件、自动检查与状态（LOCAL_IMPLEMENTED 或 PRODUCTION_BLOCKED），与 FR §8.2“Review Cxx -> FR -> 代码/内容 -> 测试 -> 证据”要求一致。PRODUCTION_BLOCKED 项均有对应 claims/资产 blocker。 | 抽查 C07/C12/C39–C43/C48–C49/C52/C55–C56 均为 PRODUCTION_BLOCKED 且 `claims-register.json` 有对应 `accepted-blocked` 条目；C01/C04/C35 等为 LOCAL_IMPLEMENTED。 | 维持；解除任何 PRODUCTION_BLOCKED 须先在 claims/资产台账完成证据并复跑 `validate:release`。 |

## 4. 结论

整体上，M4-04 把产品负责人全量 Accept 的 56 项意见按“纳入实现 + 显式阻塞 Production”的方式落地，claims register 引入 `accepted-blocked` 处置并把 `production_claims_authorization` 设为 `BLOCKED`，`validate:release` 复现 `localReady: true / productionReady: false / claimsGate: BLOCKED`，accepted-blocked 口径未被发现伪造客观证据。文档与代码的本地契约（导航、政策入口、Logo、新闻中心、电话表单、Gallery、痛点白底等）与 FR-22 一致；删除独立边界模块后，等义约束在 Hero/CTA 临近、Footer 与政策页保留。

需关注的可行动项：

1. 电话字段的 DTO/服务端收敛未完成（F-01）：`service.ts` 与 `ContactMethod` 类型仍含 `wechat`，与 FR §4.5“同步 DTO、服务端校验”不完全一致。
2. “百家主流媒体全覆盖”与可见 11 家名单的量级差异（F-02）在 Production 解除前需审查 reconciled。
3. Windows `pnpm test` 超时 flake 与证据记录的 “PASS” 不一致（F-06/F-07），建议调 整重测试 timeout 并在证据中区分宿主。
4. `BoundaryNote` 死代码（F-04）、`assertAcceptedBlocked` 未校验 `replacementCopy`（F-05）等为低优先清理项。

未发现 Critical/High 级别的正确性、安全或回归缺陷；accepted-blocked 的 Production 阻塞状态与仓库证据一致，未被本地实现或测试绕过。