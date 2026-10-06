# Sprint M3-01 客来宝工程与品牌基础迁移

> **状态：** `COMPLETE / 文档与代码 review-confirm、实现及本地验证已完成；Production 仍 BLOCKED`
>
> **For agentic workers:** 本次实施使用用户明确指定的 `sprint-workflow`，严格执行文档 review-confirm、TDD、代码 review-confirm 和最终验证门禁。根据仓库规则，不自动启用未由用户明确指定的 superpower skill。

**Goal:** 将现有中文官网整体迁移到 `products/kelaibao/`，建立客来宝品牌基础，同时保持 M2 全栈能力不变。

**Architecture:** 使用一次 Git 目录迁移和集中品牌配置完成改名，不建立兼容目录、第二应用或数据库迁移。先用契约测试固定包名、路径和品牌边界，再迁移工程及现行文档。

**Tech Stack:** Next.js 15、React 19、TypeScript 5.9、Tailwind CSS 4、Vitest 3、Node.js 20～24、pnpm 11。

## Global Constraints

- 生产架构保持 `ESA → Function Compute 全栈 Next.js → RDS MySQL + 私有 OSS`。
- 不修改 `products/sino-en/`、`products/geo-agent/`、数据库 schema 或 M2 协议。
- 只保留 `products/kelaibao/`，不得保留 `products/sino-cn/` 兼容副本。
- 当前运行代码和现行文档使用客来宝；历史评审/证据保留历史名称。
- 所有第三方集成继续使用明确 HTTP(S) API，不增加通用 `webservice`。

---

## 1. Sprint 目标

实现 [FR-15](../../1-Requirement/Mainland-Website-FR/Done/FR-15-kelaibao-brand-and-project-migration.md)，交付可独立构建的客来宝工程目录和集中品牌基础。

核心目标：

- 路径迁移与页面改版解耦。
- 目录迁移后 M2 认证、CMS、询盘、媒体、发现和发布测试不退化。
- 后续 M3 Sprint 统一以 `products/kelaibao/` 为工作目录。

## 2. 前置依赖

- [客来宝统一官网改版设计](../../../../../docs/superpowers/specs/2026-07-31-kelaibao-unified-website-design.md)已批准。
- M2-05 当前代码基线及其测试、类型检查和构建可执行。
- FR-15 与本 Sprint 完成文档 review-confirm。

当前路径与验证来源：

```text
FR_DIR=products/kelaibao/docs/1-Requirement/Mainland-Website-FR
FR_BACKLOG_DIR=products/kelaibao/docs/1-Requirement/Mainland-Website-FR/backlog
FR_DONE_DIR=products/kelaibao/docs/1-Requirement/Mainland-Website-FR/Done
DESIGN_DIR=products/kelaibao/docs/2-Design
SPRINT_DIR=products/kelaibao/docs/3-Plan
SPRINT_DONE_DIR=products/kelaibao/docs/3-Plan/Done
REVIEW_DIR=products/kelaibao/docs/4-Reviews
REVIEW_DONE_DIR=products/kelaibao/docs/4-Reviews/Done
WORKFLOW_STATE_PATH=<未设置；按 sprint-workflow 不创建独立状态文件>
VERIFICATION_COMMANDS=pnpm test && pnpm lint && pnpm build
```

文档 review-confirm 使用迁移前的 `products/sino-cn/docs/` 路径；目录与评审产物现已随完整工程进入以上新路径。验证命令来自产品级 `AGENTS.md`；standalone 和发布契约另运行 `pnpm smoke:standalone`、`pnpm validate:release`。

评审流程覆盖：用户于 2026-07-31 明确要求文档和代码评审只运行第一个 reviewer `gpt-5.5`（`high`），不运行第二个 review 模型；`review-confirm` 仍需逐条裁决全部评论并形成确认文档。

## 3. 纳入范围

