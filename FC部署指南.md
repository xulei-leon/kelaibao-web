# 客来宝 FC部署指南

更新日期：2026-10-09。适用于当前独立仓库 `kelaibao-web`，使用 FC 3.0 Web 函数、控制台 ZIP 上传、Linux x86_64 / Node.js 20 / Next.js standalone。

本指南合并替代原 `FC-Console-ZIP-Deployment-Manual.md` 和 `FC-Deployment-Runbook.md`，是 FC 配置、发布与回退的统一入口。历史评审和历史证据中的旧文件名仅表示当时的输入。

目标链路：`ESA → FC（公开 SSR、/admin、/api）→ RDS MySQL + 私有 OSS`，询盘通过 DirectMail 发信。CMS 只管理新闻和案例；数据库和媒体均不保存在 FC 临时磁盘。

操作顺序：准备资源 → 构建 ZIP → 创建 FC → 配置网络和环境变量 → 迁移数据库及初始化管理员 → test alias 验证 → 门禁通过后切换 production alias。

本指南和示例配置不代表真实云已验收；`M2-LEGACY-01` 的云运行、恢复等证据与 `M2-LEGACY-02` 的报价和预算仍须实际验证。

## 1. 准备资源

统一选择华南 1（深圳）。生产与 Preview 使用独立函数、数据库和凭据，避免测试写入生产；Preview 保持不索引。

| 资源 | 配置要求 |
| --- | --- |
| FC | 生产函数名 `kelaibao-web-prod`；Preview 函数名 `kelaibao-web-preview` |
| RDS MySQL | MySQL 8.0 兼容、项目专用数据库与受限应用账号；仅私网访问，开启自动备份 |
| VPC / 交换机 / 安全组 | FC 与 RDS 同地域且私网可路由；仅放行必要的 TCP 3306 |
| 私有 OSS | 项目专用 Bucket，关闭公共读、公共 ACL 和匿名列举 |
| ESA | 正式站域名 `www.klinktool.com`，以及独立的 HTTPS assets 域名；TLS、回源、WAF、限频和缓存 |
| DirectMail | 已验证发信域名、发信地址、获批收件邮箱和独立最小权限身份 |
| SLS / 云监控 | 项目专用日志和 FC、RDS、OSS、DirectMail、ESA 告警 |

RDS 的库名和账号可均使用 `kelaibao_web`，也可使用已有项目专用名称，但必须与连接串一致。应用账号只授予该库运行时读写权限；migration 使用独立身份执行建表和结构升级，不能给应用账号 `GRANT ALL`。

真实资源规格、费用及预算以购买页面、压测和监控为准。

## 2. 构建并生成 ZIP

### 2.1 构建环境

必须使用 Linux x86_64、Node.js 20.x、pnpm 10.34.5。可使用 Linux CI 或 WSL2 的 Linux 文件系统；macOS/Windows 开发产物不能直接上传。原生依赖 `argon2`、`sharp` 还需兼容 FC 的 Debian 10 / glibc，最终以 FC test alias 实测为准。

在干净 checkout 的项目根目录执行以下 Bash 命令。若需要切换 Node，先通过已安装的 nvm 执行 `nvm install 20`、`nvm use 20`；压缩工具缺失时在 Ubuntu/WSL2 安装 `zip unzip`。

```bash
set -euo pipefail
# 当前目录必须是独立 kelaibao-web 仓库根目录。
test -f package.json
test "$(uname -s)" = Linux
test "$(uname -m)" = x86_64
test "$(node -p 'process.versions.node.split(".")[0]')" = 20
corepack enable
corepack prepare pnpm@10.34.5 --activate
test "$(pnpm --version)" = 10.34.5
test "$(node -p 'require("./package.json").packageManager')" = pnpm@10.34.5

# Next.js 会读取本地环境文件；发现后停止，由运维安全移出，不自动删除。
if find . -maxdepth 1 -type f -name '.env*' ! -name '.env.example' -print -quit | grep -q .; then
  echo '请先安全移出项目根目录的本地 .env* 文件，再构建。' >&2
  exit 1
fi

pnpm install --frozen-lockfile
```

不复用其他系统、架构或 Node 主版本产生的 `node_modules`、`.next`。使用未注入数据库、Session、OSS、ESA、邮件等服务端秘密的独立构建环境。

