# Sprint M1-01 独立工程与内容基础

> **状态：** draft，待文档 review-confirm；未开始实现。

## 1. Sprint 目标

本 Sprint 覆盖 [FR-01](../1-Requirement/Mainland-Website-FR/FR-01-independent-project-shell-and-content-foundation.md)，建立完全独立的赛诺全网 Next.js 工程、集中内容模型和自动验证基线。

核心目标：

- 工程可在 `products/sino-cn/` 独立安装、开发、测试、类型检查和生产构建。
- 品牌、服务、职业、微信和声明配置具有单一事实源。
- 用自动测试锁定与英文站隔离、禁止能力和静态构建边界。

## 2. 前置依赖

- `../1-Requirement/Saino-Quanwang-Mainland-Website-SRS.md`。
- `../1-Requirement/Mainland-Website-FR/Mainland-Website-FR-Index.md`。
- 实施前完成本 Sprint 与 FR-01 的文档 review-confirm。

协同说明：

- 新工程只继承仓库根 `AGENTS.md` 的约束；本 Sprint 创建产品级 `AGENTS.md` 和 README。
- 不读取、复制或导入 `products/sino-en/src`。

## 3. 纳入范围

本 Sprint 纳入以下 FR：

- `FR-01` 独立项目壳与集中内容基础。

涉及包和目录：

- `products/sino-cn/package.json`、Next.js/TypeScript/Tailwind/Vitest 配置。
- `src/app/` 基础布局、首页占位、404、全局错误与样式。
- `src/lib/site-content.ts`、`src/lib/site-config.ts`、`src/types/`。
- `tests/`、`README.md`、`AGENTS.md`、`.env.example`。

## 4. 暂不纳入范围

- 完整销售与职业页面、微信弹层和备用表单。
- 生产域名、企业微信二维码、真实 endpoint 和备案。
- 数据库、Auth、CMS、CRM、支付或共享包。

原因：

- 本 Sprint 只固定独立工程、内容契约和测试骨架，后续用户能力按依赖顺序实现。

## 5. 工作范围

### 5.1 工作包：独立工程与规则

目标：

- 建立最小、独立、静态优先的 Next.js 工程。

实现任务清单：

- [ ] 先建立会失败的工程契约测试，检查必要文件、独立包名和英文站隔离。
- [ ] 配置 Next.js、React、TypeScript、Tailwind CSS、Vitest、Testing Library 和 jsdom。
- [ ] 增加 `dev`、`test`、`lint`、`typecheck`、`build` 脚本；`lint` 首版使用 TypeScript 无输出检查。
- [ ] 创建产品级 README 与 AGENTS，记录静态站、直接 HTTP(S)、隐私、验证和英文站隔离边界。
- [ ] 提供 `.env.example`，只包含公开配置名和占位值，不提交真实联系信息或 endpoint。

测试要求：

- [ ] 测试包名、脚本、入口和配置文件存在。
- [ ] 扫描依赖与源码，不允许引用 `products/sino-en`。

### 5.2 工作包：布局与集中内容

目标：

- 建立后续页面共享但不含营销实现的最小布局和内容单一事实源。

实现任务清单：

- [ ] 创建 `lang="zh-CN"` 根布局、跳过链接、基础页头/页脚、首页占位、404 和错误降级。
- [ ] 定义 `ServiceDefinition`、`ProfessionDefinition`、`WechatContactConfig` 及稳定 ID。
- [ ] 集中维护品牌、三类服务、三个职业、合作流程、全局 CTA 和禁止声明。
- [ ] 对内容 ID、必填字段、禁止价格/支付/账号字段建立类型与契约检查。
- [ ] 建立全局设计 token 与 320px 无横向正文溢出的基础样式。

测试要求：

- [ ] 内容契约覆盖唯一 ID、必填内容和禁止字段。
- [ ] 根布局、404 和基础导航通过渲染测试。

## 6. 验收标准

- `products/sino-cn/` 可独立执行完整验证命令。
- 源码、依赖、构建配置和测试不引用英文站。
- 内容模型只有一份定义，且不存在价格、付款、账号或保证结果字段。
- 构建输出包含中文、可抓取的基础 HTML。
- 英文站文件和运行行为没有变化。

## 7. 验证要求

项目推断的验证命令：

- `pnpm test`：运行内容、组件和隔离测试。
- `pnpm lint`：执行 TypeScript 无输出检查。
- `pnpm build`：验证 Next.js 静态优先生产构建。

专项验证：

- 扫描构建和源码中的英文站路径引用。
- 在 320px 与桌面视口检查基础布局和跳过链接。

## 8. 实施顺序

1. 写工程与隔离失败测试。
2. 建立配置、脚本和产品规则文档。
3. 建立布局、类型和集中内容。
4. 补齐渲染、内容和构建测试。
5. 完成代码 review-confirm、全量验证和独立提交。

## 9. 风险控制

- 工具链过重：只安装页面、类型和交互测试所需依赖，不引入 CMS、数据库或 E2E 平台。
- 无意复用英文站：通过路径扫描、独立 lockfile/package 和 review 检查阻止。
- 内容配置过度抽象：只定义 SRS 已确认的稳定概念，不创建通用内容平台。

## 10. 交付结论

待实现、评审确认和验证完成后填写。

