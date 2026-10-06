# 客来宝 FC Node.js 20 运行时依赖层实施方案

| 字段 | 内容 |
| --- | --- |
| 文档状态 | `PROPOSAL`（尚未进入实现） |
| 日期 | 2026-08-15 |
| 目标运行时 | 阿里云 FC 3.0 `custom.debian10`、Node.js 20、Linux x86_64 |
| 生产状态 | `BLOCKED`，受 `M2-LEGACY-01` 真实云资源与证据门禁约束 |

## 1. 目标与当前基线

本方案将 Next.js standalone 的完整 Node.js 运行时依赖闭包提取为阿里云 FC Layer，以减少日常发布时需要上传和更新的应用 ZIP。Layer 挂载后位于 `/opt`；应用继续从 ZIP 根目录执行 `node server.js`。

当前 Windows 本地 standalone 目录约 83.3 MiB，其中 `public` 约 14.65 MiB、`.next` 约 5.88 MiB、Next 约 27.2 MiB、`sharp` 约 19.2 MiB。这些数字只用于识别体积来源，不能作为生产制品结论。实施前必须在与 FC 兼容的 Debian 10 Linux x86_64、Node.js 20 环境重新构建并记录未压缩目录、Layer ZIP 和应用 ZIP 的真实基线。

Layer 只优化应用 ZIP 的体积与上传更新成本，不承诺降低冷启动、内存占用或请求延迟。固定图片迁移到私有 OSS 并经 ESA 分发属于独立方案，不由 Layer 承担。

## 2. 制品与运行时契约

### 2.1 Layer 制品

Layer 名称固定为 `kelaibao-node20-runtime`，ZIP 顶层结构固定为：

```text
nodejs/
├── node_modules/
├── package.json
└── dependency-manifest.json
```

- `/opt/nodejs/node_modules` 包含 Next、React、React DOM、`argon2`、`mysql2`、`sanitize-html`、`sharp`、Open Graph 中文字体及其完整运行时传递依赖。
- `dependency-manifest.json` 至少记录应用版本、Node.js 完整版本、CPU 架构、glibc 基线、pnpm 版本、`pnpm-lock.yaml` SHA-256、依赖清单和 Layer ZIP SHA-256。
- Layer 版本不可覆盖。`package.json` 的运行时依赖、Open Graph 字体、`pnpm-lock.yaml`、Node.js 主版本或原生模块构建环境发生变化时，必须发布新版本。
- Layer 不包含应用源码、`.next`、`public`、环境变量、数据库、业务数据、证书、AccessKey 或其他秘密。

### 2.2 应用 ZIP

应用 ZIP 根目录固定包含：

```text
server.js
package.json
.next/
public/                 # 仅保留尚未迁移到 OSS 的必要文件
node_modules -> /opt/nodejs/node_modules
```

打包过程必须基于 `.next/standalone` 的临时 staging 副本操作，不修改构建产物本身。删除 staging 内的依赖实体后，创建指向 `/opt/nodejs/node_modules` 的绝对符号链接，并使用保留 Unix 符号链接的 ZIP 参数打包。

应用 ZIP 不得包含 `.env*`、SQLite/WAL/SHM、`.next/cache`、本地数据、测试、文档、完整仓库 `node_modules` 或任何凭据。Next.js tracing 生成的应用文件不得手工删减。

### 2.3 FC 配置

- 函数绑定一个明确的 `kelaibao-node20-runtime` Layer 版本，不使用“最新版本”隐式漂移。
- 设置 `NODE_PATH=/opt/nodejs/node_modules`；启动命令保持 `node server.js`，监听地址和端口继续使用现有 `HOSTNAME=0.0.0.0` 与 `PORT=9000` 契约。
- 每次发布记录 `SINO_APP_VERSION`、应用 ZIP SHA-256、Layer 名称/版本、Layer ZIP SHA-256 和锁文件 SHA-256，形成可成对回滚的发布清单。
- 如后续自动发布 Layer，只能直接调用阿里云明确的 HTTP(S) API，不增加通用 `webservice` 抽象。

## 3. 实施步骤

1. 在 Debian 10 兼容的 Linux x86_64、Node.js 20、pnpm 10.34.5 环境建立原始 standalone 和 ZIP 体积基线，并确认 `argon2`、`sharp` 的原生文件不含 Windows/macOS 目标。
2. 新增 Layer 构建脚本，根据项目锁文件生成生产运行依赖；将 Open Graph 运行时读取的 `@fontsource/noto-sans-sc` 纳入运行时闭包，生成清单、ZIP 和校验和。
3. 改造 FC 应用打包脚本，在隔离 staging 目录创建 `/opt` 依赖链接；更新 ZIP 内容、符号链接、禁入文件和独立解压检查。
4. 增加 Layer-aware smoke：在本地临时目录模拟 `/opt/nodejs/node_modules`，验证模块解析后启动 standalone；本地模拟不能替代 FC test alias。
5. 先发布不可变 Layer 版本，再上传应用 ZIP并绑定到 FC test alias；验证通过后才把同一组应用 ZIP 与 Layer 版本切换到 production alias。
6. 保留上一组应用 ZIP、Layer 版本和发布清单。回滚必须成对恢复，禁止只回滚代码或只切换 Layer；在回滚保留期内不得删除旧 Layer 版本。

## 4. 验证与验收

### 4.1 本地与制品验证

- `pnpm test && pnpm lint && pnpm build` 全部通过，现有 standalone smoke 无回归。
- Layer ZIP 顶层只有合法 `nodejs/` 结构，锁文件哈希和清单一致；不存在 `win32`、`darwin` 或非 x86_64 原生模块。
- 应用 ZIP 不包含依赖实体，`node_modules` 是精确指向 `/opt/nodejs/node_modules` 的 Unix 符号链接；ZIP 解压后无秘密、本地数据库或缓存。
- 模拟 Layer 环境可解析 Next、React、`argon2`、`mysql2`、`sanitize-html`、`sharp` 和中文字体；Next server 能启动并完成健康检查、公开 SSR、管理员登录依赖加载、Open Graph 图片和响应式图片 smoke。

### 4.2 FC test alias 验证

- Node.js 版本、ABI、glibc 与 x86_64 原生模块兼容，不出现 `Cannot find module`、`ERR_DLOPEN_FAILED`、`GLIBC_xxx not found` 或启动退出。
- `/api/health`、`/health`、首页、新闻/案例 SSR、`/admin/login`、Open Graph 图片、静态资源和必要 OSS/RDS 链路按现有门禁工作。
- 记录 Layer 与应用 ZIP 的压缩/解压大小、上传耗时、冷启动和首请求数据，与改造前基线比较；只报告实测值，不预设收益。
- 完成一次成对回滚演练，确认旧应用 ZIP 与旧 Layer 版本恢复后服务可用。

## 5. 状态边界与非目标

- 本文是实施方案，不代表已获准修改打包链路、创建真实 Layer 或切换生产函数；对应 FR/Sprint 必须先完成 document review 与 review-confirm。
- 本地构建和 FC test alias 最多形成 `LOCAL_PASS` 或隔离环境证据。真实 FC/ESA/OSS/RDS、大陆网络、成本和回退证据未闭环时，Production 保持 `M2-LEGACY-01 / BLOCKED`。
- 不把 Layer 用作配置中心、秘密存储、业务数据卷或图片存储，不引入公共读 OSS、第三方图片 CDN、第二应用或第二站点。
- 不通过删除 Next tracing 文件、跳过原生依赖验证或让应用 ZIP 静默回退内置依赖来追求更小体积；Layer 缺失、版本不符或依赖校验失败时发布必须停止。
