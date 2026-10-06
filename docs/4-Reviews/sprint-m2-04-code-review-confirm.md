# Sprint M2-04 Code Review Confirm

**Reviewed Inputs**

- `docs/4-Reviews/sprint-m2-04-code-review-by-gpt-5.5.md`
- `docs/1-Requirement/Mainland-Website-FR/FR-13-public-ssr-seo-geo-technical-baseline.md`
- `docs/3-Plan/sprint-m2-04.md`
- `docs/4-Reviews/sprint-m2-04-review-confirm.md`
- M2-03 content state/published pointer migration、public query 与 purge URL/outbox contracts
- M2-04 public query、SSR、metadata/JSON-LD、discovery、crawl gate 与测试

**Review Date**

- 2026-07-30

## Overall Conclusion

GPT-5.5 的两条 Medium 意见均由代码与 FR-13 证据支持。`stale-while-revalidate=300` 会授权共享缓存超过 60 秒继续使用陈旧响应；仅依赖 `published_revision_id` 外键也不能保证目标 revision 的状态为 published。两项都应在本 Sprint 修复后再进入最终验证。

本轮按用户覆盖只使用 GPT-5.5，未调用 GPT-5.3 Codex Spark。

## Decision Table

| No. | Severity | Type | Review Source | Original Comment Summary | Decision | Evidence | Follow-up Plan / Rejection Reason |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Medium | Correctness | `GPT-5.5 M1` | `stale-while-revalidate=300` 允许共享缓存超过 60 秒返回陈旧内容。 | Accept | FR-13 第 8 条与 Sprint 证据矩阵只允许 `s-maxage <= 60`；当前 `PUBLIC_CACHE_CONTROL` 同时作用于详情、列表与三个发现文件，SWR 300 秒会扩大最坏陈旧窗口。 | 改为 `public, s-maxage=60, must-revalidate`，并增加 executable assertion：共享响应不得含 `stale-while-revalidate`，`s-maxage` 必须为 60。 |
| 2 | Medium | Correctness | `GPT-5.5 M2` | public JOIN 未要求目标 revision 自身为 `published`，损坏指针可能公开 draft/offline revision。 | Accept | migration 只有 pointer 外键；`PUBLIC_CONTENT_COLUMNS` 不含 revision status，两个 JOIN 仅匹配 id/item id。未来修复或迁移错误可绕过状态机不变量。 | 列表与详情 JOIN 均增加 `AND r.status = 'published'`；详情中 published item 无匹配 revision 继续抛 `published_content_snapshot_missing` 走 5xx/no-store。测试断言 SQL predicate 和损坏指针 fail-closed。 |

## Needs Immediate Action

- 已将公开共享缓存头收紧为 `public, s-maxage=60, must-revalidate`，测试禁止超限 SWR。
- 已在 public list/detail JOIN 增加 `r.status = 'published'`，损坏指针测试保持 5xx fail-closed。

## Can Be Deferred

- 真实 ESA 缓存、主动刷新、身份/token、链路和告警证据继续 `M2-LEGACY-01 / DEFERRED`。
- 真实报价、流量假设和预算硬上限继续 `M2-LEGACY-02 / DEFERRED`。

## Final Status

`ACCEPTED_AFTER_CHANGES`

两项接受意见已应用，专项测试通过；最终全量验证结果记录在 Sprint 交付结论中。Production Live 保持 `BLOCKED`。
