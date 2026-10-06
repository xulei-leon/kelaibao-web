# 客来宝 FC 3.0 控制台 ZIP 部署操作手册

| 字段 | 内容 |
| --- | --- |
| 适用项目 | `products/kelaibao/` |
| 适用部署 | 阿里云函数计算 FC 3.0 Web 函数，控制台上传 ZIP |
| 目标地域 | 华南 1（深圳） |
| 应用形态 | Next.js 15 standalone，Node.js 20，x86_64 Linux |
| 更新日期 | 2026-08-14 |
| 生产状态 | 本手册只说明部署操作；真实云、合规、恢复和成本门禁仍须单独通过 |

## 1. 最终配置摘要

本项目不是事件函数，不填写 `index.handler` 一类入口主函数。FC 启动 ZIP 根目录中的 Next.js standalone HTTP Server。

| FC 控制台配置 | 本项目取值 |
| --- | --- |
| 函数名称 | Production：`kelaibao-web-prod`；Preview：`kelaibao-web-preview` |
| 函数类型 | `Web 函数` |
| 运行环境 | `自定义运行时` |
| Runtime 标识 | `custom.debian10` |
| CPU 架构 | `x86_64` |
| Node.js | 20；通过 `PATH=/var/fc/lang/nodejs20/bin:...` 选择 |
| 代码上传 | 通过 ZIP 包上传代码 |
| 启动命令 | `node server.js` |
| 入口主函数/Handler | 不适用，不填写 |
| 监听端口 | `9000` |
| 环境变量 | `PORT=9000`、`HOSTNAME=0.0.0.0` |
| 健康检查 | HTTP GET `/api/health` |
| 建议初始规格 | 1 vCPU、2 GB 内存、512 MB 临时磁盘 |
| 建议初始并发 | 单实例并发 10，压测后调整 |
| 建议初始实例数 | Preview/低流量 Production 最小 0；对冷启动敏感时再设 1 |
| 建议初始最大实例数 | 3，结合预算和压测再调整 |
| 执行超时 | 60 秒 |
| 持久化 | 不使用 FC 临时磁盘；业务数据默认写阿里云 RDS MySQL，媒体写私有 OSS |

上述规格、并发和实例数是个人创业阶段的保守起点，不是容量测试结论。正式上线前必须根据真实流量、P95 延迟和费用门禁调整。

## 2. 部署前硬门禁

### 2.1 必须在 Linux x86_64 构建

FC 运行在 Linux x86_64。本项目包含 `argon2`、`sharp` 等原生依赖，不能把 Windows 上生成的 `.next/standalone` 直接上传到 FC。

构建环境必须满足：

- Linux x86_64；推荐使用 Linux CI、WSL2 内部的 Linux 文件系统，或经过验证的 Linux 构建机。
- Node.js 20.x。
- pnpm 10.34.5，与 `package.json` 的 `packageManager` 一致；pnpm 11.9.0 要求 Node.js 22.13+，不得用于本手册的 Node.js 20 构建环境。
- 构建和安装依赖都在同一个 Linux 环境完成，不能复用 Windows 的 `node_modules` 或 `.next`。

如果在 Windows 开发，推荐把仓库克隆到 WSL2 的 Linux 文件系统，例如 `~/code/tokengate`，不要在 `/mnt/d/...` 中复用现有 Windows 依赖。

#### Windows 开发机使用 WSL2 构建

可以在 Windows 的 WSL2 Linux 环境中完成构建、ZIP 打包并上传 FC。WSL2 运行真实 Linux 内核，能够生成 FC 所需的 Linux x86_64 依赖；WSL1 不作为本项目的受支持构建环境。

必须遵守以下边界：

- 仓库推荐克隆到 WSL2 自己的 Linux 文件系统，例如 `~/code/tokengate`。不要直接在 `/mnt/c/...`、`/mnt/d/...` 中复用 Windows 工作区的 `node_modules`、`.next` 或 junction/symlink。
- 必须在 WSL2 内重新执行依赖安装、测试、构建、standalone smoke 和 ZIP 打包；不能在 Windows 构建后只进入 WSL2 压缩。
- WSL2 发行版和 CPU 架构必须是 Linux x86_64，可用 `uname -s` 和 `uname -m` 检查，预期分别为 `Linux` 和 `x86_64`。
- ZIP 必须使用 WSL2 内的 Linux `zip` 命令生成，避免 Windows 压缩工具改变符号链接、权限或遗漏 `.next`。
- 上传后必须先发布到 FC test alias，验证 Node 启动、`argon2`、`sharp`、Open Graph 图片和完整 standalone smoke，再允许切换 production alias。

