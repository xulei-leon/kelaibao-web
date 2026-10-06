# Sprint M5-01 文档评审报告

被评审文件：`D:\code\tokengate\products\kelaibao\docs\3-Plan\sprint-m5-01.md`

评审类型：document review

## Findings

| Severity | Type | Location | Issue | Evidence | Recommendation |
| --- | --- | --- | --- | --- | --- |
| High | Risk | `products/kelaibao/docs/3-Plan/sprint-m5-01.md:195`, `products/kelaibao/docs/3-Plan/sprint-m5-01.md:197`, `products/kelaibao/docs/3-Plan/sprint-m5-01.md:215`, `products/kelaibao/docs/3-Plan/sprint-m5-01.md:260` | CMS 代表图被要求同时服务可见页面、Open Graph 和 Article ImageObject，并且“使用同一 URL 与尺寸”，但代表图又被限制为至少 1200x630。这可能迫使移动端详情页下载社交分享尺寸的大图，抵消本 Sprint 的响应式图片目标。 | WP4 要求代表图至少 1200x630 且不高于 350 KB；`PublicContentSnapshot.coverImage` 只输出一个由 `media/` object key 构造的 URL；WP5 和验收标准要求可见代表图、OG 和 Article ImageObject 使用同一绝对 URL/同一 URL 与尺寸。与此同时，响应式生成流水线只覆盖 `public/visual` 中的代码视觉资产，未覆盖 CMS 代表图。 | 将 CMS 代表图拆成“社交/Article 原图”与“页面可见响应式变体”两个明确契约，或显式说明内容详情页首期不纳入图片性能目标并要求 review-confirm 接受该例外。更稳妥的做法是为已确认媒体生成内容寻址的 display variants，同时保持 OG/Article 使用合规 1200x630 资源。 |
| Medium | Requirement | `products/kelaibao/docs/3-Plan/sprint-m5-01.md:191`, `products/kelaibao/docs/3-Plan/sprint-m5-01.md:193` | 公开使用授权要求“固定 reason code 审计”，但 schema 增量只列出 `public_usage_confirmed_at/by`，没有定义 reason code 的存储位置、枚举或审计 payload。实施时容易只记录时间和管理员，无法满足可审计授权原因的要求。 | 迁移项只新增 `media_assets.width_px`、`height_px`、`public_usage_confirmed_at/by` 和 revision cover 字段；下一条任务才要求“固定 reason code 审计”。 | 在 WP4 中补充 reason code 的持久化契约，例如 `media_assets.public_usage_reason_code` 或 `audit_logs` 的结构化字段、允许值枚举、迁移兼容策略和测试断言。 |
| Medium | Consistency | `products/kelaibao/docs/3-Plan/sprint-m5-01.md:50`, `products/kelaibao/docs/3-Plan/sprint-m5-01.md:105`, `products/kelaibao/docs/3-Plan/sprint-m5-01.md:250`; `products/kelaibao/docs/3-Plan/Mainland-Website-Sprint-Index.md:112` | Sprint 文件要求先执行 document `review-start`，但 Sprint 索引规定“调用多个 reviewer agents 前必须先获得人工确认”。当前 Sprint 文件没有把该人工确认作为前置步骤，执行者可能在不一致规则之间阻塞或误触发未授权的多 reviewer 流程。 | M5-01 多处把 `review-start` 作为代码实施前门禁；Sprint 索引同一流程边界要求多个 reviewer agents 前先获得人工确认。 | 在 WP0 或实施顺序中明确加入“获得人工授权后再执行 review-start”，或规定在已由用户委托单一报告时采用单报告路径，避免流程要求互相冲突。 |
| Medium | Risk | `products/kelaibao/docs/3-Plan/sprint-m5-01.md:197`, `products/kelaibao/docs/3-Plan/sprint-m5-01.md:235`, `products/kelaibao/docs/3-Plan/sprint-m5-01.md:236`, `products/kelaibao/docs/3-Plan/sprint-m5-01.md:263` | 缓存策略对构建期 `/visual/generated/*` 图片很清楚，但对 CMS `media/` 代表图缺少同等级契约。代表图参与可见页面、OG 和 Article schema，如果 object key 可变、缓存头不明或 ESA purge 范围不清，会产生旧图残留、社交图漂移或 published revision 与实际图片不一致的风险。 | WP6 只明确 `/visual/generated/*` 使用 immutable 缓存；CMS cover URL 来自 `OSS_ASSETS_BASE_URL` 和 `media/` object key；验收标准只泛化要求浏览器缓存、ESA edge 和源站 Evidence，没有定义 `media/` cover 的 TTL、immutability 或刷新规则。 | 为 CMS 代表图单独定义缓存和对象不可变策略：object key 是否内容寻址、是否禁止覆盖、浏览器/ESA TTL、发布换图时需要 purge 的 URL 集合，以及社交抓取缓存无法及时刷新时的验收/回退规则。 |
| Low | Clarity | `products/kelaibao/docs/3-Plan/sprint-m5-01.md:191`, `products/kelaibao/docs/3-Plan/sprint-m5-01.md:194`, `products/kelaibao/docs/3-Plan/sprint-m5-01.md:203` | `cover_media_asset_id` 与 `cover_alt` 的成对约束只作为文字规则出现，未说明由数据库约束、repository 校验还是两者共同保证。对于 MySQL/SQLite 双迁移和上一版本兼容矩阵，约束落点不清会增加实现偏差。 | WP4 只声明新增 nullable 字段，并要求两者同时为空或同时存在；测试要求覆盖字段不成对拒绝，但没有定义 FK、CHECK、索引或应用层校验边界。 | 补充数据完整性落点：至少定义 FK/索引、应用层事务校验、MySQL/SQLite 可移植 CHECK 策略或明确不使用 DB CHECK 的原因，并把旧版本读取 nullable 字段的兼容行为写入测试清单。 |

## Checks Performed

- 核对了 M5-01 与来源 SEO 审计中 `P2-1`、`P2-2` 的对应关系。
- 核对了产品级 `AGENTS.md`、Sprint 索引和相关 FR 文档的流程、架构、验证命令和生产门禁约束。
- 重点检查了结构化数据真实性、响应式图片路径、CMS revision 代表图、授权审计、缓存 Evidence 和 review 门禁的一致性。
