# 客来宝 FC 打包操作说明

更新：2026-10-23。本文按当前 `package.json`、`next.config.ts`、`scripts/package-standalone.mjs` 和 `scripts/package-fc-zip.sh`，说明如何将本仓库打包为阿里云函数计算（FC）Web 函数使用的 ZIP 制品。

当前版本采用 [FR-25](docs/1-Requirement/Mainland-Website-FR/FR-25-static-news-and-cases.md) 的静态新闻/案例：公开页面与发现文件随构建更新，FC 继续运行全栈 Next.js 和同域 `/api/inquiry`，不部署旧 CMS。目标链路仍为 ESA → FC；生成 ZIP 或本地检查通过不代表生产发布门禁通过。

## 一、构建环境

必须在 Linux x86_64 环境执行，Windows 用户可使用 x86_64 WSL2，macOS 用户须使用符合条件的 Linux 构建机或容器。项目包含 `sharp` 原生依赖，不能复用 Windows/macOS 或其他 CPU 架构生成的 `node_modules` 和 `.next`。

要求：

- Node.js 20.x
- pnpm 10.34.5
- Linux x86_64
- 系统命令：`zip`、`unzip`、`zipinfo`、`sha256sum`、`find`、`grep`、`mktemp`、`du`

Ubuntu/WSL2 可一次安装打包所需的压缩工具：

```bash
sudo apt update
sudo apt install -y zip unzip
```

其中 `zipinfo` 由 `unzip` 软件包提供。

`package.json` 允许日常开发使用 Node.js `>=20 <25`，但 `package:fc` 严格要求 Linux、`x86_64`、Node.js 主版本 `20`、pnpm `10.34.5` 及 `packageManager=pnpm@10.34.5`。Linux 构建成功仍需通过 FC test alias 验证原生依赖兼容性；若出现 `GLIBC_xxx not found`，使用与目标运行时兼容的 Linux 构建环境重新安装和构建。

## 二、构建和打包

### 1. 检查工具版本

以下命令均从仓库根目录执行：

```bash
node --version
pnpm --version
node -p "require('./package.json').packageManager"
uname -sm
```

预期结果为 Node.js `v20.x.x`、pnpm `10.34.5`、`pnpm@10.34.5` 和 `Linux x86_64`。

如果 Node.js 是 24、22 或其他非 20.x 版本，使用 nvm 切换：

```bash
nvm install 20
nvm use 20
corepack enable
corepack prepare pnpm@10.34.5 --activate
```

切换后再次确认：

```bash
node --version
pnpm --version
```

### 2. 使用干净构建目录

优先使用干净 checkout。构建前检查仓库根目录的本地环境文件，发现后停止，将其安全保存在构建目录之外，不自动删除：

```bash
if find . -maxdepth 1 -name '.env*' ! -name '.env.example' -print -quit | grep -q .; then
  echo '发现本地 .env* 文件，请移出构建目录后重试。' >&2
  exit 1
fi
```

Next.js 会在构建时读取 `.env.local`、`.env.production` 等文件；仅在 ZIP 生成时排除它们，不能消除已进入静态 HTML 或 JavaScript 的值。`package:fc` 也会检查根目录普通 `.env*` 文件（允许 `.env.example`），但它发生在构建之后，不能代替构建前检查。不要在打包目录复制 `.env.example` 为 `.env.local`。

如果之前使用其他平台、Node.js 版本或公开配置构建过，清理依赖和生产构建输出，再重新安装；不删除本地业务数据：

```bash
rm -rf node_modules .next
pnpm install --frozen-lockfile
pnpm test && pnpm lint && pnpm build
```

首次使用干净 checkout 也须执行 `pnpm install --frozen-lockfile`，保留 `pnpm-lock.yaml`。

### 3. 确认公开构建输入

在受控构建环境注入已确认的非秘密公开配置，完整名称见 [.env.example](.env.example)，生产配置示例见 [deploy/fc-production-env.example.json](deploy/fc-production-env.example.json)：

