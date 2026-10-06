# Sprint M5-01 文档评审确认

**Reviewed Inputs**

- `products/kelaibao/docs/3-Plan/sprint-m5-01.md`
- `products/kelaibao/docs/4-Reviews/sprint-m5-01-review-by-gpt-5.5.md`
- `products/kelaibao/docs/4-Reviews/sprint-m5-01-review-by-gpt-5.3-codex-spark.md`
- `products/kelaibao/AGENTS.md`
- `products/kelaibao/docs/3-Plan/Mainland-Website-Sprint-Index.md`
- `products/kelaibao/docs/2-Design/Alibaba-Cloud-Fullstack-Architecture-Spec.md`
- `products/kelaibao/docs/2-Design/Admin-Security-and-Media-Runbook.md`
- `products/kelaibao/docs/1-Requirement/Mainland-Website-FR/FR-07-metadata-accessibility-and-quality.md`
- `products/kelaibao/docs/1-Requirement/Mainland-Website-FR/FR-11-private-oss-media-and-html-sanitization.md`
- `products/kelaibao/docs/1-Requirement/Mainland-Website-FR/FR-12-news-case-cms-lifecycle-and-publication.md`
- `products/kelaibao/docs/1-Requirement/Mainland-Website-FR/FR-13-public-ssr-seo-geo-technical-baseline.md`

**Review Date**

- 2026-08-08

## Overall Conclusion

两份报告均有效且覆盖目标范围。gpt-5.3-codex-spark 未发现阻塞项；gpt-5.5 的 5 项意见中，3 项需要立即补充契约，1 项需要以首期范围例外方式部分采纳，1 项已由用户启动完整 Sprint 的明确指令满足但仍应写入审计记录。

应用本确认中的 Accept/Partial 修改后，Sprint 文档可以通过 document review confirmation gate 并进入实现。真实 ESA/FC/OSS/RDS、正式域名、大陆网络和微信浏览器结论继续保持 Production `BLOCKED/DEFERRED`。

## Decision Table

| No. | Severity | Type | Review Source | Original Comment Summary | Decision | Evidence | Follow-up Plan / Rejection Reason |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | High | Risk | `gpt-5.5 F1` | CMS 代表图以同一 1200x630 URL 服务可见页面、OG 和 Article，可能抵消移动端响应式优化。 | Partial | M5-01 的 P2-2 首期性能目标与变体流水线明确针对代码内视觉资产；CMS 全媒体衍生变体在“不纳入范围”。代表图仍受 350 KB 上限约束，且首期列表不展示图片。 | 明确 CMS 详情代表图是首期响应式变体例外：可见页、OG、Article 使用同一不可变 URL，单图不高于 350 KB；display variants 留到有真实 CMS 性能数据后的后续 FR。 |
| 2 | Medium | Requirement | `gpt-5.5 F2` | 授权审计要求固定 reason code，但 schema/审计 payload 没有定义存储位置和枚举。 | Accept | 现有 MySQL/SQLite `audit_logs.metadata_json` 已作为结构化审计 metadata 存储，`insertSecurityAudit`/`insertSqliteSecurityAudit` 均序列化固定事件 metadata；无需为单一 reason 再增加媒体列。 | 指定 action=`media_public_usage_confirmed`，metadata 使用 media ID 与版本化固定 `reasonCode=editor_confirmed_public_use_v1`；增加 MySQL/SQLite 审计测试并禁止自由文本。 |
| 3 | Medium | Consistency | `gpt-5.5 F3` | Sprint 要求双 reviewer，但索引要求先获得人工确认。 | Accept | 用户在 2026-08-08 明确发出“启动 sprint M5-01 开发任务”，而 M5-01 实施顺序包含 document/code 双 review-start；该指令授权执行本 Sprint 完整流程。 | 在 Sprint 前置依赖和 WP0 记录本次人工授权；新增 reviewer 或改变评审范围仍需重新获得用户确认。 |
| 4 | Medium | Risk | `gpt-5.5 F4` | CMS `media/` 代表图缺少不可变缓存、TTL 和刷新契约。 | Accept | Admin Runbook 已把确认媒体提升为 `media/<admin>/<intent>-<hash>` immutable object；FR-12 要求发布/下线精确刷新 HTML/发现文件，图片 URL 随内容变化而变化。 | 明确 object key 禁止覆盖、浏览器与 ESA 使用一年 immutable 缓存、换图生成新 URL，只刷新引用它的 HTML/发现 URL；第三方社交平台自有缓存不属于本站 purge 可控范围。 |
| 5 | Low | Clarity | `gpt-5.5 F5` | cover ID/alt 成对约束的数据库、repository 和兼容性落点不清。 | Accept | FR-12 要求 revision/pointer 事务一致；架构规格要求 expand-only migration 和上一应用版本兼容。当前 MySQL 版本仍受 M2-00 门禁约束，不能假设所有版本执行 CHECK。 | 明确 FK、索引和 repository 事务校验为必需；MySQL/SQLite 确认执行 CHECK 时增加成对 CHECK，否则以应用层校验为权威并记录原因；上一版本兼容测试必须通过。 |
| 6 | Info | Documentation | `gpt-5.3-codex-spark F1` | 未发现明确阻塞性缺陷，建议代码评审继续追踪工作包依赖。 | Accept | Sprint 已定义 WP0/WP1 技术路径门禁、工作包顺序、代码双评审和完整验收。 | 不需要额外修改；代码评审必须逐项映射 WP0-WP6 与验收标准。 |

## Needs Immediate Action

- 应用 F1 的首期 CMS 代表图性能例外说明。
- 应用 F2 的固定授权审计 action/reason code 契约。
- 应用 F3 的人工授权记录。
- 应用 F4 的 CMS immutable object/cache/purge 契约。
- 应用 F5 的 FK、索引、事务校验和 CHECK 兼容策略。

## Can Be Deferred

- CMS display responsive variants 只有在真实内容量、移动端性能和 OSS/FC 成本数据证明必要时才另建 FR。
- 社交平台自身的分享缓存刷新不属于 ESA purge 能力；通过不可变新图片 URL 和发布验证降低漂移，不承诺第三方即时刷新。

## Final Status

`ACCEPTED`。本文件的 Accept/Partial 行动已应用到 `sprint-m5-01.md`，M5-01 已通过 document review confirmation gate，可以进入实现；Production 外部门禁保持 `BLOCKED/DEFERRED`。