推荐首次准备方式：

```bash
# 在 WSL2 终端中执行。将仓库放在 Linux 文件系统，而不是 /mnt/d。
mkdir -p ~/code
cd ~/code
# 将示例地址替换为已授权的仓库 HTTPS 地址。
git clone https://github.com/OWNER/REPOSITORY.git tokengate
cd tokengate/products/kelaibao

uname -s
uname -m
node --version
```

如果仓库只能从 Windows 工作区复制到 WSL2，也必须排除生成目录，然后在 WSL2 内重新安装。复制过来的 `.env*` 不得参与生产构建；下文的构建前检查会在发现本地环境文件时停止：

```bash
cd ~/code/tokengate/products/kelaibao
rm -rf node_modules .next .next-dev
corepack enable
corepack prepare pnpm@10.34.5 --activate
pnpm install --frozen-lockfile
```

构建完成后检查原生模块平台：

```bash
find .next/standalone -type f -name '*.node' -print
```

输出路径不得包含 `win32` 或 `darwin`。发现任一非 Linux 原生模块时，当前制品无效，必须删除 `node_modules` 和 `.next` 后在 WSL2 内重新安装及构建。

WSL2 发行版的 glibc 可能比 FC `custom.debian10` 更新。如果依赖安装过程从源码编译了原生模块，上传后可能出现 `GLIBC_xxx not found`。遇到该错误时，不得通过忽略错误或复制系统库解决；应在 WSL2 内使用 Debian 10 兼容的 x86_64 容器/构建镜像，或使用与 FC 运行时兼容的 Linux CI 重新构建。即使本地 smoke 成功，也不能替代 FC test alias 的真实运行时验证。

### 2.2 构建期和运行期环境变量分离

以下 `NEXT_PUBLIC_*` 值会进入浏览器 bundle，必须在生产构建时提供真实的、允许公开的值：

```text
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_SITE_ENV
NEXT_PUBLIC_CONTACT_FORM_STATUS
NEXT_PUBLIC_WECHAT_DISPLAY_NAME
NEXT_PUBLIC_WECHAT_SERVICE_HOURS
NEXT_PUBLIC_WECHAT_QR_STATUS
NEXT_PUBLIC_MINI_PROGRAM_DISPLAY_NAME
NEXT_PUBLIC_MINI_PROGRAM_QR_STATUS
NEXT_PUBLIC_ANALYTICS_ENDPOINT
```

它们不是秘密。数据库、Session、OSS、DirectMail、ESA 等服务端秘密不得在构建阶段注入，只能配置到 FC 运行时或独立 release job。

## 3. 在 Linux 本地生成 standalone 制品

进入项目目录：

```bash
cd products/kelaibao
```

确认工具版本：

```bash
node --version
corepack enable
corepack prepare pnpm@10.34.5 --activate
pnpm --version
```

`node --version` 应为 `v20.x`，`pnpm --version` 应为 `10.34.5`。

清除其他操作系统留下的依赖和构建结果，确认没有本地环境文件，再重新安装。这里只能删除当前项目内已确认的生成目录；环境文件只检查并停止，不自动删除：

```bash
rm -rf node_modules .next .next-dev

if find . -maxdepth 1 -type f -name '.env*' ! -name '.env.example' -print -quit | grep -q .; then
  echo 'Production build refused: move local .env* files out of the project first.' >&2
  find . -maxdepth 1 -type f -name '.env*' ! -name '.env.example' -print
  exit 1
fi

pnpm install --frozen-lockfile
```

### 3.1 pnpm 下载大字体包超时

`@fontsource/noto-sans-sc@5.3.0` 的压缩包约为 73 MB，并由 Open Graph 图片构建代码使用。出现以下日志时，失败发生在 registry 下载阶段，不是 lockfile、Next.js 编译或字体代码错误：

```text
GET https://registry.npmmirror.com/@fontsource/noto-sans-sc/-/noto-sans-sc-5.3.0.tgz error (23)
The operation was aborted due to timeout
```

先确认构建仍在 Linux x86_64，并切换到与 FC 一致的 Node.js 20。以下命令适用于已经安装 `nvm` 的构建机：

```bash
nvm install 20
nvm use 20
corepack enable
corepack prepare pnpm@10.34.5 --activate

node --version
pnpm --version
pnpm config get registry
```

