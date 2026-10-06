# M2-00 隔离可行性门禁

本目录只用于 M2-00 隔离验证，不是生产应用。它提供：

- 可构建为 `standalone` 候选制品的最小 Next.js SSR/Route Handler/Cookie spike；
- 8 项门禁的自动执行与证据校验；
- 只记录 allowlist 布尔结果的脱敏报告。

## 安全边界

- 所有供应商集成必须由各自的 provider-specific probe 直接使用 HTTP(S) API；不得增加通用 `webservice`。
- `config.local.json` 已被 Git 忽略，只能保存非秘密端点和脱敏资源标签。
- 授权 token、数据库密码、AccessKey、Cookie 和收件地址只能通过隔离环境变量注入，运行器不会把值写入报告。
- 原始响应、供应商日志和含 PII 的内容不得复制到仓库。
- G1–G7 的 URL 必须与 `isolatedOrigin` 同源，响应必须匹配 `probeIdentity`，避免任意 HTTPS JSON 伪造 PASS。

## 运行

```bash
pnpm m2:00:test
pnpm m2:00:build
pnpm m2:00:gate -- --config spikes/m2-00/config.local.json
```

先复制 `config.example.json` 为被忽略的 `config.local.json`，补充真实隔离资源端点和版本化成本输入。默认 token 环境变量为 `M2_00_PROBE_TOKEN`，也可用配置中的 `probeTokenEnv` 指定另一个变量名。

门禁执行会覆盖：

- `docs/5-Evidence/m2-00/gate-report.json`
- `docs/5-Evidence/m2-00/gate-report.md`

任一输入缺失或验证失败时，命令写入 `BLOCKED` 证据并以退出码 `2` 结束。

## Provider-specific probe 契约

G3、G4、G6、G7 的端点必须由隔离 FC spike 中各自独立的实现提供：

- RDS：私网 `SELECT 1`、连接复用、禁用公网端点；
- OSS：私有 Bucket、直连拒绝、ESA 受控回源、短期授权和越权失败；
- DirectMail：测试发信域的直接 HTTPS API 调用；
- ESA purge：精确 URL 的直接 HTTPS API 调用与对照 URL 验证。

这些端点的独立 Route Handler 已随 spike 提交，只能返回文档约定的非敏感布尔值，并在配置缺失时默认拒绝。当前仓库不包含阿里云凭据，也不伪造 provider probe 的 PASS 结果。

当前 RDS Route Handler 只用 Node 内置 TCP 验证 MySQL 协议握手，并明确返回 `selectOne: false`、`connectionReuse: false`。这是 fail-closed 的临时边界；在加入并审查可执行 `SELECT 1` 与连接复用的数据库驱动前，G3 不可能 `PASS`。
