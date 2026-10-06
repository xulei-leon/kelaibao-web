# Sprint M3-02 文档评审 - gpt-5.5

| 字段 | 内容 |
| --- | --- |
| Review target | `products/kelaibao/docs/3-Plan/sprint-m3-02.md` |
| Requirements source | `products/kelaibao/docs/1-Requirement/Mainland-Website-FR/FR-16-kelaibao-product-site-and-mini-program-trial.md` |
| Review type | Document review |
| Reviewer | gpt-5.5 |
| Review date | 2026-07-31 |

## Review Scope

本次只评审 M3-02 Sprint 与 FR-16/设计/SRS/工程规则之间的一致性、范围控制、TDD 可执行性、配置安全、无障碍和上线风险。未修改被评审文档，未运行第二 reviewer，未启动 sub agent。

已检查的主要依据：

- `products/kelaibao/docs/3-Plan/sprint-m3-02.md`
- `products/kelaibao/docs/1-Requirement/Mainland-Website-FR/FR-16-kelaibao-product-site-and-mini-program-trial.md`
- `products/kelaibao/docs/1-Requirement/Kelaibao-Unified-Website-SRS.md`
- `products/kelaibao/docs/2-Design/Kelaibao-Unified-Website-Visual-Design-Spec.md`
- `docs/superpowers/specs/2026-07-31-kelaibao-unified-website-design.md`
- `products/kelaibao/AGENTS.md`
- `AGENTS.md`

## Findings

| Severity | Type | Location | Issue | Evidence | Recommendation |
| --- | --- | --- | --- | --- | --- |
| Medium | Consistency | `products/kelaibao/docs/3-Plan/sprint-m3-02.md:83`, `:127`, `:169`; `products/kelaibao/docs/1-Requirement/Mainland-Website-FR/FR-16-kelaibao-product-site-and-mini-program-trial.md:47`, `:102` | M3-02 的“不纳入范围”把“媒体咨询”整体排除，但同一 Sprint 又要求 `/contact` 建立“体验 K-Link”和“咨询客来宝媒体”两个区块。这个措辞会让实施者误以为 `/contact` 的媒体咨询半区或双二维码区分测试不属于本 Sprint。 | Sprint 明确 M3-02 不切 Header/Footer/home/nav，范围只到 `/features`、`/team`、`/about`、小程序体验和联系分流；FR-16 同时要求 `/contact` 必须明确分开两条路径。 | 将“不纳入范围”改窄为“`/media` 页面、旧路由重定向和 `/media` 页面内企业微信 CTA 迁移不纳入 M3-02”，并保留 `/contact` 的媒体咨询分区、企业微信配置隔离和降级文案为本 Sprint 验收项。 |
| High | Requirement | `products/kelaibao/docs/3-Plan/sprint-m3-02.md:145`, `:152`; `products/kelaibao/docs/1-Requirement/Kelaibao-Unified-Website-SRS.md:157`, `:186`; `products/kelaibao/docs/1-Requirement/Mainland-Website-FR/FR-16-kelaibao-product-site-and-mini-program-trial.md:63` | `/about` 的统计数据门禁只要求逐项 `approvedForPublicUse=true`，但没有要求保存或测试口径定义、来源、日期、范围和复核人。单一布尔值不足以满足 SRS 对结果型/统计型口径的证据要求，后续可能在缺少证明材料时误发 `100+`、`10万+`、`99.99%`。 | SRS `FR-CONTENT-001` 要求相关口径必须有定义、来源、日期、范围和复核人，缺少证明时改写为能力描述；FR-16 说明这些统计和 Logo/案例默认不公开，只有显式发布许可才可渲染。 | 在 Sprint 的内容模型和测试要求中加入 `claimEvidence`/`publicClaimApproval` 之类的结构化字段，至少覆盖 claim、definition、source、sourceDate、scope、reviewer、approvedForPublicUse。测试应断言缺少任一证据字段时即使布尔值为 true 也不得渲染生产统计。 |
| Medium | Risk | `products/kelaibao/docs/3-Plan/sprint-m3-02.md:131`, `:132`; `products/kelaibao/docs/1-Requirement/Kelaibao-Unified-Website-SRS.md:222`, `:267`, `:272`, `:293` | `MiniProgramConfig` 允许 `preview-placeholder | production-mini-program` 状态，但 Sprint 没有要求生产运行模式下拒绝 `preview-placeholder` 或占位二维码。这样可以满足本地构建，却弱化 SRS 的 Production 门禁。 | SRS 要求 Preview 与 Production 配置严格区分，正式小程序二维码是 Production gate，所有 mandatory gate 必须是真实 PASS，不能用本地 fake、示例配置或构建成功替代。 | 增加配置验证与测试：在 Production/runtime gate 下 `NEXT_PUBLIC_MINI_PROGRAM_QR_STATUS=preview-placeholder` 必须失败或将 Production 状态保持 `BLOCKED`；`production-mini-program` 必须指向版本控制内的正式本地资源并通过 alt、尺寸和加载测试。 |
| Medium | Test | `products/kelaibao/docs/3-Plan/sprint-m3-02.md:124`, `:160`; `products/kelaibao/docs/1-Requirement/Kelaibao-Unified-Website-SRS.md:251`, `:285`; `products/kelaibao/docs/2-Design/Kelaibao-Unified-Website-Visual-Design-Spec.md:185`, `:271`, `:304`, `:305` | 小程序 Dialog 测试覆盖打开、关闭、Escape、焦点恢复、二维码 alt、移动说明和图片错误，但没有明确覆盖 Tab 焦点限制、背景不可交互、遮罩关闭规则、200% 缩放和 reduced motion。现有测试清单不足以验证“Dialog 焦点管理正确”和视觉设计中的键盘顺序/缩放要求。 | SRS 要求 Dialog 焦点管理正确；视觉规格要求 Dialog 有焦点进入与恢复、Escape、遮罩关闭规则，并在人工检查中覆盖键盘顺序、Escape、焦点恢复、200% 缩放和 reduced motion。 | 扩展 `tests/mini-program-trial.test.tsx` 和 `docs/5-Evidence/m3-02/visual-qa.md`：增加 Tab/Shift+Tab 循环或焦点不逃逸、背景内容不可触发、遮罩关闭规则、200% 缩放、reduced motion 状态，以及移动端 Dialog 无横向溢出的可复核记录。 |

## Checks Performed

- 核对 M3-02 是否只覆盖 `/features`、`/team`、`/about`、小程序体验配置/Dialog 和 `/contact` 产品/媒体分流，并确认 Header/Footer/home/final nav 被留到 M3-04。
- 核对 FR-16 在缺少原始工作簿时的可执行来源限制，确认 Sprint 已禁止推断额外文案、统计口径和素材。
- 核对小程序二维码与企业微信二维码的配置、事件、alt、失败降级和 `/contact` 分流是否保持独立。
- 核对 `/about` 未授权统计、Logo、客户/合作素材默认隐藏的要求。
- 核对 TDD、metadata、SSR、sitemap/llms、视口检查和项目级 `pnpm test && pnpm lint && pnpm build` 验证要求。

## Overall Assessment

M3-02 文档整体方向与 FR-16 的分 Sprint 边界一致，没有发现需要阻塞评审的 Critical 问题。建议在进入代码实施前修正文档中的媒体咨询范围表述，并补强统计口径证据、生产二维码状态门禁和 Dialog 无障碍测试清单。
