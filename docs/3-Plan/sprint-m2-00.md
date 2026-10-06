# Sprint M2-00 架构与基础设施可行性门禁

> **状态：** `CONDITIONALLY_ACCEPTED`；文档与代码 review-confirm 已完成。8 项真实链路仍为 `BLOCKED`，但用户于 2026-07-29 明确接受将外部资源与成本输入登记为遗留待确认项，并授权继续 M2-01～M2-05 开发。

## 1. Sprint 目标

覆盖 [FR-09](../1-Requirement/Mainland-Website-FR/FR-09-alibaba-cloud-fullstack-runtime-and-infrastructure-gate.md) 的可行性部分，在投入全栈改造前验证阿里云链路、兼容性、安全和成本。

核心目标：

- 对 ESA→FC SSR、VPC→RDS、私有 OSS、Session Cookie、DirectMail、ESA purge 和成本形成 PASS/BLOCKED 证据。
- 固定 FC 的 Next.js 交付形态、Node 版本、资源上限和回退方式。

## 2. 前置依赖

- SRS v0.2、FR-09、本 Sprint 与[架构规格](../2-Design/Alibaba-Cloud-Fullstack-Architecture-Spec.md)完成文档 review-confirm。
- 可使用隔离测试域名和阿里云测试资源。
- 成本门禁输入必须包含版本化的流量假设、成本口径、报价时间/来源、预算硬上限和脱敏证据路径；实现者不得自行虚构预算值。

协同说明：

- 任一 P0 项失败即停止 M2；不得静默切换 ESA Pages、Vercel 或公开数据库。
- 本流程不等待人工负责人：8 项证据和成本输入齐全且满足阈值时自动 `PASS`，任一输入缺失、验证失败或成本超过阈值时自动 `BLOCKED`。
- 显式流程覆盖：用户已接受下表遗留项不阻断后续代码开发；该覆盖不把门禁改写为 `PASS`，也不允许在 M2-05 标记 Production Live。

遗留待确认项：

| ID | 遗留项 | 当前状态 | 继续开发规则 | 最迟收口 |
| --- | --- | --- | --- | --- |
| `M2-LEGACY-01` | 缺少隔离 ESA/FC/RDS/OSS/DirectMail 资源、probe 身份/token | `BLOCKED` | M2-01～M2-05 只完成可本地验证的代码、配置契约和自动化；真实云 smoke/发布/回退保持未验证 | M2-05 Production 判定前 |
| `M2-LEGACY-02` | 缺少真实报价、流量假设和预算硬上限 | `BLOCKED` | 不虚构价格或预算；成本相关配置保持显式未配置 | M2-05 Production 判定前 |

## 3. 纳入范围

本 Sprint 纳入以下 FR：

- `FR-09` 阿里云全栈运行时与基础设施门禁（可行性部分）。

涉及包和目录：

- `spikes/m2-00/` 下可复现的隔离 spike、测试配置和 FC 打包实验。
- `docs/5-Evidence/m2-00/` 下的 ESA/RDS/OSS/DirectMail 脱敏验证记录。
- `docs/2-Design/Alibaba-Cloud-Fullstack-Architecture-Spec.md` 的验证结论回填。

提交边界：

- 只提交最小复现代码、脱敏配置样例、执行脚本和证据索引。
- 不提交真实凭据、原始供应商响应、包含 PII 的日志或不可复核的本地临时文件。

## 4. 暂不纳入范围

- 正式业务代码、管理员 UI、CMS、生产域名切换和真实内容迁移。

原因：

- 本 Sprint 只回答“选定架构是否可安全、可负担地运行”。

## 5. 工作范围

### 5.1 工作包：ESA 与 FC Next.js

目标：

- 证明全栈 Next.js SSR、Route Handler 和同域 Cookie 可经 ESA 正常运行。

实现任务清单：

- [x] 建立最小 SSR/Route Handler spike 和健康检查。
- [ ] 验证 Host、HTTPS、客户端地址代理头、Cookie、缓存与 WAF/限频。
- [ ] 确定 FC 交付形态、Node 版本、冷启动和版本回退；本地 `standalone` 候选构建已通过，但未部署到 FC，不能标记完成。

测试要求：

- [ ] SSR 首响应、API、Cookie 和 ESA 回源证据齐全。

### 5.2 工作包：数据、媒体和外部 API

目标：

- 证明私网数据库、私有媒体与必要 HTTP(S) API 可用。

实现任务清单：

- [ ] 验证 FC 经 VPC 连接 RDS MySQL 和连接复用。
- [ ] 验证短期受限上传私有 OSS，并通过 ESA 分发。
- [ ] 验证 Bucket 公共读关闭、OSS 直连拒绝、ESA 受控回源、授权过期和对象键越权失败。
- [ ] 验证 DirectMail 测试发信和 ESA 精确 URL 刷新。

测试要求：

- [ ] RDS 无公网依赖；OSS 非公共读；浏览器、构建产物和测试日志不含长期 AccessKey、凭据或 PII。

### 5.3 工作包：成本与门禁结论

目标：

- 得到个人创业阶段可接受的最小资源方案。

实现任务清单：