`node --version` 必须为 `v20.x`，`pnpm --version` 必须为 `10.34.5`。如果 pnpm 11.9.0 报告需要 Node.js 22.13 或出现 `ERR_UNKNOWN_BUILTIN_MODULE: node:sqlite`，说明 pnpm 版本不兼容 Node.js 20；不要因此升级 FC 构建 Node.js，按上述命令切回项目固定的 pnpm 10.34.5。Node.js 24 也不得用于生成本手册面向 FC Node.js 20 的生产制品。

Corepack 会优先采用当前项目 `package.json` 的 `packageManager`，`corepack prepare ... --activate` 不会覆盖项目声明。执行以下检查：

```bash
node -p "require('./package.json').packageManager"
```

预期输出必须为 `pnpm@10.34.5`。如果仍是 `pnpm@11.9.0`，说明 Linux 构建目录尚未同步当前项目文件；应先同步最新 `package.json`。需要立即修正当前检出时可执行：

```bash
npm pkg set packageManager=pnpm@10.34.5
corepack prepare pnpm@10.34.5 --activate
hash -r

node -p "require('./package.json').packageManager"
pnpm --version
```

如果仍需区分 Corepack 项目解析与 shim/cache 问题，可显式运行 `corepack pnpm@10.34.5 --version`；该命令应输出 `10.34.5`。无需仅为版本切换清空整个 Corepack 或 pnpm 缓存。

先保留已下载的 pnpm store 和当前 Linux `node_modules`，延长单次下载超时后重试：

```bash
pnpm install \
  --frozen-lockfile \
  --fetch-timeout=600000 \
  --fetch-retries=5
```

如果 `registry.npmmirror.com` 仍然超时，使用命令行参数仅为本次安装切换到 npm 官方 registry，不修改 lockfile：

```bash
pnpm install \
  --frozen-lockfile \
  --registry=https://registry.npmjs.org/ \
  --fetch-timeout=600000 \
  --fetch-retries=5
```

安装成功后，在同一个 Node.js 20 环境重新处理原生依赖，再继续正常构建门禁：

```bash
pnpm rebuild argon2 sharp
pnpm build
pnpm smoke:standalone
```

不要因为该超时改用 `pnpm install --prod`、删除 `@fontsource/noto-sans-sc`、修改 `pnpm-lock.yaml` 或跳过完整安装；构建需要该字体包。仅当依赖来自其他操作系统、CPU 架构或 Node.js 主版本时，才按本节前述硬门禁清理当前项目的 `node_modules` 和 `.next` 后重新安装。

设置当前确认的生产构建变量：

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

在 DirectMail、政策、WAF 和 release gate 全部批准前，询盘状态保持 `preview-only`。在正式域名、备案、政策和搜索引擎开放门禁全部通过前，抓取状态保持 `blocked`。只有代码和已确认 FR 明确定义生产启用值后才能修改，不能自行发明状态字符串。

执行质量门禁和构建：

```bash
pnpm test
pnpm lint
pnpm build
pnpm smoke:standalone
pnpm validate:release
```

`pnpm build` 会依次：

1. 生成响应式图片；
2. 执行 `next build`；
3. 生成 `.next/standalone/server.js`；
4. 把 `.next/static` 和 `public` 复制进 standalone 制品；
5. 检查制品中没有本地 SQLite 数据。

`pnpm validate:release -- --require-production-live` 在真实云门禁尚未关闭时预期失败，不应绕过。它不是生成 ZIP 的前提，但在正式生产切流前必须成功。

## 4. ZIP 应包含哪些文件

不要打包整个 Git 仓库。应打包 `.next/standalone/` 目录的全部内容，不能自行删减 Next.js tracing 生成的文件。

典型目录结构如下：

```text
.next/standalone/
├── .next/
│   ├── server/
│   ├── static/
│   └── ...
├── node_modules/
├── public/
├── src/                  # 若 tracing 生成则必须保留
├── package.json
└── server.js
```

ZIP 解压后的根目录必须直接出现：

```text
server.js
package.json
.next/
node_modules/
public/
```

错误结构是多包了一层目录：

```text
kelaibao-fc.zip
└── standalone/
    └── server.js
```

这种结构会让 `node server.js` 在 `/code` 根目录找不到入口文件。

以下内容不得进入 ZIP：

