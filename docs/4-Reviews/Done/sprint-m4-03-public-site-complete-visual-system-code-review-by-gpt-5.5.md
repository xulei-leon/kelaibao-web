# Sprint M4-03 公开站完整视觉系统代码评审（GPT-5.5）

- Review date: 2026-08-02
- Scope: `D:\code\tokengate\products\kelaibao` 当前未提交 M4-03 change set，包括 `git diff`、untracked source/tests/docs/evidence、17 个本地 WebP 素材和已保存截图证据。
- Baseline note: 未读取或修改 `D:\code\tokengate-m4-03-before` detached before-baseline worktree。
- Verification note: 为遵守“只写指定报告文件”的约束，本次评审未重新运行会写入 `.next`、`tsconfig.tsbuildinfo` 或其他构建产物的 `pnpm lint` / `pnpm build` / browser QA；判断依据为源码、测试文件、资产元数据和已保存 evidence。评审期间只读取 WebP 尺寸，未改动被评审文件。

## Findings

| Severity | Type | Location | Issue | Evidence | Recommendation |
| --- | --- | --- | --- | --- | --- |
| Medium | Requirement | `src/components/ui/page-hero.tsx:35` and `src/app/page.tsx:93` | Home Hero 的既有 aside 内容被插入到新增视觉素材之后，改变了冻结内容的 DOM / 移动阅读顺序。FR-21 与 Sprint 要求保持现有 copy/actions/aside 顺序、DOM 阅读顺序和移动端阅读顺序不变。 | `HomePage` 同时传入 `visual` 与 `aside`；`PageHero` 当前渲染顺序为 copy -> visual -> aside。保存的 `docs/5-Evidence/m4-03/screenshots/after/home-390x844.png` 也显示“熟人筛完后，下一个客户，去哪找？”卡片在 Hero 图片之后。现有 fixture 只检查 `hero.aside: true`，未断言 aside 相对顺序。 | 保持 DOM 中既有业务内容顺序，例如 copy -> aside -> visual，并用 CSS grid/order 在桌面实现目标视觉构图；补充测试断言 Home Hero 中 CTA、aside 标题和视觉槽的相对顺序，移动端也应覆盖。 |
| Medium | Test | `src/content/visual-assets.ts:191` and `tests/m4-03-visual-system.test.tsx:41` | 视觉资产 fail-closed 覆盖不完整，无法防止部分 FR-21 明确禁止的 registry 漂移。 | `validateVisualAssetDefinition` 只校验路径格式、非空 alt、正整数尺寸、状态和 focalPoint 格式；测试只检查 17 个 ID、路径非远程、alt 长度、状态为 provisional 和文件存在。FR-21 §7 要求拒绝声明尺寸与实际文件尺寸不一致、未登记/未获准 alt、固定槽位映射漂移、容器宽高比不一致等情况。本次人工读取 WebP 尺寸均匹配，但该约束没有自动 fail-closed。 | 在测试层建立 FR-21 固定 registry fixture，逐项断言 ID、src、alt、width、height、status、focalPoint 完全匹配；读取本地 WebP metadata 校验实际尺寸；增加负向用例覆盖尺寸不匹配、未获准 alt、重复/缺失槽位和越界 focalPoint。 |
| Medium | Test | `docs/5-Evidence/m4-03/verification.md:27` | 当前 evidence 还没有满足产品级和 Sprint 退出门禁，不能标记为 Local Code Ready。 | `pnpm test` 记录为 PASS，但 `pnpm lint`、`pnpm build`、`pnpm smoke:standalone`、`pnpm validate:release`、`git diff --check` 均仍是“待最终门禁更新”。`products/kelaibao/AGENTS.md` 要求改动后至少运行 `pnpm test && pnpm lint && pnpm build`；Sprint M4-03 WP6 还要求 smoke、发布校验和 diff check。 | 完成代码评审修复后运行并记录 `pnpm test && pnpm lint && pnpm build`，再按 Sprint 要求补跑 smoke、release validation、`git diff --check` 和必要浏览器证据；失败或跳过项必须在 evidence 中说明原因。 |
| Low | Consistency | `docs/1-Requirement/Mainland-Website-FR/Mainland-Website-FR-Index.md:6` and `docs/3-Plan/Mainland-Website-Sprint-Index.md:6` | FR/Sprint 索引状态与当前 M4-03 文档和代码实施状态不一致。 | FR-21 主文档标记为 `Document Review Confirmed / 实施中`，Sprint 主文档也写明“文档 review-confirm 已完成；进入冻结基线与代码实施”；但两个索引仍写 `FR-21 规划中`、`M4-03 规划中` 和 `等待文档 review-confirm`，FR/Sprint 表格中也仍为 `Planned / 等待文档 review-confirm`。 | 将索引状态更新为与当前实施阶段一致，例如 `Document Review Confirmed / Implementation in progress`；最终关闭 Sprint 时再统一更新为 Local Code Ready / Production BLOCKED。 |

## Checks Performed

- Reviewed current `git diff -- products/kelaibao`.
- Reviewed untracked M4-03 FR/Sprint review docs, source, tests, evidence files and local WebP asset inventory.
- Used the codebase knowledge graph for code-oriented discovery, then inspected exact files and line references.
- Checked actual WebP dimensions with Pillow: all 17 files match the registry dimensions.
- Visually spot-checked representative local assets (`home-hero`, `team-hero`, `media-hero`) for prohibited real people, customer/media logos, metrics, product results or readable generated copy; no such prohibited content was observed in those assets.

## Overall Assessment

The implementation is directionally aligned with FR-21: it adds a local visual asset registry, `VisualAssetSlot`, public CSS overlay, page wiring for the 17 required slots, saved evidence, and tests for basic registry/component behavior. I found no Critical or High issues.

The current change set should not be closed as Local Code Ready yet. The main blockers are the Home Hero DOM/order regression risk, incomplete fail-closed validation coverage for the fixed visual registry, and incomplete final verification evidence.
