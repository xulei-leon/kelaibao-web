# 20260804 客来宝官网修改意见 Review Confirm

**Reviewed Inputs**

- `var/20260804-kelaibao-website-review.docx`
- `products/kelaibao/AGENTS.md`
- `products/kelaibao/docs/1-Requirement/Kelaibao-Unified-Website-SRS.md`
- `products/kelaibao/docs/1-Requirement/Mainland-Website-FR/FR-06-policy-privacy-and-claims-boundary.md`
- `products/kelaibao/docs/1-Requirement/Mainland-Website-FR/Done/FR-18-claims-content-discovery-and-release-migration.md`
- `products/kelaibao/docs/2-Design/Kelaibao-Unified-Website-Visual-Design-Spec.md`
- `products/kelaibao/docs/2-Design/Kelaibao-Website-Content-and-Layout-Spec-v1.2.md`
- `products/kelaibao/docs/5-Evidence/m3-05/claims-register.json`
- 当前公开站源码、测试基线与审阅稿内 20 张嵌入图片
- `products/kelaibao/docs/2-Design/assets/m4-04/`（从审阅稿提取的设计概念图与候选素材）

**Review Date**

- 2026-08-04

## Overall Conclusion

审阅稿共提取 56 项可执行修改意见，覆盖品牌色、页头页脚、首页、功能页、团队页、媒体页、新闻、关于、联系流程、政策文案与正式图片。按产品负责人 2026-08-04 的明确决定，全部意见统一判定为 `Accept`，纳入 `FR-22` 与 `sprint-m4-04`。

审阅对象明确为 `products/kelaibao/` 当前网站；不是独立新站、第二应用或另一品牌的设计输入。Word 内 20 张图片已按“布局/样式概念图”和“产品负责人提供的候选素材”分类归档到 `docs/2-Design/assets/m4-04/`。

本次 `Accept` 是产品需求确认，不自动代表所有原始措辞已满足 Production 发布条件。涉及结果型承诺、搜索结果、媒体覆盖、产品数据处理、访客归属、办公图片、到访二维码与联系方式的条目，必须在 Sprint 内完成口径登记、授权/来源确认、专业审查或等义合规实现；在这些证据完成前，Production 继续保持 `BLOCKED`。该执行约束不改变任何条目的 `Accept` 决策。

## Decision Table