### 2.2 公开构建变量

以下值会固化到浏览器 bundle。正式域名、企业微信和小程序二维码必须提前确认，正式二维码文件必须已经替换并验证；改变这些变量后需要重新构建 ZIP，仅修改 FC 环境变量不能替换浏览器中的值。

```bash
export NEXT_PUBLIC_SITE_URL='https://www.klinktool.com'
export NEXT_PUBLIC_SITE_ENV='production'
export NEXT_PUBLIC_CONTACT_FORM_STATUS='preview-only'
export NEXT_PUBLIC_WECHAT_DISPLAY_NAME='客来宝顾问'
export NEXT_PUBLIC_WECHAT_SERVICE_HOURS='工作日 9:30–18:00（中国标准时间）'
export NEXT_PUBLIC_WECHAT_QR_STATUS='production-wecom'
export NEXT_PUBLIC_MINI_PROGRAM_DISPLAY_NAME='K-Link'
export NEXT_PUBLIC_MINI_PROGRAM_QR_STATUS='production-mini-program'
export NEXT_PUBLIC_ANALYTICS_ENDPOINT=''
export PUBLIC_CRAWL_STATUS='blocked'
```

询盘入口在真实 DirectMail、政策和 WAF 等门禁通过前保持 `preview-only`。不得自行填写代码未支持的启用状态。抓取状态在正式域名、备案、政策及发布门禁通过前保持 `blocked`。

Preview 构建应替换为实际 Preview HTTPS 域名、`NEXT_PUBLIC_SITE_ENV=preview`，并使用已确认的 Preview 资源状态；FC 的 `SINO_RUNTIME_MODE` 同步设为 `preview`。

### 2.3 检查、构建、打包

```bash
pnpm test && pnpm lint && pnpm build
pnpm smoke:standalone
pnpm validate:release
pnpm package:fc
```

上传文件为 `out/kelaibao-fc.zip`，同时生成文件清单 `out/kelaibao-fc.files.txt` 和校验和 `out/kelaibao-fc.zip.sha256`。发布单记录 Git commit、发布版本、构建平台、Node/pnpm 版本、ZIP 大小和 SHA-256。

ZIP 根目录直接包含以下内容，不得多包一层 `standalone/`：

```text
server.js
package.json
node_modules/
.next/server/
.next/static/
public/
```

`pnpm build` 自动整理 standalone 的静态文件；保留 tracing 生成的其他文件。`pnpm package:fc` 会检查平台、根目录、禁入文件和符号链接，并在项目外独立解压验证 Next.js 依赖。它使用 `zip -qry` 保留 pnpm 符号链接，不能用普通 `zip -r` 或 Windows 压缩工具替代。

ZIP 不得包含 `.env*`、真实凭据、SQLite、本地数据或缓存。完整打包约束见 [FC-PACKAGING.md](FC-PACKAGING.md)。

## 3. 创建 FC Web 函数

