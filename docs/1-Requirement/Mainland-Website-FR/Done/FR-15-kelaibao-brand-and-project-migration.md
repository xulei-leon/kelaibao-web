# FR-15 客来宝品牌与项目迁移

- `FR-ID`: `FR-15`
- `标题`: 客来宝品牌与项目迁移
- `所属阶段`: 阶段 3 - 客来宝统一官网改版
- `开发顺序`: 15
- `优先级`: P0
- `前置依赖`: [客来宝统一官网改版设计](../../../../../../docs/superpowers/specs/2026-07-31-kelaibao-unified-website-design.md)、M2-05 代码基线
- `涉及包`: `products/sino-cn/` → `products/kelaibao/`
- `是否属于原型阶段`: 否
- `来源类型`: 需求变更
- `原始 SRS 章节`: 迁移前 SRS 第 1～4、6.1、7、8、10、12、13 节；本 FR 与统一官网设计替代其中“赛诺全网独立官网”表述
- `相关 FR`: `FR-01`、`FR-07`、`FR-08`、`FR-09`～`FR-14`

## 目标

在不改变现有全栈运行能力、数据库结构和安全边界的前提下，将现有“赛诺全网中国大陆官网”工程迁移为唯一的客来宝中文官网工程，为后续页面改版提供稳定、可构建、可回退的品牌基础。

## 背景与问题

迁移前的工程、文档、测试、环境变量和发现文件均以“赛诺全网”和 `products/sino-cn/` 为身份。新需求取消双官网方案，要求客来宝成为唯一主品牌，原赛诺业务改为“客来宝媒体”子业务，并将工程目录改为 `products/kelaibao/`。

目录和品牌迁移涉及构建路径、部署脚本、默认配置、邮件、metadata、测试及现行文档。若与页面改版混在同一提交中，将难以判断失败来自路径迁移还是业务改版。

## 影响范围

- 工程目录、包名、产品级说明和构建命令。
- 站点品牌常量、默认 metadata、邮件别名、二维码替代文本和后台显示名称。
- `.env.example`、部署示例、standalone 打包、smoke 和发布校验。
- 现行 SRS、FR/Sprint 索引、视觉/架构规格和 Runbook。
- 根仓库与产品级 `AGENTS.md`，以及两份现行 Runbook：`Admin-Security-and-Media-Runbook.md`、`FC-Deployment-Runbook.md`。
- 源码路径契约、品牌契约、构建和 smoke 测试。

## 需求描述

1. 必须用 Git 追踪方式将 `products/sino-cn/` 整体迁移到 `products/kelaibao/`，不得复制后保留两套工程。
2. `package.json` 的包名必须改为 `kelaibao-website`，现有依赖和 Node 版本范围保持不变。
3. 当前生效的代码、配置、测试、README、`AGENTS.md`、SRS、FR/Sprint 索引、设计规格和 Runbook 必须使用客来宝当前品牌及新目录路径。
4. 公共品牌模型必须明确：
   - 主品牌：客来宝。
   - 产品名：K-Link。
   - 子业务：客来宝媒体。
5. DirectMail 默认发件别名、企业微信显示名、管理后台标题、健康页和错误页必须改为客来宝语义。
6. 已完成的 Sprint、评审和证据文档必须保留当时名称和结论，不进行破坏审计语义的批量替换。
7. 不得改变现有数据库表、迁移历史、管理员认证、CMS、OSS、DirectMail、询盘或 ESA 缓存刷新协议。
8. 不得增加第二个应用、二级域名路由、`site_key` 或跨应用内容接口。
9. `products/sino-en/` 和 `products/geo-agent/` 不得被修改或引用。
10. 活跃旧品牌文档文件名必须按固定映射迁移：`Saino-Quanwang-Mainland-Website-SRS.md` → `Kelaibao-Unified-Website-SRS.md`，`Saino-Quanwang-Visual-Design-Spec.md` → `Kelaibao-Unified-Website-Visual-Design-Spec.md`；已完成 Sprint、Review 和 Evidence 的历史文件名不得批量改写。

## 高层要求

- 生产架构继续固定为 `ESA → Function Compute 全栈 Next.js → RDS MySQL + 私有 OSS`。
- 所有第三方集成继续使用明确 HTTP(S) API，不增加通用 `webservice`。
- 目录迁移必须单独形成可验证的 Sprint，页面行为变化留给后续 Sprint。
- 历史证据中的旧绝对路径可以作为历史事实保留；当前运行说明不得继续指向旧目录。

## 输入

- 已确认的统一官网设计。
- 迁移前位于 `products/sino-cn/` 的完整工程基线。
- 当前 M2 测试、构建、standalone 和发布校验基线。

## 输出

- 唯一工程目录 `products/kelaibao/`。
- 包名 `kelaibao-website`。
- 客来宝品牌基础配置及更新后的当前文档。
- 目录迁移后仍可运行的全套工程验证。

## 失败与降级

- 任一迁移后验证失败时不得开始页面改版；应在同一 Sprint 内修复路径/品牌契约或回退整个目录迁移。
- 不允许同时保留 `products/sino-cn/` 与 `products/kelaibao/` 作为临时兼容路径。
- 真实云资源仍未完成时继续保持既有 `CODE_READY_WITH_EXTERNAL_LEGACY`/Production `BLOCKED` 状态，不得因改名提升上线状态。

## 不纳入范围

- 新首页、功能页、团队页、媒体页或关于页面的视觉实现。
- 数据库 schema、CMS 生命周期、管理员权限和询盘 DTO 改造。
- 正式域名、备案、云资源采购或生产发布。
- 批量改写历史评审和证据文档。

## 最小验证方式

- 在迁移后的 `products/kelaibao/` 运行 `pnpm test && pnpm lint && pnpm build`。
- 运行 `pnpm smoke:standalone` 和 `pnpm validate:release` 的本地可执行部分。
- 运行 `git diff --check`。
- 扫描当前源码、配置、脚本、部署示例、README、AGENTS、active FR/Sprint/索引/设计/Runbook，确认无运行时 `products/sino-cn` 路径和公开“赛诺全网”品牌；已完成 Sprint、历史 Review/Evidence 单独列为允许的历史匹配。
- 确认 `products/sino-en/` 工作树与构建入口未变化，并确认 `products/geo-agent/` submodule 指针、工作树和引用未变化。
- 对比迁移前后 `migrations/`、数据库 schema 相邻实现与 migration release step，只允许路径重命名，不允许 SQL 或协议语义变化。

## 验收要点

- 仓库只存在一个中文官网工程目录 `products/kelaibao/`。
- 新目录能够独立安装、测试、类型检查、构建和打包。
- 公开运行配置只定义客来宝、K-Link 和客来宝媒体三种已批准名称。
- M2 已有认证、CMS、媒体、询盘和发现测试继续通过。
- 历史评审/证据仍可追溯，当前文档链接无断链。
- `products/sino-en/` 与 `products/geo-agent/` 均无工作树、指针或构建入口变化；数据库 migration 与 schema 协议无语义变化。

## 备注

本 FR 由 `sprint-m3-01` 独立实施。文档 review-confirm 阶段的 FR/Sprint 文件位于 `products/sino-cn/docs/`；目录迁移后，它们已随工程进入 `products/kelaibao/docs/`，当前及后续工作统一使用新路径。
