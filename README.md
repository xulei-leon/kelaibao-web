# 客来宝统一中文官网

独立的 Next.js 全栈工程。新闻与案例已按 [FR-25](docs/1-Requirement/Mainland-Website-FR/FR-25-static-news-and-cases.md) 改为代码维护的静态页面；后台编辑、登录、上传、修订与内容 API 已移除。生产平台继续采用 ESA → Function Compute，询盘经同域 `/api/inquiry` 由 DirectMail 发送。

当前本地内容清单为空；未读取真实 CMS 数据库，不代表线上没有文章。历史内容、URL、图片和授权的核对记录在 [M5-05 验收记录](docs/5-Evidence/m5-05/README.md)，Production 继续受真实外部门禁约束。

## 本地运行

使用 Node.js >=20 <25 和 pnpm 10.34.5。FC ZIP 仍须在 Linux x86_64、Node.js 20.x 构建。

```sh
pnpm install --frozen-lockfile
pnpm dev
```

打开 `http://localhost:3000`。从 `.env.example` 配置本地环境；不提交真实联系人或云凭据。新闻、案例和发现文件不需要数据库、管理员密钥或 OSS 上传配置。询盘配置缺失时服务端安全失败，不发送邮件。

## 维护新闻与案例

在 [src/content/articles.ts](src/content/articles.ts) 维护 `ARTICLES`。条目包括类型（`news` / `case`）、稳定 slug、标题、摘要、首次发布日期、当前发布日期、修改日期、正文内容块和可选图片。日期必须包含时区；案例必须填写公开的授权复核日期，私人证明留在发布记录，不放进内容模块。

正文支持段落、二级标题、引述、列表和图片，由 React 作为内容渲染，不执行 HTML。图片使用已授权静态文件或稳定 HTTPS URL，需要 alt 与宽高，不接受临时签名参数。沿用现有图片格式、体积与构建预算。不要导入待审材料、私人草稿、测试文章或授权证明。

新闻与案例保留 `/news/[slug]`、`/cases/[slug]`。修改标题不改 slug；撤回已公开文章时从 `ARTICLES` 移除并将原路径加入 `WITHDRAWN_CONTENT`（真实 410）；路径迁移加入 `CONTENT_REDIRECTS`（308，目标必须是当前公开文章）。未知路径为 404。不能同时公开、撤回或重定向同一路径。

列表、详情、首页/关于页摘要、metadata、结构化数据、sitemap、RSS 和实验性 llms 使用同一静态内容源，构建部署后才更新。没有文章时保留空状态。Preview 继续禁止索引。

## 质量与制品

```sh
pnpm test
pnpm lint
pnpm build
pnpm smoke:standalone
pnpm validate:release
```

`pnpm build` 生成响应式图片、Next.js standalone 和 `.next/static-content-manifest.json`；manifest 随制品打包为 `static-content-manifest.json`。构建输出的新闻/案例列表和详情必须为静态生成，发现文件为静态路由。完整 FC 打包与部署见 [FC-PACKAGING.md](FC-PACKAGING.md) 和 [FC部署指南](FC部署指南.md)。

`validate:release` 保留旧证据 schema 兼容，并以静态内容迁移证据替代旧 CMS 品牌迁移 gate。其余云、备案、口径、授权、恢复和预算门禁仍保留。`--require-production-live` 在生产证据不足时返回非零，不以本地通过冒充上线许可。

## 迁移、缓存与回退

旧 SQL migration 保留。不要删除数据库、修订、审计或 OSS 对象，不擅自注销云资源。原 CMS 版本需要的数据库和媒体须保留供回退；新应用运行时不连接内容数据库。

在受控环境临时注入只读 MySQL 身份，执行 `pnpm content:inventory` 可将旧内容和已发布快照盘点到被忽略的 `.local-data/legacy-content-inventory.json`。脚本仅 SELECT，只读事务，不导出工作草稿正文，不覆盖旧文件，不记录凭据或内容。导出文件须私下逐条审查后手工转成受控内容块，并填写迁移清单；导出成功不代表授权或迁移完成。

发布时保留上版制品/URL manifest，停用旧 CMS 写入口，核对最终公开内容、撤回/跳转清单、原始日期和图片。`pnpm cache:refresh --previous-manifest <上版manifest路径>` 默认只打印精确 URL 计划；`--apply` 才使用发布环境独立 ESA 身份直接 HTTPS 提交刷新（该动作不在开发验证中执行）。旧 CMS 首次切换需按核实的旧 URL 清单制作上版 manifest，不能用空文件替代。必须验证 ESA 任务完成和实际首响应，再开放流量；失败停止发布或回退。

生产迁移证据位于 `docs/5-Evidence/m5-05/static-migration.json`，应包含真实盘点完成状态、复核人/日期/证据、当前源码 digest，以及与本次 build manifest 完全一致的 200/410/308 URL 映射。空本地清单不会自动通过。
