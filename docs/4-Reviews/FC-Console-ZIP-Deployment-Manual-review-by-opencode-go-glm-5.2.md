# Review: FC-Console-ZIP-Deployment-Manual.md

| 字段 | 内容 |
| --- | --- |
| 被审文件 | `docs/2-Design/FC-Console-ZIP-Deployment-Manual.md` |
| 关联提交 | `9f41d2dbc3e83b5102d64a8c87416865503168ca` |
| 提交范围 | 同步变更：`README.md`、`deploy/fc-runtime.example.json`、`docs/2-Design/FC-Deployment-Runbook.md`，新增本手册 |
| 审查类型 | 文档 + 配置与仓库构建/打包/运行时契约一致性比对 |
| 审查者 | opencode-go / glm-5.2 |
| 审查日期 | 2026-08-11 |
| 审查范围声明 | 仅评审本提交引入/修改的文档与配置，并以仓库当前构建脚本、`next.config.ts`、`/api/health` 路由、`smoke-standalone.mjs`、`validate-release.mjs`、`.env.example`、`package.json` 为实证依据。未登录阿里云控制台逐项验证云限额；云侧事实以手册 §15 列出的官方文档为准。 |

## 1. 总体结论

新增手册是仓库内最完整的 FC 3.0 控制台 ZIP 部署步骤记录。本提交同时把 `deploy/fc-runtime.example.json` 补齐了 `nodePath`、`handler`、`listenAddress`、`listenPort`、`environment` 字段，并把 `README.md` 的文档入口与 `FC-Deployment-Runbook.md` 的 §4 制品契约更新到与手册一致的 Node.js 20 / `custom.debian10` / `node server.js` / `0.0.0.0:9000` 契约。核心运行时主轴三处一致，是一处明显的正收益。

审查未发现 Critical 或 High 级别的正确性或安全缺陷。存在若干 Medium / Low 的可执行改进，集中在：示例配置与手册之间的“机器可读契约”未完全自描述、`FC-Deployment-Runbook.md` 中残留的 `m2-05/gate-input.json` 路径与 `validate-release.mjs` 默认值不符、若干手册语句虽正确但缺少指向已存在证据的实现链路。

## 2. 与构建/打包/运行时契约的实证对照（摘要）

| 手册条目 | 仓库实证 | 结论 |
| --- | --- | --- |
| §1、§6.2 启动命令 `node server.js` | `package.json` `start:standalone` = `node .next/standalone/server.js`；`package-standalone.mjs:14` 校验 `.next/standalone/server.js` 存在 | 一致 |
| §1、§6.2 监听 `0.0.0.0:9000`、`PORT=9000`、`HOSTNAME=0.0.0.0` | `fc-runtime.example.json` 新增字段一致；`smoke-standalone.mjs:64-68` 使用相同两环境变量 | 一致 |
| §1 Runtime `custom.debian10`、Node.js 20、`PATH=/var/fc/lang/nodejs20/bin:...` | `fc-runtime.example.json` `runtime`/`nodePath`/`PATH` 与手册逐字符相同；`package.json` engines `>=20 <25` | 一致（云侧路径属官方契约，手册已标注依据） |
| §2.1 `argon2`、`sharp` 原生依赖需 Linux x86_64 构建 | `package.json` `argon2 ^0.45.1`、`sharp ^0.34.5`；`package-standalone.mjs` 不替换原生二进制 | 一致 |
| §3 `pnpm build` 步骤：响应式图片 → `next build` → 生成 standalone → 复制 `.next/static` + `public` → 检查无 SQLite | `scripts/build.mjs:22-24` 串行执行 `build-responsive-assets`、`next build`、`package-standalone`；`package-standalone.mjs:71-86` 复制静态/公开并 `assertNoSqliteData` | 一致 |
| §3 `pnpm smoke:standalone`、§11 健康检查契约 | `smoke-standalone.mjs:77-92` 校验 `status=ok`、`version===SINO_APP_VERSION`、`Cache-Control: private, no-store, max-age=0`、JSON 非 HTML | 一致 |
| §11 `/opengraph-image` 返回 PNG | `smoke-standalone.mjs:152-162` 校验 PNG 签名与字节数 | 一致 |
| §9 `/api/health` 503 表示后端配置无效 | `src/app/api/health/route.ts:24-32` `resolveServerConfig` 抛错时返回 503 `status="degraded"` | 一致（手册未点明 `status="degraded"` 字段名，不影响操作判断） |
| §7 `SINO_APP_VERSION` → 健康版本字段 | `src/server/config.ts:254` `appVersion = env.SINO_APP_VERSION?.trim() \|\| "local"`；route 返回 `version: config.appVersion` | 一致 |
| §2.2 `NEXT_PUBLIC_*` 构建期变量清单 9 项 | `.env.example` 含相同 9 个 `NEXT_PUBLIC_*` 变量 | 一致 |
| 底部 4 个项目内交叉引用 | `docs/2-Design/` 实际存在 4 个目标文件 | 一致，无断链 |
| `README.md` 新增链接 | 目标文件存在 | 一致 |

