# Sprint M4-04 代码评审报告

- 评审类型：Code Review
- 评审对象：`products/kelaibao` 当前 `git diff HEAD` 变更集 + 未跟踪的 M4-04 实现与证据文件
- 评审依据：
  - `docs/1-Requirement/Mainland-Website-FR/FR-22-owner-approved-public-site-content-and-experience-update.md`
  - `docs/3-Plan/sprint-m4-04-owner-approved-content-and-experience-update.md`
  - `docs/4-Reviews/20260804-kelaibao-website-review-confirm.md`
  - `products/kelaibao/AGENTS.md` 与根 `AGENTS.md`
  - `docs/5-Evidence/m4-04/`（decision-traceability、production-blockers、asset-provenance-ledger、visual-qa）
- 评审模型：opencode-go / glm-5.2
- 评审日期：2026-08-05
- 评审状态：只读评审，未改动任何代码、测试、需求、计划、证据或 git 状态

## 1. 变更概览

本次评审覆盖两类输入：

1. 相对 `HEAD`（`d5044511 chore: checkpoint sprint-m4-04 development`）的未提交改动：
   - `src/app/about/page.tsx`（接入 `ImageLightbox`、新增文本到访指引）
   - `src/app/media/page.tsx`（痛点图标化、新增“百家主流媒体全覆盖”名单）
   - `src/app/globals.css`（媒体/灯箱样式、办公双列顶部对齐）
   - `src/app/m4-03-visual-system.css`（痛点 01/04 改白底）
   - `tests/fixtures/m4-02-public-page-baseline.json`（digest 与 `/news` h1 同步）
   - `tests/m4-04-owner-update.test.tsx`（媒体名单、图标、灯箱、到访文本契约）
   - `tests/m2-server-config.test.ts`、`tests/sqlite-maintenance.test.ts`（Windows `EPERM` 下跳过 symlink 用例）
   - `tests/m3-claims-validator.test.ts`、`tests/m3-release-cli.test.ts`、`tests/m3-release-evidence.test.ts`（claims 计数 8→15、总数 10→17、PASS gate contradiction 用例对齐 schema）
   - `docs/5-Evidence/m3-05/claims-register.json`（新增 7 条 `accepted-blocked` 口径）
   - `docs/5-Evidence/m3-05/gate-input.json`（`actualResult` 由 “eight” 改为 “fifteen”）
2. 未跟踪文件：
   - `src/components/image-lightbox.tsx`（原生 `<dialog>` 灯箱组件）
   - `tests/image-lightbox.test.tsx`（灯箱开/关/焦点恢复测试）
   - `docs/5-Evidence/m4-04/`（decision-traceability、production-blockers、asset-provenance-ledger、visual-qa、screenshots/）

`HEAD` 已前置提交主体 M4-04 实现（Header/Footer/品牌色、首页、功能、团队、隐私/条款/免责、新闻中心、电话表单、DTO 等），本次评审对这些既有提交不做逐文件复核，只就本次变更集与未跟踪文件评审。

## 2. 验证复现

在 Windows 宿主按评审依据复现：

- `pnpm lint`（`tsc --noEmit`）：PASS
- 受影响测试单跑（`m4-04-owner-update`、`image-lightbox`、`m3-claims-validator`、`m3-release-evidence`、`m3-release-cli`、`m2-server-config`、`sqlite-maintenance`、内容/SSR/联系/政策等）：全部 PASS（symlink 两条按预期 skip）
- `pnpm build`：未在本机执行（`production-blockers.md` 记录 Windows `EPERM`，WSL2 PASS）
- `pnpm test` 全量：5 个 SQLite 重负载用例在默认并行下 5s 超时（`sqlite-content-integration`、`sqlite-media-repository`、`sqlite-maintenance` 等），单独跑则 PASS；与证据中“Windows 347 passed / 2 skipped”记录存在并行可复现性差异，详见下表 Test 条目。

## 3. Findings