- `FR-15` 客来宝品牌与项目迁移。
- 整体迁移 `products/sino-cn/` → `products/kelaibao/`。
- 当前代码、配置、测试、现行文档、脚本和部署示例的路径/品牌更新。

关键文件：

- `products/kelaibao/package.json`、`.env.example`、`AGENTS.md`、`README.md`。
- 根 `AGENTS.md`。
- `src/lib/site-content.ts`、`src/lib/site-config.ts`、`src/lib/route-metadata.ts`。
- `src/app/layout.tsx`、`src/app/opengraph-image.tsx`、`src/server/discovery/*`。
- `src/server/inquiry/directmail.ts`、管理/健康/错误页及公共内容组件。
- `scripts/package-standalone.mjs`、`scripts/smoke-standalone.mjs`、`scripts/validate-release.mjs`。
- `tests/project-contract.test.ts`、`tests/site-content.test.ts`、`tests/routes-and-metadata.test.ts` 及 M2 回归测试。
- `docs/1-Requirement/Kelaibao-Unified-Website-SRS.md`、`docs/2-Design/Kelaibao-Unified-Website-Visual-Design-Spec.md`。
- `docs/2-Design/Admin-Security-and-Media-Runbook.md`、`docs/2-Design/FC-Deployment-Runbook.md`。
- `docs/5-Evidence/m3-01/tdd-red.md`。

## 4. 暂不纳入范围

- 首页、功能、团队、关于和媒体页面改版。
- 小程序二维码体验流程。
- 政策、CMS 已发布内容和宣传口径迁移。
- 正式云发布和外部门禁关闭。

原因：

- 本 Sprint 只证明目录与品牌基础迁移不会破坏现有全栈能力。

## 5. 工作范围

### 5.1 工作包：先固定迁移契约

实现任务清单：

- [x] 修改 `tests/project-contract.test.ts`，先断言目标包名为 `kelaibao-website`、当前工程不得引用旧运行路径、不得依赖英文站。
- [x] 修改 `tests/site-content.test.ts` 和 `tests/routes-and-metadata.test.ts`，先断言品牌模型包含客来宝、K-Link、客来宝媒体且公开默认品牌不再是赛诺。
- [x] 运行上述测试，确认它们在旧工程上因旧包名/旧品牌失败。
- [x] 将准确命令、预期失败断言和脱敏失败摘要记录到 `docs/5-Evidence/m3-01/tdd-red.md`，作为单提交之外可追溯的 red-phase 证据。

测试要求：

- [x] 失败原因必须明确来自旧路径或旧品牌，而不是测试环境错误。

### 5.2 工作包：目录、包名与脚本迁移

实现任务清单：

- [x] 使用 Git 跟踪方式迁移完整目录到 `products/kelaibao/`。
- [x] 修改包名、standalone 错误提示、部署示例、发布校验和当前绝对/相对路径。
- [x] 不增加 junction、复制目录、兼容脚本或第二个 workspace 包。
- [x] 从新目录运行目标契约测试直至通过。

测试要求：

- [x] 仓库文件扫描证明不存在第二套中文站工程。
- [x] standalone 打包产物仍从新目录生成和启动。

### 5.3 工作包：品牌基础与现行文档

实现任务清单：

- [x] 集中更新 `site-content.ts`、`site-config.ts`、route metadata、Open Graph、发现文件、邮件默认文案和后台/健康显示名称。
- [x] 更新根与产品 `AGENTS.md`、README、当前 SRS、FR/Sprint 索引、视觉/架构规格及两份 Runbook 的现行名称与路径；`Admin-Security-and-Media-Runbook.md` 审计无旧品牌、旧路径或断链，因此不制造无意义 diff。
- [x] 按固定映射重命名活跃文档：`Saino-Quanwang-Mainland-Website-SRS.md` → `Kelaibao-Unified-Website-SRS.md`，`Saino-Quanwang-Visual-Design-Spec.md` → `Kelaibao-Unified-Website-Visual-Design-Spec.md`，并更新全部 active 链接。
- [x] 历史 Sprint、Review、Evidence 保留历史名称；在当前索引中记录迁移边界。
- [x] 运行品牌和文档链接检查；扫描 roots 固定为 `src/`、`tests/`、`scripts/`、`deploy/`、运行配置、README、AGENTS、active FR/Sprint/索引/设计/Runbook，allowlist 仅包含已完成 Sprint、历史 Review/Evidence 和明确记录的历史事实。

