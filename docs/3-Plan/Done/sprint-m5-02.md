# Sprint M5-02 核心页面搜索语义与站内链接优化

> **状态：** `COMPLETED / LOCAL CODE READY / Production BLOCKED`
>
> **来源问题：** SEO 审计 `P1-1`、`P2-4`、`P2-5`
>
> **来源报告：** [2026-08-08 客来宝 SEO 审计](../../6-SEO/2026-08-08-kelaibao-seo-audit.md)

## 1. Sprint 目标

本 Sprint 覆盖以下既有 FR 的增量实现：

- [FR-07 Metadata、可访问性与发布质量](../../1-Requirement/Mainland-Website-FR/FR-07-metadata-accessibility-and-quality.md)
- [FR-13 公开 SSR 与 SEO/GEO 技术基线](../../1-Requirement/Mainland-Website-FR/FR-13-public-ssr-seo-geo-technical-baseline.md)

核心目标：

- 将首页、功能页、团队页和媒体页的 Title、Description、H1 与首屏说明统一到各自唯一的页面主题，减少“核心工具”“团队解决方案”“媒体中心”等脱离站点上下文后语义过宽的问题。
- 修正首页 Description 与当前 K-Link 产品首页内容不一致的问题。
- 统一新闻列表的 Title、H1 和 Description 命名，消除“新闻动态/新闻中心”的配置漂移。
- 将页脚与正文链接从单纯“导航可达”增强为描述目标内容的语义内链，建立首页、功能页、团队页和媒体页之间的清晰关系。
- 通过自动化契约和四视口检查防止 metadata、H1、链接目标、视觉换行和索引门禁回归。
- 本 Sprint 只优化页面可理解性和搜索结果表达，不承诺排名、点击率、收录、流量或 AI 引用提升。

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
EVIDENCE_DIR=products/kelaibao/docs/5-Evidence/m5-02
VERIFICATION_COMMANDS=pnpm test && pnpm lint && pnpm build
```

除 `FR_BACKLOG_DIR` 外，以上目录来自现有项目布局与 [Sprint 索引](../Mainland-Website-Sprint-Index.md)，验证命令来自产品级 `AGENTS.md`。`FR_BACKLOG_DIR` 来自 `sprint-workflow` fallback，当前目录不存在且本 Sprint 不创建或使用。关键词方向来自 2026-08-08 SEO 审计，属于尚未由搜索平台数据验证的页面定位假设；本 Sprint 不把假设描述成已证明的搜索需求或效果结论。

## 2. 前置依赖

- M4-04 已形成当前公开站内容和体验基线，M5-01 已完成结构化数据、响应式图片和 CMS 代表图的本地代码闭环。
- 当前公开路由、canonical、Open Graph URL、页面级结构化数据 schema 类型、节点关系和索引门禁保持不变；新闻列表结构化数据的显示名称随已确认的页面名称同步变化，是唯一有意的结构化数据内容变更。
- 本 Sprint 文档必须先完成 `review-start`、`review-confirm`，并应用 Accept/Partial 决策；在此之前不得修改代码。
- Title、H1、Description 和链接锚文本必须保持自然、可读并与页面可见内容一致，不得机械堆叠“直销、拓客、小程序、媒体发稿”等近义词。

协同说明：

- 客来宝继续是唯一主品牌，K-Link 是产品名，客来宝媒体是 `/media` 内的子业务；不得创建第二站点、第二 Organization、双二级域名或跨应用内容接口。
- 本 Sprint 不解除 Preview/Production 索引门禁，不关闭真实域名、备案、主体、专业审查、声明证据或云环境相关 blocker。
- 如果后续搜索平台查询数据与本 Sprint 的页面主题假设不一致，应形成新的数据驱动优化，不在本 Sprint 内预设排名结果。

## 3. 纳入范围

本 Sprint 纳入以下 FR：

- `FR-07`：公开页面唯一中文 metadata、语义标题、响应式和质量测试增量。
- `FR-13`：SSR 可理解性、metadata 一致性和 SEO/GEO 技术基线增量。

涉及包和目录：

- `src/lib/route-metadata.ts`：核心静态路由 Title、Description、Canonical 共用配置。
- `src/app/page.tsx`、`src/app/features/page.tsx`、`src/app/team/page.tsx`、`src/app/media/page.tsx`：H1、首屏说明、稳定锚点和正文内链。
- `src/components/site-footer.tsx`：页脚链接名称。
- `src/components/public-content-list.tsx`、新闻列表 metadata 调用路径：新闻列表命名统一。
- `tests/routes-and-metadata.test.ts`、`tests/site-content.test.ts`、`tests/home-and-global-shell.test.tsx`、相关公开页面测试：metadata、H1、链接和边界回归。
- `docs/4-Reviews`、`docs/5-Evidence/m5-02`：后续文档/代码评审及验证 Evidence。

## 4. 暂不纳入范围

- 真实关键词搜索量、竞争度、排名或 Search Console/百度/Bing 查询数据研究。
- 新增新闻、方法文章、案例或其他 CMS 内容；不新增 CMS 类型。
- 将 `/cases` 加入主导航、页脚、核心 Sitemap，或改变空案例页的索引策略。
- 自动生成“相关阅读”、全站统一推荐、关键词密度控制或批量内容生产。
- Production robots 放行、索引状态切换、正式域名、备案、主体信息或搜索平台 Sitemap 提交。
- Organization/Service/Product 等结构化数据扩展、CMS 代表图或响应式图片优化；这些由 M5-01 或后续独立工作处理。
- 修改路由、重定向、CTA 业务行为、询盘流程、CMS 生命周期、数据库、缓存或生产架构。
- 任何排名、点击率、收录、流量、咨询或 AI 引用保证。

原因：

- 本 Sprint 聚焦低风险、可在当前版本独立验证的页面语义和站内链接优化，不把外部输入、内容生产或生产发布门禁混入同一变更。

## 5. 工作范围

### 5.1 WP0：文档评审与文案冻结

目标：

- 在实施前固定页面唯一主题、候选文案、允许调整的组件和验收边界。

实现任务清单：

- [x] 对本 Sprint 执行 document `review-start` 与 `review-confirm`，将报告写入 `REVIEW_DIR`，并应用全部 Accept/Partial 决策。
- [x] 检查 Title、H1、Description 与页面实际功能、品牌层级和宣传边界一致，不引入页面未展示的能力。
- [x] 检查中文自然表达与长度；不得为覆盖关键词而重复堆叠近义词。
- [x] 将最终确认文案作为测试夹具或集中配置的权威输入，避免组件和 metadata 各自维护不同版本。
- [x] 冻结新闻列表最终名称为 `新闻与行业观察`；本 Sprint 不再保留回退为“新闻动态”的条件分支。

测试要求：

- [x] 文档链接、FR 映射、路径变量、review 输出目录和未决文案问题检查通过。
- [x] 所有核心页面均能用一句话说明唯一主题，且主题之间不存在明显互相抢占。

### 5.2 WP1：核心页面 Metadata 优化

目标：

- 让搜索结果中的 Title 和 Description 能脱离导航上下文说明页面提供的内容。

实现任务清单：

- [x] 首页 Title 调整为 `客来宝 K-Link｜直销拓客与团队数字化工具`。
- [x] 首页 Description 调整为 `客来宝 K-Link 为直销从业者和团队提供内容分享、数字名片、团队小程序与客户经营工具，支持持续曝光、信任建立与团队协同。`。
- [x] `/features` Title 调整为 `K-Link 核心功能｜内容工具、数字名片与团队小程序`；Description 沿用现有精确文本：`了解 K-Link 从曝光、获客、信任、成交到沉淀的五阶段路径，以及内容、展示、团队和引流四组十项工具。`。
- [x] `/team` Title 调整为 `直销团队小程序与数字化赋能方案｜K-Link`；Description 沿用现有精确文本：`了解 K-Link 如何通过品牌专刊、团队小程序、成员分享归属和三类交付保障支持团队经验复制。`。
- [x] `/media` Title 调整为 `媒体发稿与团队 IP 内容服务｜客来宝媒体`；Description 沿用现有精确文本：`了解客来宝媒体如何通过专业表达、新闻稿、公开传播与持续内容沉淀，帮助个人和团队建立可信的公开信息。`。
- [x] 保持四页现有 canonical、Open Graph URL、索引门禁和全局唯一 Organization 不变；Open Graph Title/Description 继续复用同一 route metadata。

测试要求：

- [x] 自动化测试逐页断言最终 Title、Description、Canonical 和 Open Graph 一致。
- [x] 四页 Title 唯一、自然且不包含不存在的价格、排名、保证、评价或效果声明。
- [x] 首页 Description 不再出现与当前产品首页不一致的旧“个人定位/专业介绍”定位。

### 5.3 WP2：H1、首屏说明与新闻命名统一

目标：

- 让 H1、首屏说明和 metadata 回答同一页面主题，同时保留当前视觉叙事。

实现任务清单：

- [x] 首页 H1 调整为 `一站式直销拓客与团队数字化工具`，现有转化说明继续作为 lead/辅助信息。
- [x] `/features` H1 调整为 `从曝光到沉淀的直销拓客工具`；`曝光 → 获客 → 信任 → 成交 → 沉淀` 保留为 H1 下方的可见流程，不继续独占 H1。
- [x] `/team` H1 调整为 `直销团队小程序与数字化赋能方案`；当前“突破团队管理瓶颈 / 构建可复制、可持续增长的团队体系”降级为可见辅助标题或说明，不丢失原有内容。
- [x] `/media` H1 调整为 `媒体发稿与团队 IP 内容服务`；当前“朋友圈让人看见你，媒体新闻让人相信你”保留为可见辅助文案。
- [x] 新闻列表统一采用 `新闻与行业观察` 作为 H1；Title 调整为 `新闻与行业观察｜客来宝`，Description 调整为 `查看客来宝、K-Link 产品、媒体服务及数字化展业相关的新闻、方法说明与行业观察。`。
- [x] 新闻列表的 metadata、可见 H1、结构化数据标签和测试不得继续出现“新闻动态/新闻中心”漂移。
- [x] 新闻列表只改变结构化数据中的显示名称；schema 类型、`@id`、`isPartOf`、canonical 和 URL 关系保持不变。

测试要求：

- [x] 每个核心页首响应 HTML 只有一个 H1，且 H1 与对应 Title/Description 的主题一致。
- [x] 现有 Hero 辅助文案没有被误删，页面仍能表达原有销售叙事和合规边界。
- [x] 新闻列表无内容和有内容两种状态均输出统一 H1，不因数据库内容数量改变 metadata。

### 5.4 WP3：页脚语义链接优化

目标：

- 在不改变信息架构和路由的前提下，让全站固定入口更清楚地描述目标页面。

实现任务清单：

- [x] 页脚 `/features` 链接名称由 `核心工具` 调整为 `K-Link 产品功能`。
- [x] 页脚 `/team` 链接名称由 `团队解决方案` 调整为 `直销团队方案`。
- [x] 页脚 `/media` 链接名称由 `媒体中心` 调整为 `媒体发稿与团队 IP`。
- [x] 保持主导航、页脚分组、路由、键盘焦点、移动菜单和现有 CTA 行为不变。

测试要求：

- [x] 页脚链接文字、href、顺序和可访问名称具有自动化断言。
- [x] 页面内不存在因文字替换导致的空链接、重复嵌套链接或断链。

### 5.5 WP4：核心页面上下文内链

目标：

- 从菜单可达提升为正文语义相关，让用户和抓取器能够沿产品主题继续浏览。

实现任务清单：

- [x] 首页四组工具分别增加描述性链接，并映射到 `/features#daily-trends`、`/features#digital-card`、`/features#brand-publication`、`/features#resource-market`。
- [x] 链接锚文本使用 `查看内容工具`、`查看展示工具`、`查看团队工具`、`查看引流工具` 或经 review-confirm 确认的等价自然文案，不统一使用“了解更多”。
- [x] `/team` 为团队小程序与成员分享归属说明增加稳定锚点 `#team-mini-program` 与 `#member-attribution`；锚点不得破坏旧路由重定向所依赖的既有片段。
- [x] `/features` 的“品牌专刊”和“团队小程序”功能项增加到 `/team#team-mini-program` 的上下文链接；链接附近需说明目标页提供团队落地和成员归属的详细说明。
- [x] 首页媒体模块增加到 `/media#services` 的明确入口，锚文本说明目标为媒体发稿或团队 IP 服务。
- [x] 保持现有 `/features`、`/media` 和旧路由片段兼容；不得删除或重命名已公开锚点，至少包括 `/media#services`、`/media#method`、`/media#direct-sales`、`/media#insurance`、`/media#securities`。

