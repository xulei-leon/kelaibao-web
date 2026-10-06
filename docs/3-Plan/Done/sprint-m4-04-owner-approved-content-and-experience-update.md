# Sprint M4-04 产品负责人确认的内容与体验调整

> **状态：** `DONE / Local Code Ready / Production BLOCKED`

## 1. Sprint 目标

覆盖 [FR-22 产品负责人确认的公开站内容与体验调整](../../1-Requirement/Mainland-Website-FR/Done/FR-22-owner-approved-public-site-content-and-experience-update.md)，把 [20260804 修改意见确认文档](../../4-Reviews/20260804-kelaibao-website-review-confirm.md) 中 56 项 `Accept` 决策全部转化为可追踪实现、自动化测试、四视口 QA 和 Production 门禁记录。

该 Word 文档明确是对 `products/kelaibao/` 当前网站的修改意见；其中布局/样式图片已提取到 [M4-04 设计概念图与候选素材](../../2-Design/assets/m4-04/README.md)，作为本 Sprint 的实现与验收输入。

核心目标：

- 完成全站品牌色、Logo、导航、Footer、首页、功能、团队、媒体、新闻、关于、联系与政策调整。
- 对所有结果型口径、媒体范围、产品行为和正式图片建立来源/授权/专业审查门禁；证据不完整时保持 Production `BLOCKED`。
- 保持单一官网、双咨询语义隔离、现有 CMS/SSR/安全/架构能力与 PII 边界无回归。

路径与验证基线：

```text
FR_DIR=products/kelaibao/docs/1-Requirement/Mainland-Website-FR
FR_BACKLOG_DIR=products/kelaibao/docs/1-Requirement/Mainland-Website-FR/backlog
FR_DONE_DIR=products/kelaibao/docs/1-Requirement/Mainland-Website-FR/Done
DESIGN_DIR=products/kelaibao/docs/2-Design
SPRINT_DIR=products/kelaibao/docs/3-Plan
SPRINT_DONE_DIR=products/kelaibao/docs/3-Plan/Done
REVIEW_DIR=products/kelaibao/docs/4-Reviews
REVIEW_DONE_DIR=products/kelaibao/docs/4-Reviews/Done
EVIDENCE_DIR=products/kelaibao/docs/5-Evidence/m4-04
VERIFICATION_COMMANDS=pnpm test && pnpm lint && pnpm build
```

## 2. 前置依赖

- FR-16～FR-18、FR-20、FR-21 及 M4-03 已完成并归档。
- `20260804-kelaibao-website-review-confirm.md` 已将 56 项意见全部确认为 `Accept`。
- Logo、办公室图、到访指引图、媒体名单、结果型口径与产品行为证据可分批补充，但缺失项必须保持 Production blocker。

协同说明：

- 产品负责人要求全部意见纳入，不允许因证据暂缺将条目改为 Partial/Reject；实现状态与 Production 发布状态分开记录。
- 用户于 2026-08-05 明确放弃 FR-22/M4-04 文档 `review-start` 与 `review-confirm`；中止报告不保留、不计为 PASS。代码 review-start / code-review-confirm 仍按计划完成。

## 3. 纳入范围

本 Sprint 纳入以下 FR：

- `FR-22` 产品负责人确认的公开站内容与体验调整。

涉及包和目录：

- `src/app`：首页、功能、团队、媒体、新闻入口、关于、联系和政策页面。
- `src/components`：Header、Footer、步骤组件、卡片、图标、Dialog、Gallery、表单。
- `src/content`、`src/lib`：品牌、导航、CTA、集中内容、metadata 和口径引用。
- `src/pages`：新闻/案例 SSR 与共享视觉回归接线。
- `public`：Logo、办公室场景与到访指引正式候选资产。
- `tests`：内容、路由、交互、可访问性、DTO、metadata、SSR、发现与发布门禁。
- `docs/1-Requirement`、`docs/2-Design`、`docs/4-Reviews`、`docs/5-Evidence/m4-04`。
- `docs/2-Design/assets/m4-04/review-concepts`：16 张布局/样式概念与批注图。
- `docs/2-Design/assets/m4-04/provided-assets`：4 张 Logo、图标、办公室和到访候选素材。

## 4. 暂不纳入范围

