# 客来宝 FC 打包操作说明

本文说明如何将 `kelaibao` 打包为阿里云函数计算（FC）Web 函数使用的 ZIP 制品。

## 一、构建环境

必须在 Linux x86_64 环境执行，Windows 用户请使用 WSL2。项目包含 `argon2`、`sharp` 等原生依赖，不能直接使用 Windows 生成的依赖和 `.next` 目录。

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

## 二、构建和打包

先在本目录检查 Node.js 和 pnpm 版本：

```bash
node --version
pnpm --version
node -p "require('./package.json').packageManager"
```

预期结果为 Node.js `v20.x.x`、pnpm `10.34.5` 和 `pnpm@10.34.5`。

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

如果之前使用其他 Node.js 版本安装或构建过，必须清理并重新安装依赖，不能复用旧的原生依赖或 `.next`：

```bash
rm -rf node_modules .next
pnpm install --frozen-lockfile
```

确认版本和依赖正确后执行：

```bash
pnpm test
pnpm lint
pnpm build
pnpm smoke:standalone
pnpm package:fc
```

其中：

- `pnpm build` 执行资源生成、`next build`，并整理 Next.js standalone 制品；
- `pnpm package:fc` 执行 `scripts/package-fc-zip.sh`，检查运行环境、依赖、符号链接和禁入文件后生成 FC ZIP。

如果只需要重新生成 FC ZIP，必须确认 `.next/standalone` 已由正确的 Linux 环境构建完成，然后执行：

```bash
pnpm package:fc
```

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
```

不能多包一层 `standalone/` 目录。

脚本会拒绝包含以下内容的制品：

- `.env*` 文件；
- SQLite 数据库及 WAL/SHM 文件；
- `.next/cache` 和本地数据；
- Windows/macOS 原生模块。

## 四、FC 控制台配置

生产函数名：`kelaibao-web-prod`

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
  "PORT": "9000"
}
```

数据库、Session、OSS、邮件和其他服务端秘密只配置在 FC 运行时环境变量中，不要写入代码、构建环境或 ZIP。

## 五、上传和验证

在 FC 控制台选择“代码”→“上传代码”→“通过 ZIP 包上传代码”，上传 `out/kelaibao-fc.zip`，然后部署代码。

部署后先验证：

```bash
curl -i 'https://<FC测试地址>/api/health'
```

确认 `/api/health` 返回 HTTP 200 后，再验证首页、`/admin` 和 `/opengraph-image`。

更完整的控制台部署、环境变量、网络和回退说明见：[FC-Console-ZIP-Deployment-Manual.md](docs/2-Design/FC-Console-ZIP-Deployment-Manual.md)。