| 配置 | 构建要求 |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | 本次部署的 canonical origin；生产为已确认的真实 HTTPS 域名，不能使用 FC 测试地址或 `.invalid` 占位域名 |
| `NEXT_PUBLIC_SITE_ENV` | 明确选择 `preview` 或 `production`，生产构建为 `production` |
| `NEXT_PUBLIC_WECHAT_*` | 确认公开名称、服务时间和实际二维码；生产资源状态为 `production-wecom` |
| `NEXT_PUBLIC_MINI_PROGRAM_*` | 确认 K-Link 名称和实际二维码；生产资源状态须为 `production-mini-program`，否则生产构建失败 |
| `NEXT_PUBLIC_CONTACT_FORM_STATUS` | 按邮件、政策、WAF 与发布门禁决定是否启用；生产模板目前保留 `preview-only` |
| `NEXT_PUBLIC_ANALYTICS_ENDPOINT` | 可选；只配置已批准的匿名事件端点，不能发送询盘字段 |

资源状态必须与真实二维码及验收结果一致，不能只修改状态值代替资源核验。不要把含 DirectMail AccessKey 等秘密的整份生产模板注入构建环境；秘密只在 FC 运行时配置。standalone smoke 也应在没有真实邮件和询盘密钥的环境运行。

当前所有环境的公开页面均允许搜索抓取与索引，旧 `PUBLIC_CRAWL_STATUS` 已移除。这些公开配置影响静态页面、canonical、metadata、robots 与发现文件；仅修改 FC 环境变量不会重生成已构建页面，变更后须重新构建、打包、部署并刷新相关 ESA 缓存。

### 4. 构建、检查与打包

确认版本、依赖和公开配置正确后执行，任一步失败均停止后续步骤：

```bash
pnpm test && pnpm lint && pnpm build && \
pnpm smoke:standalone && \
pnpm validate:release && \
pnpm package:fc
```

其中：

- `pnpm build` 依次生成响应式静态资源、执行 `next build`、生成 `.next/static-content-manifest.json`，再整理 `.next/standalone`。新闻/案例列表与详情应为静态生成，发现文件来自同一静态清单，构建与公开请求不需要内容数据库。
- standalone 整理脚本复制 `.next/static`、`public` 和内容 manifest（在制品根目录命名为 `static-content-manifest.json`），移除制品中的 `.local-data` 并拒绝 SQLite 数据文件。`public/visual/generated/` 随资源构建生成并进入制品，不手动遗漏或提交生成目录。
- `pnpm smoke:standalone` 启动本地 standalone，验证动态 SSR、健康接口、静态内容与发现文件、manifest 路径状态、公开页面抓取/索引策略、响应式 WebP、OG PNG、旧 CMS 入口 404，以及未配置询盘服务时的 503 降级。它不验证真实 DirectMail 发信或云网络。
- `pnpm validate:release` 默认读取 `docs/5-Evidence/m3-05/gate-input.json` 和 `docs/5-Evidence/m5-05/static-migration.json`，核对既有发布证据及静态迁移证据。默认命令成功仍可能输出 `CODE_READY_WITH_EXTERNAL_LEGACY`、`productionReady: false`，必须保留实际 blocker，不能解释为允许生产切流。
- `pnpm package:fc` 不执行安装或构建；它检查已有 standalone，使用保留 Unix 符号链接的 ZIP 打包，再解压到临时目录验证 Next.js 依赖加载。

如果只重新生成 ZIP，必须确认 `.next/standalone` 已由相同 Linux/Node/pnpm 环境、当前源码和本次公开配置构建并通过检查，且不含秘密，然后执行：

```bash
pnpm package:fc
```

`package:fc` 不校验源码与旧构建是否一致，也不校验 canonical 是否正确；源码、内容、依赖或公开构建配置有变化时须重新完整构建。

## 三、输出文件

