# FR-20 视觉风格升级与回归保护文档评审报告

| Severity | Type | Location | Issue | Evidence | Recommendation |
| --- | --- | --- | --- | --- | --- |
| Medium | Test | `products/kelaibao/docs/1-Requirement/Mainland-Website-FR/FR-20-visual-style-upgrade-and-regression-protection.md:119`, `:172-179` | `/admin` 被明确排除在本轮换肤范围外，但最小验证方式没有覆盖后台非回归；由于本 FR 计划通过全局 CSS 覆盖层接入，后台仍可能被全局选择器、变量或基础元素样式影响。 | 文档要求“管理后台 `/admin` 不纳入本轮品牌换肤；全局选择器不得意外改变后台布局或可用性”，但验证清单只列公开页面、CTA、Dialog、菜单、表单、SSR、Metadata、结构化数据、视口截图和可访问性检查。 | 在回归保护中新增 `/admin` 非回归门禁，例如登录页/后台壳的 smoke test、关键选择器作用域检查，或在 CSS 覆盖层中明确限定公开站 root/shell 作用域，并记录验证证据。 |
| Medium | Requirement | `products/kelaibao/docs/1-Requirement/Mainland-Website-FR/FR-20-visual-style-upgrade-and-regression-protection.md:66`, `:156`, `:188` | “可回退的新视觉覆盖层”是核心交付与验收点，但文档没有定义如何证明覆盖层可单独移除并恢复旧视觉。 | 功能需求要求新增规则通过独立、可删除覆盖层接入；输出要求“可回退的新视觉覆盖层”；验收要求“新视觉覆盖层可单独移除并恢复原视觉”，但最小验证方式未包含移除覆盖层后的构建、测试或截图验证。 | 增加 rollback 验证步骤：明确覆盖层入口文件、禁用/移除方式、预期无编译错误，并要求在关闭覆盖层后运行最小 smoke/build 与关键页面截图或 DOM 契约检查。 |
| Medium | Test | `products/kelaibao/docs/1-Requirement/Mainland-Website-FR/FR-20-visual-style-upgrade-and-regression-protection.md:37-59`, `:133-139` | 内容、布局、行为冻结要求很多，但自动化契约没有把每类冻结项映射到具体测试断言或 fixture 字段，执行时容易只保留“测试通过”而漏掉局部契约。 | 文档列出逐字内容冻结、Section 数量/顺序、Grid 列数、CTA 位置、Dialog/菜单/SSR 等冻结项；自动化部分只说明建立语义基线、证明 PageHero variant 不改 DOM、复用若干测试文件。 | 补充“冻结项 -> 证据/测试”矩阵，至少覆盖路由清单、H1/H2/H3 数量、Section 顺序、关键 Grid 项数、CTA label 与交互目标、Hero aside 条件、移动端阅读顺序、Dialog 行为和 metadata/JSON-LD/RSS/sitemap/llms 契约。 |
| Medium | Clarity | `products/kelaibao/docs/1-Requirement/Mainland-Website-FR/FR-20-visual-style-upgrade-and-regression-protection.md:140-145`, `:177` | 截图证据要求缺少确定性矩阵和判定标准，可能导致不同执行者对“同视口截图”和“layout 漂移”采用不同口径。 | 文档要求实施前后使用相同浏览器、相同路由和四个关键视口截图，并最少覆盖若干页面；但未明确每条路由是否都必须覆盖四个视口、截图是 full-page 还是 viewport、是否禁用动画、如何命名、差异到什么程度算漂移。 | 固定截图矩阵为“指定路由 x `320/390/768/1440` x before/after”，补充命名约定、浏览器版本、设备缩放、滚动位置/full-page 规则、动画降级方式和人工判定清单。 |
| Low | Requirement | `products/kelaibao/docs/1-Requirement/Mainland-Website-FR/FR-20-visual-style-upgrade-and-regression-protection.md:126`, `:178` | WCAG 2.1 AA 要求没有量化阈值或工具链，验收标准不够可执行。 | 文档要求正文与关键控件满足 WCAG 2.1 AA，对深色媒体 Hero 和绿色 CTA 单独检查；最小验证方式只写“键盘导航、Escape、焦点恢复、200% 缩放和 reduced motion 检查”。 | 明确对比度阈值和检查对象，例如普通文本 `>= 4.5:1`、大字号文本和非文本 UI `>= 3:1`、focus-visible 可见边界，并指定 axe/Lighthouse 或手工 contrast 记录方式。 |
| Low | Consistency | `products/kelaibao/docs/1-Requirement/Mainland-Website-FR/FR-20-visual-style-upgrade-and-regression-protection.md:8`, `:192` | 前置依赖与备注中的启动门禁表述可能被误读为互相冲突：一处列出 FR-16/17/18 为前置依赖，另一处又说明 M4-01 完成状态不构成本 FR 技术依赖，但 M4-02 受单 Sprint 顺序规则限制。 | 元数据写明“前置依赖：`FR-16`、`FR-17`、`FR-18`”；备注写明“M4-01 的完成状态不构成本 FR 的技术依赖，但按项目‘单 Sprint 顺序实施’规则，M4-02 只能在前序 active Sprint 关闭后启动”。 | 将“技术依赖”和“流程/排期门禁”拆开列明，例如前置依赖改为“技术输入依赖”和“启动门禁”两项，避免开发或排期评审误判是否可提前准备实现。 |
| Info | Documentation | Overall | 未发现阻断 FR 方向的致命问题；文档对“纯视觉升级、不改变内容/结构/行为、避免第二品牌、建立回归保护”的边界描述较完整。 | 本次检查覆盖了目标、冻结契约、功能需求、页面要求、响应式与无障碍、证据要求、输出、非范围、最小验证方式和验收要点。 | 在进入实现前优先补齐上述验证口径和证据矩阵，可降低视觉升级误伤公开站或后台的风险。 |

## 审核范围

- Review type: document review.
- Reviewed file: `products/kelaibao/docs/1-Requirement/Mainland-Website-FR/FR-20-visual-style-upgrade-and-regression-protection.md`.
- Focus: correctness, requirement clarity, regression risk, evidence requirements, validation completeness, and actionable improvements.
- Not performed: no implementation code review, no visual screenshot comparison, and no modification to the reviewed FR.