测试要求：

- [x] 自动化测试覆盖全部新增 href、锚点唯一性和目标元素存在性。
- [x] 自动化测试逐一断言 `/media#services`、`/media#method`、`/media#direct-sales`、`/media#insurance`、`/media#securities` 的目标元素仍唯一存在，并检查对应旧路由 308 Location 未变化。
- [x] SSR HTML 中可直接看到新增链接，不依赖客户端脚本注入。
- [x] 键盘能够访问新增链接，焦点样式可见；新增文本链接可点击区域最小高度为 44px；点击锚点后目标标题顶部不得位于固定 Header 底边之上，并保留至少 8px 可见间距。

### 5.6 WP5：一致性契约与视觉回归

目标：

- 将本次文案和内链关系固化为低维护成本的回归保护。

实现任务清单：

- [x] 优先复用 `ROUTE_METADATA` 或建立小型公开页面语义配置，避免为 SEO 新建与现有 metadata 平行的第二套系统。
- [x] 增加跨实现一致性测试，至少覆盖 route metadata、页面 H1、新闻列表名称、页脚标签和新增上下文链接。
- [x] 检查 Open Graph、页面级结构化数据、Sitemap、RSS、`llms.txt` 和索引门禁无意外变化。
- [x] 将四视口截图或检查记录写入 `EVIDENCE_DIR`，重点观察较长中文 H1、Title 不参与布局、页脚换行和新增链接的触控空间。

