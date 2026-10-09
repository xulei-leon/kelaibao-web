# 客来宝统一中文官网阿里云部署指南

| 字段 | 内容 |
| --- | --- |
| 文档版本 | `v1.1` |
| 更新日期 | `2026-08-15` |
| 适用项目 | `products/kelaibao/` |
| 目标地域 | 华南 1（深圳） |
| 目标架构 | `ESA -> Function Compute 全栈 Next.js -> RDS MySQL + 私有 OSS + DirectMail` |
| 当前状态 | 本地代码与制品契约已具备；真实云、合规、恢复和成本门禁仍为 `BLOCKED/DEFERRED` |

## 1. 文档目的

本文用于指导客来宝统一中文官网从本地代码到阿里云生产环境的资源准备、配置、发布、验证和回退。本文是实施指南，不替代以下约束文档：

- [阿里云全栈架构规格](./Alibaba-Cloud-Fullstack-Architecture-Spec.md)
- [FC部署指南](../../FC部署指南.md)
- [管理员安全与媒体 Runbook](./Admin-Security-and-Media-Runbook.md)
- [M2-05 生产上线 Sprint](../3-Plan/sprint-m2-05.md)

本文不得被当作已经完成采购、备案、真实云验证或 Production Live 的证据。实例规格、流量、费用和预算必须以购买前的阿里云实时页面、实际压测和版本化成本记录为准。

## 2. 部署范围与边界

客来宝、K-Link 和客来宝媒体部署为同一个 Next.js 应用，使用同一正式域名、管理后台、数据库和 CMS。

生产环境必须遵守以下边界：

- Function Compute（FC）是唯一 Next.js 运行时，承载公开 SSR、`/admin` 和 `/api`。
- 不使用 ESA Pages、Vercel、ECS 或第二套应用承载站点功能。
- RDS MySQL 只能由 FC 经 VPC 私网访问，不向公网开放数据库端口。
- OSS Bucket 保持私有；浏览器不得持有阿里云长期 AccessKey。
- 询盘由同域 `/api/inquiry` 调用 DirectMail HTTPS API，不建立询盘或 CRM 数据表。
- 所有第三方集成使用边界明确的 HTTP(S) API，不建立通用 `webservice` 抽象。
- 真实主体、域名、备案、企业微信、专业审查、恢复演练和云链路证据未通过前，禁止开放 Production 索引和正式询盘。

## 3. 目标拓扑

```text
访客 / 管理员
        |
        v
Alibaba Cloud ESA
DNS / TLS / CDN / WAF / 限频 / 缓存 / 回源保护
        |
        v
Function Compute 3.0
Next.js 15 standalone / Node.js 20
公开 SSR + /admin + /api
        |
        +---- VPC 私网 ----> RDS MySQL
        |
        +---- HTTPS -------> 私有 OSS（上传、确认、媒体读取）
        |
        +---- HTTPS -------> DirectMail（询盘通知）
        |
        +------------------> SLS / 云监控（脱敏日志与告警）
```

推荐 FC、RDS 和 OSS 统一位于华南 1（深圳），减少跨地域延迟、流量费用和网络配置复杂度。ESA 作为唯一公开入口，FC 源站地址不作为公开访问地址推广。

## 4. 推荐阿里云产品

### 4.1 上线必需产品