- K-Link 小程序、公众账号、会员、团队权限、访客 Dashboard 或线索数据库实现。
- 新 CMS 类型、通用页面 CMS、CRM、支付、预约、自动报价或微信 API。
- 第二应用、第二域名、`site_key`、媒体独立站、跨应用内容 API 或通用 `webservice`。
- 用本地测试、截图、产品决定或占位材料关闭客观口径、授权、备案、云资源和专业审查门禁。

原因：

- 本 Sprint 只修改客来宝统一官网的公开表达与交互，不扩展产品或生产架构。

## 5. 工作范围

### 5.1 WP0：文档、口径与资产门禁

目标：

- 在代码改动前消除现行 SRS/设计/口径与全量 Accept 决定之间的矛盾，并建立 56 项追踪基线。

实现任务清单：

- [x] 用户明确跳过 FR-22/M4-04 document review-start、review-confirm；中止报告已清理，该门禁不记为 PASS。
- [x] 建立 `C01`～`C56` 决策追踪矩阵，映射 FR 条款、目标文件、测试、证据与 Production 状态。
- [x] 更新 SRS、视觉规格、内容布局规格中的主色、Logo、导航、政策显示名、页面结构和文案冻结规则。
- [x] 更新 claims register：增长、效率、收录、搜索、成交、业绩、私域锁客、访客归属、媒体覆盖和公司资历。
- [x] 为 Logo、办公室图、到访图和媒体名单建立 provenance/authorization ledger。
- [x] 固化 16 张设计概念图到页面/Section/Cxx 的映射；实现时逐张记录采用、调整或受响应式/可访问性约束的差异。
- [x] 更新 Production gate 输入：证据未齐的 Accept 项固定为 blocker，不减少既有 blocker 集。

测试要求：

- [x] FR/Sprint/Review 链接、编号、56 项唯一映射和 claims schema 自动检查通过。
- [x] `git diff --check` 通过。

### 5.2 WP1：全局品牌、Header、Footer 与信息架构

目标：

- 落地新品牌色、Logo、“媒体中心”导航和 Footer/政策入口。

实现任务清单：

- [x] 建立 `#094092` 主色、`#3f6cc4` 辅色及完整语义状态 Token。
- [x] 接入正式候选 Logo，移除 Header 多余描述，处理桌面/移动尺寸与 alt。
- [x] 导航“客来宝媒体”改为“媒体中心”，导航文字改黑色，更新 active/focus 状态。
- [x] Footer 更新标语、媒体标签、案例入口和五项政策入口。
- [x] 同步 metadata、Open Graph alt、结构化数据可见名称、导航/页脚测试；“客来宝媒体”子业务身份继续保留。

测试要求：

- [x] Header/Footer 在 320/390/768/1440 无溢出，移动菜单、键盘与焦点通过。
- [x] 对比度、hover/active/focus-visible 和 Logo 加载失败通过。

### 5.3 WP2：首页结构、文案与图标

目标：

- 按 C06～C19 完成首页信息层级、流程、工具、媒体摘要和边界重排。

实现任务清单：

- [x] 调整 Hero 问题句字号、新增长结果口径和三段文字布局，确保不覆盖 Banner。
- [x] 四类工具删除外层灰底并保留各自背景。
- [x] 实现“查找/转发/信任/实时/复制”响应式步骤组件；固定图仅作为可访问降级候选。
- [x] 更新四大模块效率文案、标点与四个语义图标。
- [x] 更新媒体两组三行文案，移除编号并增加图标。
- [x] 删除首页独立边界模块，在 Hero/CTA、Footer 和政策中保留等义约束。

测试要求：

- [x] 首屏文案、步骤顺序、图标语义和边界存在性契约通过。
- [x] 320/390/768/1440 与 200% 缩放无遮挡、无横向溢出。

### 5.4 WP3：功能页与团队页

目标：

- 完成 C35～C44 的内容、排版、能力说明与边界重排。

实现任务清单：

- [x] 修复“私域营销（（”重复括号。
- [x] 删除功能页独立产品能力边界，并在能力临近位置保留等义约束。
- [x] 调整团队 Hero 与引语断行、字号和标点。
- [x] 更新团队效率/复制/私域锁客/分享者归属全部文案。
- [x] 为具体产品行为增加版本、异常状态与数据流说明，不在官网实现产品 Dashboard。
- [x] 删除团队独立边界模块，并在能力卡、CTA 和政策中保留等义约束。

测试要求：