## 3. Findings

| Severity | Type | Location | Issue | Evidence | Recommendation |
| --- | --- | --- | --- | --- | --- |
| Medium | Consistency | `docs/2-Design/FC-Deployment-Runbook.md` §“M2-05 自动发布门禁”（本提交修改的同一文件，未在提交中一并修订） | Runbook 仍把 release gate 输入路径写为 `docs/5-Evidence/m2-05/gate-input.json`，而 `scripts/validate-release.mjs:17` 默认读取 `docs/5-Evidence/m3-05/gate-input.json`（仓库下也仅有 `m3-05/gate-input.json` 与 `m2-05/gate-input.json` 并存；脚本默认值已迁至 M3-05）。 | `FC-Deployment-Runbook.md:70` 文本与 `validate-release.mjs:17` `argumentValue("--input") ?? "docs/5-Evidence/m3-05/gate-input.json"` 不符；`docs/5-Evidence/m3-05/gate-input.json` 存在。 | 在 Runbook 中将默认 `--input` 路径同步为 `docs/5-Evidence/m3-05/gate-input.json`，或显式标注“M3-05 起默认输入路径变更，M2-05 路径仅为历史样例”。 |
| Medium | Documentation | `docs/2-Design/FC-Console-ZIP-Deployment-Manual.md` §8.3 与 `deploy/fc-runtime.example.json` `observability.applicationLogs.redactSecrets` | 手册规定日志不得包含密钥/Cookie/CSRF/AccessKey/PII，且示例 JSON 声明 `redactSecrets: true`，但仓库内未发现任何日志脱敏实现或测试（`grep` 在 `src/**` 内未匹配到 `redact\|redaction\|sanitize` 类日志中间件）。该字段目前是声明性意图，不是被代码或测试强制的契约。 | `fc-runtime.example.json:24` `"redactSecrets": true`；对 `products/kelaibao/src` 的搜索未发现运行期日志脱敏拦截器，手册 §8.3 也未指向任何实现/测试入口。 | 在手册 §8.3 增加“当前 `redactSecrets` 为 TODO，真实脱敏中间件随 M2-LEGACY-01 落地”的明确注释，或指向实现/测试文件；否则把 JSON 字段标为 `status: TODO`，避免被误读为已生效。 |
| Low | Consistency | `deploy/fc-runtime.example.json` vs 手册 §6.1 / §1 初始规格 | 示例配置把 `minimumInstances`、`maximumInstances`、`concurrency` 全部留空（`null`），而手册推荐“1 vCPU、2 GB、512 MB、并发 10、最小 0、最大 3”。示例 JSON 是部署约定的机器可读来源，单独阅读该文件会丢失手册中的保守起点。 | `fc-runtime.example.json:18-20` 三字段为 `null`；手册 §6.1 提供建议值。两文件之间无注释互指引。 | 在示例 JSON 中至少补 `cpu`、`memory`、`disk`、`minimumInstances`、`maximumInstances`、`concurrency` 的“建议初值（待 M2-LEGACY-02 关闭再最终化）”字段或加注释引用手册 §6.1，使契约自描述。 |
| Low | Test | `deploy/fc-runtime.example.json` 全文件 | 仓库无测试断言示例 JSON 与手册契约保持一致（`runtime`、`nodeMajor`、`nodePath`、`entrypoint`、`listenPort`、`PORT/HOSTNAME` 一致性）。本提交刚刚人工补回缺失的 `nodePath`/`handler`/`listenAddress`/`listenPort`/`environment` 字段，说明此类漂移会再次发生且无门禁拦截。 | 对 `products/kelaibao` 下未发现针对 `fc-runtime.example.json` 的 schema/契约测试。 | 新增一个最小脚本（或 vitest 用例）解析 `deploy/fc-runtime.example.json`，断言关键字段取值与手册契约一致，并将其纳入 `pnpm test` 或 `validate:release`。 |
| Low | Clarity | `docs/2-Design/FC-Console-ZIP-Deployment-Manual.md` §3 构建命令块 | §3 把 `pnpm test`、`pnpm lint`、`pnpm build`、`pnpm smoke:standalone` 与 `pnpm validate:release -- --require-production-live` 放入同一代码块。后面这条在云门禁未关闭前“预期失败”，与前三条可用性约束不同，混排易被读成“生成 ZIP 前必须通过”。 | 手册 §178 文本“它不是生成 ZIP 的前提，但在正式生产切流前必须成功”与 Runbook §86-88 的两段式调用差异；同块呈现削弱提示。 | 把 `--require-production-live` 拆为单独的“发布硬门禁（上线前必须真实通过，未通过前预期非零退出）”代码块，与本地制品/ZIP 生成步骤分离。 |
| Low | Clarity | `docs/2-Design/FC-Console-ZIP-Deployment-Manual.md` §2.1 WSL2 glibc 段落 | 手册提到若 WSL2 glibc 更新导致 `GLIBC_xxx not found` 应“使用 Debian 10 兼容的 x86_64 容器/构建镜像”，但未给出具体参考镜像或构建命令。operator 命中该错误后缺乏可落地指针。 | 手册 §98 文本；未引用具体镜像名/标签或 CI 配置。 | 给出至少一个已知良好的参考（如 `debian:10-slim` 或 FC 公布的 custom-runtime 构建镜像），并列出在该容器内执行 `pnpm install --frozen-lockfile` + `pnpm build` 的最小命令序列。 |
| Low | Documentation | `docs/2-Design/FC-Console-ZIP-Deployment-Manual.md` §1 / §6.1 | 手册给出“最大实例数 3”等具体数值，并已说明是“保守起点”。该数值未在 `fc-runtime.example.json`、README、Runbook 任何处留底，也无任何容量/预算证据支撑。在个人创业阶段这是合理假设，但应被标注为“假设值”，与 `M2-LEGACY-02` 的硬上限门禁关联。 | 手册 §32/§292 `3`；`fc-runtime.example.json:19` `maximumInstances: null`；Runbook §9 `M2-LEGACY-02 / DEFERRED`。 | 在手册 §6.1 表格脚注显式标注“最大实例数 3 是未验证假设，最终值由 M2-LEGACY-02 的真实压测与预算门禁确定”，与既有 DEFERRED 状态对齐。 |
| Info | Correctness | `deploy/fc-runtime.example.json` 本提交新增字段 | 本提交把缺失的 `nodePath`、`handler: null`、`listenAddress`、`listenPort`、`environment` 补齐，并在 `environment.PATH` 中显式拼接 `/var/fc/lang/nodejs20/bin`，与手册 §7 一致，修复了此前“示例 JSON 缺运行期契约”的缺口。 | `git show` 显示该 JSON 净增 10 行均为上述字段。 | 维持现状；建议配合上面 Low 级“一致性/测试”条目使补齐后的契约可被自动校验。 |
| Info | Correctness | `README.md`、`FC-Deployment-Runbook.md` 的交叉引用更新 | README 末尾的文档入口新增手册链接；Runbook 顶部新增指向手册的引导段；Runbook §4 把“FC 注释 PORT、SINO_APP_VERSION”改写为“FC 自定义运行时监听端口 9000，环境变量显式 `PORT=9000`、`HOSTNAME=0.0.0.0`”，与本提交的`fc-runtime.example.json` 字段一致。 | `git show` 显示 README 仅末段一行新增、Runbook 顶部引导段新增；`FC-Deployment-Runbook.md:16` 文本与示例 JSON 一致。 | 维持现状。 |
| Info | Risk | `docs/2-Design/FC-Console-ZIP-Deployment-Manual.md` §3 pnpm 11.9.0 / Node 20.x | 手册要求 pnpm 11.9.0、Node 20.x，与 `package.json` `packageManager: pnpm@11.9.0` 与 `engines.node >=20 <25` 一致。注意 README“无 MySQL 的本地后台调试”要求 SQLite 使用 Node 22.13+，与 FC 构建推荐的 Node 20 并存；手册只覆盖 FC Linux 构建路径，故不冲突，但 operator 同时做两件事时需注意切换 Node 版本。 | `package.json:5-7,62`；README §93 `node --version 必须为 22.13+`（SQLite 路径）。 | 在手册 §3“确认工具版本”旁加一句提示：若同机做 SQLite 本地调试，按 README 要求切换至 Node 22.13+，避免版本混用造成原生模块差异。 |
| Info | Clarity | `docs/2-Design/FC-Console-ZIP-Deployment-Manual.md` §9 / §11 | `route.ts` 在配置异常时返回 503 且 `status="degraded"`；手册 §9 只笼统说“基础服务端配置无效时会返回 503”，§11 验证清单只写“`status=ok`”。两处均未提及 `degraded` 字面值。 | `src/app/api/health/route.ts:24-32`。 | 可选：在 §9 或 §14 增加一行“`/api/health` 失败时 body 为 `{"status":"degraded",...}`，可用作运维探针判别”，提升可观测性。 |

## 4. 建议落地顺序

1. 修 Runbook §M2-05 的 `m2-05/gate-input.json` → `m3-05/gate-input.json`（Medium，本提交同文件遗留）。
2. 在手册 §8.3 / 示例 JSON 上对 `redactSecrets` 显式标 TODO（Medium）。
3. 把示例 JSON 补齐运行期环境变量与初始规格注释（Low ×2）。
4. 增加针对 `fc-runtime.example.json` 的最小契约测试（Low）。
5. 其余文档清晰度改进按方便程度合入下个文档修补提交即可（Low ×5 + Info ×2）。

## 5. 通过/未通过判定

- 阻塞性问题：无（0 Critical、0 High）。
- 文档与构建/打包/运行时主轴契约：一致。
- 建议在合入后续文档/配置修补前，至少处理上表中标 Medium 的两项，以消除“运行期配置默认路径漂移”和“声明性脱敏被误读为已生效”两类风险。