测试要求：

- [x] 320px、390px、768px、1440px 无正文横向溢出、文字遮挡、不可读换行或 CTA/链接重叠。
- [x] 200% 缩放下 H1、页脚和新增链接仍可阅读与操作。
- [x] 320px 起新增链接无横向溢出，最小点击高度 44px；锚点跳转后目标标题位于固定 Header 下方且至少保留 8px 可见间距。
- [x] Preview 默认禁止索引、Production 门禁和 `/admin`、`/api`、`/health` 禁止索引行为无回归。

## 6. 验收标准

- [x] 首页、`/features`、`/team`、`/media` 使用本 Sprint 确认的唯一 Title 与 Description，Canonical 和 Open Graph URL 不变。
- [x] 首页 Description 与当前 K-Link 产品首页内容一致，不再沿用旧个人专业表达服务定位。
- [x] 四个核心页各自只有一个 H1，且 Title、H1、首屏说明和正文主题一致。
- [x] 功能页不再以单独的五阶段词组作为 H1，但五阶段流程仍可见、语义正确。
- [x] 新闻列表 Title、H1、Description 和结构化数据名称统一为“新闻与行业观察”，有内容/无内容状态一致。
- [x] 页脚三个核心入口采用描述目标内容的链接名称，href 与顺序无回归。
- [x] 首页四组工具、功能页团队功能和首页媒体模块具备可见、可键盘访问、服务端输出的上下文链接。
- [x] 所有新增片段目标存在且唯一；已有 `/media#services`、`/media#method`、`/media#direct-sales`、`/media#insurance`、`/media#securities` 均保持唯一可达且旧路由 308 Location 不变。
- [x] 自动化测试能够阻止核心页面 metadata/H1、新闻命名、页脚标签和关键 href 再次漂移。
- [x] 320px、390px、768px、1440px 及 200% 缩放检查通过。
- [x] `pnpm test && pnpm lint && pnpm build` 全部通过，结构化数据、发现文件、索引门禁、二维码、Lightbox、CMS 和生产架构无回归。
- [x] 交付说明明确本次只形成技术与页面语义基线，不声称 SEO 效果已经发生。