- [x] 功能/团队内容契约、产品行为版本标记、禁止 Dashboard/线索库扫描通过。
- [x] 团队卡片在四视口与长文案下无裁切、无阅读顺序变化。

### 5.5 WP4：媒体中心、新闻与关于我们

目标：

- 完成 C45～C56 的媒体、新闻、关于和图片改造。

实现任务清单：

- [x] `/media` 导航/栏目改为“媒体中心”，CTA 改为“咨询媒体报道”。
- [x] 更新媒体 Dialog 可访问名称、触发器显示文案和匿名事件标签，保持企业微信资源隔离。
- [x] 四个痛点改为图标并列布局，使用一致白底并实现移动端重排。
- [x] 更新搜索口径，新增“百家主流媒体全覆盖”模块、部分示例说明和证据状态。
- [x] 新闻 Hero 改“新闻中心”并删除副说明，保持 CMS/SSR/发现契约。
- [x] 关于 Hero 改“关于我们”，增加独立四段公司介绍，删除合作伙伴模块。
- [x] “公司实景”接入可访问 Gallery/Dialog，导入办公室图和到访图，提供有序文本路线。

测试要求：

- [x] 企业微信 Dialog、焦点、Escape、失败降级和匿名事件无回归。
- [x] 新闻 SSR、canonical、JSON-LD、RSS、sitemap 与 CMS 生命周期无回归。
- [x] 图片来源/授权、PII/二维码、alt、尺寸、优化与远程请求扫描完成；授权缺口保持 Production blocker。

### 5.6 WP5：政策、体验、咨询与电话表单

目标：

- 落地 C23～C34 的政策结构与联系流程，同时维持隐私和双路径隔离。

实现任务清单：

- [x] 重组隐私保护、技术中立、用户行为、效果责任和政策使用原则的页面/入口关系。
- [x] 采用审阅稿批准正文，并补齐真实字段、用途、保存期限、用户权利、适用范围和第三方依赖。
- [x] 简化小程序体验文案，把被删除的数据边界说明迁移到隐私/架构契约。
- [x] 联系页三个模块增加留白，删除指定冗长区分文案但保留视觉/资源/事件/失败路径隔离。
- [x] 媒体咨询改为“人工服务咨询”/“咨询媒体报道”。
- [x] 表单改为电话号码，更新 DTO、校验、DirectMail HTTPS 请求、模板、隐私同意与错误状态。
- [x] 禁止图片替代真实交互，仅允许作为辅助说明。

测试要求：

- [x] 政策页面、Footer 链接、表单隐私同意和结果声明一致性通过。
- [x] 电话合法/非法/超长输入、honeypot、限频、幂等、超时、零自动重试与零 PII 日志通过。
- [x] 小程序与企业微信资源、标题、事件、alt 和失败路径保持分离。

### 5.7 WP6：完整验证、评审与收口

目标：

- 证明 56 项均已实现或被显式 Production blocker 覆盖，并完成代码评审闭环。

实现任务清单：

- [x] 运行 `pnpm test && pnpm lint && pnpm build`；Windows build 的 standalone symlink `EPERM` 由同源码 WSL2 完整 build 补充验证。
- [x] 运行 standalone/media smoke、release validation、客户端秘密扫描和公开口径扫描。
- [x] 在 320×568、390×844、768×1024、1440×900 采集证据；补充 200% 等效缩放。
- [x] 验证 Header、移动菜单、两类 Dialog、表单、Gallery、政策、媒体、新闻与关于核心流程。
- [x] 建立最终 C01～C56 追踪表；每项均为本地实现通过或显式 Production blocker。
- [x] 完成 code review-start、code-review-confirm，只应用确认后的代码修改并重跑全部验证。
- [x] 更新 FR/Sprint/Evidence 状态并以 `feat: complete sprint-m4-04 code and change base on reviews` 独立提交。

测试要求：

- [x] 无未处理的 Critical/High/Medium 本地缺陷。
- [x] Local 与 Production 状态分开；外部证据仍缺失，Production 保持 `BLOCKED`。

## 6. 验收标准