| 产品 | 用途 | 初始选择原则 | 生产要求 |
| --- | --- | --- | --- |
| 边缘安全加速 ESA | TLS、CDN、WAF、限频、缓存和 FC 回源 | 按实际流量选择计费方式，不预购无法验证的大包 | 正确转发 Host、HTTPS 和可信客户端地址；保护源站 |
| 函数计算 FC 3.0 | 运行完整 Next.js | 按量计费；Node.js 20 自定义运行时；部署 standalone 制品 | 设置超时、并发、最大实例数、健康检查和版本别名 |
| RDS MySQL | CMS、管理员、Session、修订与审计 | MySQL 8.0 兼容、基础版、单可用区、自动备份 | 私网访问、严格 SQL 模式、InnoDB、`utf8mb4`、恢复演练 |
| OSS | 新闻和案例媒体 | 标准存储、私有 Bucket | 禁止公共读；短期 STS 上传；经 ESA 受控分发 |
| DirectMail 邮件推送 | 询盘通知 | 受控发信域名和企业收件箱 | 仅服务端 HTTPS 调用；失败不泄露供应商信息 |
| VPC / 交换机 / 安全组 | FC 与 RDS 私网通信 | 与 FC、RDS 同地域规划 | RDS 只允许必要的 FC 网络来源 |
| RAM / STS | 服务身份和短期授权 | 每个集成独立 RAM 身份与最小权限策略 | 禁止使用主账号 AccessKey；定期轮换 |
| 云解析 DNS | 正式域名解析 | 域名统一接入 ESA | 切换前降低 TTL，稳定后再调高 |

### 4.2 推荐的运行保障产品

| 产品 | 用途 | 最小落地内容 |
| --- | --- | --- |
| 日志服务 SLS | FC 应用和访问日志 | 结构化日志、保留期、PII/秘密脱敏、查询与告警 |
| 云监控 | 资源指标和告警 | FC 5xx/延迟/实例数，RDS 连接/容量，OSS、DirectMail 和 ESA 异常 |
| KMS 或凭据管理能力 | 管理服务端秘密 | 数据库、Session、CSRF、DirectMail、ESA 和 OSS 凭据 |

### 4.3 当前不推荐采购

- ECS、ACK/Kubernetes、SLB/ALB、Redis、独立 WAF。
- ESA Pages、公共读 OSS、公网 RDS。
- 第二应用、第二后台、媒体子站或跨应用内容 API。

这些产品当前没有明确业务需求。新增它们会提高费用和运维面，且可能破坏既定单应用架构。只有出现经测量确认的容量、安全或可用性问题后，才单独评审扩容方案。

## 5. 上线前需要准备的信息

在创建生产资源前，先形成一份不包含秘密的资源登记表：

| 项目 | 必填内容 |
| --- | --- |
| 阿里云账号 | 已完成企业实名认证的主账号；日常操作使用 RAM 用户或角色 |
| 主体与域名 | 正式主体、正式域名、域名持有人、ICP备案状态 |
| 地域 | 华南 1（深圳）；如果变更，必须同步评审 FC、RDS、OSS 和网络 |
| 流量假设 | 月访问量、峰值请求数、页面响应大小、图片存储量和下行流量 |
| 预算 | 月度硬上限、告警阈值、异常流量处置方式 |
| 邮件 | DirectMail 发信域名、发信地址、企业收件邮箱 |
| 联系方式 | 正式企业微信名称、二维码、服务时间 |
| RTO/RPO | 可接受恢复时间和数据丢失窗口 |
| 操作身份 | 发布、迁移、回退和紧急处置的 RAM 身份 |

缺少真实报价、流量假设或预算硬上限时，不锁定实例规格，也不能把成本门禁标记为 `PASS`。

## 6. 推荐资源创建顺序

### 6.1 创建 RAM 身份和审计边界

1. 主账号只用于账号级管理，不创建或使用主账号 AccessKey。
2. 为部署、FC 运行、OSS 上传、ESA 刷新和 DirectMail 分别建立 RAM 身份或角色。
3. 每个身份只授予目标资源和必要操作权限。
4. 开启控制台登录保护、MFA 和关键操作审计。
5. 将秘密保存到受控环境配置或凭据管理服务，不写入 Git、构建日志或客户端 bundle。

### 6.2 创建 VPC 和交换机

1. 在华南 1（深圳）创建项目专用 VPC。
2. 创建可供 FC 和 RDS 使用的交换机；记录可用区和网段。
3. 创建最小安全组规则，只允许 FC 到 RDS MySQL 端口的必要访问。
4. 不为 RDS 开启公网地址。

生产环境应避免与无关项目共用数据库账号、安全组或部署身份。

