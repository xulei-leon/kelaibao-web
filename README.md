# 客来宝统一中文官网

客来宝面向中国大陆市场提供统一中文官网：客来宝是唯一主品牌，K-Link 是一站式拓客工具系统和小程序产品，客来宝媒体是站内的专业表达与内容顾问业务。

当前 M1/M2 已形成公开站、阿里云全栈 Next.js、单管理员新闻/案例 CMS、私有媒体、DirectMail 询盘和 SEO/GEO 发现基线。M3-01～M3-05 在不改变这些安全与数据边界的前提下，依次完成品牌与目录迁移、产品页面、媒体单页、统一首页和发布收口。真实云、备案、授权、口径、恢复和回退证据未齐时，Production 仍为 `BLOCKED`。

目标生产架构：

```text
Alibaba Cloud ESA
  -> Function Compute（全栈 Next.js：公开 SSR、/admin、/api）
      -> RDS MySQL
      -> 私有 OSS
      -> DirectMail
```

## 本地运行

```bash
pnpm install
pnpm dev
```

打开 `http://localhost:3000`。环境变量可从 `.env.example` 复制到 `.env.local`；不要提交真实联系人、二维码、数据库、OSS、ESA 或 DirectMail 凭据。

## 验证

```bash
pnpm test
pnpm lint
pnpm build
pnpm smoke:standalone
pnpm validate:release
```

`lint` 与 `typecheck` 都使用 TypeScript 无输出检查。`build` 生成可由 Function Compute 运行的 Next.js standalone 制品；本地发布校验通过不代表 Production 外部门禁已通过。

## 无 MySQL 的本地后台调试

本地可使用 Node 22.13+ 内置 SQLite 调试管理员登录、Session、新闻/案例 CMS、修订、发布/下线、审计和本地 purge job。SQLite 只允许 local-test，不用于 FC、Production 或真实发布证据。

`.env.local` 至少配置：

```env
SINO_RUNTIME_MODE=preview
NEXT_PUBLIC_SITE_URL=http://localhost:3000
DATABASE_ADAPTER=sqlite
DATABASE_RUNTIME_SCOPE=local-test
DATABASE_URL=
SQLITE_DATABASE_PATH=.local-data/kelaibao.local-test.sqlite
ADMIN_DUMMY_PASSWORD_HASH=<pnpm admin:dummy-hash 的输出>
ADMIN_CSRF_SECRET=<至少32字节的base64url随机值>
```

SQLite 模式下删除或留空 `MYSQL_POOL_LIMIT`、`MYSQL_QUEUE_LIMIT`、`MYSQL_ACQUIRE_TIMEOUT_MS`、`MYSQL_MAX_APP_INSTANCES` 和 `MYSQL_CONNECTION_BUDGET`，避免产生不确定配置。

### Windows PowerShell 初始化

```powershell
cd D:\code\tokengate\products\kelaibao

node --version
pnpm install

$env:SINO_RUNTIME_MODE='preview'
$env:NEXT_PUBLIC_SITE_URL='http://localhost:3000'
$env:DATABASE_ADAPTER='sqlite'
$env:DATABASE_RUNTIME_SCOPE='local-test'
$env:DATABASE_URL=''
$env:SQLITE_DATABASE_PATH='.local-data/kelaibao.local-test.sqlite'

Remove-Item Env:MYSQL_POOL_LIMIT -ErrorAction SilentlyContinue
Remove-Item Env:MYSQL_QUEUE_LIMIT -ErrorAction SilentlyContinue
Remove-Item Env:MYSQL_ACQUIRE_TIMEOUT_MS -ErrorAction SilentlyContinue
Remove-Item Env:MYSQL_MAX_APP_INSTANCES -ErrorAction SilentlyContinue
Remove-Item Env:MYSQL_CONNECTION_BUDGET -ErrorAction SilentlyContinue

$env:ADMIN_DUMMY_PASSWORD_HASH=(node scripts/generate-admin-dummy-hash.mjs).Trim()
$env:ADMIN_CSRF_SECRET=(node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))").Trim()
$env:ADMIN_USERNAME='admin@example.test'
$env:ADMIN_PASSWORD=Read-Host '请输入本地管理员密码（至少14字符）'
$env:ADMIN_OPERATION_REASON_CODE='LOCAL_SQLITE_BOOTSTRAP'

pnpm db:sqlite:migrate
pnpm admin:bootstrap
Remove-Item Env:ADMIN_PASSWORD
pnpm dev
```

