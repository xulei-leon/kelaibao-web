# FC Console ZIP Deployment Manual Review Confirm

**Reviewed Inputs**

- `docs/2-Design/FC-Console-ZIP-Deployment-Manual.md`
- `docs/2-Design/FC-Deployment-Runbook.md`
- `deploy/fc-runtime.example.json`
- `README.md`
- `docs/4-Reviews/FC-Console-ZIP-Deployment-Manual-review-by-opencode-go-kimi-k2.7-code.md`
- `docs/4-Reviews/FC-Console-ZIP-Deployment-Manual-review-by-opencode-go-glm-5.2.md`
- Commit `9f41d2dbc3e83b5102d64a8c87416865503168ca`

**Review Date**

- 2026-08-11

## Overall Conclusion

两份报告对 FC Web 函数、`custom.debian10`、Node.js 20、standalone ZIP 根目录、
`0.0.0.0:9000` 和 `/api/health` 主契约的正向确认总体可靠。手册没有 Critical 或 High
级阻塞问题。

确认需要修改 3 项：生产构建前阻止遗留 `.env.local`、澄清 VPC 是控制台网络配置、
把 ZIP 根目录与禁入文件检查改成确定性命令。另有 2 项部分成立：Runbook 的旧 gate
路径确实漂移但不是本 commit 引入；JSON 示例的基础环境变量范围可能被误读，但不应在
示例中复制全部秘密清单。

手册可以作为当前联调指南；在把它冻结为生产操作手册前，应至少修复 `.env.local`
构建污染风险。真实云、恢复、成本和 Production gate 仍维持 `DEFERRED/BLOCKED`，本确认
不把文档正确性转换为生产就绪证据。

## Decision Table