打包成功后生成：

```text
out/kelaibao-fc.zip
out/kelaibao-fc.files.txt
out/kelaibao-fc.zip.sha256
```

上传到 FC 的文件是：

```text
out/kelaibao-fc.zip
```

ZIP 根目录必须直接包含：

```text
server.js
package.json
node_modules/
.next/server/
.next/static/
public/
static-content-manifest.json
```

不能多包一层 `standalone/` 目录。

`static-content-manifest.json` 记录内容源码 SHA-256 与本次公开、撤回、跳转路径及其 200/410/308 状态，供 smoke、迁移核对及发布回退使用；它与 ZIP 文件列表 `kelaibao-fc.files.txt` 用途不同。保留上一发布版本的内容 manifest。

打包脚本执行以下检查与清理：

- 检查 standalone 必需目录/入口，要求 `node_modules/next` 为符号链接；
- 清理 standalone 中的 `.next/cache`、`.local-data` 与旧的三个 FC 输出文件；
- 拒绝制品中的 `.env*`、`.sqlite` 及 `-wal`、`-shm`、`-journal` 文件，并检查 ZIP 中的缓存和本地数据禁入项；
- 检查发现的 `.node` 原生模块路径是否含 `win32`/`darwin` 平台目录；该路径检查不能替代 Linux 构建与 FC 实测；
- 检查 ZIP 根目录必需条目，确认 ZIP 及解压后的 `node_modules/next` 仍是 Unix 符号链接；
- 在隔离临时目录解压后加载 `next/dist/server/require-hook.js`，成功后生成 SHA-256 文件。

上传脚本生成的原始 ZIP，不要解压后用图形压缩工具重新打包或多包一层目录，否则可能丢失 pnpm 符号链接。可在仓库根目录复核校验和及文件列表：

```bash
sha256sum -c out/kelaibao-fc.zip.sha256
unzip -Z1 out/kelaibao-fc.zip
```

校验和文件记录生成时的 ZIP 路径；若将制品移到其他机器归档，按新位置核对同一 SHA-256 值。脚本只检查部分禁入模式，发布前仍须确认 `public` 等复制目录没有私人草稿、盘点文件、授权证明或其他秘密。以本次命令成功退出和 `ZIP ready` 日志为准，不能仅凭 `out/` 中存在旧文件认定打包成功。

## 四、FC 控制台配置

沿用生产函数名：`kelaibao-web-prod`。先部署新不可变版本到 test alias 验证，再按发布门禁决定是否切换生产流量。

创建或更新 FC 3.0 Web 函数时使用：

| 配置项 | 值 |
| --- | --- |
| 函数类型 | Web 函数 |
| 运行环境 | 自定义运行时 |
| Runtime | `custom.debian10` |
| 架构 | `x86_64` |
| 启动命令 | `node server.js` |
| Handler | 不填写，不适用 |
| 监听地址 | `0.0.0.0` |
| 监听端口 | `9000` |

基础环境变量：

```json
{
  "PATH": "/var/fc/lang/nodejs20/bin:/usr/local/bin:/usr/bin:/bin",
  "NODE_ENV": "production",
  "HOSTNAME": "0.0.0.0",
  "PORT": "9000",
  "TZ": "Asia/Shanghai",
  "SINO_RUNTIME_MODE": "production",
  "SINO_APP_VERSION": "<发布版本或Git提交号>"
}
```

以上只是启动与版本配置，完整契约见 [FC runtime 模板](deploy/fc-runtime.example.json)、[生产环境模板](deploy/fc-production-env.example.json) 和 [.env.example](.env.example)。`NODE_ENV` 控制 Node/Next.js 生产运行，`SINO_RUNTIME_MODE` 控制应用运行模式；后者默认为 `preview`，上线时须显式设置。生产域名相关公开变量也应与构建值一致。