### 6.3 创建 RDS MySQL

初始选择方向为 MySQL 8.0 兼容、基础版、单可用区和自动备份，最终规格由真实报价与压测确定。

必须完成：

1. 选择与 FC 相同的 VPC、地域和可通信交换机。
2. 设置 InnoDB、`utf8mb4`、严格 SQL 模式和 UTC 时间保存规则。
3. 创建仅供应用使用的受限数据库账号；迁移账号可单独设置更高权限并只在 release step 注入。
4. 开启自动备份并定义保留周期。
5. 设置连接数、容量和备份失败告警。
6. 正式上线前执行一次恢复到隔离实例的演练。

应用侧连接预算必须同时满足：

```text
FC 最大实例数 × 每实例 MySQL 连接池上限 <= 预留的 RDS 应用连接预算
```

仓库初始示例使用很小的连接池和单实例预算，只能作为保守起点，不能替代真实并发验证。

#### 6.3.1 使用 RDS 控制台授权应用账号

数据库创建和 migration 完成后，必须单独授权 FC 使用的应用账号访问业务数据库。DMS 托管账号、migration 账号和应用账号相互独立；DMS 能查询业务表，不代表 FC 应用账号已经获得权限。

本项目的账号职责如下：

| 账号类型 | 示例 | 用途 | 权限边界 |
| --- | --- | --- | --- |
| FC 应用账号 | `kelaibao_web` | 公开 SSR、后台 CMS、Session、审计等运行时读写 | 只授权 `kelaibao_web` 业务库的运行时读写，不承担 migration |
| 独立迁移账号 | 一次性或受控 release 账号 | 执行 schema migration | 仅在维护窗口使用，完成后回收或禁用 |
| DMS 托管账号 | `dms_user_*` | DMS 平台代理访问 | 由 DMS 管理，不能代替 FC 应用账号 |

推荐通过 RDS 控制台完成授权：

1. 登录阿里云 RDS 控制台，确认地域为华南 1（深圳）。
2. 进入客来宝目标 RDS 实例详情。
3. 打开“账号管理”。
4. 找到应用账号 `kelaibao_web`；如果账号不存在，先创建普通应用账号，不创建高权限账号。
5. 选择“修改权限”或当前控制台等价入口。
6. 将数据库 `kelaibao_web` 加入已授权数据库。
7. 权限选择“读写”，确认并等待授权状态生效。
8. 返回账号列表，复核账号状态正常、目标数据库和权限均正确。

不要为了应用运行而执行 `GRANT ALL`，也不要让 `kelaibao_web` 承担 `CREATE`、`ALTER` 等 migration 职责。结构变更继续使用独立迁移账号。

授权后必须同步完成：

1. 如果密码曾出现在聊天、工单、日志、截图或其他非秘密载体中，立即在 RDS 轮换密码。
2. 将新密码写入 FC 受控环境变量中的 `DATABASE_URL`；密码包含 `@`、`:`、`/`、`#`、`%` 等 URL 保留字符时，必须先做百分号编码。
3. 保存 FC 配置，并重启或重新发布实例，确保旧 MySQL 连接池被销毁。
4. 依次验证 `/api/health`、`/news` 和 `/cases`；三者都返回 HTTP `200` 后，数据库访问验收才通过。

常见错误判断：

| 现象 | 判断 | 处理 |
| --- | --- | --- |
| `ERROR 1044 (42000): Access denied ... to database 'kelaibao_web'` | 已到达 MySQL 且账号已被识别，但未获业务库权限 | 在 RDS 控制台为 `kelaibao_web` 授权目标库“读写”权限 |
| `ERROR 1045 (28000): Access denied for user ...` | 用户名、密码或账号允许的来源不正确 | 重置密码、核对账号状态，并更新 FC `DATABASE_URL` |
| 连接超时或 `ETIMEDOUT` | 优先检查 FC 到 RDS 的私网链路 | 核对 VPC、交换机、安全组、RDS 白名单和内网地址 |
| DMS 显示当前用户为 `dms_user_*` | 当前会话使用 DMS 托管代理账号 | 不能据此判断 `kelaibao_web` 的权限；以 RDS“账号管理”页面为准 |
| 查询 `mysql.user` 被拒绝 | RDS/DMS 对系统表的正常权限限制 | 不给 DMS 代理账号追加系统表权限，改用 RDS“账号管理”页面检查 |