`node --version` 必须为 `22.13+`。打开 `http://localhost:3000/admin/login`，使用 `admin@example.test` 和刚才输入的密码登录。本地 HTTP Cookie 不设置 `Secure`；HTTPS/Production Cookie 继续强制 `Secure`。

### 手工验证后台编辑功能

登录后选择“管理新闻”→“新建新闻”，可以使用以下测试数据：

```text
标题：SQLite 手工验证新闻
摘要：用于验证本地后台编辑、发布和下线流程
```

Slug 无需填写，首次创建草稿时自动生成；保存后只读显示链接路径。修改标题不会改变链接，已有内容继续使用原链接。

HTML 正文示例：

```html
<h2>本地 SQLite 测试</h2>
<p>这是一条后台编辑测试内容。</p>
<script>alert("should be removed")</script>
```

按以下顺序检查：

1. 点击“安全预览”：普通 HTML 正常显示，`script` 不执行并被 sanitizer 移除。
2. 点击“创建草稿”：进入编辑页，公开状态为 `draft`，页面显示 Draft revision 编号。
3. 点击“发布”：公开状态变为 `published`；使用编辑页显示的自动链接（例如 `/news/news-0123456789abcdef`）查看公开内容。
4. 修改标题并点击“保存草稿”：编辑页提示公开 revision 未改变，公开页面仍显示上一个已发布版本。
5. 点击“发布草稿更新”：公开页面显示新标题；点击“查看 revision 历史”可以看到多条 revision。
6. 点击“下线”：状态变为 `offline`，公开 URL 返回下线状态（HTTP 410）。
7. 点击“重新发布”：内容重新公开。

案例授权门禁可通过“管理案例”→“新建案例”验证。首次发布案例前必须勾选授权确认；未勾选时发布按钮不可用，发布后编辑页应显示案例授权记录。

Session 可通过以下操作验证：

- 登录后刷新页面，仍然保持登录状态。
- 登录后直接访问 `/admin/news`，可以正常进入。
- 点击退出后再次访问 `/admin`，应返回登录页。
- 清除 `localhost` 的站点 Cookie 后刷新后台，应要求重新登录。

SQLite 模式的发布/purge 只写入本地任务和审计记录，不访问 ESA、RDS 或其他云服务，也不能作为 Production 通过证据。

### 重置本地测试数据

先停止 `pnpm dev`，然后在仍保留上述 SQLite 环境变量的 PowerShell 中执行：

```powershell
pnpm db:sqlite:reset
pnpm db:sqlite:migrate

$env:ADMIN_USERNAME='admin@example.test'
$env:ADMIN_PASSWORD=Read-Host '请输入新的本地管理员密码（至少14字符）'
$env:ADMIN_OPERATION_REASON_CODE='LOCAL_SQLITE_BOOTSTRAP'
pnpm admin:bootstrap
Remove-Item Env:ADMIN_PASSWORD

pnpm dev
```

`pnpm db:sqlite:reset` 只允许删除项目 `.local-data` 内选定的 `.sqlite` 文件及同 basename 的 `-wal`、`-shm`、`-journal` sidecar，不会访问或修改 MySQL/RDS。

RDS MySQL 和开发机本地 MySQL 继续使用同一个 `mysql` adapter 与既有 `pnpm db:migrate`；只需通过 `DATABASE_URL` 指向不同服务器。

## 品牌与转化边界

- 全站主品牌是客来宝；K-Link 不建立第二站点，客来宝媒体不形成站中站。
- “免费体验”只打开客来宝小程序二维码，不要求 Web 注册，也不进入询盘表单。
- “咨询客来宝媒体”只打开企业微信二维码；失败时进入 `/about#contact` 联系区降级。
- 两类二维码分别配置、分别提供替代文本和分析事件，不得互相替代。

