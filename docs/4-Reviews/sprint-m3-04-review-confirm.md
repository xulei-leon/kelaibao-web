# Sprint M3-04 Document Review Confirm

**Reviewed Inputs**

- `products/kelaibao/docs/1-Requirement/Mainland-Website-FR/FR-16-kelaibao-product-site-and-mini-program-trial.md`
- `products/kelaibao/docs/3-Plan/sprint-m3-04.md`
- `products/kelaibao/docs/4-Reviews/sprint-m3-04-review-by-gpt-5.5.md`
- `products/kelaibao/AGENTS.md`
- `products/kelaibao/docs/1-Requirement/Kelaibao-Unified-Website-SRS.md`
- `products/kelaibao/docs/2-Design/Kelaibao-Unified-Website-Visual-Design-Spec.md`
- `products/kelaibao/docs/1-Requirement/Mainland-Website-FR/Done/FR-17-kelaibao-media-page-and-legacy-route-migration.md`
- `products/kelaibao/docs/1-Requirement/Mainland-Website-FR/FR-18-claims-content-discovery-and-release-migration.md`
- `products/kelaibao/scripts/validate-release.mjs`
- `products/kelaibao/src/components/mini-program-trial.tsx`
- `products/kelaibao/tests/mini-program-trial.test.tsx`

**Review Date**

- 2026-07-31

## Overall Conclusion

本轮按用户明确覆盖只使用第一 reviewer `gpt-5.5`，并以标准速度执行；未启动第二 reviewer。报告的 6 条意见均由当前需求、视觉规格、脚本或实现证据支持，全部接受并在进入 TDD 前修订 FR-16 与 Sprint M3-04。

这些问题不会改变 M3-04 的产品边界，但会补齐统一外壳的路由、非营销表面隔离、全路由视觉回归、二维码错误可访问性，以及本地通过但 Production 仍受外部门禁阻塞的精确验收语义。接受项应用后，文档可进入实现门禁。

## Decision Table

| No. | Severity | Type | Review Source | Original Comment Summary | Decision | Evidence | Follow-up Plan / Rejection Reason |
|---|---|---|---|---|---|---|---|
| 1 | High | Test | `M3-04-DOC-01` | 六项导航虽固定 href，但最小路由与浏览器验证没有逐项覆盖，尤其缺少 `/news`。 | Accept | SRS 4.1 固定六项主导航并要求新闻列表可访问；FR-16 当前最小验证只列 `/`、`/features`、`/team`、`/about`、`/contact`，Sprint 浏览器抽查只要求 `/` 与 `/media`，不能证明六项主导航均无断链。 | 在 FR-16 与 Sprint 中加入六项目标的 route/metadata/SSR 或 standalone smoke 契约；`/news` 验证服务端列表/空状态与 canonical，不要求本 Sprint 增加新闻内容。 |
| 2 | Medium | Test | `M3-04-DOC-02` | 共享 Header/Footer/移动导航影响全站，但视觉验证只覆盖首页与至少 `/media`。 | Accept | 统一视觉规格 10.2 明确列出 `/`、`/features`、`/team`、`/media`、`/news`、`/cases`、`/about`、`/contact` 与政策页，并要求四视口、键盘、Escape、焦点恢复、200% 缩放和 reduced motion。 | 将 `visual-qa.md` 定义为紧凑路由矩阵，覆盖规格列出的公开页面与四视口；交互检查可在存在对应交互的代表路由抽样，但每个共享外壳路由都必须检查身份、溢出和 CTA 语义。 |
| 3 | Medium | Risk | `M3-04-DOC-03` | “全站外壳”未明确限于公开营销路由，可能误覆盖 `/admin`、`/api`、健康检查或 CMS 管理表面。 | Accept | 产品 `AGENTS.md` 规定 FC 同时承载公开 SSR、`/admin` 和 `/api`，且管理后台是服务端受控表面；FR-16 失败边界要求公开内容异常不得影响 `/admin`、CMS、询盘和健康检查。 | 在 Sprint 增加“公开营销路由 only”边界，并新增回归断言，确认 `/admin` 布局与 API/health 响应不渲染免费体验 CTA、Footer 或移动联系栏。 |
| 4 | Medium | Requirement | `M3-04-DOC-04` | FR-16 缺少工作簿时的约束仍只写 M3-02，未覆盖本次实现首页的 M3-04。 | Accept | FR-16 输入段只点名 M3-02；Sprint 5.3 已依赖批准设计、SRS 和 FR，并明确禁止从缺失工作簿推断统计、Logo、案例或截图。 | 将 FR-16 说明扩展为 M3-02 与 M3-04，在原始工作簿可用前以已批准统一设计、SRS、FR 和已确认下游规格为执行来源，缺失细节保持不展示或只做不冒充真实界面的结构说明。 |
| 5 | Medium | Clarity | `M3-04-DOC-05` | `pnpm validate:release` 的预期结果不清，可能把正确的 Production `BLOCKED` 当成本 Sprint 失败，或为通过而弱化门禁。 | Accept | `scripts/validate-release.mjs` 默认在本地检查通过、外部 Production gate 未齐时输出 `CODE_READY_WITH_EXTERNAL_LEGACY` 且退出 0；仅传 `--require-production-live` 且 Production 未就绪时退出 1。SRS 第 9 节与视觉规格 11 节都要求缺少真实外部证据时 Production 保持 `BLOCKED`。 | 在 Sprint 验证要求写明默认命令必须退出 0、`localReady=true`、`productionReady=false`、状态为 `CODE_READY_WITH_EXTERNAL_LEGACY`；不得运行或伪造 Production live 通过，若额外运行 `--require-production-live`，预期退出 1。 |
| 6 | Low | Test | `M3-04-DOC-06` | 二维码失败测试未明确断言破图被移除/隐藏、状态文本可被辅助技术感知。 | Accept | `mini-program-trial.tsx` 已在 `qrFailed` 时以条件渲染移除 `<img>` 并显示 `role="status"` 的产品降级文案；现有测试只检查错误文本与 `/contact#klink-trial`，未锁定图片消失、状态角色和企微/企微事件隔离。 | 在 Sprint 与 `mini-program-trial.test.tsx` 中增加显式断言：失败后图片不存在、可访问 status 出现、产品联系降级正确，且不出现企业微信文案或企业微信事件。 |

## Needs Immediate Action

- 补齐六项导航的 route/SSR/standalone smoke 契约，特别是 `/news`。
- 将共享外壳视觉 QA 扩展到统一视觉规格列出的所有公开页面。
- 明确统一外壳只属于公开营销表面，并保护 `/admin`、`/api`、health/CMS 管理表面。
- 更新 FR-16 缺失工作簿约束，使其覆盖 M3-04。
- 固定 `validate:release` 的本地成功与 Production 阻塞双状态语义。
- 补齐小程序二维码失败状态的可访问性与隔离回归断言。

## Can Be Deferred

- 正式小程序二维码、正式域名/备案、真实云与其他 Production 外部门禁仍按 FR-18/M3-05 和既有 M2 legacy gate 处理；本 Sprint 不伪造或关闭这些外部门禁。
- 新闻内容量、案例内容授权与政策内容迁移仍属于 M3-05；M3-04 只验证既有路由与共享外壳不回归。

## Final Status

`ACCEPT_AFTER_DOCUMENT_CHANGES`。应用以上 6 项文档修订并通过 `git diff --check` 后，M3-04 可以进入 TDD RED；在修订完成前不得开始代码实现。