RDS 白名单应加入 FC 实际交换机网段，不要加入 DMS 请求来源地址，也不要使用 `0.0.0.0/0`。数据库连接串、密码和完整凭据不得写入本文、Git、普通工单或应用日志。

### 6.4 创建私有 OSS Bucket

1. 在华南 1（深圳）创建项目专用 Bucket。
2. 关闭公共读、公共 ACL 和匿名列举。
3. 配置仅允许 JPEG、PNG、WebP，单文件最大 10 MB 的上传流程。
4. 浏览器先向 `/api/admin/media/presign` 申请短期、限定对象键和 MIME 的授权，再通过 HTTPS 上传。
5. 服务端确认 MIME、文件大小、魔数、SHA-256 和对象归属后，将对象从 `pending/` 提升到不可变 `media/` 路径。
6. 公共媒体通过 ESA 的 assets 域名或路径分发，禁止直接使用公开 OSS URL。

可参考 [`deploy/oss-media-boundary.example.json`](../../deploy/oss-media-boundary.example.json) 的边界定义。

### 6.5 配置 DirectMail

1. 创建并验证发信域名，按 DirectMail 要求完成 DNS 记录。
2. 创建发信地址和显示别名，配置获批企业收件邮箱。
3. 为应用身份授予最小发信权限。
4. 通过明确的 DirectMail HTTPS API 发信，不引入浏览器调用或通用 `webservice`。
5. 生产前使用不包含真实客户 PII 的测试询盘验证成功、超时和失败降级。

应用不保存询盘正文。日志只允许记录服务端请求 ID、结果码、耗时区间和脱敏原因码。

### 6.6 创建 Function Compute 服务和函数

部署契约：

| 项目 | 配置 |
| --- | --- |
| 运行形态 | FC 3.0 Web 函数或等价自定义运行时能力 |
| Node.js | 20 |
| 制品 | `.next/standalone` |
| 启动命令 | `node server.js` |
| 监听端口 | 使用 FC 注入的 `PORT` |
| 健康检查 | `/api/health` |
| 公共入口 | 只允许 ESA 正式回源链路作为公开入口 |

仓库示例 [`deploy/fc-runtime.example.json`](../../deploy/fc-runtime.example.json) 当前记录 `custom.debian10`。采购和创建函数前必须在阿里云控制台验证该运行时标签仍可用；若平台标签变化，只能调整基础运行时，不能改变 Node.js 20、standalone、启动命令和应用协议。

生产配置必须设置：

- 有限请求超时、并发和最大实例数。
- 与 RDS 连接预算匹配的实例上限。
- 结构化日志和秘密脱敏。
- 版本与别名；测试别名验证通过后才能切换生产别名。
- 5xx、P95 延迟、实例数和错误日志告警。
- VPC 访问能力和到 RDS 的私网连通性。

在获得真实压测数据前，不在本文写死内存、并发、最小实例数和最大实例数。为控制个人创业阶段成本，建议从按量计费、低并发和有限最大实例数开始，以实测结果扩容。

### 6.7 配置 ESA

1. 添加正式站点和正式域名，配置 TLS 证书。
2. 将源站配置为 FC 的受控入口。
3. 验证 ESA 向 FC 保留正确 Host、HTTPS 协议和可信客户端地址头。
4. 防止访客绕过 ESA 直接访问源站；至少保证源站地址不公开，并使用平台支持的回源鉴权或访问控制。
5. 配置 WAF、Bot/异常请求防护、请求体上限和路径限频。
6. 配置缓存规则，并验证发布/下线后的精确 URL 刷新。

推荐缓存基线：