- [ ] 记录开发/测试/生产候选规格、流量假设、固定与弹性成本。
- [ ] 使用实际报价比较 RDS MySQL 实例、存储、备份、连接与流量成本，确认其满足成本目标。
- [x] 记录各验证项 PASS/BLOCKED、证据位置、风险和后续动作。
- [ ] 按版本化预算硬上限自动判定成本 `PASS/BLOCKED`；预算或报价输入缺失时必须 `BLOCKED`。

测试要求：

- [ ] 8 项门禁无空白项，阻塞项不得被标记 PASS。

### 5.4 FR-09 覆盖映射

| FR-09 范围 | M2-00 结论 | 后续承接 |
| --- | --- | --- |
| 需求 1–5 与 9：真实链路、交付形态、成本可行性 | 本 Sprint 必须形成 8 项 `PASS/BLOCKED` 证据 | 无 |
| 需求 6–8：移除静态导出、数据层、统一 FC 回源 | 本 Sprint 只验证可行性，不实施生产工程 | `sprint-m2-01` |
| FC 服务端构建、迁移骨架、部署/监控/回退可执行 | 本 Sprint 只记录验证结论，不能声称 FR-09 完成 | `sprint-m2-01` |

### 5.5 门禁证据模板

每项门禁记录必须包含：

| 字段 | 要求 |
| --- | --- |
| 验证日期 | 使用 ISO 日期/时间并注明时区 |
| 隔离资源 | 脱敏资源 ID、地域与用途 |
| 执行方式 | 可复现命令或 HTTP(S) 请求，禁止通用 webservice |
| 预期与实际 | 分别记录，不以结论替代事实 |
| 证据路径 | 指向 `docs/5-Evidence/m2-00/` 的脱敏日志、截图摘要或报价记录 |
| 敏感信息检查 | 明确凭据、AccessKey、Cookie、PII 的检查结果 |
| 结论 | 仅允许 `PASS` 或 `BLOCKED` |
| 后续动作 | `BLOCKED` 必须记录原因和解除条件 |

证据字段不完整、外部资源不可用或结果无法复核时，该项自动为 `BLOCKED`。

## 6. 验收标准

- 8 项门禁全部自动判定为 `PASS`，且总成本不超过已记录的预算硬上限，才能批准 M2-01。
- 结论明确 FC 交付、版本回退、VPC、OSS 私有分发和 ESA 刷新方式。
- 证据脱敏，未提交真实云凭据。

## 7. 验证要求

项目声明的验证命令：

- 本 Sprint 不改生产代码，不运行 `pnpm build`；使用目标链路专项 smoke tests、`git diff --check`、Markdown 链接检查和 8 项编号检查。

专项验证：

- ESA→FC SSR/Cookie、VPC→RDS、私有 OSS、DirectMail、ESA purge、成本检查。

实际验证结果：

| 命令 | 结果 |
| --- | --- |
| `pnpm m2:00:test` | `PASS`，11 个测试通过 |
| `pnpm m2:00:build` | `PASS`，最小 Next.js `standalone` spike 构建通过 |
| `pnpm m2:00:gate` | 预期的 `BLOCKED` / 退出码 2；G1～G8 均缺少真实输入 |
| `pnpm test` | `PASS`，10 个测试文件、36 个测试通过 |
| `pnpm lint` | `PASS`，TypeScript 无输出检查通过 |
| `pnpm build` | `PASS`，M1 静态 Preview 基线构建通过 |
| `git diff --check` | `PASS` |
| Markdown 相对链接与 8 项编号检查 | `PASS` |

## 8. 实施顺序

1. 完成文档 review-confirm 和测试资源准备。
2. 验证 ESA/FC。
3. 验证 RDS/OSS。
4. 验证 DirectMail/ESA purge。
5. 汇总成本与门禁结论。
6. 根据证据完整性与成本阈值自动判定是否进入 M2-01。

## 9. 风险控制

- 供应商能力与文档不一致：只以真实 spike 证据作为 PASS。
- spike 污染生产：使用隔离资源、测试域名和最小权限。
- 成本失控：先设并发/实例上限并记录可接受阈值。

## 10. 交付结论

`CONDITIONALLY_ACCEPTED`（2026-07-29，Asia/Shanghai）。

- 自动门禁执行器、脱敏证据格式、最小 FC Next.js spike 和 provider-specific probe 边界已实现并通过代码 review-confirm。
- 当前环境没有隔离 ESA/FC/RDS/OSS/DirectMail 端点、probe 身份/token、真实报价、流量假设或预算硬上限。
- RDS Route Handler 当前仅验证 MySQL 握手，并 fail-closed 地返回 `selectOne: false`、`connectionReuse: false`；还需加入受审的查询/连接复用实现。
- [门禁报告](../5-Evidence/m2-00/gate-report.md)中 G1～G8 全部为 `BLOCKED`，没有虚构 `PASS`。
- 用户明确接受 `M2-LEGACY-01`、`M2-LEGACY-02` 作为遗留待确认问题并授权继续 M2-01～M2-05；这只解除开发顺序阻塞，不解除生产门禁。
- RDS 查询与连接复用工程实现转由 `sprint-m2-01` 承接；真实 VPC/RDS 证据继续归 `M2-LEGACY-01`。
- 解除条件：提供 `spikes/m2-00/config.example.json` 所列真实隔离输入，完成 RDS 查询 probe，并重新执行门禁，直至整体状态为 `PASS`。
