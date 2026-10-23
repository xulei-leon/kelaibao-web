# 客来宝 FC 部署指南

更新：2026-10-20，适用于 FR-25 静态新闻/案例版本。目标运行链路为 ESA → FC 全栈 Next.js，询盘由 DirectMail HTTPS 发送。公开内容在构建期生成；不部署 CMS 后台，不给新 FC 注入管理员、内容数据库、OSS 上传或 purge worker 密钥。现有 RDS、私有 OSS、备份与历史对象继续保留，退役须另行评估。

## 制品与 FC 配置

在 Linux x86_64、Node.js 20.x、pnpm 10.34.5 环境执行：

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm lint
pnpm build
pnpm smoke:standalone
pnpm validate:release
pnpm package:fc
```

不能复用 Windows/macOS 的原生依赖与 `.next`。当前仍有 sharp 原生依赖；最终以 FC test alias 实测为准。上传 `out/kelaibao-fc.zip`，ZIP 根目录直接包含 server.js、package.json、node_modules、.next/server、.next/static、public 和 static-content-manifest.json。不得包含 .env、SQLite、本地盘点文件或真实凭据。详细限制见 [FC-PACKAGING](FC-PACKAGING.md)。

FC Web 函数使用 `custom.debian10`、x86_64、启动命令 `node server.js`、监听 `0.0.0.0:9000`、Handler 留空。PATH 包含 `/var/fc/lang/nodejs20/bin`。运行配置见 [FC 模板](deploy/fc-runtime.example.json) 和[环境变量模板](deploy/fc-production-env.example.json)。并发、实例上限、预算、日志、告警与 WAF/限频须以真实测试确定，不能用本地占位值视为启用。

正式域名、站点环境、二维码和公开口径在构建前确认；这些是静态输出的构建输入。构建使用正式 HTTPS canonical origin；公开页面始终允许搜索抓取与索引，旧 `PUBLIC_CRAWL_STATUS` 已移除。修正线上 robots/metadata 必须重新构建和发布，不能只改 FC 环境变量；部署后刷新相关 ESA 缓存并复核正式域名。运行时注入版本、DirectMail、询盘限频 HMAC 等秘密；不将秘密放入构建命令、Git、浏览器或 ZIP。

## 迁移与旧资源

新版本不执行数据库 migration，也不初始化管理员。旧表、SQL migration、修订、审计和媒体保留供核对与回退；原 RDS/OSS 的网络、最小权限、备份恢复和告警继续维持，不擅自公开 Bucket 或关闭资源。

首次从 CMS 切换前：盘点实际库的公开/草稿/下线/删除条目、旧 URL、发布时间、图片和授权；使用只读账号运行 `pnpm content:inventory`，结果只存被忽略的本地目录。停用旧 CMS 写入口后导出最终快照，逐条判断保留原 URL、308 或 410。只迁入授权公开快照，不迁工作草稿。私下备份和迁移证据不随 FC 制品打包。

更新 [静态迁移证据](docs/5-Evidence/m5-05/static-migration.json)，记录已核对的真实来源、复核信息、当前源码 SHA-256 和本次制品的完整 URL manifest。没有真实盘点时保持 BLOCKED。旧库从未有文章也必须由真实盘点证明，不能根据 Preview 空列表推断。

## test alias 验证

部署新不可变版本到 test alias，使用受控 HTTPS 链路验证：

```sh
curl -i 'https://<FC测试地址>/api/health'
curl -i 'https://<FC测试地址>/news'
curl -i 'https://<FC测试地址>/cases'
curl -i 'https://<FC测试地址>/sitemap.xml'
curl -i 'https://<FC测试地址>/admin/login'
```

健康检查须为 200、status=ok、contentSource=static、版本正确、private no-store；它不证明邮件或历史内容已迁移。新闻、案例和发现文件在没有 DATABASE_URL、管理员和 OSS 上传凭据时仍须可用。/admin、/api/admin/*、/api/internal/cache-purge 为 404，未知文章 404；对 manifest 中每个公开、撤回、跳转路径核实 200/410/308 和目的地。首响应包含正文、canonical、metadata 和 JSON-LD。保留首页、关于、二维码、政策、询盘隐私和错误降级回归。

本地 Windows smoke 不替代 Linux 制品、真实 FC/ESA、DirectMail 发信、大陆/微信浏览器证据。公开正文无客户端 JS 仍可阅读。

## ESA 缓存与发布切换

/api/* 和 /health 禁止共享缓存；静态页面与发现文件使用发布版本缓存，生成图片可长期 immutable。示例见 [ESA 缓存规则](deploy/esa-cache-rules.example.json)。不再运行 CMS purge worker，也没有内容事务内的刷新 outbox。

保留旧版 static-content-manifest.json（首次迁移由真实旧 URL 清单制作），在受控发布环境设置 canonical HTTPS origin 和独立 ESA 最小权限短期身份，先检查计划：

```sh
pnpm cache:refresh --previous-manifest <上版manifest路径>
```

核对新增、修改、撤回、跳转、列表、首页/关于摘要和发现文件后，执行相同命令加 `--apply`。ESA endpoint、site ID、AccessKey 与 SecurityToken 只注入发布工具，不能注入浏览器。工具逐批提交精确 URL，不使用 wildcard；返回接受不代表异步任务完成。需检查 ESA 任务、实际内容与缓存响应，验证后才开放新版本流量；失败停止切流或回退，不标记发布成功。

## 生产门禁与回退

`pnpm validate:release --require-production-live` 必须通过。当前命令兼容历史 M2/M3 证据，但旧 CMS gate 由静态迁移证据替代；其余真实 FC/ESA/DirectMail、域名备案、正式二维码、政策、授权、口径、恢复、成本与预算门禁不因此解除。RDS/OSS 的保留/退役与相应门禁按实际用途另行核定。

保留上一不可变 FC 版本、旧 manifest、数据库和媒体，以及部署/缓存证据。新版本异常时回退 FC alias，按旧新版 URL 并集刷新 ESA 并实测。如果回退到 CMS 版本，先恢复其运行时配置和网络，验证原数据库/媒体与旧版本兼容，再受控开放管理入口；不能把删除表或对象作为回退步骤。