| No. | Severity | Type | Review Source | Original Comment Summary | Decision | Evidence | Follow-up Plan / Rejection Reason |
|---|---|---|---|---|---|---|---|
| 1 | High | Consistency | `DOC C01` | 全站主色改为 `#094092`、辅色改为 `#3f6cc4`，按钮与主标题统一使用主色 | Accept | 产品负责人明确接受；现行视觉规格仍使用旧 Token | 在 FR/Sprint 中重建语义色 Token、对比度和状态色映射，避免机械覆盖微信语义、错误态和正文色。 |
| 2 | Medium | Requirement | `DOC C02` | 页头“客来宝”文字改为正式 Logo | Accept | 审阅稿提供 Logo；现行规格允许正式 Logo 到位后替换 Wordmark | 登记 Logo 来源、授权、透明背景、尺寸和移动端替代文本后接入共享 Header。 |
| 3 | Low | Clarity | `DOC C03` | Logo 下描述删去“与客来宝媒体” | Accept | 产品负责人明确接受 | 同步修改 Header 描述及相关快照测试，metadata 是否同步由 WP1 单独核对。 |
| 4 | Medium | Requirement | `DOC C04` | 导航“客来宝媒体”改为“媒体中心” | Accept | 产品负责人明确接受；当前 SRS 固定旧导航名 | 更新导航、Footer、metadata、测试和 SRS/设计规格，同时保留“客来宝媒体”作为 `/media` 内的子业务名称。 |
| 5 | Low | Accessibility | `DOC C05` | 导航文字改为黑色 `#000000` | Accept | 产品负责人明确接受 | 验证默认、hover、active、focus-visible 和深浅背景对比度。 |
| 6 | Low | Clarity | `DOC C06` | 首页问题句降级字号，不作为视觉重点 | Accept | 属于明确层级调整 | 调整语义层级与响应式字号，不改变可访问标题顺序。 |
| 7 | High | Risk | `DOC C07` | Hero 替换为“每天1分钟…1%被吸引≈近百个新客/年” | Accept | 产品负责人明确覆盖原口径处置；现有 claims register 将其列为未授权 | 将原句纳入口径登记、算法/归因/观察周期/负责人/授权证据门禁；证据未完成前仅允许 Preview 标识，Production 保持阻塞。 |
| 8 | Medium | Maintainability | `DOC C08` | Hero 三段文字不得覆盖 Banner 图 | Accept | 现有视觉规格要求内容与视觉区稳定分栏 | 使用真实 DOM 与响应式布局实现，四视口验证无遮挡、无溢出。 |
| 9 | Low | Consistency | `DOC C09` | 首页四类工具删除外层灰底，仅保留各模块背景 | Accept | 属于视觉调整 | 更新 Section/Card variant，并检查相邻区块层级和对比度。 |
| 10 | Medium | Clarity | `DOC C10` | 五步流程突出“查找、转发、信任、实时、复制”，适配 PC/移动 | Accept | 审阅稿提供参考图 | 用语义列表/步骤组件实现箭头关系；不得把顺序信息只编码在颜色或背景图中。 |
| 11 | Medium | Accessibility | `DOC C11` | 流程组件改不好时换成固定图片 | Accept | 产品负责人明确接受 | 先实现响应式 HTML；若使用图片，必须保留等价文本、alt、移动端清晰度和可替换资产登记。 |
| 12 | High | Risk | `DOC C12` | 四大模块副标题改为“每天至少1小时…变成1分钟” | Accept | 产品负责人明确覆盖原口径处置；claims register 当前将其列为未授权 | 进入效率口径登记，补任务样本、基准耗时、测量方法与公开授权；证据未完成前 Production 阻塞。 |
| 13 | Info | Consistency | `DOC C13` | 删除“锚定私域增长用户。”句号 | Accept | 纯文案修正 | 修改集中内容源并更新快照。 |
| 14 | Info | Consistency | `DOC C14` | 删除“共享品牌与团队IP…”中的两个逗号 | Accept | 纯文案修正 | 修改集中内容源并更新快照。 |
| 15 | Low | Clarity | `DOC C15` | 四大模块占位方块替换为对应图标 | Accept | 现行设计规格允许生产级 SVG 图标 | 复用现有图标体系，登记含义、尺寸和装饰/语义属性。 |
| 16 | Medium | Risk | `DOC C16` | 媒体模块改为“专业新闻稿撰写/量身定制新闻稿/合规发布”三行 | Accept | 产品负责人明确接受 | 原样纳入内容清单；“合规发布”在发布前由专业审查确认适用范围，并保留项目审核条件。 |
| 17 | High | Risk | `DOC C17` | 媒体模块改为“官方媒体/实时收录/数据反馈”三行 | Accept | 产品负责人明确接受 | 补媒体身份、收录时效与数据反馈来源证据；未完成前 Production 阻塞。 |
| 18 | Low | Clarity | `DOC C18` | 媒体四卡删除 01-04，新增语义图标 | Accept | 属于视觉调整 | 使用统一图标和卡片布局，保持 DOM 顺序与可访问名称。 |
| 19 | High | Requirement | `DOC C19` | 删除首页“产品与传播边界”模块，仅在页脚出现 | Accept | 产品负责人明确接受；现行 FR 要求边界可读且不能只隐藏在页脚 | 删除独立模块，同时把等义边界接入 Hero/CTA 临近说明、Footer 与政策页，确保执行效果满足“仅保留页脚入口”与强制可见边界。 |
| 20 | Low | Clarity | `DOC C20` | Footer 标语改为“内容赋能 资源链接 商机互联” | Accept | 产品负责人明确接受 | 修改集中品牌文案并检查分隔、断行和 metadata 是否受影响。 |
| 21 | Medium | Requirement | `DOC C21` | Footer“客来宝媒体”改为“媒体中心” | Accept | 与 C04 同一 IA 决定，但作用于独立位置 | 同步 Footer 链接标签，目标继续为 `/media`。 |
| 22 | Low | Requirement | `DOC C22` | Footer“了解客来宝-案例”删除 | Accept | 产品负责人明确接受 | 仅移除该 Footer 入口，不删除 `/cases`、CMS、sitemap 或已发布案例能力。 |
| 23 | High | Requirement | `DOC C23` | 政策链接重命名并新增“效果与责任说明” | Accept | 产品负责人明确接受；现行 FR 固定三页显示名 | 更新 SRS/FR、Footer 与路由映射；优先复用 `/privacy`、`/terms`、`/disclaimer` 并增加清晰的效果责任入口，避免重复或冲突政策。 |
| 24 | High | Privacy | `DOC C24` | 采用新的“隐私保护原则”全文 | Accept | 产品负责人明确接受；正文含 K-Link 数据处理断言 | 作为批准文案输入，同时补齐实际字段、用途、共享、保存期限、用户权利及通讯录/关系链事实核验。 |
| 25 | High | Requirement | `DOC C25` | 采用“技术中立原则”全文 | Accept | 产品负责人明确接受 | 接入政策页并核对实际产品/媒体服务边界，不删除合同、第三方平台依赖与客户责任的必要说明。 |
| 26 | High | Requirement | `DOC C26` | 采用“用户行为规范”全文 | Accept | 产品负责人明确接受 | 明确适用对象、内容处置权限和申诉/联系路径，避免声明尚不存在的平台管理能力。 |
| 27 | High | Risk | `DOC C27` | 新增“效果与责任说明”全文 | Accept | 文案与“不承诺固定收益、客户数量或商业结果”方向一致 | 作为全站结果声明主来源，纳入 Footer/政策与相关营销页一致性测试。 |
| 28 | Low | Clarity | `DOC C28` | 小程序体验说明简化为按小程序指引体验 | Accept | 产品负责人明确接受 | 修改 Dialog/联系页文案，保留二维码失败与联系降级。 |
| 29 | Medium | Privacy | `DOC C29` | 删除“官网不创建公众账号、Dashboard，也不收集小程序行为” | Accept | 产品负责人明确接受 | 从体验 UI 删除，但在隐私政策与架构契约中保留等义事实，避免误导数据处理范围。 |
| 30 | Low | Accessibility | `DOC C30` | 联系页三个模块增加留白，文字不顶边 | Accept | 属于明确可用性问题 | 调整容器 padding、行高与断点，并验证 320/390/768/1440。 |
| 31 | High | Requirement | `DOC C31` | 删除产品体验与媒体咨询的区分说明 | Accept | 产品负责人明确接受；SRS 要求两条路径保持独立 | 删除指定冗长文案，但以标题、图标、CTA、二维码资源与失败路径继续保持可辨识隔离。 |
| 32 | Medium | Clarity | `DOC C32` | 媒体咨询改为“人工服务咨询”，删除筛选说明 | Accept | 产品负责人明确接受 | 修改标题与辅助文案，保留服务目的、响应预期和二维码替代说明。 |
| 33 | Medium | Correctness | `DOC C33` | 表单改为“提交表单，等待人工服务”，微信号改电话号码 | Accept | 产品负责人明确接受 | 更新 Label、DTO 校验、DirectMail 模板、隐私说明、错误状态与测试；不将号码写入 URL、存储、分析或日志。 |
| 34 | Medium | Accessibility | `DOC C34` | 表达不准确时可用图片形式贴图 | Accept | 产品负责人明确接受 | 仅把图片作为获批准的辅助说明；表单、按钮、二维码与关键信息仍必须保留真实可访问 DOM。 |
| 35 | Low | Correctness | `DOC C35` | 修正“私域营销（（”重复括号 | Accept | 当前源码和 baseline 可复现该缺陷 | 修正集中内容源、fixture 与页面测试。 |
| 36 | High | Requirement | `DOC C36` | 删除功能页“产品能力边界” | Accept | 产品负责人明确接受；SRS 仍要求能力边界 | 删除独立 BoundaryNote，同时在 Hero/相关能力卡和政策入口保留等义约束。 |
| 37 | Low | Clarity | `DOC C37` | 团队页 Hero 两句话各占一行并统一字号 | Accept | 属于排版调整 | 使用响应式断行与最大行宽，避免硬编码在窄屏溢出。 |
| 38 | Info | Consistency | `DOC C38` | 团队引语改成两行且删除句末标点 | Accept | 纯文案/排版调整 | 修改集中内容源并更新快照。 |
| 39 | High | Risk | `DOC C39` | 团队副标题改为“每天节省1小时…业绩倍增” | Accept | 产品负责人明确接受；包含效率与业绩结果口径 | 分别登记效率、时间换算和业绩倍增的定义、样本、算法、归因和授权；证据未完成前 Production 阻塞。 |
| 40 | Medium | Requirement | `DOC C40` | 重写“搭建可复制的小程序”两组标题与正文 | Accept | 产品负责人明确接受 | 按审阅稿落入集中内容；逐项核验实时同步、共享和资料更新能力与当前获批准产品版本一致。 |
| 41 | High | Risk | `DOC C41` | 使用“提升成交率”结果措辞 | Accept | 产品负责人明确接受 | 纳入口径登记并补真实归因证据；证据未完成前 Production 阻塞。 |
| 42 | High | Risk | `DOC C42` | 使用“彻底消除利益顾虑、不抢流量、不越级留存”等私域锁客文案 | Accept | 产品负责人明确接受 | 核验产品路由、成员隔离、数据归属和异常场景，登记绝对措辞证据及责任人。 |
| 43 | High | Privacy | `DOC C43` | 声明 A 分享后只显示 A 二维码/名片，线索只留 A 后台 | Accept | 产品负责人明确接受；涉及产品行为和个人数据归属 | 增加产品版本、授权、访客数据流和后台归属专项验收，不在官网实现 Dashboard 或线索数据库。 |
| 44 | High | Requirement | `DOC C44` | 删除团队页“团队方案边界” | Accept | 产品负责人明确接受；SRS 仍要求职业/能力边界 | 删除独立模块，同时把必要限制分散到相关能力卡、CTA 临近说明和政策入口。 |
| 45 | Medium | Requirement | `DOC C45` | 页面内“客来宝媒体”更名为“媒体中心” | Accept | 产品负责人明确接受 | 页面栏目/导航改名；公司定义、主体和必要品牌语境仍保留“客来宝媒体”。 |
| 46 | Medium | Clarity | `DOC C46` | CTA 改为“咨询媒体报道”并删除说明文字 | Accept | 产品负责人明确接受 | 更新触发器、Dialog 可访问名称和 analytics 事件显示文案，保留咨询性质与失败降级。 |
| 47 | Medium | Accessibility | `DOC C47` | 媒体四个痛点并列、加图标，01/04 改白底 | Accept | 属于明确视觉修改 | 在 320/390 下改为可读单列/双列，颜色不作为唯一差异。 |
| 48 | High | Risk | `DOC C48` | “建设公开信息基础；实际搜索结果由平台决定”改为“客户搜索即可看到优质内容” | Accept | 产品负责人明确接受；现行 AGENTS/SRS 禁止搜索结果承诺 | 纳入 SEO/GEO 结果口径登记与专业审查；实现时必须保留平台决定因素和 Production 门禁，未经证据不得标记上线。 |
| 49 | High | Risk | `DOC C49` | 媒体中心新增“百家主流媒体全覆盖”模块和媒体名单 | Accept | 产品负责人明确接受；需媒体范围与名称来源证明 | 建立媒体资源清单、合作/可投范围、有效期与授权证据；页面明确“以项目审核与实际发布为准”。 |
| 50 | Low | Clarity | `DOC C50` | 新闻 Banner 改为“新闻中心”并删除副说明 | Accept | 产品负责人明确接受 | 更新 H1、metadata/快照关联项并保持新闻 SSR、canonical、RSS 和 sitemap 不变。 |
| 51 | Low | Clarity | `DOC C51` | 关于页 Banner“公司介绍”改为“关于我们” | Accept | 产品负责人明确接受 | 更新 H1、metadata、测试和导航一致性。 |
| 52 | High | Risk | `DOC C52` | 关于页新增四段公司介绍与增长/成交/管理文案 | Accept | 产品负责人明确接受 | 作为批准文案输入；对主体、团队资历、业务范围和结果型措辞逐项登记来源与授权。 |
| 53 | High | Requirement | `DOC C53` | 删除“合作伙伴”整个模块 | Accept | 当前模块使用未获授权的合作 Logo 占位语义；SRS 要求无授权不得展示 | 删除模块和相关 baseline 断言，不删除获授权案例 CMS 能力。 |
| 54 | Medium | Accessibility | `DOC C54` | “实景图”改为“公司实景”，办公室/到访均点击查看 | Accept | 产品负责人明确接受 | 实现可访问 Gallery/Dialog，支持键盘、Escape、焦点恢复、移动端缩放和图片替代文本。 |
| 55 | High | Privacy | `DOC C55` | 使用审阅稿办公室场景合成图 | Accept | 审阅稿提供正式候选图片 | 导入前完成来源、人物/Logo/屏幕信息、授权、压缩、裁切与 provenance 登记；未确认时 Production 阻塞。 |
| 56 | High | Privacy | `DOC C56` | 使用审阅稿到访指引长图 | Accept | 审阅稿提供地址、电话、二维码和路线候选图 | 核对地址、电话、二维码有效性与公开授权，提供可访问文本版路线；未确认时 Production 阻塞。 |