| Severity | Type | Location | Issue | Evidence | Recommendation |
|---|---|---|---|---|---|
| Medium | Test | `docs/5-Evidence/m4-04/production-blockers.md`; `pnpm test`（Windows 全量并行） | 证据记录“Windows `pnpm test` PASS：64 files；347 passed，2 skipped”，但本次在相同宿主默认并行下出现 5 个 SQLite 重负载用例 5s 超时（单独跑可通过）。证据结论在该并行度下不可复现。 | Windows 全量：5 failed / 342 passed / 2 skipped；受影响用例单跑：PASS | 以降低并行度或加长 `testTimeout` 复跑并更新证据（记录并行度/超时配置），或在 `production-blockers.md` 注明 Windows 全量需 `--no-file-parallelism`/更高 timeout，避免“Windows PASS”被读为任意并行度均 PASS。 |
| Medium | Risk | `src/app/media/page.tsx:21-24`（`MEDIA_OUTLETS`） | 页面硬编码并渲染真实第三方媒体标名（今日头条、新浪网、腾讯网、搜狐网、网易网、凤凰网、长沙晚报、郑州广播电视报、江西快报、江苏青年网、济南日报）。C49 已记为 `PRODUCTION_BLOCKED`，阻滞机制未绕过，按评审要求不作为代码缺陷；但源码/Preview 构建仍会发出未授权商标名，存在商标/名称使用风险。 | `production-blockers.md` C49 blocker；`asset-provenance-ledger.md` `media-coverage-list` = BLOCKED | 在 provenance 状态为 `authorized` 前，将名单置于 feature flag 之后或渲染占位名，使 Preview/源码不在未授权时直接发出真实媒体标名；保持 Production blocker 不变。 |
| Low | Maintainability | `src/app/m4-03-visual-system.css:567-576` | C18 将痛点卡编号 `<span>` 替换为 Lucide `<svg>` 图标后，`.media-problem-grid article:nth-child(1)/(4) span` 选择器已无匹配元素（死选择器）；`nth-child(1)/(4){color/background:#ffffff}` 与 559-565 的基础 `background:#ffffff` 重复。 | grep 命中 `m4-03-visual-system.css:573-575` span 规则；`media/page.tsx` 痛点 article 已无 `<span>` 子元素 | 删除 573-576 的 `span` 死规则，合并 567-571 与基础白底规则，避免样式来源歧义。 |
| Low | Maintainability | `src/app/media/page.tsx:74`（`MEDIA_PROBLEM_ICONS[index]`） | `MEDIA_PROBLEM_ICONS[index]` 隐式假定与 `MEDIA_PROBLEMS` 长度一致，无运行期/类型层守卫；新增第 5 条痛点会渲染 `undefined` 图标。 | `MEDIA_PROBLEMS` 4 条、`MEDIA_PROBLEM_ICONS as const` 4 元组 | 将图标并入 `MEDIA_PROBLEMS` 数据结构，或加 `[...MEDIA_PROBLEMS].length === MEDIA_PROBLEM_ICONS.length` 断言/类型约束。 |
| Low | Maintainability | `src/app/media/page.tsx:74` IIFE | `{(() => { const Icon = ...; return <Icon .../>; })()}` 内联 IIFE 可读性差。 | 该处渲染痛点图标 | 预先把 `MEDIA_PROBLEMS` 映射为 `{text, Icon}` 数组，或抽 `ProblemCard` 子组件。 |
| Low | Performance | `src/app/about/page.tsx:114,119`; `public/brand/office-scenes.png`（3.5MB） | 办公室图以 `next/image unoptimized` 直接服务，3.5MB PNG 在每个关于页访客处下发；Local/Preview 即受影响。C55 已 PRODUCTION_BLOCKED，但未约束体积。 | `public/brand/office-scenes.png` 3535118 字节；`ImageLightbox` `unoptimized` | 输出 WebP/优化尺寸或提供 `sizes`/多档资源，移除 `unoptimized` 后再由 Next 优化（Production 解阻前用占位/缩略图）。 |
| Low | Requirement | `src/app/about/page.tsx:118` | FR §7.5 / C56 要求“文本版到访路线”；当前仅提供单行地址“数字创新中心B座 E门，进入大堂后前往 18 层，按现场标识到访客来宝”，非完整多步路线。C56 仍 BLOCKED。 | `about/page.tsx:118`；`asset-provenance-ledger.md` 记“文本路线降级”done | 补完整分段文本路线（交通/入口/楼层/接待），降低对到访长图二维码的依赖，满足 C56“文本版”要求。 |
| Low | Test | `tests/image-lightbox.test.tsx` | 仅覆盖 open/close/焦点恢复（mock `showModal`/`close`）；未测 backdrop 点击关闭分支（`event.target === event.currentTarget`）与“在新页面查看原图”链接 `href`。 | `image-lightbox.test.tsx` 仅 1 个用例 | 增补 backdrop 关闭用例与原图链接 `href={src}` 断言，锁定退路与降级链接契约。 |
| Low | UX | `src/components/image-lightbox.tsx:41` | “在新页面查看原图” `<a href={src}>` 无 `target`/`rel`，点击在当前标签跳转到裸图，离开站点上下文。 | `image-lightbox.tsx:41` | 加 `target="_blank" rel="noopener"`（同源亦可），保留访客站点上下文。 |
| Low | Accessibility | `src/components/image-lightbox.tsx:20-29` | 触发按钮可访问名由 `<img alt>` 与 `<span>label` 组合而成（如“客来宝办公室场景 查看办公室场景大图”）；`alt` 与 `label` 语义部分重叠。 | `image-lightbox.tsx:27,28` | 触发图作为装饰性预览时考虑 `alt=""`，由 `span` 单独提供按钮名；或保留 `alt` 但使 label 不重复“大图”描述。非阻塞。 |
| Info | Correctness | `tests/m3-release-evidence.test.ts:41-46` | contradiction 用例由原来只设 `gate.reason` 改为 `delete reason` 并补 `region`/`resourceRef`/`evidence`，对齐 `release-validator.mjs`（所有 gate 必须有 region/resourceRef，PASS 不要求 reason）。用例仍断言 claims gate PASS 与 BLOCKED register 冲突时抛错。 | `release-validator.mjs:212-217`；测试通过 | 保持现状；该重构使测试更忠实于 validator 契约。 |
| Info | Consistency | `docs/5-Evidence/m3-05/claims-register.json`; `gate-input.json`; `tests/m3-claims-validator.test.ts` | 新增 7 条 `accepted-blocked` 口径（搜索可见优质内容、百家媒体覆盖、提升成交率、业绩倍增、访客归属、绝对私域锁客、官方媒体实时收录反馈），`accepted-blocked` 计数 8→15、`claimsCount` 10→17、`actualResult` “eight”→“fifteen” 全链路一致。 | `claims-register.json` diff；`m3-claims-validator.test.ts:204-219` 通过 | 无需改动；保持“接受公开表达但不解除 Production 门禁”的一致记录。 |
| Info | Documentation | `docs/5-Evidence/m4-04/decision-traceability.md` | C01–C56 全量映射到 FR/WP、实现文件、自动检查与 LOCAL_IMPLEMENTED/PRODUCTION_BLOCKED 状态，满足 FR“Review Cxx -> FR 条款 -> 代码/内容文件 -> 测试 -> 证据”映射要求。 | `decision-traceability.md` 63 行 | 无需改动。 |
| Info | Security | `src/lib/inquiry-validation.ts`; `src/components/contact/inquiry-form.tsx:155` | 电话 DTO 限制 `contactMethod=phone`、正则 `^(?:\+?86[-\s]?)?1[3-9]\d{9}$`、长度 2–80、隐私同意必填；C33 满足；diff 中未见 PII 进入 URL/存储/日志。 | `inquiry-validation.ts:57-64`；`inquiry-form.tsx:155` | 无需改动。 |
| Info | Requirement | `tests/m4-04-owner-update.test.tsx:61-85` | 媒体名单 11 项、4 个 `media-problem-icon`、关于页“关于我们/公司实景/查看…大图/数字创新中心B座 E门”、联系页“人工服务咨询/提交表单，等待人工服务/电话号码”契约落实。 | 该用例通过 | 无需改动。 |
| Info | Consistency | `tests/fixtures/m4-02-public-page-baseline.json` | 伴随实现更新 `/`、`/media`、`/about`、`/contact` 的 `textDigest` 与 `/news` h1（“新闻”→“新闻中心”），与源码一致。 | baseline diff | 无需改动。 |
| Info | Test | `tests/m2-server-config.test.ts`; `tests/sqlite-maintenance.test.ts` | Windows `EPERM` 下 symlink 用例 `skip()`，不阻断；`production-blockers.md` 记录“两项仅因当前 Windows 无 symlink 权限跳过”。 | 两用例单跑 skip，其余通过 | 无需改动；考虑在证据中固定 skip 触发条件文案，便于后续核对。 |

## 4. 结论

- 本次变更集未发现 Critical/High 缺陷：C49/C55/C56 等外部证据门禁均按 `PRODUCTION_BLOCKED` 记录，未被本地测试或代码绕过；claims/计数/baseline 全链路一致；`pnpm lint` 与受影响测试单跑均 PASS。
- 需关注项：
  1. （Medium/Test）Windows 全量 `pnpm test` 在默认并行下与证据“PASS”记录不可复现，应复核并行度/超时并在证据中固化运行条件。
  2. （Medium/Risk）媒体中心在未授权阶段即在源码/Preview 发出真实第三方媒体标名，建议加 feature flag/占位，保持 Production blocker 不变。
- 其余为 Low 级维护性/可访问性/性能/测试覆盖改进，可在后续小迭代处理，不影响当前 Sprint 本地门禁成立。

**建议评审结论：** Conditional Pass——本地实现与显式 Production blocker 体系成立；在落实上述 Test 可复现性说明与媒体名单 Preview 暴露建议前，不解除 `production-blockers.md` 中“Local Code Ready 未标记”的现状。