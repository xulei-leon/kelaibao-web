# Sprint M5-01 Code Review Confirm

**Reviewed Inputs**

- `docs/3-Plan/Done/sprint-m5-01.md`
- `docs/4-Reviews/Done/sprint-m5-01-code-review-by-gpt-5.5.md`
- `docs/4-Reviews/Done/sprint-m5-01-code-review-by-gpt-5.3-codex-spark.md`
- M5-01 当前 working-tree diff、相关 migrations、repository、构建脚本与测试

**Review Date**

- 2026-08-09

## Overall Conclusion

两份评审对结构化数据、代表图 revision、响应式图片 fail-closed、缓存与 Production blocker 的总体判断一致，未发现需要推翻当前设计的缺陷。GPT-5.5 指出的两个集成缺口均有直接代码证据：旧 SQLite 文件不会因更新 monolithic `CREATE TABLE IF NOT EXISTS` 自动获得新增列；standalone smoke 也尚未请求新生成图片和 OG 图。

当前实现不能按原样通过最终门禁。先落实 SQLite 增量升级和 standalone 新资产验证，再重新运行完整验证；真实 ESA/FC/OSS/RDS、大陆网络和微信浏览器继续保持 Production `BLOCKED`。

## Decision Table

| No. | Severity | Type | Review Source | Original Comment Summary | Decision | Evidence | Follow-up Plan / Rejection Reason |
|---|---|---|---|---|---|---|---|
| 1 | High | Correctness | `GPT-5.5 #1` | 既有 SQLite 数据库不会补齐 M5-01 新列，升级后 repository 查询会报 `no such column`。 | Accept | `scripts/sqlite-maintenance.mjs` 只执行 `001_local_test_schema.sql` 并要求版本为 1；`CREATE TABLE IF NOT EXISTS` 不会修改旧表，而当前 SQLite media/content repository 已查询新增列。 | 新增显式 SQLite v2 增量 migration，维护脚本按版本顺序应用并记录 schema version；增加从 pre-M5 schema 起步的升级测试，并执行新 repository 查询验证。 |
| 2 | Medium | Test | `GPT-5.5 #2` | standalone smoke 没有验证构建生成的 WebP 与使用本地中文字体的 OG 图。 | Accept | `scripts/smoke-standalone.mjs` 当前只请求 health、admin、home 与 inquiry；`public/visual/generated` 依赖构建后复制，`/opengraph-image` 依赖构建期字体生成，现有 smoke 无法发现制品缺失。 | 从 manifest 解析一个 generated WebP 路径并在 standalone 请求，检查 MIME、非空响应与 immutable 缓存；请求 `/opengraph-image` 并检查 PNG MIME、尺寸/非空响应，同时确保响应不触发运行时字体异常。 |
| 3 | Info | Test | `GPT-5.3 Codex Spark #1` | 未发现可落地缺陷，建议继续完成 standalone、视觉与搜索侧 Evidence。 | Partial | 本地 smoke、四视口和首响应 HTML 属于本 Sprint 可执行验证；真实搜索平台、ESA/FC/OSS/RDS 和微信环境缺少生产资源，Sprint 明确要求保持 `DEFERRED/BLOCKED`，不能伪造 PASS。 | 本轮完成 standalone 与本地四视口/首响应验证并留存 Evidence；生产搜索、ESA、OSS、大陆网络与微信 Evidence 明确记为 BLOCKED，不扩大为虚假本地结论。 |

## Needs Immediate Action

- 实施 SQLite v2 增量升级，并验证旧库升级与新 repository 兼容。
- 扩展 standalone smoke 覆盖 generated WebP、immutable 缓存和 OG PNG。

## Can Be Deferred

- 真实 ESA edge TTL/Age、私有 OSS 链路、正式域名、搜索验证、大陆移动网络和微信内置浏览器 Evidence；缺少生产资源时继续保持 `BLOCKED`。

## Final Status

代码评审确认完成，两个 Accept 项均已落实：

- 新增 `migrations/sqlite/002_seo_images.sql`，维护脚本按 schema version 1 → 2 顺序执行增量升级，并以字段检测保持幂等；pre-M5 v1 升级与新 repository 查询测试通过。
- standalone smoke 已覆盖 manifest-derived WebP、MIME、RIFF/WEBP 签名、immutable 缓存，以及 `/opengraph-image` PNG MIME、签名和非空响应，并确认不存在 `/_next/image`。

重新验证结果：`pnpm test` 66 个测试文件、369 个测试全部通过；`pnpm lint`、`pnpm build`、`pnpm smoke:standalone` 全部通过；四视口和 SSR 证据见 `docs/5-Evidence/m5-01/README.md`。

最终确认状态：`ACCEPTED FOR LOCAL CODE READY / Production BLOCKED`。真实 ESA/FC/OSS/RDS、大陆网络、正式域名与微信浏览器仍按 Sprint 边界保留为外部门禁。
