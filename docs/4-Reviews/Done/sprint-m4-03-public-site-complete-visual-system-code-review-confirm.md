# Sprint M4-03 公开站完整视觉系统 Code Review Confirm

**Reviewed Inputs**

- `sprint-m4-03-public-site-complete-visual-system-code-review-by-gpt-5.5.md`
- `sprint-m4-03-public-site-complete-visual-system-code-review-by-gpt-5.3-codex-spark.md`
- `../1-Requirement/Mainland-Website-FR/FR-21-public-site-complete-visual-system-and-replaceable-assets.md`
- `../3-Plan/sprint-m4-03-public-site-complete-visual-system.md`
- 当前 M4-03 源码、测试、WebP 元数据与浏览器证据

**Review Date**

- 2026-08-02

## Overall Conclusion

两份评审均正确指出最终门禁尚未完成；GPT-5.5 还发现 Home Hero 新视觉槽改变了既有 aside 的 DOM/移动阅读顺序。两位 reviewer 对固定资产注册表的自动 fail-closed 覆盖不足判断方向正确，但把文件系统读取放进前端共享运行时 validator 会破坏浏览器边界，正确修复应落在固定 metadata fixture、WebP 文件头检查与范围校验测试。

Spark 关于 `path.join` 会丢弃前缀的 High 判断不成立，Node `path.join` 与 `path.resolve` 语义不同；要求给其他公开页增加素材槽也与 FR-21 固定 17 槽映射冲突。接受项完成并通过最终验证前，代码暂不关闭。

## Decision Table

| No. | Severity | Type | Review Source | Original Comment Summary | Decision | Evidence | Follow-up Plan / Rejection Reason |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | Medium | Requirement | GPT-5.5 C1 | Home Hero 渲染为 copy → visual → aside，改变既有 aside 的 DOM 和移动阅读顺序 | Accept | FR-21 §1.3–1.4 冻结 DOM/移动阅读顺序；`PageHero` 基线为 copy → aside，当前移动截图也显示图片先于问题卡 | 将 JSX 改为 copy → aside → visual；用显式 grid placement 保持桌面 copy / visual / aside 构图，并增加相对顺序测试 |
| 2 | Medium | Test | GPT-5.5 C2 | 固定注册表没有自动锁定获准 metadata 与真实文件尺寸 | Partial | 当前测试已锁定 17 个 ID、键集合、本地文件存在和状态，但只检查 `alt` 长度，未逐项锁定 metadata，也未读取 WebP 几何尺寸；运行时组件已用同一 width/height 构造 CSS aspect ratio | 在测试层加入完整 17 项 fixture、WebP 文件头尺寸校验、focalPoint 0–100 范围负向用例和渲染 aspect-ratio 断言；不在可进入浏览器 bundle 的 validator 中引入 `fs` |
| 3 | Medium | Test | GPT-5.5 C3 | evidence 中最终 lint/build/smoke/release/diff 门禁仍待完成 | Accept | `verification.md` 明确标为待最终门禁；AGENTS 要求至少 test/lint/build，Sprint WP6 还要求 smoke、release 与 diff check | review-confirm 修复后运行全部命令并把真实结果写回 verification；任何失败均不关闭 Sprint |
| 4 | Low | Consistency | GPT-5.5 C4 | FR/Sprint 索引仍显示 Planned/等待文档确认 | Accept | 主 FR/Sprint 已为实施中，索引文本仍是旧状态 | 完成所有门禁后统一更新主文档和索引为 Local Code Ready / Production BLOCKED，并归档到 Done |
| 5 | Info | Test | Spark C1 | `join(process.cwd(), "public", "/visual/...")` 会在 POSIX 丢弃前缀并误指向根目录 | Reject | Node `path.posix.join('/repo','public','/visual/x')` 结果为 `/repo/public/visual/x`；会重置到绝对段的是 `path.resolve`，当前测试已在 Windows 通过 | 不采用无效的 `slice(1)` 修复；保留现有 `join`，最终测试覆盖实际文件存在性 |
| 6 | Medium | Requirement | Spark C2 | validator 未在运行时读取图片尺寸，也未覆盖重复、缺失和 aspect ratio | Partial | 重复/缺失已由 `VISUAL_ASSET_IDS` Set 与 `Object.keys(VISUAL_ASSETS)` 测试覆盖；组件 aspect ratio 直接来自同一声明尺寸。真实文件几何与完整获准 metadata 仍缺自动锁定 | 与第 2 项使用测试层 WebP 几何解析和精确 fixture 修复；同时把 focalPoint 百分比限制在 0–100；拒绝把 Node 文件读取带进前端注册表模块 |
| 7 | Info | Requirement | Spark C3 | `/about`、`/contact`、政策和 CMS 页面也应增加素材槽/接线断言 | Reject | FR-21 §7 固定 17 槽仅分配给首页、功能、团队和媒体；其他页面的范围是共享字体、表面、内容宽度和回归验证，不能新增未登记槽位 | 不扩大素材清单；这些页面继续由共享双路由 CSS 与 M4-02 全页面 fixture 验证 |
| 8 | Low | Test | Spark C4 | 最终自动门禁尚未写入 evidence | Accept | 与 GPT-5.5 C3 独立达到同一结论，且 Sprint/AGENTS 明确要求 | 按第 3 项执行全量最终门禁并记录结果 |

## Needs Immediate Action

- 恢复 Home Hero 既有 aside DOM/移动阅读顺序，并保持桌面构图。
- 锁定 17 项完整 metadata、真实 WebP 尺寸、aspect ratio 与 focalPoint 范围。
- 执行全量测试、lint、build、standalone smoke、release validation 与 diff check。
- 在全部通过后更新状态索引、主文档与归档路径。

## Can Be Deferred

- 生成素材的 Production 授权继续保持 `BLOCKED`，不作为本次 Local Code Ready 的假设性通过项。

## Final Status

当前为 `Changes Required`。完成 Accept/Partial 项并通过最终验证后，方可接受为 `Local Code Ready / Production BLOCKED`。