新 FC 只注入实际使用的 DirectMail、询盘限频等秘密：`DIRECTMAIL_*` 使用独立最小权限身份，生产 endpoint 为 `https://dm.aliyuncs.com/`；`INQUIRY_RATE_KEY_SECRET` 为至少 32 字符的独立 HMAC 密钥。`x-esa-client-ip` 等客户端 IP 头必须由真实 ESA 回源链路覆盖并保护，实例/并发、WAF、日志、告警与费用上限须保留真实证据，不能把示例视为已生效。

不再注入 CMS 数据库、管理员、Session、OSS 上传或 worker 密钥。ESA 刷新身份只供受控发布工具使用，不注入 FC。新版本不运行数据库 migration、不初始化管理员；历史 RDS、OSS、数据、备份和凭据继续按原安全边界保留，不能因静态化擅自清库或退役。

## 五、上传和验证

在 FC 控制台选择“代码”→“上传代码”→“通过 ZIP 包上传代码”，上传 `out/kelaibao-fc.zip`，部署新版本并绑定 test alias。不要在验收前直接切换生产 alias。

部署后先验证：

```bash
curl -i 'https://<FC测试地址>/api/health'
```

确认 `/api/health` 返回 HTTP 200、JSON `status=ok`、`contentSource=static`、本次版本及预期 `runtimeMode`，缓存头为 `private, no-store, max-age=0`。该接口只报告应用配置与版本，不检查数据库连通、DirectMail 发信、ESA 缓存、内容迁移或生产门禁。

继续通过 FC test alias 及真实 ESA HTTPS 链路验证并留存证据：

- 首页、`/trial`、关于、媒体、政策、新闻/案例列表与详情首响应可用；canonical、metadata、JSON-LD 与本次正式域名/内容一致，无客户端 JS 也可阅读正文；
- `/robots.txt`、`/sitemap.xml`、`/feed.xml`、`/llms.txt` 一致，公开页面允许抓取与索引；`/opengraph-image` 返回 PNG，生成 WebP 可访问；
- manifest 中每条路径的 200/410/308 及跳转目标符合预期，未知文章返回 404；撤回路径及其尾斜杠形式返回真实 410；
- `/admin`、`/admin/login`、`/api/admin/*` 与 `/api/internal/cache-purge` 返回 404；`/api/*`、`/health` 禁止共享缓存；
- 用受控测试数据验证同域询盘、DirectMail、可信客户端 IP、限频和失败降级，不记录联系人或需求正文；健康检查成功不能代替这项验收。

首次由 CMS 切换时，先完成真实历史内容/URL/授权盘点、冻结旧写入口并保留备份；本地原型文章或空案例列表不能代替历史数据库核对。更新静态迁移证据，使其源码 digest 和完整 URL 映射与本次 manifest 一致。

保留上版制品和 manifest，在受控发布环境先审查精确缓存刷新计划：

```bash
pnpm cache:refresh --previous-manifest <上版manifest路径>
```

该命令默认只打印计划，要求 `NEXT_PUBLIC_SITE_URL` 为本次正式 HTTPS origin；首次切换的上版 manifest 须由核实的旧 URL 清单制作。核对后按部署指南使用独立发布身份执行 `--apply`，验证 ESA 异步任务完成及实际响应；提交被接受不代表刷新完成。robots 或其他不在自动计划中的变更路径须另行精确刷新，失败停止切流或回退。

生产切流前必须运行强制门禁并真实通过：

```bash
pnpm validate:release --require-production-live
```

生产证据不足时该命令退出 `1`，不得删减 blocker 或以默认校验成功替代。当前真实云、历史迁移、授权、备案、恢复和成本等门禁按实际证据保持 `BLOCKED/DEFERRED`。回退时切回上一个 FC 版本，按旧新 URL 并集刷新 ESA 并复验；旧 CMS 版本依赖的原数据库、媒体与运行配置须可恢复。

更完整的控制台部署、环境变量、网络和回退说明见：[FC部署指南](FC部署指南.md)。
