# Sprint M2-04 Review Confirm

**Reviewed Inputs**

- `docs/4-Reviews/sprint-m2-04-review-by-gpt-5.5.md`
- `docs/1-Requirement/Mainland-Website-FR/FR-13-public-ssr-seo-geo-technical-baseline.md`
- `docs/3-Plan/sprint-m2-04.md`
- `docs/1-Requirement/Saino-Quanwang-Mainland-Website-SRS.md`
- `docs/2-Design/Alibaba-Cloud-Fullstack-Architecture-Spec.md`
- `docs/2-Design/Saino-Quanwang-Visual-Design-Spec.md`
- M2-03 public content query, purge contracts, Sprint and review-confirm evidence

**Review Date**

- 2026-07-30

## Overall Conclusion

GPT-5.5 的六条意见均指出了真实的可执行性缺口。外部证据分栏、抓取门禁、失败降级、发现文件契约和视觉 QA 应全部接受；公共 DTO 意见方向正确，但审查将 M2-03 的“列表 DTO”描述得比现有实现更完整，因此按实际代码边界部分接受。

本轮按用户覆盖只使用 GPT-5.5，未调用 GPT-5.3 Codex Spark。完成下表文档行动后，M2-04 可以进入 TDD 实施；Production Live 继续 `BLOCKED`。

## Decision Table

| No. | Severity | Type | Review Source | Original Comment Summary | Decision | Evidence | Follow-up Plan / Rejection Reason |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | High | Risk | `GPT-5.5 H1` | Sprint 未保留本地契约与真实 ESA/Production 证据分栏。 | Accept | 架构规格 9.2 只允许继续本地开发；M2-03 第 7、10 节已将真实 ESA、链路、token、报价和预算保持为 `DEFERRED/BLOCKED`。 | 在 M2-04 增加证据矩阵和最高状态 `CODE_READY_WITH_EXTERNAL_LEGACY`，明确真实 ESA ≤60 秒、ESA→FC→RDS、身份/token、告警与成本不得由 fake 标 PASS。 |
| 2 | Medium | Requirement | `GPT-5.5 M1` | robots/metadata 的 preview 与 production 抓取门禁未形成任务和测试。 | Accept | FR-13 高层要求正式环境只有通过 FR-08 后才开放抓取；当前 `robots.ts` 只有 preview 环境分支，不能表达 FR-08 Production readiness。 | 增加显式 crawl gate：默认及 preview/staging 阻止索引，只有受控 Production-ready 配置允许公开抓取；始终排除 `/admin`、`/api`、草稿、下线和私有资源，并测试 metadata robots。 |
| 3 | Medium | Correctness | `GPT-5.5 M2` | FR-13 的 DB、JSON-LD、`llms.txt` 失败降级未进入 Sprint 测试。 | Accept | FR-13“失败与降级”明确要求 DB 失败为可诊断 5xx、JSON-LD 失败不影响正文且不输出无效 schema、`llms.txt` 失败不影响页面/RSS/sitemap。 | 增加 repository failure、schema serialization failure、`llms.txt` failure 隔离测试；告警只记录 request/component/stable reason，不记录正文或凭据。 |
| 4 | Medium | Consistency | `GPT-5.5 M3` | 公开 route 与发现文件未强制复用 M2-03 public DTO。 | Partial | `getPublicBySlug()` 已通过 `contentForPublic()` 返回 `published/not_found/gone`，但当前 `listByType()` 是后台查询，代码中尚无 public listing DTO；不能把不存在的列表 DTO 当成已完成输入。 | 详情严格复用 M2-03 `getPublicBySlug()`/immutable published revision；M2-04 在相同 repository boundary 新增只返回 published revision 的有界 public list query。所有公开消费者不得读取 draft/source/admin-only 字段，并增加边界测试。 |
| 5 | Medium | Requirement | `GPT-5.5 M4` | sitemap、RSS、`llms.txt` 的内容集合和稳定 URL 契约不明确。 | Accept | SRS 6.9 要求 sitemap 保留全部公开核心页；FR-13 要求三个发现文件只加入 published 稳定内容且 `llms.txt` 排除后台/API/草稿/下线。 | 分别定义 sitemap=代码管理核心公开页+published 新闻/案例，RSS=published 新闻/案例，`llms.txt`=实验性稳定公开入口；全部使用绝对 canonical、确定排序、固定上限并排除私有路径。 |
| 6 | Low | Test | `GPT-5.5 L1` | 公开列表/详情的视口与可访问性验收不够具体。 | Accept | 产品 AGENTS 要求 320/390/768/1440；视觉规格还要求 1024、200% zoom、标题层级与无横向溢出。 | 增加 `/news`、`/news/[slug]`、`/cases`、`/cases/[slug]` 和空列表状态的 320/390/768/1024/1440 QA，检查单 H1、标题顺序、正文/日期可读、键盘链接、无溢出和 200% reflow。 |

## Needs Immediate Action

- 在 Sprint 中加入本地/真实云证据矩阵及 `CODE_READY_WITH_EXTERNAL_LEGACY` 状态上限。
- 固化抓取门禁、失败降级、public query boundary、发现文件集合/排序/上限和视觉 QA。
- 先写对应失败测试与契约测试，再开始实现。

## Can Be Deferred

- `M2-LEGACY-01`：隔离 ESA/FC/RDS/OSS/DirectMail 资源、probe 身份/token、真实缓存/刷新/链路/告警证据。
- `M2-LEGACY-02`：真实报价、流量假设与预算硬上限。

## Final Status

`ACCEPTED_AFTER_CHANGES`

六项确认行动已应用到 Sprint 文档，允许进入 M2-04 实施；真实 Production Live 保持 `BLOCKED`。
