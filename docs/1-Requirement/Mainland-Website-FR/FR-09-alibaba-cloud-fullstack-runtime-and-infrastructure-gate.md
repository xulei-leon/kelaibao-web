# FR-09 阿里云全栈运行时与基础设施门禁

- `FR-ID`: `FR-09`
- `标题`: 阿里云全栈运行时与基础设施门禁
- `所属阶段`: 阶段 5 - 阿里云全栈升级
- `开发顺序`: 9
- `优先级`: P0
- `前置依赖`: `FR-01`～`FR-08` 的现有 Preview 基线、`../../2-Design/Alibaba-Cloud-Fullstack-Architecture-Spec.md`
- `涉及包`: Next.js 构建/运行配置、FC 部署、ESA、VPC、RDS、OSS、环境配置、基础设施说明
- `是否属于原型阶段`: 否
- `来源类型`: 需求变更
- `原始 SRS 章节`: 4、6.10、7.2、7.3、8、9
- `相关 FR`: `FR-10`～`FR-14`

## 目标

先证明并建立 `ESA -> Function Compute 全栈 Next.js -> RDS MySQL + 私有 OSS` 的生产基础，消除从静态导出升级到服务端运行的关键兼容性、网络、安全和成本风险。

## 背景与问题

当前工程使用 `output: "export"`，无法承载管理员、Route Handler、数据库和动态 SSR。已选架构不是简单更换部署目标，必须先完成真实链路可行性门禁，再改造运行时。

## 影响范围

- `next.config.ts`、package scripts、服务端入口与部署制品。
- 阿里云华南 1（深圳）的 FC、VPC、RDS MySQL、私有 OSS。
- ESA 回源、TLS、WAF、缓存、限频和精确 URL 刷新。
- 环境变量、秘密、迁移、监控、成本与回退文档。

## 需求描述

1. M2-00 使用隔离测试资源验证 ESA→FC SSR、Route Handler、同域 Cookie 与正确代理头。
2. 验证 FC 通过 VPC 私网访问 RDS，不开放 RDS 公网入口。
3. 验证私有 OSS 的短期受限上传与 ESA 公开分发。
4. 验证 DirectMail 测试调用与 ESA 精确 URL 刷新。
5. 记录 FC Next.js 交付形态、Node 版本、冷启动/响应、资源上限和预估成本。
6. 默认在全部门禁通过且成本获接受后，移除静态导出并建立 FC 服务端构建、健康检查与版本回退；2026-07-29 显式覆盖允许为本地 `CODE_READY_WITH_EXTERNAL_LEGACY` 移除静态导出，但不代表 M2-00 或 FR-09 生产验收通过。
7. 建立数据库迁移与连接复用基线，不在请求中无界创建连接。
8. 将公开站、`/admin`、`/api` 统一回源 FC；ESA Pages 与 Vercel 不得进入生产链路。
9. 以小型官网总拥有成本为口径比较 RDS MySQL 候选规格，记录实例、存储、备份、连接和流量费用；仅在实际报价符合预算后锁定规格。

## 高层要求

- Function Compute 是唯一 Next.js 运行时。
- FC、RDS、OSS 默认同地域华南 1（深圳）。
- 第三方集成使用明确 HTTP(S) API，不使用通用 webservice。
- M2-00 任一 P0 验证失败时停止 M2-01，不静默替换架构。
- 用户于 2026-07-29 明确接受 `M2-LEGACY-01`、`M2-LEGACY-02` 作为遗留待确认项；该覆盖只允许继续本地可验证的 M2-01～M2-05 工程开发，不改变真实云门禁的 `BLOCKED` 状态或 Production 门禁。
- 秘密不得进入 Git、客户端 bundle、构建日志或文档。

## 输入

- 测试域名与 ESA/FC/RDS/OSS/DirectMail 隔离资源。
- 目标流量假设、资源规格候选和预算接受标准。
- 当前 Next.js 工程与 M1 Preview 路由。

## 输出

- 可审计的 M2-00 PASS/BLOCKED 门禁记录。
- 可运行的 FC 全栈 Next.js 基础、数据库连接和迁移骨架。
- ESA 回源/缓存/安全基线、部署与回退说明。
- 脱敏成本估算和生产规格建议。

## 失败与降级

- 门禁失败：保留当前 Preview，记录证据并请求架构决策。
- 新 FC 版本异常：回退上一可用 FC 版本；数据库迁移失败立即停止发布。
- ESA 刷新失败：公开缓存最多 60 秒并触发告警，不伪报即时生效。

## 不纳入范围

- 管理员业务 UI、内容编辑、正式发布和生产数据迁移。
- 采购审批、ICP备案代办或供应商 SLA 保证。
- ESA Pages、Vercel、公开 RDS 或跨站共享运行时。

## M2-00 可行性门禁

M2-00 必须逐项记录以下 8 项，不得合并或留空：

1. ESA 稳定回源 FC，并保留正确 Host、HTTPS 和客户端地址信息。
2. FC 运行 Next.js SSR、Route Handler 以及常规流式/非流式响应。
3. FC 通过 VPC 私网连接 RDS MySQL。
4. 私有 OSS 使用短期受限授权上传并经 ESA 受控分发。
5. 同域 Session Cookie 经 ESA 回源链路正确工作。
6. DirectMail HTTPS API 使用测试发信域完成受控调用。
7. 发布/下线相关 URL 可通过 ESA 精确刷新。
8. 开发、测试和预估生产总成本满足已记录的预算硬上限。

每项证据至少包括验证日期、脱敏资源标识与地域、执行命令或 HTTP 请求、预期结果、实际结果、日志/截图路径、敏感信息检查、`PASS/BLOCKED` 结论和后续动作。任一字段或必需外部输入缺失时自动判定 `BLOCKED`。

## 最小验证方式

- 文档阶段：`git diff --check`、链接和编号检查。
- 实施阶段：`pnpm test`、`pnpm lint`、`pnpm build`。
- M2-00 专项：上述 8 项可行性门禁。

## 验收要点

- 8 项 M2-00 门禁均有真实测试证据与明确结论。
- 静态导出已安全切换为 FC 可运行的 Next.js 服务端构建。
- RDS 无公网依赖，OSS 保持私有，ESA 是唯一公开入口。
- 部署、迁移、监控和回退路径可执行。
- 在显式覆盖下，本地构建与迁移契约通过只允许标记 `CODE_READY_WITH_EXTERNAL_LEGACY`；真实云门禁继续阻断 Production Live。

## 备注

代码实施必须在本 FR 与对应 Sprint 完成文档 review-confirm 后开始。
