# Sprint M2-00 文档审查报告（GPT-5.5）

## 审查范围

- `products/sino-cn/docs/1-Requirement/Mainland-Website-FR/FR-09-alibaba-cloud-fullstack-runtime-and-infrastructure-gate.md`
- `products/sino-cn/docs/3-Plan/sprint-m2-00.md`
- `products/sino-cn/docs/2-Design/Alibaba-Cloud-Fullstack-Architecture-Spec.md`

## 审查结论

该组文档总体方向一致，均围绕 `ESA -> Function Compute 全栈 Next.js -> RDS MySQL + 私有 OSS + DirectMail` 的 M2-00 可行性门禁展开。但在进入后续 Sprint 工作前，仍有几处会影响门禁判定、review-confirm 自动推进和 FR/Sprint 边界的阻塞性或中等风险问题需要澄清。

## Findings

| Severity | Type | Location | Issue | Evidence | Recommendation |
| --- | --- | --- | --- | --- | --- |
| High | Consistency | `FR-09-alibaba-cloud-fullstack-runtime-and-infrastructure-gate.md:79`, `FR-09-alibaba-cloud-fullstack-runtime-and-infrastructure-gate.md:83`, `sprint-m2-00.md:91`, `sprint-m2-00.md:95`, `Alibaba-Cloud-Fullstack-Architecture-Spec.md:140-147` | M2-00 门禁数量和拆分口径不一致，可能导致某个关键验证项被合并后遗漏。 | FR 的专项验证和验收写为七项；Sprint 的测试要求和验收标准也写为七项；架构规格第 9 节却列出 8 项，其中将 ESA 稳定回源与 FC 运行 Next.js SSR/Route Handler/流式响应拆成两个独立门禁。 | 统一三份文档的门禁清单。建议采用架构规格中的 8 项作为规范清单，并在 FR 与 Sprint 中逐项编号引用；如果坚持 7 项，应明确哪两项合并、合并后的 PASS 证据必须同时覆盖哪些子断言。 |
| High | Requirement | `sprint-m2-00.md:17`, `sprint-m2-00.md:87`, `sprint-m2-00.md:95`, `sprint-m2-00.md:116`, `sprint-m2-00.md:126` | Sprint 依赖“负责人/人工确认”作为成本和进入 M2-01 的门禁，但没有定义无人值守或证据驱动的自动判定规则；这会阻塞当前要求的自动 review-confirm/自动决策流程。 | Sprint 要求“成本验证口径由负责人确认”“由负责人确认成本可接受或停止”“人工确认是否进入 M2-01”“待验证和人工门禁确认后填写”。 | 将人工确认改为可审计的判定规则，至少列出预算上限、成本口径、流量假设、报价来源、证据路径和 PASS/BLOCKED 条件；如仍保留负责人确认，应同时给出“无人工确认时默认 BLOCKED”或“满足全部阈值时自动 PASS”的规则。 |
| Medium | Requirement | `FR-09-alibaba-cloud-fullstack-runtime-and-infrastructure-gate.md:37-38`, `FR-09-alibaba-cloud-fullstack-runtime-and-infrastructure-gate.md:59`, `FR-09-alibaba-cloud-fullstack-runtime-and-infrastructure-gate.md:84-86`, `sprint-m2-00.md:3`, `sprint-m2-00.md:31`, `sprint-m2-00.md:36`, `sprint-m2-00.md:103` | FR-09 的输出和验收包含移除静态导出、建立 FC 服务端构建、数据库迁移骨架、部署/迁移/监控/回退可执行；Sprint M2-00 又声明只做隔离验证、不改生产代码。这会让 M2-00 是“完成 FR-09”还是“只完成 FR-09 可行性部分”变得不够可执行。 | FR 需求 6/7 和输出/验收要求服务端构建与迁移骨架；Sprint 状态、范围和验证要求明确只做隔离 spike/测试配置，不实施正式业务代码，也不运行 `pnpm build`。 | 在 Sprint 中增加 FR-09 验收项映射表，明确 M2-00 只覆盖哪些 FR-09 条目、哪些条目延后到 M2-01，并给出 M2-00 的“不能声称 FR-09 完成”的交付结论模板；或把最小 FC 构建/迁移骨架纳入 M2-00 并相应调整验证命令。 |
| Medium | Security | `Alibaba-Cloud-Fullstack-Architecture-Spec.md:47`, `Alibaba-Cloud-Fullstack-Architecture-Spec.md:100`, `Alibaba-Cloud-Fullstack-Architecture-Spec.md:143`, `sprint-m2-00.md:68`, `sprint-m2-00.md:74` | 私有 OSS 经 ESA 公开分发的安全边界没有定义到可测试层级，无法证明“OSS 私有但可经 ESA 分发”不会退化为公共读或长期凭据暴露。 | 架构规格要求私有 OSS Bucket、浏览器不得持有长期 AccessKey、短期授权上传并经 ESA 分发；Sprint 仅要求验证私有 OSS 上传与 ESA 分发、OSS 非公共读，但未要求验证 ESA 到 OSS 的鉴权/回源方式、直连 OSS URL 禁止访问、对象键约束、授权过期和越权上传失败场景。 | 为 M2-00 增加 OSS/ESA 安全验收子项：私有 Bucket 公共读关闭、直连 OSS URL 403/拒绝、ESA 回源鉴权或受控源站策略明确、presign 过期后失败、错误 MIME/大小/对象键失败、浏览器和日志中无 AccessKey。 |
| Medium | Test | `sprint-m2-00.md:52-58`, `sprint-m2-00.md:64-74`, `sprint-m2-00.md:84-91`, `sprint-m2-00.md:103-107` | Sprint 的测试要求说明了验证主题，但没有定义每个 PASS/BLOCKED 所需的最小证据格式和失败判定，后续 review-confirm 难以判断是否满足 sprint-workflow 的可验证门禁。 | Sprint 使用“证据齐全”“无公网依赖”“日志不含凭据/PII”“七项门禁无空白项”等描述，但没有要求记录命令、请求/响应、控制台截图/日志摘要、资源配置摘要、脱敏规则、证据存放路径或失败样例。 | 增加门禁证据模板，例如每项包含：验证日期、隔离资源 ID/区域（脱敏）、执行命令或 HTTP 请求、预期结果、实际结果、日志/截图路径、敏感信息检查、PASS/BLOCKED 结论和后续动作。 |
| Low | Maintainability | `sprint-m2-00.md:31`, `sprint-m2-00.md:103`, `FR-09-alibaba-cloud-fullstack-runtime-and-infrastructure-gate.md:75-79` | 隔离 spike/测试配置的位置、是否允许进入仓库、是否参与常规验证没有明确，容易在后续实施时污染生产代码或留下不可复现的本地验证。 | Sprint 提到“隔离 spike/测试配置、FC 打包实验、脱敏验证记录”，同时说“不改生产代码，不运行 `pnpm build`”；FR 的文档阶段验证只列 `git diff --check`、链接和编号检查。 | 指定 spike 目录、命名规则和清理/保留策略；明确哪些文件可提交、哪些只作为脱敏证据引用，以及本 Sprint 至少应运行的 Markdown/link/编号检查命令。 |

## 已检查事项

- FR 头部字段和基本章节结构与 FR Gate 要求基本匹配。
- Sprint 文件路径、文件名和章节结构与 Sprint Gate 要求基本匹配。
- 三份文档均明确排除 ESA Pages、Vercel、公开 RDS 和通用 `webservice` 封装。
- 未发现要求提交真实云凭据、真实报价明细或未脱敏合规证据的内容。