- `.env`、`.env.local` 或任何真实凭据；
- Git 元数据、文档、测试、设计稿和源仓库的完整 `node_modules`；
- `.next/cache`、`.next-dev`、覆盖率文件；
- `.local-data`、SQLite 文件及其 WAL/SHM/journal；
- AccessKey、数据库 URL、Session/CSRF secret、询盘 PII。

## 5. ZIP 打包与检查

完成第 3 节的 Linux 构建和 standalone smoke 后，推荐在项目目录执行一键打包脚本：

```bash
pnpm package:fc
```

该脚本执行本节的环境、制品、ZIP 根目录、禁入文件、符号链接和独立解压依赖检查。脚本会在打包前删除 standalone 中的 `.next/cache`、`.local-data` 以及 `out/` 中同名的旧 ZIP、清单和校验文件；无论成功或失败，都会在退出时删除本次独立解压使用的临时目录，失败时还会删除本次生成的半成品 ZIP、清单和校验文件。脚本不会替代 `pnpm build` 或 `pnpm smoke:standalone`。

以下命令保留为脚本所执行步骤的人工核对依据。

先检查入口和原生依赖平台：

```bash
test -f .next/standalone/server.js
test -d .next/standalone/.next/static
test -d .next/standalone/public
find .next/standalone -type f -name '*.node' -print
```

输出路径不得包含 `win32` 或 `darwin`。如果发现它们，停止上传，回到干净的 Linux x86_64 环境重新安装依赖和构建。

创建 ZIP：

```bash
mkdir -p out
rm -f out/kelaibao-fc.zip
cd .next/standalone
zip -qry ../../out/kelaibao-fc.zip .
cd ../..
```

`-y` 必须保留 pnpm 在 standalone 制品中的符号链接。不要改回普通 `zip -r`：它会跟随并展开 `node_modules/next`，改变 Next.js 包的真实路径，使其无法从 pnpm virtual store 解析 `styled-jsx` 等传递依赖；FC 启动时会因此报 `CAExited` 和 `Cannot find module 'styled-jsx/package.json'`。

确定性验证 ZIP 根目录、静态资源、禁入文件和校验和：

```bash
unzip -Z1 out/kelaibao-fc.zip > out/kelaibao-fc.files.txt

grep -qx 'server.js' out/kelaibao-fc.files.txt
grep -qx 'package.json' out/kelaibao-fc.files.txt
grep -q '^node_modules/' out/kelaibao-fc.files.txt
grep -q '^\.next/server/' out/kelaibao-fc.files.txt
grep -q '^\.next/static/' out/kelaibao-fc.files.txt
grep -q '^public/' out/kelaibao-fc.files.txt

# node_modules/next 在 ZIP 中必须仍是 Unix symbolic link（首列以 l 开头）。
zipinfo -l out/kelaibao-fc.zip node_modules/next | grep -q '^l'

if grep -Eq '(^|/)\.env([^/]*)(/|$)|(^|/)\.local-data(/|$)|\.sqlite(-(wal|shm|journal))?$' out/kelaibao-fc.files.txt; then
  echo 'ZIP contains forbidden environment or SQLite data.' >&2
  exit 1
fi

sha256sum out/kelaibao-fc.zip > out/kelaibao-fc.zip.sha256
du -h out/kelaibao-fc.zip
```

上传前在项目目录之外解压一次，并验证 FC 将要使用的独立制品能够解析 Next.js 运行时依赖：

```bash
artifact_check_dir="$(mktemp -d)"
trap 'rm -rf -- "$artifact_check_dir"' EXIT

unzip -q out/kelaibao-fc.zip -d "$artifact_check_dir"
test -L "$artifact_check_dir/node_modules/next"
(
  cd "$artifact_check_dir"
  node -e 'require("./node_modules/next/dist/server/require-hook.js")'
)

rm -rf -- "$artifact_check_dir"
trap - EXIT
```

该检查必须无错误退出。它不能在原项目目录直接执行，否则 Node.js 可能回退读取源仓库的 `node_modules`，掩盖 ZIP 内缺失的依赖。

全部命令必须成功；`server.js` 和 `package.json` 必须位于 ZIP 根目录，traced `node_modules/`、`.next/server/`、`.next/static/` 与 `public/` 必须存在。运行能力仍由 `node server.js` 的本地 standalone smoke 验证，不依据归档条目顺序人工判断。华南 1（深圳）当前官方文档允许控制台、开发者工具或 OSS 指定的 ZIP 代码包最大 500 MB；若实际控制台限制或产品规则变化，以控制台和阿里云实时文档为准。