## 技术与业务边界

- 与英文站完全隔离，不复用其源码、内容、账号、数据或部署。
- 备用询盘提交到同域 `/api/inquiry`，由服务端调用 DirectMail，不保存线索。
- 仅提供一个预创建的后台管理员，不提供公众账号、支付、自动报价、CRM、团队权限或产品 Dashboard。
- CMS 只维护新闻和获授权案例；首页、功能、团队、媒体、关于和政策页面继续由代码维护。
- Preview 默认阻止索引；只有真实主体、备案、二维码、DirectMail、云链路、专业审查、授权与恢复门禁全部通过后，才能配置 Production。

当前需求见 [Kelaibao-Unified-Website-SRS.md](docs/1-Requirement/Kelaibao-Unified-Website-SRS.md)，视觉基线见 [Kelaibao-Unified-Website-Visual-Design-Spec.md](docs/2-Design/Kelaibao-Unified-Website-Visual-Design-Spec.md)，技术基线见 [Alibaba-Cloud-Fullstack-Architecture-Spec.md](docs/2-Design/Alibaba-Cloud-Fullstack-Architecture-Spec.md)，完整云资源与发布流程见 [Alibaba-Cloud-Deployment-Guide.md](docs/2-Design/Alibaba-Cloud-Deployment-Guide.md)，控制台上传 ZIP 的逐步操作见 [FC部署指南](FC部署指南.md)，实施顺序见 [Mainland-Website-Sprint-Index.md](docs/3-Plan/Mainland-Website-Sprint-Index.md)。

## 新闻 CMS 图文操作（M5-04）

新闻管理列表的“编辑”右侧提供“删除”。确认后文章从后台移除，已发布文章同时下线，旧公开链接返回 410；未发布草稿返回 404。删除为逻辑删除，修订、审计和图片保留，后台没有撤销/恢复入口。版本冲突时刷新列表再重试；案例不提供删除。

删除功能上线前 MySQL 必须显式执行 `005_news_soft_delete.sql`（通过既有 `pnpm db:migrate`）。SQLite local-test 必须显式运行 `pnpm db:sqlite:migrate` 升级到 schema 3；迁移保留既有文章，不能在请求中自动运行。

后台入口为 `/admin/login` → `/admin/news`。使用支持 Navigation API 的当前浏览器；不支持时后台保持只读并提示升级，以保证后退/前进不会静默丢稿。

1. 新建新闻，填写标题、摘要，在“HTML 正文”中直接输入 HTML 源码；Slug 首次保存时自动生成。图片从下方选择并填写图片说明，上传确认成功后将 img 标签追加到 HTML 正文末尾。
2. 可选封面支持 JPEG、PNG、WebP，至少 1200×630、约 1.90:1、最大 350 KB。上传自动绑定资源；显式点击“确认该媒体可公开使用”后保存。移除封面只解除绑定。
3. 点击安全预览、保存草稿，再发布。未保存时发布/下线不可用；保存草稿不会修改公开版本。版本历史独立读取，不锁住正文。
4. 正文只提供 HTML 编辑，无可视化/格式工具栏/模式切换；加载和粘贴按原始字符串保留，不执行 HTML。编辑后使用安全预览检查净化结果，图片继续通过下方上传添加。
5. 网络错误或图片仍在确认时，保留本页并点击“重试确认”；也可显式放弃本次图片操作。待处理图片与未保存正文均受离开保护。新建文章需先完成或放弃待处理图片，才会跳转到已创建草稿。
6. 登录过期时保留当前页，点击“在新标签页登录”，登录后返回点击“重新连接会话”，再保存或重试确认。正文不会写入浏览器 Web Storage。

生产仍使用 MySQL 保存文章、修订和媒体元数据，私有 OSS 保存图片文件。本地 SQLite 测试不提供真实 OSS；存储配置缺失时纯文字新闻可正常使用，图片上传明确失败。详见 [运行手册](docs/2-Design/Admin-Security-and-Media-Runbook.md) 和 [M5-04 验收](docs/5-Evidence/m5-04/README.md)。