| 路径 | ESA 策略 |
| --- | --- |
| `/admin/*`、`/api/*`、`/health` | 禁止共享缓存 |
| `/news`、`/news/*`、`/cases`、`/cases/*` | 最长 60 秒 |
| `/feed.xml`、`/sitemap.xml`、`/llms.txt` | 最长 60 秒或发布后精确刷新 |
| 代码维护的公开页面和版本化静态资源 | 长缓存或遵循源站版本化策略 |

配置基线见 [`deploy/esa-cache-rules.example.json`](../../deploy/esa-cache-rules.example.json)。示例状态不是生产已配置证明。

### 6.8 域名、证书与备案

1. 完成企业实名认证和域名持有人核验。
2. 依据中国大陆实际接入方式完成 ICP 备案；正式上线后按适用要求处理公安备案。
3. 在 ESA 配置正式证书、强制 HTTPS 和安全响应头。
4. 上线切换前降低 DNS TTL，验证完成后再恢复合理 TTL。
5. Preview 域名保持不可索引；只有全部 Production 门禁通过后，才将 `PUBLIC_CRAWL_STATUS` 改为允许公开抓取的生产值。

备案和合规要求可能随主体、地域和产品接入方式变化，必须以阿里云备案系统和适用监管要求的实时结论为准。

## 7. 构建和发布流程

### 7.1 本地或 CI 验证

使用 Node.js 20+ 和锁定的 pnpm 版本：

```bash
pnpm install --frozen-lockfile
pnpm test
pnpm lint
pnpm build
pnpm smoke:standalone
pnpm validate:release
```

`pnpm build` 会生成 `.next/standalone/server.js`，并由项目脚本补齐 `.next/static` 和 `public`。任何命令失败都停止发布。

### 7.2 生成不可变制品

1. 使用干净工作区和已确认的 Git commit 构建。
2. 记录 commit、`SINO_APP_VERSION`、构建时间和制品 SHA-256。
3. 制品中不得包含 `.env*`、数据库 URL、AccessKey、Session 秘密、联系人 PII 或本地 SQLite 数据。
4. 将制品上传到受控位置，并创建新的 FC 不可变版本。

不要在 `next build` 阶段注入生产秘密；秘密只在 FC 运行时或独立 release job 中提供。

### 7.3 执行数据库迁移

数据库迁移是显式 release step，不能在 FC 冷启动、应用启动或请求路径自动执行。

如果通过阿里云 DMS 手工执行迁移，遵循 [客来宝 RDS DMS 数据库迁移操作手册](./RDS-DMS-Database-Migration-Runbook.md)。

```bash
pnpm db:migrate
```

执行要求：

1. 先取得 RDS 自动备份或手动备份的可核验证据。
2. 使用独立迁移身份和临时注入的 `DATABASE_URL`。
3. migration 必须使用 advisory lock，且只允许 expand-only、向后兼容变更。
4. 锁获取失败或任何语句失败时停止发布。
5. 验证上一应用版本与新 schema 的兼容矩阵，保证应用版本可以安全回退。

### 7.4 发布到测试别名

1. 用不可变制品创建 FC 新版本。
2. 将测试别名指向新版本。
3. 经 ESA 或受控测试链路验证 `/api/health`。
4. 验证首页、新闻、案例、后台登录、内容读写、私有媒体和询盘失败降级。
5. 确认 `/admin/*`、`/api/*` 和 `/health` 不被共享缓存。
6. 确认日志中没有凭据、Cookie、询盘 PII 或供应商响应正文。

### 7.5 切换生产别名

只有全部强制 Production gate 都有真实 `PASS` 证据时，才能将生产别名切换到新 FC 版本。切换后：

1. 验证正式域名、证书和关键路由。
2. 对本次变化涉及的 ESA URL 执行精确刷新，不进行无必要的全站清空。
3. 观察 FC 5xx、P95 延迟、实例数和 RDS 连接数。
4. 验证 OSS 媒体、DirectMail 测试通知和企业微信降级。
5. 记录脱敏版本号、资源引用、验证时间和结果。