建议把以下信息记录到发布单，但不要记录秘密：

```text
Git commit
SINO_APP_VERSION
构建时间
构建系统和 CPU 架构
Node/pnpm 版本
ZIP 文件大小
ZIP SHA-256
```

## 6. 在 FC 控制台创建 Web 函数

1. 登录[函数计算控制台](https://fcnext.console.aliyun.com)。
2. 进入“函数管理”→“函数列表”。
3. 地域选择“华南 1（深圳）”。
4. 单击“创建函数”。
5. 函数类型选择“Web 函数”，不要选择事件函数或任务函数。
6. 函数名称可使用 `kelaibao-web-prod`；Preview 建议使用独立名称 `kelaibao-web-preview`。

### 6.1 函数名称如何填写

本次正式生产函数填写：

```text
kelaibao-web-prod
```

“函数名称”是 FC 控制台内用于识别函数资源的名称，不是网站域名、访问 URL、品牌展示名称、ZIP 文件名或 Node.js 入口文件。不要填写以下内容：

```text
https://www.klinktool.com
www.klinktool.com
客来宝
kelaibao-fc.zip
server.js
```

命名约定：

- 只使用小写英文字母、数字和连字符，便于 CLI、日志、RAM 策略和监控统一引用。
- 名称应同时表达应用、用途和环境；本项目采用 `<应用>-<用途>-<环境>`。
- Production 固定使用 `kelaibao-web-prod`，Preview 使用独立函数 `kelaibao-web-preview`，不得把两个环境上传到同一个函数反复覆盖。
- 正式域名 `www.klinktool.com` 在 ESA、自定义域名或触发器的域名配置中绑定，不写入函数名称。
- 创建后应把函数名称记录到发布单、RAM 授权范围、SLS 查询和告警配置中。若需要改名，按新名称创建函数并重新核对角色、触发器、ESA 回源、环境变量和发布 alias，不能只修改域名配置。

### 6.2 基础规格

首次验证可使用：

| 参数 | 建议值 | 说明 |
| --- | --- | --- |
| vCPU | 1 | 给 Next.js 冷启动和 Argon2 留出基础 CPU |
| 内存 | 2 GB | 低于此值必须以真实冷启动和并发测试证明可用 |
| 临时磁盘 | 512 MB | 仅运行时临时空间，不保存业务数据 |
| 单实例并发度 | 10 | 初始值；验证登录、发布和 SSR 并发后调整 |
| 执行超时 | 60 秒 | 普通 HTTP 请求不应长期占用实例 |
| 最小实例数 | 0 | 控制早期成本；延迟不达标时再设 1 |
| 最大实例数 | 3 | 初始费用保护；正式值必须结合流量和预算 |

### 6.3 函数代码

配置如下：

| 控制台字段 | 值 |
| --- | --- |
| 运行环境 | 自定义运行时 |
| 自定义运行时版本 | Debian 10 / `custom.debian10` |
| 代码上传方式 | 通过 ZIP 包上传代码 |
| ZIP 文件 | `out/kelaibao-fc.zip` |
| 启动命令 | `node server.js` |
| 启动参数 | 留空 |
| 监听端口 | `9000` |
| Handler/入口主函数 | 不适用；若当前页面出现该字段，说明函数类型或运行时选错 |

FC 自定义运行时要求 HTTP Server 监听 `0.0.0.0:CAPort`。FC 控制台环境变量支持 JSON 导入，本项目使用下面的 JSON 让 Next.js 监听 `0.0.0.0:9000`：

```json
{
  "HOSTNAME": "0.0.0.0",
  "PORT": "9000"
}
```

控制台“监听端口”和环境变量 `PORT` 必须始终一致。

## 7. 配置 Node.js 20 和基础环境变量

`custom.debian10` 内置 Node.js 20，官方安装目录是 `/var/fc/lang/nodejs20`。在 FC 控制台“环境变量”的 JSON 编辑/导入区域填写：

```json
{
  "PATH": "/var/fc/lang/nodejs20/bin:/usr/local/bin:/usr/bin:/bin",
  "NODE_ENV": "production",
  "HOSTNAME": "0.0.0.0",
  "PORT": "9000",
  "TZ": "Asia/Shanghai",
  "SINO_RUNTIME_MODE": "production",
  "SINO_APP_VERSION": "1.0",
  "DATABASE_ADAPTER": "mysql",
  "PUBLIC_CRAWL_STATUS": "blocked"
}
```

JSON 中的键和值都使用双引号，不写 `export`、等号、注释或尾随逗号。将占位值替换为实际发布版本后再保存；控制台“监听端口”仍需单独设置为 `9000`。

`deploy/fc-runtime.example.json` 的 `environment` 只记录启动 Node server 所需的基础环境；其 `runtimeEnvironmentContract` 指向 `.env.example`，Production 业务变量不得只依据 JSON 示例配置。

不要把 `nodejs20` 当成 Handler，也不要把启动命令写成 `npm start`。standalone 制品已经包含运行依赖，最短且可验证的启动命令是 `node server.js`。

### 7.1 业务运行时变量

完整清单和格式约束以项目根目录 `.env.example` 为准。Production 至少还需配置：

- `PUBLIC_CRAWL_STATUS`；全部上线门禁通过前保持 `blocked`。
- RDS MySQL 的内网连接串 `DATABASE_URL`、连接池与连接预算参数。
- 管理员 dummy hash、CSRF secret 和 Argon2 参数。
- 私有 OSS Bucket、endpoint、assets URL 和短期授权相关参数。
- ESA purge endpoint、site ID 和 purge worker token。
- DirectMail endpoint、发信账号、收件地址和超时参数。
- 询盘可信客户端 IP header、限频和 HMAC secret。

`DATABASE_URL` 的格式为 `mysql://<用户名>:<URL 编码后的密码>@<RDS 内网地址>:3306/<数据库名>`。密码中的 `@`、`:`、`/`、`?`、`#` 等字符必须 URL 编码。数据库凭据只授予 FC 运行时读取，不能使用 RDS 高权限账号、主账号 AccessKey 或浏览器变量。环境变量页面有明文查看权限，RAM 授权必须限制到最小运维人员范围；平台支持受控秘密能力时优先使用该能力。

## 8. 权限、网络、日志和存储

### 8.1 函数角色

为函数绑定项目专用 RAM 角色，至少按实际功能授予：

- 目标私有 OSS Bucket 的最小对象操作权限；
- 必要的日志写入权限。

RDS 通过数据库专用账号授权，不通过 FC RAM 角色授予数据库表权限。建表权限只给独立迁移身份，不给 Web 函数运行账号。ESA purge 和 DirectMail 使用各自独立的最小权限边界，不使用主账号 AccessKey。

### 8.2 FC 接入阿里云 RDS MySQL（默认数据库）

生产和 Preview 的默认数据库均为阿里云 RDS MySQL；不使用 FC 临时磁盘或 SQLite 保存业务数据。RDS 与 FC 必须在同一地域（本手册为华南 1〔深圳〕），应用仅通过 RDS **内网地址**访问数据库，禁止为 FC 开放 RDS 公网地址。

1. 在 RDS 控制台创建 MySQL 8.0 实例，并创建本项目专用数据库（例如 `kelaibao`）和专用应用账号。账号权限仅限该数据库所需的 DDL/DML；日常 Web 函数不授予用户管理、全局权限或跨库权限。
2. 记录 RDS 的内网地址和端口（通常为 `3306`）。不要填外网地址，也不要把地址、账号或密码提交到 Git、ZIP 或日志。
3. 在 FC 函数“配置”→“网络”中启用 VPC，选择与 RDS 可路由的同地域 VPC 和交换机；若 FC 与 RDS 不在同一安全组，给 RDS 所在安全组添加入方向规则，仅允许 FC 所用安全组访问 TCP `3306`。安全组规则以安全组引用为准，不使用 `0.0.0.0/0`。
4. 在函数运行时环境变量中设置 `DATABASE_ADAPTER=mysql` 和 `DATABASE_URL`。示例中的账号、密码、主机和库名均须替换，密码中的保留字符须 URL 编码：

```json
{
  "DATABASE_ADAPTER": "mysql",
  "DATABASE_URL": "mysql://kelaibao_app:<URL编码后的密码>@rm-xxxxxxxx.mysql.rds.aliyuncs.com:3306/kelaibao",
  "DATABASE_RUNTIME_SCOPE": "deployment",
  "MYSQL_POOL_LIMIT": "2",
  "MYSQL_QUEUE_LIMIT": "4",
  "MYSQL_ACQUIRE_TIMEOUT_MS": "5000",
  "MYSQL_MAX_APP_INSTANCES": "3",
  "MYSQL_CONNECTION_BUDGET": "12"
}
```

`MYSQL_POOL_LIMIT × MYSQL_MAX_APP_INSTANCES` 必须小于或等于 `MYSQL_CONNECTION_BUDGET`，且总预算必须为 RDS 的 `max_connections` 与其他运维连接预留余量。上例为每实例最多 2 个应用连接、最多 3 个 FC 实例、12 个应用连接预算；这是起始值，需以压测和 RDS 监控结果调整。

5. 在受控的 Linux release 环境中，以专用迁移身份完成 schema 初始化；迁移不是由 Web 请求自动执行。使用生产连接串仅运行：

```bash
DATABASE_ADAPTER=mysql \
DATABASE_URL='mysql://<迁移账号>:<URL编码后的密码>@<RDS内网地址>:3306/kelaibao' \
pnpm db:migrate
```

迁移身份可在发布窗口拥有必要的 schema 变更权限，但 FC Web 函数运行账号应只保留应用实际需要的权限。迁移完成后记录迁移版本，不在日志或发布单记录连接串。

6. 部署到 FC test alias 后，先访问 `/api/health`，再以无真实客户信息的受控账号验证管理员登录、内容读写、发布和媒体元数据流程。同步检查 FC 日志、RDS 慢日志/连接数监控和安全组命中情况；连接超时应优先检查地域、VPC/交换机路由、安全组、内网地址和连接预算。

- 应用仍需通过 HTTPS 访问 OSS、DirectMail 和 ESA API，因此必须验证实际网络配置下的这些 endpoint 连通性。
- 不挂载 NAS，不把临时磁盘当持久化存储。

### 8.3 日志

开启 SLS 日志并使用项目专用 Logstore。日志不得包含：

- 密码、Cookie、CSRF secret、AccessKey、token、数据库 URL；
- 询盘姓名、联系方式、需求正文、原始 IP；
- DirectMail 完整请求、签名和供应商响应正文。

## 9. 配置实例健康检查

函数创建后，进入“配置”→“高级配置”→“健康检查”，开启健康检查：

| 参数 | 建议初始值 |
| --- | --- |
| 请求路径 | `/api/health` |
| HTTP 方法 | GET |
| 首次探测延迟 | 10 秒 |
| 探测间隔 | 30 秒 |
| 探测超时 | 5 秒 |
| 最大失败次数 | 3 |
| 探测成功阈值 | 1 |

FC 把 HTTP 2xx～3xx 视为成功，4xx～5xx 或超时视为失败。`/api/health` 在基础服务端配置无效时会返回 503，因此正式启用健康检查前必须先配置所需运行时变量。

## 10. 上传 ZIP 和首次启动

创建函数时可直接上传 ZIP；更新已有函数时：

1. 进入函数详情→“代码”。
2. 选择“上传代码”→“通过 ZIP 包上传代码”。
3. 选择 `out/kelaibao-fc.zip`。
4. 再次核对启动命令、监听端口和环境变量。
5. 单击“部署代码”。
6. 在日志中确认没有 `FunctionNotStarted`、`Cannot find module`、`Exec format error` 或 OOM。

若 ZIP 超过控制台允许大小，可先上传到同地域私有 OSS，再选择“通过 OSS 上传代码”。上传身份只需目标对象的读取权限；制品 OSS 不应公共读。

## 11. 直接验证 FC

使用控制台提供的测试 URL 或受控 HTTP 触发器 URL。不要在命令历史中写入长期 token。

```bash
curl -i 'https://<FC测试地址>/api/health'
curl -i 'https://<FC测试地址>/'
curl -i 'https://<FC测试地址>/admin'
curl -i 'https://<FC测试地址>/opengraph-image'
```

预期：

- `/api/health`：HTTP 200、JSON、`status=ok`、版本等于 `SINO_APP_VERSION`、`Cache-Control: private, no-store, max-age=0`。
- `/`：HTTP 200，返回包含“客来宝”的 HTML。
- `/admin`：未登录时重定向到 `/admin/login`。
- `/opengraph-image`：HTTP 200，返回 PNG。

随后验证：

- RDS MySQL schema version、受限读写和连接池预算；
- 管理员登录、Session Cookie、内容创建/发布/下线；
- 私有 OSS presign、上传、确认和 ESA 分发；
- `/api/inquiry` 的受控测试和失败降级；
- 日志没有秘密或询盘 PII。

不要用真实客户信息做 smoke。

## 12. 发布版本、别名和 ESA 回源

ZIP 验证通过后：

1. 发布不可变 FC 版本，记录版本号和 ZIP SHA-256。
2. 创建或更新 test alias 指向新版本。
3. 通过 test alias 完成完整 smoke。
4. 所有 Production gate 真实通过后，才把 production alias 切到新版本。
5. ESA 源站指向受控的 FC production alias 入口。
6. 验证 ESA 保留正确 Host、HTTPS 和受保护的客户端地址头。
7. 禁止或限制访客绕过 ESA 直接访问 FC 源站。

ESA 缓存基线：

- `/admin/*`、`/api/*`、`/health`：禁止共享缓存；
- `/news*`、`/cases*`、`/feed.xml`、`/sitemap.xml`、`/llms.txt`：最长 60 秒；
- `/_next/static/*`、`/visual/generated/*`：版本化长期缓存。

## 13. 回退

出现 5xx、关键路由失败、数据库兼容或媒体问题时：

1. 停止扩大流量和后续 schema 操作。
2. 确认上一应用版本与当前 schema 兼容。
3. 把 production alias 切回上一健康 FC 版本，不重新上传旧 ZIP 覆盖当前版本。
4. 验证 `/api/health`、首页、后台、新闻、案例和询盘降级。
5. 只刷新受影响的 ESA URL。
6. 记录脱敏事件时间线和处置结果。

不得以删除生产数据作为应用回退手段。

## 14. 常见故障

| 现象 | 优先检查 |
| --- | --- |
| `FunctionNotStarted` | 函数是否为 Web 函数；监听端口、`PORT` 是否同为 9000；`HOSTNAME` 是否为 `0.0.0.0` |
| `node: command not found` | `PATH` 是否以 `/var/fc/lang/nodejs20/bin` 开头 |
| `Cannot find module /code/server.js` | ZIP 是否错误地多包了一层 `standalone/` |
| `CAExited`、`Cannot find module 'styled-jsx/package.json'` | ZIP 是否使用 `zip -qry` 保留 pnpm 符号链接；运行 `zipinfo -l ... node_modules/next` 和独立解压依赖检查后重新上传完整 ZIP |
| `Exec format error`、原生模块加载失败 | 是否在 Windows/macOS 构建；ZIP 是否包含 `win32`/`darwin` 原生二进制 |
| `@fontsource/noto-sans-sc` 下载出现 error (23) 或 `TimeoutError` | 确认使用 Node.js 20；保留 pnpm store，按 3.1 节延长 `fetch-timeout` 重试，必要时仅为本次安装切换 npm 官方 registry |
| 页面样式或图片 404 | `.next/static` 和 `public` 是否已复制并进入 ZIP |
| `/api/health` 返回 503 | 服务端基础环境变量或数据库 adapter 配置是否无效 |
| 冷启动超时 | 日志中的启动耗时、内存是否不足；必要时提高内存或设置最小实例数 1 |
| 502/504 | Node 进程是否退出、请求是否超过 60 秒、下游 HTTPS 是否超时 |
| 上传失败 | ZIP 是否超过地域/上传方式限制；改用同地域私有 OSS 代码包 |
| OSS/DirectMail 无权限 | FC 函数角色和实际资源范围是否匹配，是否误用长期 AccessKey |

## 15. 官方依据

- [创建 Web 函数](https://help.aliyun.com/zh/functioncompute/creating-a-web-function.md)
- [自定义运行时](https://help.aliyun.com/zh/functioncompute/custom-runtime.md)
- [自定义运行时 HTTP Server 原理](https://help.aliyun.com/zh/functioncompute/principles-1.md)
- [配置实例健康检查](https://help.aliyun.com/zh/functioncompute/configure-a-custom-health-check-policy-for-instances-1.md)
- [FC 运行时列表](https://help.aliyun.com/zh/functioncompute/fc/runtime-overview-3.md)
- [FC 配额与使用限制](https://help.aliyun.com/zh/functioncompute/limits-of-usage.md)

项目内配套文档：

- [FC Standalone 部署与回退 Runbook](./FC-Deployment-Runbook.md)
- [阿里云部署指南](./Alibaba-Cloud-Deployment-Guide.md)
- [阿里云全栈架构规格](./Alibaba-Cloud-Fullstack-Architecture-Spec.md)
- [管理员安全与媒体 Runbook](./Admin-Security-and-Media-Runbook.md)