- 用户已明确覆盖并跳过 FR-22/M4-04 文档 review-start / review-confirm；该项不标记为通过，代码评审与验证门禁仍完整执行。
- 56 项 Accept 决策全部映射到代码、内容、测试、证据或显式 Production blocker。
- 新品牌色、Logo、导航、Footer 和政策入口全站一致。
- 首页、功能、团队、媒体、新闻、关于、联系和政策内容按 FR-22 完成。
- 小程序体验与媒体咨询保持独立资源、Dialog、事件和失败路径。
- 删除独立边界模块后，等义约束仍在相关能力/CTA、Footer 和政策中可读。
- 电话字段全链路服务端校验，PII 不进入 URL、浏览器持久存储、分析或日志。
- 结果型口径、搜索、媒体覆盖、产品数据行为、公司资历与图片均有登记；证据不足时 Production 阻塞。
- Windows `pnpm test` 351 passed / 2 skipped、lint 通过；同源码 WSL2 353/353、完整 build、standalone/media smoke 通过；四视口、200% 缩放、键盘与 Dialog/Gallery 焦点通过。
- CMS、SSR、metadata、canonical、RSS、sitemap、`llms.txt`、后台、安全和生产架构无回归。

## 7. 验证要求

项目声明的验证命令：

- `pnpm test && pnpm lint && pnpm build`

专项自动验证：

- C01～C56 决策追踪完整性。
- claims register schema、授权/阻塞状态与公开口径扫描。
- Header/Footer/navigation/metadata/政策内容契约。
- 电话 DTO、DirectMail、PII 安全、双 Dialog 资源隔离。
- 新闻/案例 SSR、canonical、JSON-LD、RSS、sitemap、`llms.txt`。
- Logo/图片 provenance、二维码/联系方式核对、本地资产与远程请求扫描。

专项人工验证：

- 视口：`320×568`、`390×844`、`768×1024`、`1440×900`，补充 200% 缩放。
- 流程：桌面/移动导航、小程序体验、媒体咨询、电话表单、媒体模块、新闻、关于、政策、Gallery。
- 图片：办公室图中的人物/Logo/屏幕信息，到访图中的地址、电话、二维码和路线与文本版一致。

## 8. 实施顺序

1. FR-22/M4-04 文档 review-start / review-confirm 由用户明确跳过，中止报告不保留。
2. 建立 56 项追踪矩阵，更新 SRS、设计规格、claims register、provenance 与 Production gate。
3. 先编写/更新失败测试，锁定新文案、IA、DTO、交互、口径和资产契约。
4. 实施全局品牌、Header、Footer 与政策入口。
5. 依次实施首页、功能/团队、媒体/新闻/关于、政策/联系。
6. 完成电话 DTO、DirectMail、Dialog/Gallery、图片和发现文件专项回归。
7. 执行完整自动验证与四视口/可访问性 QA。
8. 完成代码 review-confirm，应用确认项并重跑验证。
9. 更新证据和状态，满足门禁后归档并独立提交。

## 9. 风险控制

- **全量 Accept 与既有口径冲突：** 先更新来源文档和 claims register；证据不足转为 Production blocker，不伪造 PASS。
- **删除边界造成结果保证：** 独立模块可删除，但等义约束必须贴近相关能力/CTA，并在 Footer/政策可达。
- **媒体中心形成第二品牌：** “媒体中心”只作 IA 标签，继续共享客来宝外壳、Organization、CMS 和联系体系。
- **产品/媒体咨询混淆：** 可删冗长说明，不得合并二维码、Dialog、事件或失败路径。
- **电话字段引入 PII 泄露：** 服务端严格 DTO，禁止 URL/Storage/analytics/log，DirectMail 零自动重试。
- **图片暴露个人/地址信息：** 上线前逐项授权、事实与二维码有效性核验；缺失时阻塞 Production。
- **固定图片破坏可访问性：** 交互和关键信息保持真实 DOM，图片必须有等价文本和键盘可访问查看方式。
- **文案改动破坏发现能力：** metadata、SSR、canonical、RSS、sitemap、`llms.txt` 与 CMS 回归纳入同一门禁。

## 10. 交付结论

已完成。C01～C56 的本地实现或显式 Production blocker、代码双报告完整范围评审与 review-confirm、接受项修正、Windows/WSL2 自动验证、standalone/media smoke、release validation、四视口与交互 QA 均已闭环。用户于 2026-08-05 明确跳过 FR/Sprint 文档 review-start 与 review-confirm，中止报告未保留且不计为 PASS。Sprint 达到 `Local Code Ready`；Production 状态保持 `BLOCKED`。
