# Sprint M5-02 Document Review Confirm

**Reviewed Inputs**

- `products/kelaibao/docs/3-Plan/sprint-m5-02.md`
- `products/kelaibao/docs/4-Reviews/sprint-m5-02-review-by-gpt-5.5.md`
- `products/kelaibao/docs/4-Reviews/sprint-m5-02-review-by-gpt-5.3-codex-spark.md`
- `products/kelaibao/docs/1-Requirement/Mainland-Website-FR/FR-07-metadata-accessibility-and-quality.md`
- `products/kelaibao/docs/1-Requirement/Mainland-Website-FR/FR-13-public-ssr-seo-geo-technical-baseline.md`
- `products/kelaibao/docs/6-SEO/2026-08-08-kelaibao-seo-audit.md`
- `products/kelaibao/AGENTS.md`

**Review Date**

- 2026-08-09

## Overall Conclusion

两份评审均确认 Sprint 方向与既有 FR、SEO 审计及项目边界基本一致，但发现若干会导致实施与验收口径不一致的文档问题。所有 Medium 问题均可通过收敛文案、明确结构化数据例外、补齐旧锚点回归和量化链接可用性标准解决，不需要扩大 Sprint 范围。

本确认冻结新闻列表最终名称为“新闻与行业观察”。该名称来自已批准的 M5-02 页面定位，且新闻 CMS 已允许承载方法说明与市场观察；本 Sprint 不再保留与“新闻动态”之间的条件分支。完成下表 Accept/Partial 项后，Sprint 文档可进入实现门禁。

## Decision Table

| No. | Severity | Type | Review Source | Original Comment Summary | Decision | Evidence | Follow-up Plan / Rejection Reason |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Medium | Consistency | `GPT-5.5 #1` | 文档一处要求页面级结构化数据不变，另一处要求新闻列表结构化数据名称变化。 | Accept | M5-02 WP2 明确要求统一新闻名称；`src/server/discovery/metadata.ts` 的列表结构化数据名称来自列表标签，名称会随页面语义变化，但 schema 类型、节点关系、canonical 和 URL 无需改变。 | 将前置依赖和范围表述改为“schema 形状、类型、节点关系与 URL 不变；新闻列表显示名称是唯一有意变化”，并增加针对该例外的测试要求。 |
| 2 | Medium | Requirement | `GPT-5.5 #2` | 新闻列表名称同时被硬编码为“新闻与行业观察”并允许条件回退为“新闻动态”。 | Accept | SEO 审计允许新闻 CMS 承载方法说明与市场观察；用户要求把该建议纳入并执行 M5-02。保留双分支会使验收不可判定。 | 在 WP0 记录最终决策为“新闻与行业观察”，删除风险章节的条件回退，并让 WP2、测试与验收只引用冻结值。 |
| 3 | Medium | Clarity | `GPT-5.5 #3` | `/features`、`/team`、`/media` Description 未冻结精确字符串。 | Accept | 当前 `src/lib/route-metadata.ts` 已有三条与页面内容一致的 Description；M5-02 只要求改 Title，不需要重写这三条 Description。 | 在 WP1 明确三页沿用现有 Description，并把精确字符串写入 Sprint 与测试要求。 |
| 4 | Medium | Test | `GPT-5.5 #4` | 旧锚点兼容要求未枚举完整，测试契约弱于迁移风险。 | Accept | `next.config.ts` 的旧路由分别依赖 `/media#services`、`#direct-sales`、`#insurance`、`#securities`、`#method`；删除片段目标会让 308 后的落点失效。 | 在 WP4、测试和验收中枚举五个 `/media` 片段，并要求每个目标唯一存在且保持命名。 |
| 5 | Low | Documentation | `GPT-5.5 #5` | `FR_BACKLOG_DIR` 被描述为来自 Sprint 索引，但索引未定义且目录不存在。 | Accept | `sprint-workflow` 的 fallback 定义了该路径，但当前项目 Sprint 索引和磁盘没有 backlog 目录，本 Sprint 也不使用它。 | 保留已解析值以满足工作流记录，但注明它来自 skill fallback、当前不存在且本 Sprint 不创建或使用；其余路径继续来自项目布局/索引。 |
| 6 | Medium | Consistency | `Spark #1` | 新闻最终名称和条件回退冲突，验收未体现条件。 | Accept | 与 `GPT-5.5 #2` 结论一致，但 Spark 强调验收不可执行；M5-02 必须只有一个确定结果。 | 同第 2 项：冻结“新闻与行业观察”，删除条件化表述，并同步全部验收文本。 |
| 7 | Medium | Requirement | `Spark #2` | 现有锚点留存要求没有进入显式回归断言。 | Accept | 与 `GPT-5.5 #4` 结论一致；旧 URL 永久重定向是既有公开合同。 | 同第 4 项，并在专项验证中检查旧 URL 308 Location 及目标元素存在。 |
| 8 | Low | Clarity | `Spark #3` | 锚点无遮挡、焦点可见和触控区域缺少量化阈值。 | Partial | 问题真实，但本 Sprint 不重新定义全站颜色对比或设计系统；现有项目已要求可见焦点和移动端可操作。锚点目标与新增链接仍可增加客观标准。 | 要求锚点跳转后目标标题的顶部不得位于固定 Header 底边之上，并保留至少 8px 可见间距；新增文本链接可点击区域最小高度 44px，320px 起无横向溢出。焦点颜色对比继续沿用现有设计系统和自动化/人工检查，不新增独立对比度重设计。 |

## Needs Immediate Action

- 明确结构化数据保持不变的边界，并记录新闻列表名称的有意例外。
- 冻结新闻名称及三页 Description 精确值。
- 枚举并测试全部五个 `/media` 历史片段。
- 增加锚点可见间距和新增链接最小点击高度标准。
- 纠正 `FR_BACKLOG_DIR` 来源说明。

## Can Be Deferred

- 基于真实搜索平台查询数据再次调整页面关键词与新闻频道名称。
- 对全站焦点颜色对比进行独立视觉系统重设计；当前 Sprint 只验证既有焦点样式无回归。

## Final Status

`ACCEPT AFTER DOCUMENT UPDATES`：应用以上 Accept/Partial 修改后，M5-02 文档满足实现门禁；在修订完成前不得开始代码实施。