## 7. 验证要求

项目声明的验证命令：

- `pnpm test`
- `pnpm lint`
- `pnpm build`

专项验证：

- 对首页、`/features`、`/team`、`/media`、`/news` 检查首响应 HTML 中的 Title、Description、Canonical、Open Graph、H1 和新增链接。
- 运行 metadata、站点内容、全局外壳、媒体页、公开 SSR/结构化数据相关定向测试。
- 在 320px、390px、768px、1440px 和 200% 缩放下检查 H1、页脚及新增上下文链接。
- 验证新增锚点跳转、键盘焦点和固定导航偏移。
- 逐一验证 `/media#services`、`/media#method`、`/media#direct-sales`、`/media#insurance`、`/media#securities` 及对应旧路由的兼容性。
- 对 robots、Sitemap、RSS、`llms.txt`、`/admin`、`/api`、`/health` 执行无回归检查。

## 8. 实施顺序

1. 完成 Sprint 文档 review-start、review-confirm，并应用 Accept/Partial 决策。
2. 先补充或更新 metadata/H1/链接一致性测试，使旧文案基线下测试按预期失败。
3. 更新统一 route metadata 与新闻列表命名。
4. 调整四个核心页 H1 和辅助文案层级，保持原有内容与边界。
5. 更新页脚链接名称，增加首页、功能页和团队页的上下文链接与稳定锚点。
6. 运行定向测试并检查 SSR HTML、canonical、Open Graph、结构化数据和索引门禁。
7. 运行四视口、200% 缩放、键盘和锚点专项检查，记录 Evidence。
8. 执行完整 `pnpm test && pnpm lint && pnpm build`。
9. 完成代码 `review-start`、`review-confirm`，应用 Accept/Partial 决策后重新验证。
10. 仅在全部门禁通过后更新交付结论并按 Sprint 工作流独立提交。