测试要求：

- [x] 公开源码和当前配置不含“赛诺全网”。
- [x] 历史文档未被批量重写，现行链接可解析。

### 5.4 工作包：全量回归

实现任务清单：

- [x] 在 `products/kelaibao/` 运行完整测试、类型检查、构建、standalone smoke 和发布校验。
- [x] 确认 Production 外部遗留状态没有被改名操作误判为 PASS。
- [x] 对比迁移前后 `migrations/`、`src/server/db/`、migration runner 与 release step，只允许路径重命名，不允许 SQL、schema 或发布协议语义变化。
- [x] 证明 `products/sino-en/` 工作树/构建入口不变，并证明 `products/geo-agent/` submodule 指针、工作树和引用不变。
- [x] 完成代码 review-confirm 后应用接受项并重新验证。

## 6. 验收标准

- 仓库只存在 `products/kelaibao/` 中文官网工程。
- 包名、当前文档、构建脚本和运行配置统一使用新路径。
- 客来宝品牌基础配置可被后续页面复用。
- M2 测试与安全边界无回归。
- `products/sino-en/` 工作树无变化。
- `products/geo-agent/` submodule 指针、工作树和构建入口引用无变化。
- 数据库 migrations、schema 相邻实现和 migration release step 无语义变化。

## 7. 验证要求

项目声明的验证命令：

- `pnpm test`
- `pnpm lint`
- `pnpm build`

专项验证：

- `pnpm smoke:standalone`
- `pnpm validate:release`
- `git diff --check`
- 旧路径、公开旧品牌、双应用和 `site_key` 静态扫描，并单独列出 allowlist 中的历史匹配。
- `git submodule status -- products/geo-agent` 与 `git diff --submodule=short -- products/geo-agent products/sino-en`。
- `migrations/`、`src/server/db/`、`scripts/migrate.mjs` 和 Runbook release-step 的内容级差异检查。

## 8. 实施顺序

1. 写失败的路径/品牌契约测试。
2. 整体迁移目录与包名。
3. 更新品牌基础、脚本和现行文档。
4. 运行全量回归并完成代码 review-confirm。

## 9. 风险控制

- 目录迁移导致脚本路径遗漏：先用契约测试和全仓当前路径扫描锁定。
- 品牌替换破坏历史证据：只修改当前运行/治理文档，历史目录保持原文。
- 大 diff 难以审查：本 Sprint 不混入页面视觉变化或数据库改动。
- 回退：整个 Sprint 使用单一迁移提交；失败时回退该提交，不保留半迁移目录。

## 10. 交付结论

`COMPLETE / CODE_READY_WITH_EXTERNAL_LEGACY`。

- 文档 review 与 review-confirm：完成，仅运行用户指定的第一 reviewer `gpt-5.5`（`high`）。
- TDD red、工程/品牌迁移、历史 allowlist 和受保护产品隔离：完成。
- 代码 review 与 code-review-confirm：完成；无需要修改代码的可执行发现。
- 最终本地验证：`pnpm test`（40 files / 179 tests）、`pnpm lint`、`pnpm build`、`pnpm smoke:standalone`、`pnpm validate:release`、`git diff --check` 全部通过。
- 证据：`docs/5-Evidence/m3-01/tdd-red.md`、`docs/5-Evidence/m3-01/migration-verification.md`。
- 发布状态：Local Code Ready；真实云、备案、正式二维码、专业审查、恢复、监控与成本门禁未关闭，Production 继续为 `BLOCKED`。