## Needs Immediate Action

- 建立 `FR-22` 与 `sprint-m4-04`，把 56 项 Accept 决策转成工作包、验收与测试。
- 在代码实施前更新 SRS、视觉规格、内容/布局规格、claims register、资产 provenance 与 Production gate 输入。
- 对结果型、搜索、媒体覆盖、产品行为、隐私和正式图片执行证据/授权门禁；门禁未完成时不得把 Production 标记为 Ready。
- 保持 K-Link 小程序体验与媒体人工咨询在资源、Dialog、事件、失败路径和隐私语义上的隔离。

## Can Be Deferred

- 不允许把任何已 Accept 项从本 Sprint 范围中静默移除；若外部证据暂缺，只能将其实现状态标记为 `BLOCKED`，并记录责任人、所需证据和恢复条件。

## Final Status

全部 56 项修改意见均已按产品负责人明确决定确认采用。目标进入 `FR-22 / sprint-m4-04` 计划阶段；在文档 review-confirm、证据门禁、实现、代码 review-confirm 与完整验证完成前，不视为交付完成，Production 状态保持 `BLOCKED`。

## 审阅限制

- 已通过 OOXML 完整提取正文，确认 Word 文件没有结构化评论，共包含 92 个段落、20 张嵌入图片。
- 本机缺少 LibreOffice，未能完成 DOCX 页面 PNG 渲染检查；本次结论基于正文、OOXML、嵌入图片、当前源码与仓库来源文档，不声称 Word 版式已通过视觉渲染 QA。