| No. | Severity | Type | Review Source | Original Comment Summary | Decision | Evidence | Follow-up Plan / Rejection Reason |
|---|---|---|---|---|---|---|---|
| 1 | High | Risk | Kimi C1 | 手册要求 Node 20，但 `package.json` 允许 Node 20～24，README 的本地 SQLite 又要求 Node 22.13+，生产 native addon 可能不兼容。 | Reject | 手册 §2.1、§3 明确要求生产 ZIP 使用 Linux x86_64 Node 20.x，并要求 `node --version` 为 `v20.x`；README 的 22.13+ 只属于 `DATABASE_ADAPTER=sqlite` 本地测试路径。宽泛的 `engines` 是项目多运行模式约束，不等于 FC 构建版本。 | 不把该项作为 High finding，也不新增全项目 `.nvmrc`，否则会破坏 README 已批准的 SQLite Node 22.13+ 路径。生产构建继续以手册中的 Node 20 门禁为准。 |
| 2 | Medium | Security | Kimi C2 | WSL/生产构建没有防止旧 `.env.local` 被 Next.js 读取并写入生产 bundle。 | Accept | README 明确指导本地创建 `.env.local`；手册 §2.1 的复制路径只删除 `node_modules`、`.next`、`.next-dev`，§3 也未检测本地 env 文件。Next.js 构建会加载 `.env.local`，显式 export 之外的遗留值仍可能影响构建。 | 修改手册 §2.1 和 §3：生产制品优先使用干净 checkout；构建前检测并拒绝 `.env.local`、`.env.production.local` 等本地 env 文件，再显式提供已批准的公开构建变量。不要自动删除用户文件。 |
| 3 | Medium | Correctness | Kimi C3 | `PUBLIC_CRAWL_STATUS` 被称为 Production 必需变量，却没有放进基础 FC 环境变量块。 | Reject | 手册 §7.1 紧接基础块明确写明 Production 至少还需配置 `PUBLIC_CRAWL_STATUS`，并规定上线门禁通过前为 `blocked`；这不是缺失，只是按基础变量与业务变量分组。 | 保持当前分组，不在两个代码块重复同一变量。若未来增加可复制的完整生产模板，应以 `.env.example` 生成，而不是人工复制两份清单。 |
| 4 | Low | Clarity | Kimi C4 | `DATABASE_ADAPTER=mysql：才开启 FC VPC` 容易被理解为环境变量会自动开启 VPC。 | Accept | VPC、交换机和安全组是 FC 控制台/云资源配置；代码只读取 `DATABASE_ADAPTER` 选择 repository，不会改变云网络。 | 将 §8.2 改为：仅在显式 MySQL/RDS 部署路径下，运维人员才在 FC 控制台开启 VPC 并选择对应 VPC、交换机和安全组。 |
| 5 | Low | Consistency | Kimi C5 | 手册为 `/llms.txt` 配置缓存，但仓库没有对应路由。 | Reject | `src/app/llms.txt/route.ts` 已存在，导出动态 `GET` 并调用 `createDiscoveryHandler` 返回 `text/plain`。审阅器的文件搜索范围错误。 | 不修改 `/llms.txt` 缓存条目；保留该路由的短缓存和 purge 约定。 |
| 6 | Low | Documentation | Kimi C6 | `unzip -l ... | head -n 40` 不能可靠证明 ZIP 根目录正确。 | Accept | 大型 standalone ZIP 的前 40 行不保证包含所有根级入口；该命令也没有验证 `.env*`、`.local-data` 或 SQLite 禁入文件。 | 将 §5 改为 `zipinfo -1`/`unzip -Z1` 精确断言根级 `server.js`，并分别断言 `.next/static/`、`public/` 存在及禁入文件不存在；保留 SHA-256 和大小检查。 |
| 7 | Info | Correctness | Kimi C7 | JSON 示例与手册的 Node 20、端口和启动契约一致。 | Accept | `fc-runtime.example.json` 的 runtime、nodePath、PATH、entrypoint、HOSTNAME、PORT 与手册 §1、§6、§7 一致。 | 无需立即修改；FC runtime 或内置 Node 路径变化时同步复核 JSON、手册与 Runbook。 |
| 8 | Info | Correctness | Kimi C8 | `/api/health` 手册约定与代码和 smoke 一致。 | Accept | `src/app/api/health/route.ts` 返回 JSON 和 no-store；`scripts/smoke-standalone.mjs` 验证 status、version、content type 和 cache header。 | 无需修改；继续把 `/api/health` 作为 test alias 首个探针。 |
| 9 | Info | Correctness | Kimi C9 | 手册构建顺序与仓库脚本一致。 | Accept | `scripts/build.mjs` 依次生成响应式资源、执行 Next build、调用 `package-standalone.mjs`；后者复制 `.next/static`、`public` 并拒绝 SQLite 文件。 | 无需修改；构建脚本发生变化时同步更新手册。 |
| 10 | Info | Correctness | Kimi C10 | 深圳地域 ZIP 上限 500 MB 与官方文档一致。 | Accept | 2026-08-11 重新读取阿里云 FC 使用限制：华南 1（深圳）通过控制台、开发者工具或 OSS 指定的 ZIP/JAR 代码包上限为 500 MB，其余部分地域为 100 MB。 | 保留当前表述和“以实时控制台/文档为准”的漂移提示；变更地域或上传方式时重新核对。 |
| 11 | Medium | Consistency | GLM C1 | Runbook 仍写 `m2-05/gate-input.json`，脚本默认已迁到 `m3-05/gate-input.json`。 | Partial | `scripts/validate-release.mjs` 默认读取 `docs/5-Evidence/m3-05/gate-input.json`，Runbook 仍展示 m2-05，问题真实；但该段在 `9f41d2db` 前已存在，本 commit 只修改 Runbook 顶部链接和制品契约。 | 记录为既有文档债务，在后续 Runbook 清理中将默认路径更新为 m3-05，并说明 m2-05 仅为历史 evidence；不把它判定为最新 commit 的回归。 |
| 13 | Low | Consistency | GLM C3 | JSON 中实例数和并发为 `null`，手册却给出 0/3/10 建议值。 | Reject | JSON 明确标记 `M2-LEGACY-01-DEFERRED`，空值表示尚无生产证据；手册 §1、§6.1 明确说明 0/3/10 是首次联调的未验证保守起点。两者语义不同且不矛盾。 | 保持 JSON 为 `null`，避免把建议值误写成已批准的机器配置；真实压测和预算门禁关闭后再写最终值。 |
| 14 | Low | Consistency | GLM C4 | JSON `environment` 只列启动环境，缺少全部 Production 运行变量。 | Partial | JSON 的 `environment` 容易被单独阅读为完整环境，但手册 §7.1 和 `.env.example` 已明确完整 Production 清单；把秘密和所有业务变量复制进 JSON 会造成三份清单漂移。 | 最小修正是在 JSON 增加非秘密的契约指针字段，例如 `runtimeEnvironmentContract: ".env.example"`，或将字段命名为 `baseEnvironment`；不复制 AccessKey、token 或完整业务变量。 |
| 15 | Low | Test | GLM C5 | 应增加测试保证 JSON 与手册字段一致。 | Reject | `fc-runtime.example.json` 是未被程序消费的示例/文档制品；测试无法可靠验证 Markdown 叙述，新增测试会把人工文档结构变成运行时耦合。当前变更已通过 JSON 解析和人工一致性检查。 | 不新增专用测试。若未来部署工具直接消费该 JSON，再为其 schema 和启动契约增加最小测试。 |
| 17 | Low | Clarity | GLM C7 | `--require-production-live` 与本地构建命令混在同一代码块，容易被认为是生成 ZIP 前提。 | Reject | §3 的代码块只运行普通 `pnpm validate:release`；`pnpm validate:release -- --require-production-live` 位于代码块后的独立说明，并明确“不是生成 ZIP 的前提、生产切流前必须成功”。 | 当前文字已经消除歧义，无需再拆分。 |
| 18 | Low | Clarity | GLM C8 | WSL glibc 故障说明没有给出具体 Debian 10 镜像和命令。 | Reject | 手册已说明只有出现 `GLIBC_xxx not found` 才切换到 Debian 10 兼容构建环境，并要求 FC test alias 验证。固定一个未验证或可能 EOL 的镜像标签会制造新的漂移和维护责任。 | 不在当前手册硬编码镜像；实际命中兼容性错误时，选用阿里云当期支持的构建镜像并记录真实验证证据。 |
| 19 | Low | Documentation | GLM C9 | §11 curl 列表缺少 `/api/inquiry` fail-closed 请求。 | Reject | §11 紧接 curl 列表已要求受控验证 `/api/inquiry` 的测试和失败降级，并明确不得使用真实客户信息；本地 smoke 已自动检查未配置时的 503 和不泄露配置。通用 curl 示例无法安全提供真实 DirectMail/限频配置。 | 保留受控测试要求，不在公共手册加入可能携带联系人或 token 的完整请求体。若建立脱敏 test fixture，再从专用 evidence/runbook 链接。 |
| 20 | Low | Documentation | GLM C10 | 最大实例数 3 没有证据，应显式标记假设。 | Reject | 手册 §1 已写“保守起点，不是容量测试结论”，§6.1 又写“初始费用保护，正式值必须结合流量和预算”；JSON 继续为 `null`，Runbook 维持资源预算 DEFERRED。 | 已满足建议，无需第三次重复。待 `M2-LEGACY-02` 关闭后用实测值替换。 |
| 21 | Info | Correctness | GLM C11 | commit 补齐 JSON 的 Node、handler、监听和环境字段，是正向改进。 | Accept | Git diff 显示新增 nodePath、handler、listenAddress、listenPort 和基础 environment，且与手册一致。 | 无需立即修改；保留这些字段并在 FC runtime 变化时同步更新。 |
| 22 | Info | Correctness | GLM C12 | README、Runbook 新增链接及端口说明与手册一致。 | Accept | README 链接目标存在；Runbook 的 `PORT=9000`、`HOSTNAME=0.0.0.0` 与 JSON、手册相同。 | 无需修改；文档重命名时运行链接检查。 |
| 23 | Info | Risk | GLM C13 | 可增加提示：同机做 SQLite 调试时需从 FC Node 20 切换到 Node 22.13+。 | Reject | 手册只覆盖 FC Linux 生产制品并在两处要求 Node 20；README 的独立 SQLite 章节明确要求 Node 22.13+。把本地 SQLite 操作引入 FC 手册会混淆两个已清晰分隔的路径。 | 不增加跨场景提示；操作者分别遵循 FC 手册和 README 的对应章节。 |
| 24 | Info | Clarity | GLM C14 | 手册可说明健康失败 body 的 `status="degraded"`。 | Reject | 手册 §9 已说明配置无效返回 503，§14 故障表也以 503 定位配置问题；FC 健康检查只依据 HTTP 状态，不依赖 JSON 字面值。 | 不增加非必要字段细节；若未来告警规则解析 body，再记录并测试 `degraded` 契约。 |