## 8. 生产环境变量

完整变量和注释以项目 [`.env.example`](../../.env.example) 为准。生产环境至少需要以下类别：

| 类别 | 主要变量 | 注意事项 |
| --- | --- | --- |
| 站点 | `NEXT_PUBLIC_SITE_URL`、`NEXT_PUBLIC_SITE_ENV`、`PUBLIC_CRAWL_STATUS` | 正式 URL 必须唯一；抓取开关最后开启 |
| 运行时 | `SINO_RUNTIME_MODE`、`SINO_APP_VERSION` | 用于运行协议和健康检查，不用于品牌文案 |
| MySQL | `DATABASE_URL`、连接池和连接预算变量 | 全部为服务端变量；URL 不进入日志 |
| 管理员安全 | `ADMIN_DUMMY_PASSWORD_HASH`、`ADMIN_CSRF_SECRET`、Argon2 参数 | 不使用 `NEXT_PUBLIC_` 前缀 |
| OSS | Bucket、Endpoint、assets URL 和短期 STS 凭据 | 不注入主账号或长期浏览器凭据 |
| ESA | purge endpoint、site ID、临时凭据、worker token | 仅服务端使用；缓存刷新失败需告警 |
| DirectMail | endpoint、AccessKey、发信账号、收件邮箱、超时 | endpoint 必须为批准的 HTTPS 地址 |
| 询盘防护 | 可信 IP header、HMAC secret、限频和去重参数 | ESA 必须覆盖并保护可信地址头 |

不得将 server-only 变量改名为 `NEXT_PUBLIC_*`。不得把真实环境变量写入本文、Git、截图、工单正文或构建制品。

## 9. 监控与告警基线

至少监控：

- ESA：WAF 命中、限频命中、回源失败、缓存刷新失败和异常流量。
- FC：5xx、P95 延迟、超时、实例数、冷启动和费用异常。
- RDS：连接数、CPU、存储容量、慢查询、备份失败和可用性。
- OSS：上传、确认、读取和回源失败。
- DirectMail：成功、失败和超时数量，只记录无 PII 的稳定原因码。
- 应用：`/api/health`、管理员登录异常、发布失败和 migration 失败。

告警必须发送到可实际接收的运维渠道，并至少完成一次测试告警。阈值需要结合真实基线设定；没有数据时不得用占位阈值声称监控已完成。

日志禁止包含：

- 管理员密码、Session Cookie、CSRF secret、AccessKey、token、数据库 URL。
- 询盘姓名、城市、联系方式、需求正文、原始 IP、Idempotency-Key。
- DirectMail 完整请求参数、签名和供应商响应正文。

## 10. 安全检查

上线前逐项确认：

- [ ] 主账号没有用于应用的长期 AccessKey。
- [ ] 发布、FC、OSS、ESA 和 DirectMail 使用独立最小权限身份。
- [ ] RDS 没有公网入口，只允许 FC 私网访问。
- [ ] OSS 关闭公共读，匿名直连失败，短期授权过期和越权测试失败。
- [ ] `/admin/*` 和 `/api/admin/*` 同时启用服务端鉴权、ESA WAF 和限频。
- [ ] Session Cookie 为 `HttpOnly; Secure; SameSite=Strict`，最长 8 小时。
- [ ] ESA 覆盖并保护应用信任的客户端地址头。
- [ ] `/api/inquiry` 有请求大小、字段白名单、honeypot、限频和去重保护。
- [ ] 生产制品和客户端 bundle 不含 server-only 凭据。
- [ ] 日志、分析事件和错误响应不包含询盘 PII。

## 11. Production Live 验收清单

### 11.1 云链路

- [ ] ESA 能稳定回源 FC，并保留正确 Host 和 HTTPS 信息。
- [ ] FC 能运行 SSR、Route Handler、后台和 standalone 健康检查。
- [ ] FC 能通过 VPC 私网连接 RDS 并复用有限连接池。
- [ ] 私有 OSS 直连被拒绝，ESA 受控分发和短期上传正常。
- [ ] 发布和下线能精确刷新 ESA URL。
- [ ] DirectMail HTTPS 测试发信成功，失败时页面正确降级。