登录 [FC 控制台](https://fcnext.console.aliyun.com)，选择华南 1（深圳）→ 函数管理 → 创建函数 → **Web 函数**。生产填写 `kelaibao-web-prod`；函数名称不填写域名或 ZIP 文件名。

### 3.1 代码和启动配置

以下字段分别填入控制台对应位置，不作为环境变量 JSON 导入：

| 控制台字段 | 直接填写值 |
| --- | --- |
| 函数类型 | Web 函数 |
| 运行环境 | 自定义运行时 |
| 自定义运行时版本 | Debian 10 / `custom.debian10` |
| 架构 | `x86_64` |
| 上传方式 | 通过 ZIP 包上传代码 |
| ZIP | `out/kelaibao-fc.zip` |
| 启动命令 | `node server.js` |
| 启动参数 | 留空 |
| Handler / 入口主函数 | 不适用；若要求填写，检查函数类型和运行时 |
| 监听端口 | `9000` |

无需在线安装依赖，ZIP 已包含运行依赖。环境变量 `PATH` 选择 `/var/fc/lang/nodejs20/bin` 中的 Node.js 20；`HOSTNAME=0.0.0.0` 和 `PORT=9000` 必须与监听配置一致。

### 3.2 初始资源配置

| 配置项 | 初始建议 |
| --- | --- |
| CPU / 内存 | 1 vCPU / 2 GB |
| 临时磁盘 | 512 MB，仅临时使用 |
| 单实例并发 | 10 |
| 请求执行超时 | 60 秒 |
| 最小 / 最大实例数 | 0 / 3；冷启动延迟不达标时再将最小设为 1 |

这些是待压测的起点。下方 JSON 的 `MYSQL_MAX_APP_INSTANCES=3` 要与实际 FC 最大实例数保持一致；修改 FC 实例上限时同时调整连接预算。

### 3.3 网络、角色和日志

进入函数“配置”对应页面完成：

1. **网络**：启用 VPC，选择与 RDS 可通信的 VPC、交换机和安全组。环境变量不会自动配置云网络。
2. **数据库入口**：仅使用 RDS 内网地址；RDS 白名单加入 FC 实际交换机网段，安全组仅允许必要 FC 来源访问 TCP 3306，不使用 `0.0.0.0/0`。
3. **HTTPS 出站**：确认 DNS 与路由能访问配置的 OSS、DirectMail、ESA endpoint；按 VPC 网络方案配置所需的公网访问能力或 NAT 出站，不能只验证数据库连通。
4. **RAM 角色**：绑定项目专用角色，授予必要日志写入、目标私有 OSS 的最小对象权限。RDS 表权限由数据库账号授予；ESA 刷新、DirectMail 使用各自独立最小权限身份。
5. **SLS**：开启项目专用 Logstore，禁止记录密码、Cookie、CSRF、签名 URL、AccessKey、token、数据库连接串和询盘个人信息。

当前 OSS provider 从环境变量读取 STS 凭据，绑定 FC RAM 角色不会自动替代这些配置。凭据轮换见第 5 节。

## 4. FC 环境变量：可复制 JSON

进入函数“配置”→“环境变量”→ JSON 编辑/导入。下面是完整生产配置模板，独立文件位于 [deploy/fc-production-env.example.json](deploy/fc-production-env.example.json)。

**先替换所有 `<…>` 为实际值，再复制到控制台**；不要把替换后的真实配置提交 Git、写进 ZIP 或发到聊天。所有 JSON 值均为字符串，不添加注释、`export` 或尾随逗号。更新已有函数时先核对当前完整配置，避免导入覆盖仍需保留的值。

模板从 [.env.example](.env.example) 的运行时变量整理，排除了 SQLite 和仅供 migration / 管理员维护命令使用的变量。`deploy/fc-runtime.example.json` 描述启动契约，不能作为此 JSON 导入。

```json
{
  "PATH": "/var/fc/lang/nodejs20/bin:/usr/local/bin:/usr/bin:/bin",
  "NODE_ENV": "production",
  "HOSTNAME": "0.0.0.0",
  "PORT": "9000",
  "TZ": "Asia/Shanghai",
  "NEXT_PUBLIC_SITE_URL": "https://www.klinktool.com",
  "NEXT_PUBLIC_SITE_ENV": "production",
  "PUBLIC_CRAWL_STATUS": "blocked",
  "NEXT_PUBLIC_CONTACT_FORM_STATUS": "preview-only",
  "NEXT_PUBLIC_WECHAT_DISPLAY_NAME": "客来宝顾问",
  "NEXT_PUBLIC_WECHAT_SERVICE_HOURS": "工作日 9:30–18:00（中国标准时间）",
  "NEXT_PUBLIC_WECHAT_QR_STATUS": "production-wecom",
  "NEXT_PUBLIC_MINI_PROGRAM_DISPLAY_NAME": "K-Link",
  "NEXT_PUBLIC_MINI_PROGRAM_QR_STATUS": "production-mini-program",
  "NEXT_PUBLIC_ANALYTICS_ENDPOINT": "",
  "SINO_RUNTIME_MODE": "production",
  "SINO_APP_VERSION": "<发布版本或Git提交号>",
  "DATABASE_URL": "mysql://kelaibao_web:<URL编码后的密码>@<RDS内网地址>:3306/kelaibao_web",
  "DATABASE_ADAPTER": "mysql",
  "DATABASE_RUNTIME_SCOPE": "deployment",
  "MYSQL_POOL_LIMIT": "2",
  "MYSQL_QUEUE_LIMIT": "4",
  "MYSQL_ACQUIRE_TIMEOUT_MS": "5000",
  "MYSQL_MAX_APP_INSTANCES": "3",
  "MYSQL_CONNECTION_BUDGET": "12",
  "ADMIN_DUMMY_PASSWORD_HASH": "<pnpm admin:dummy-hash输出的完整PHC字符串>",
  "ADMIN_CSRF_SECRET": "<32字节以上随机值的base64url字符串>",
  "ARGON2_MEMORY_COST_KIB": "19456",
  "ARGON2_TIME_COST": "2",
  "ARGON2_PARALLELISM": "1",
  "ARGON2_HASH_LENGTH": "32",
  "OSS_BUCKET_NAME": "<项目私有Bucket名称>",
  "OSS_BUCKET_ENDPOINT": "https://<Bucket名称>.oss-cn-shenzhen.aliyuncs.com",
  "OSS_ASSETS_BASE_URL": "https://<ESA图片分发域名>",
  "OSS_STS_ACCESS_KEY_ID": "<临时AccessKey ID>",
  "OSS_STS_ACCESS_KEY_SECRET": "<临时AccessKey Secret>",
  "OSS_STS_SECURITY_TOKEN": "<临时SecurityToken>",
  "OSS_STS_EXPIRES_AT": "<STS实际到期时间的ISO 8601字符串>",
  "ESA_PURGE_ENDPOINT": "https://<实际ESA API endpoint>",
  "ESA_SITE_ID": "<实际ESA站点的正整数ID>",
  "ESA_ACCESS_KEY_ID": "<独立ESA刷新身份AccessKey ID>",
  "ESA_ACCESS_KEY_SECRET": "<独立ESA刷新身份AccessKey Secret>",
  "ESA_SECURITY_TOKEN": "<ESA刷新身份SecurityToken>",
  "PURGE_WORKER_TOKEN": "<独立随机Bearer令牌，至少32字符>",
  "DIRECTMAIL_ENDPOINT": "https://dm.aliyuncs.com/",
  "DIRECTMAIL_ACCESS_KEY_ID": "<独立DirectMail身份AccessKey ID>",
  "DIRECTMAIL_ACCESS_KEY_SECRET": "<独立DirectMail身份AccessKey Secret>",
  "DIRECTMAIL_ACCOUNT_NAME": "<已验证的DirectMail发信地址>",
  "DIRECTMAIL_FROM_ALIAS": "客来宝",
  "DIRECTMAIL_TO_ADDRESS": "<获批询盘收件邮箱>",
  "DIRECTMAIL_TIMEOUT_MS": "5000",
  "INQUIRY_CLIENT_IP_HEADER": "x-esa-client-ip",
  "INQUIRY_RATE_KEY_SECRET": "<独立随机HMAC密钥，至少32字符>",
  "INQUIRY_RATE_LIMIT_MAX": "5",
  "INQUIRY_RATE_LIMIT_WINDOW_MS": "900000",
  "INQUIRY_DEDUPE_TTL_MS": "600000",
  "INQUIRY_GUARD_MAX_ENTRIES": "1000"
}
```

配置时注意：

- `SINO_RUNTIME_MODE`、`SINO_APP_VERSION` 是现有内部兼容变量名，保留；不用于建立其他品牌或第二应用。
- `DATABASE_URL` 中密码的 `@`、`:`、`/`、`?`、`#`、`%` 等保留字符必须百分号编码。不要将真实密码放在 URL 编码网站或命令参数中。
- `MYSQL_POOL_LIMIT × MYSQL_MAX_APP_INSTANCES ≤ MYSQL_CONNECTION_BUDGET`。模板为 `2 × 3 ≤ 12`；RDS 还需为迁移、运维及其他应用连接预留容量。
- `ADMIN_DUMMY_PASSWORD_HASH` 在受控环境运行 `pnpm admin:dummy-hash` 生成，复制完整 PHC 字符串。Argon2 参数要与管理员初始化时一致。
- 在受控终端运行 `node -e 'console.log(require("node:crypto").randomBytes(32).toString("base64url"))'` 生成随机值。为 `ADMIN_CSRF_SECRET`、`PURGE_WORKER_TOKEN`、`INQUIRY_RATE_KEY_SECRET` **分别执行一次**，输出直接写入受控配置。
- `NEXT_PUBLIC_*` 应与第 2 节构建时一致；秘密禁止使用该前缀。`ADMIN_USERNAME`、`ADMIN_PASSWORD`、`ADMIN_OPERATION_REASON_CODE` 仅临时注入维护命令，不长期放入 FC。
- 保存后部署或重启实例，让新配置生效。数据库密码和 STS 等轮换时同步核对生效版本与 alias，不能只修改草稿配置。

## 5. 数据库、管理员和 OSS 初始化

### 5.1 数据库迁移与管理员

使用可访问 RDS 私网的受控 release 环境（例如临时 ECS），在项目根目录显式执行；ZIP 中不运行迁移脚本。

1. 确认迁移前 RDS 备份可用，正式上线前完成恢复到隔离实例的演练。
2. 临时注入独立迁移账号的 `DATABASE_URL`，执行 `pnpm db:migrate`。当前必须应用全部 `001`～`005` MySQL migration，包括新闻软删除的 `005_news_soft_delete.sql`。
3. 迁移成功后临时注入管理员维护所需的受限数据库身份及 `ADMIN_USERNAME`、`ADMIN_PASSWORD`、`ADMIN_OPERATION_REASON_CODE`，执行 `pnpm admin:bootstrap`。密码至少 14 个字符，原因码使用稳定代码，例如 `INITIAL_SETUP`。
4. 清除临时凭据，FC 改用应用读写账号。确认 RDS 控制台“账号管理”已授权该账号访问业务库；DMS 可以查表不代表 FC 账号有权限。

命令入口（变量由受控秘密系统临时注入，不在命令文本写入真实凭据）：

```bash
pnpm db:migrate
pnpm admin:bootstrap
```

migration 获取 MySQL advisory lock，任何失败都停止发布。MySQL DDL 会隐式提交，不能假定事务可回滚全部建表操作；保留成功语句和迁移版本记录，按 expand-only / backward-compatible 规则处理。迁移不得由冷启动、应用启动或请求触发。手动 DMS 路径见 [RDS 迁移手册](docs/2-Design/RDS-DMS-Database-Migration-Runbook.md)，执行前核对它是否覆盖当前全部迁移。

### 5.2 私有 OSS 与图片分发

- `OSS_BUCKET_ENDPOINT` 填 Bucket 的实际 HTTPS origin；`OSS_ASSETS_BASE_URL` 填独立的 HTTPS ESA assets origin，不能填 OSS 直连地址或附带路径的 URL。
- 为上传和确认身份限定目标 Bucket 的 `pending/`、`media/` 所需操作权限；ESA 单独配置私有 OSS 的鉴权回源，只允许对外分发确认后的 `media/`，不开放临时 `pending/`。
- OSS CORS 仅允许正式后台的精确 origin（例如 `https://www.klinktool.com`），允许 PUT 及实际所需的 `Content-Type`、`x-oss-*` 请求头，并验证 OPTIONS 预检；浏览器 PUT 不携带 Cookie。
- 上传仅接受 JPEG、PNG、WebP，单文件最大 10 MB。后台向 `/api/admin/media/presign` 申请短期签名，浏览器直传 `pending/`，再通过 `/api/admin/media/confirm` 校验 MIME、大小、魔数、SHA-256、归属及有效期，确认后提升至不可变 `media/` 并写入数据库。
- **当前实现不自动获取或续期 STS。** 运维必须在到期前更新 `OSS_STS_ACCESS_KEY_ID`、`OSS_STS_ACCESS_KEY_SECRET`、`OSS_STS_SECURITY_TOKEN`、`OSS_STS_EXPIRES_AT` 并确保实例使用新配置。配置解析要求至少剩余 60 秒有效期；过期或缺失会阻断图片上传和确认。正式长期运行必须落实受控轮换流程，不能一次填写后永久使用。

更多安全细节见 [管理员与媒体运行手册](docs/2-Design/Admin-Security-and-Media-Runbook.md)。

## 6. 部署 ZIP、健康检查和 test alias 验证

进入函数详情 → 代码 → 上传代码 → 通过 ZIP 包上传 → 选择 `out/kelaibao-fc.zip` → 核对启动配置、网络及环境变量 → 部署代码。ZIP 超出当前控制台限制时按控制台规则通过同地域私有 OSS 上传，制品 Bucket 不得公共读。

在“高级配置”→“健康检查”中填写：

| 字段 | 值 |
| --- | --- |
| 请求路径 / 方法 | `/api/health` / GET |
| 首次探测延迟 / 间隔 | 10 秒 / 30 秒 |
| 探测超时 | 5 秒 |
| 最大失败次数 / 成功阈值 | 3 / 1 |

发布不可变 FC 版本，并将 `test` alias 指向新版本。使用控制台提供的受控测试 URL 验证启动：

```bash
curl -i 'https://<FC测试地址>/api/health'
curl -i 'https://<FC测试地址>/'
curl -i 'https://<FC测试地址>/admin'
curl -i 'https://<FC测试地址>/opengraph-image'
```

预期 `/api/health` 为 HTTP 200、`status=ok`、`version` 等于 `SINO_APP_VERSION`、`Cache-Control: private, no-store, max-age=0`；首页包含客来宝 HTML；未登录 `/admin` 重定向登录页；Open Graph 返回 PNG。日志无启动失败、原生模块错误或 OOM。

**`/api/health` 只校验基础运行配置，不执行数据库查询，也不证明 OSS、邮件正常。** 继续验证 `/news`、`/cases` 的真实 RDS 查询，并通过配置为 test alias 的受控 ESA 测试链路验证管理员登录、创建、保存、发布、下线、图片上传/确认/分发、询盘失败降级和日志脱敏。CMS 变更接口严格校验 canonical Host/Origin，直接使用 FC 默认域名进行变更会被拒绝；测试链路域名须与该环境构建及运行时的 `NEXT_PUBLIC_SITE_URL` 一致。

Preview 函数使用独立测试域名完成全流程，再在生产 test alias 上受控验证正式构建；不要将生产域名临时全量指向未经门禁的新版本。测试仅使用受控账号和无真实客户信息的数据。

## 7. ESA 回源、缓存与生产切流

在 ESA 中将站点源站指向受控 FC `production` alias 入口，核对 HTTPS、canonical Host 保留及来源限制，限制访客绕过 ESA 直连 FC。

| 路径 | 缓存要求 |
| --- | --- |
| `/admin`、`/admin/*`、`/api/*`、`/health` | 禁止共享缓存，不缓存 Session / Cookie 响应 |
| `/news`、`/news/*`、`/cases`、`/cases/*`、`/feed.xml`、`/sitemap.xml`、`/llms.txt` | 最长 60 秒，发布后精确刷新 |
| `/_next/static/*`、`/visual/generated/*`、确认后的不可变媒体 | 版本化长期缓存 |

ESA 必须覆盖并保护 `x-esa-client-ip`，不能信任访客自行提交该头；WAF/限频承担跨 FC 实例的强制保护。DirectMail 通过配置的独立 HTTPS API 身份发送邮件，询盘不写数据库。

CMS 发布会写入刷新任务，必须安排受控定时调用器周期执行以下 HTTP 请求。当前 Web 函数没有把 Timer 事件转换为此 HTTP 调用的入口；应配置能实际发送 HTTPS 请求的独立调用器，并验证成功、重试和告警：

```http
POST https://www.klinktool.com/api/internal/cache-purge
Authorization: Bearer <与FC配置一致的PURGE_WORKER_TOKEN>
```

请求必须经过该环境的 canonical origin；令牌放入受控秘密，不放 URL 或公开 Timer payload。每次最多处理 10 个任务；调用间隔及 ESA TTL 必须满足发布/下线后不超过 60 秒缓存要求，并有真实证据。配置 `ESA_*` 环境变量本身不会自动启动定时任务。

生产切流前执行：

```bash
pnpm validate:release
pnpm validate:release -- --require-production-live
```

默认输入为 `docs/5-Evidence/m3-05/gate-input.json`，M2-05 输入仅保留为历史证据。第一条检查清单格式，清单明确 `BLOCKED` 时也可零退出；第二条要求所有 mandatory production gate 为真实 `PASS`，缺少真实云证据时必须非零退出。

上线前至少完成真实 FC/RDS/OSS/ESA/DirectMail、连接容量、STS/CORS、缓存刷新、告警、RDS 备份恢复、FC 回退、上一版本与新 schema 兼容、域名备案、政策与二维码、CMS 内容及成本预算等门禁。证据记录日期、命令或 HTTP 请求、预期/实际结果、脱敏资源与地域、证据路径和敏感信息检查；不以构建或本地 fixture 替代。

全部门禁通过后才把 `production` alias 切到新版本；按已批准的抓取计划将 `PUBLIC_CRAWL_STATUS` 改为代码支持的 `production-approved`，部署使其生效并验证 robots/sitemap。公开构建值若需修改，重新构建发布。

## 8. 回退

1. 停止扩大流量和后续 schema 操作，核对故障范围。
2. 确认上一应用与当前已迁移 schema 兼容。独立记录 `fc_previous_app_new_schema_compatibility`：`previousAppVersion`、`migrationVersion`、`schemaState`、`commandOrProbe`、`expectedResult`、`actualResult`、`evidencePath`。在隔离 RDS 上应用目标迁移，用上一不可变 FC 版本验证认证、内容读写、公开查询及询盘降级。
3. 将 `production` alias 切回上一健康不可变版本，确认当时配置中的凭据仍有效；不覆盖上传旧 ZIP，不以删除生产数据回退应用。
4. 验证健康、首页、后台、新闻、案例和询盘降级，仅刷新受影响 ESA URL。
5. 保留脱敏事件时间线。兼容矩阵、RDS 恢复、FC rollback 是三项独立证据，不能互相替代。

## 9. 常见故障

| 现象 | 检查与处理 |
| --- | --- |
| `FunctionNotStarted` / `node: command not found` | Web 函数、`custom.debian10`、Node 20 PATH、`0.0.0.0`、监听端口与 PORT 均为 9000 |
| 找不到 `/code/server.js` | ZIP 根目录多包了一层；重新使用 `pnpm package:fc` |
| `CAExited` / 缺少 `styled-jsx/package.json` | pnpm 符号链接被展开；用脚本保留链接并独立解压检查 |
| 原生模块失败 / `GLIBC_xxx not found` | 在兼容 Debian 10 的 Linux x86_64 / Node 20 环境重建；不复制系统库绕过 |
| 字体包下载超时 | 保留 Linux pnpm store，运行 `pnpm install --frozen-lockfile --fetch-timeout=600000 --fetch-retries=5`；必要时追加 `--registry=https://registry.npmjs.org/`，不删 lockfile 或字体依赖 |
| 页面资源 404 | ZIP 是否含 `.next/static`、`public`；重建完整 standalone |
| 健康 503 | 基础运行时、MySQL adapter、连接串格式、连接预算；不是数据库连通性 probe |
| RDS 超时 / 1044 / 1045 | 分别核对 VPC/白名单/安全组、应用账号业务库授权、账号密码和来源；轮换密码后部署销毁旧连接池 |
| 图片上传失败 | STS 是否过期、签名权限、Bucket endpoint、CORS 预检、确认流程和 ESA 私有回源 |
| 发布后缓存未更新 | ESA 权限、刷新任务、HTTP 定时调用器与 TTL，不只检查环境变量 |
| CMS 变更 403 | Session、CSRF、canonical Host/Origin，不能直接使用 FC 内部域名 |
| 冷启动 / OOM / 502 / 504 | SLS、内存、实例数、请求超时和下游出站；以真实压测调整 |

## 10. 配套资料

- [完整阿里云资源部署指南](docs/2-Design/Alibaba-Cloud-Deployment-Guide.md)
- [阿里云全栈架构规格](docs/2-Design/Alibaba-Cloud-Fullstack-Architecture-Spec.md)
- [管理员与媒体运行手册](docs/2-Design/Admin-Security-and-Media-Runbook.md)
- [创建 Web 函数](https://help.aliyun.com/zh/functioncompute/creating-a-web-function.md)
- [自定义运行时](https://help.aliyun.com/zh/functioncompute/custom-runtime.md)
- [HTTP Server 原理](https://help.aliyun.com/zh/functioncompute/principles-1.md)
- [实例健康检查](https://help.aliyun.com/zh/functioncompute/configure-a-custom-health-check-policy-for-instances-1.md)
- [FC 配额与限制](https://help.aliyun.com/zh/functioncompute/limits-of-usage.md)

控制台字段名称、ZIP 配额和可用运行时以部署时阿里云实际页面为准；本次整理核对项目源码、示例及已确认评审，没有连接云资源执行发布验收。