## Needs Immediate Action

- 在生产构建步骤增加 `.env.local`/`.env.production.local` 检测并失败退出；优先使用干净 checkout。
- 将 ZIP 验证改为确定性的 required-entry 与 forbidden-file 检查。
- 澄清 MySQL/RDS 路径的 VPC 必须由运维人员在 FC 控制台配置。

## Can Be Deferred

- 在独立 Runbook 清理中同步 `m3-05/gate-input.json` 默认路径，并保留 m2-05 历史说明。
- 为 `fc-runtime.example.json` 增加指向 `.env.example` 的非秘密环境契约提示，避免复制完整变量清单。

## Implementation Result（2026-08-11）

- 已在 FC 手册的 WSL 复制路径和正式构建步骤增加本地 `.env*` 检测；发现后失败退出，不自动删除用户文件。
- 已使用 `unzip -Z1`、精确 required-entry 断言和 forbidden-file 正则替换前 40 行人工检查。
- 已明确 VPC 由运维人员在 FC 控制台配置，`DATABASE_ADAPTER` 不会修改云网络。
- 已将 Runbook 默认 gate 输入同步到 M3-05，并标明 M2-05 为历史 evidence。
- 已在 JSON 示例增加 `runtimeEnvironmentContract: ".env.example"`，没有复制秘密或完整业务变量清单。

## Final Status

最新 commit 的 FC 部署主契约可以接受，没有 Critical/High 阻塞项。确认中采纳和部分采纳
的文档修正均已完成，当前手册可以用于 test alias 联调。真实云、恢复、费用和
Production gate 仍未因此变为通过；不得把本次文档关闭状态解释为生产上线批准。