### 11.2 恢复与回退

- [ ] RDS 自动备份可用，并已完成一次隔离恢复演练。
- [ ] 上一应用版本与迁移后 schema 兼容矩阵通过。
- [ ] FC 生产别名回退演练通过。
- [ ] 回退后 `/api/health`、后台、内容读取和公开页面验证通过。

### 11.3 合规与业务

- [ ] 正式主体、域名和 ICP 备案状态满足上线要求。
- [ ] 隐私、条款、免责声明和健康相关专业内容审查完成。
- [ ] 案例授权记录完整。
- [ ] 正式企业微信二维码、显示名和服务时间已确认。
- [ ] 中国大陆常见网络和微信内置浏览器验证通过。

### 11.4 成本

- [ ] 版本化流量和存储假设已记录。
- [ ] ESA、FC、RDS、OSS、DirectMail、日志与监控的实时报价已记录。
- [ ] 月度总成本不超过预算硬上限。
- [ ] FC 最大实例数、ESA 防护和费用告警已配置并验证。

执行最终自动校验：

```bash
pnpm validate:release
pnpm validate:release -- --require-production-live
```

第二条命令只有在全部强制 Production gate 为真实 `PASS` 时才应成功。当前真实云与成本输入缺失时，它预期失败并输出 Production `BLOCKED`，这是正确的安全门禁。

## 12. 回退流程

出现高错误率、关键路径失败、媒体不可用或数据库兼容问题时：

1. 停止继续扩大生产流量和后续 migration。
2. 核对上一版本与当前 schema 兼容矩阵。
3. 将 FC 生产别名切回上一健康的不可变版本。
4. 验证 `/api/health`、首页、后台、新闻、案例和询盘降级。
5. 仅刷新受影响的 ESA URL。
6. 观察 FC、RDS、OSS、DirectMail 和 ESA 指标恢复情况。
7. 记录脱敏事件时间线、版本、原因、处置和后续动作。

不得通过删除生产数据、回滚已执行的破坏性 DDL 或清空整个数据库完成应用回退。数据库恢复仅在明确的数据损坏或灾难恢复场景下，依据已演练的 RTO/RPO 流程执行。

## 13. 成本控制建议

本项目处于个人创业阶段，初期采用最小必要资源：

- FC 优先按量计费，设置有限最大实例数；是否配置最小实例由真实延迟需求决定。
- RDS 从满足连接、备份和恢复要求的小规格基础版开始，依据监控扩容。
- OSS 使用私有标准存储，按实际媒体容量和下行流量计费。
- ESA 按真实请求量、下行流量和安全能力核价。
- SLS 设置合理保留期，避免无限保留低价值日志。
- 设置预算硬上限和分级费用告警，异常流量优先由 ESA 限频/WAF 阻断。

成本表至少包含以下字段：

```text
报价日期 / 地域 / 产品 / 规格或计费项 / 数量
月访问量 / 峰值请求 / 下行流量 / OSS 容量 / 日志量
单项月成本 / 总月成本 / 预算硬上限 / 余量
报价来源 / 记录人 / 复核结果
```

## 14. 当前待办与阻塞项

截至本文更新日期：

- `M2-LEGACY-01`：缺少真实隔离 ESA、FC、RDS、OSS、DirectMail 资源和 probe 身份/token。
- `M2-LEGACY-02`：缺少真实报价、版本化流量假设和预算硬上限。
- 正式域名、ICP备案、企业微信、专业审查、大陆网络、恢复和回退仍需真实证据。

因此当前最高状态是 `CODE_READY_WITH_EXTERNAL_LEGACY`，不是 Production Live。完成真实资源采购后，应按本文第 6～11 节逐项执行，并将脱敏证据写入 `docs/5-Evidence/` 对应目录，而不是直接修改状态为 `PASS`。