## 9. 风险控制

- **关键词假设未经真实数据验证：** 使用自然、与页面可见内容一致的文案；不把关键词方向写成已证明结论，上线后再由真实查询数据决定是否迭代。
- **长 H1 破坏当前 Hero：** 保留辅助标题层级并执行四视口与 200% 缩放检查；不得通过缩小到不可读字号强行塞入单行。
- **Title 与 H1 机械重复：** 两者围绕同一主题但按各自场景自然表达，Description 负责补充而非重复堆词。
- **新闻名称超前于当前内容：** document review-confirm 已冻结“新闻与行业观察”，依据是新闻 CMS 允许承载方法说明与市场观察；后续仍需由真实内容与搜索查询数据验证，不得把频道名称当作内容已经充足或 SEO 效果已发生的证据。
- **新增链接影响卡片交互：** 使用明确文本链接，不用包含其他交互元素的整卡嵌套链接；保证键盘焦点和触控区域。
- **锚点兼容风险：** 只新增稳定锚点，不删除或改名已有公开锚点和旧路由重定向目标。
- **误解为 SEO 结果交付：** 验收只检查页面语义、HTML、链接和技术回归，不使用排名、点击率、流量或收录作为本地完成条件。
- **范围膨胀：** 案例入口、内容生产、结构化数据扩展、生产索引和搜索平台运营继续留在本 Sprint 之外。

## 10. 交付结论

`LOCAL CODE READY / Production BLOCKED`：文档与代码双评审、逐条 review-confirm、全部 Accept/Partial 修正、本地全量验证及专项浏览器检查均已完成。metadata、H1、新闻列表命名、页脚与正文语义内链、稳定锚点和回归测试已实现；本 Sprint 不解除现有 Production 索引及发布门禁，也不声称 SEO 效果已经发生。

- Local Code 状态：`READY`
- Production 状态：`BLOCKED`（沿用既有正式域名、备案、主体、专业审查与索引门禁，不由本 Sprint 关闭）
- 文档 review：`docs/4-Reviews/Done/sprint-m5-02-review-by-gpt-5.5.md`、`docs/4-Reviews/Done/sprint-m5-02-review-by-gpt-5.3-codex-spark.md`
- 文档 review-confirm：`docs/4-Reviews/Done/sprint-m5-02-review-confirm.md`
- 代码 review：`docs/4-Reviews/Done/sprint-m5-02-code-review-by-gpt-5.5.md`、`docs/4-Reviews/Done/sprint-m5-02-code-review-by-gpt-5.3-codex-spark.md`
- 代码 review-confirm：`docs/4-Reviews/Done/sprint-m5-02-code-review-confirm.md`；两项 Medium Accept 已修正并重新验证
- 自动化验证：`pnpm test` 通过（67 files / 374 tests），`pnpm lint` 通过，`pnpm build` 通过
- 浏览器 Evidence：`docs/5-Evidence/m5-02/responsive-and-link-check.md`；320/390/768/1440 四视口、200% 页面缩放、键盘焦点、44px 点击高度、锚点间距和五个历史媒体片段均通过
- 交付边界：本次形成页面语义与站内链接技术基线，不承诺排名、点击率、收录、流量、咨询或 AI 引用提升
