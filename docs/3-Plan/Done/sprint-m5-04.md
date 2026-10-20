# Sprint M5-04 新闻 CMS 自主图文编辑

> **2026-10-20 规格覆盖：** 本文新闻 CMS 自主编辑及补充为历史交付，目标版本不再要求保留此能力。 现行依据为 [FR-25](../../1-Requirement/Mainland-Website-FR/FR-25-static-news-and-cases.md)；M5-05 已完成静态代码与本地验证，真实内容迁移和 Production 证据仍待补齐。

## 1. Sprint 目标

完成 [FR-24](../../1-Requirement/Mainland-Website-FR/Done/FR-24-news-cms-authoring.md)，把已有 MySQL/OSS 新闻 CMS 补齐为可自主使用的图文后台。

## 2. 前置依赖

复用 FR-10～13 和 M5-01；遵守 AGENTS.md、全栈架构、视觉规范与现状核查文档。用户已授权无人工确认连续推进。

路径沿用项目索引：FR_DIR=docs/1-Requirement/Mainland-Website-FR，FR_DONE_DIR=其 Done，DESIGN_DIR=docs/2-Design，SPRINT_DIR=docs/3-Plan，SPRINT_DONE_DIR=其 Done，REVIEW_DIR=docs/4-Reviews，REVIEW_DONE_DIR=其 Done。FR_BACKLOG_DIR 使用 skill 默认 FR_DIR/backlog；不创建 workflow state 文件。验证命令来自产品 AGENTS.md。

## 3. 纳入范围

FR-24；src/components/admin、src/lib/admin、媒体单项读取 API/repository、package.json/lock、tests、README 和运行手册。复用现有数据 schema，不改变 MySQL/OSS 归属。

## 4. 暂不纳入范围

通用媒体库、文件删除、数据库更换、任意附件、站点重设计、真实云部署。仅扩展新闻所需操作，保留案例共享行为。

## 5. 工作范围

### 5.1 正文编辑与防丢稿

- [x] Tiptap 最小扩展和可访问工具栏，源码模式、受支持 HTML 判定及无损降级。
- [x] 外部粘贴/拖放图片不直接进入编辑器；可视化仅加载安全且已由服务器认可的图片 URL，不把原始 HTML 注入 DOM。
- [x] 表单状态与异步操作互斥、未保存提示、发布前保存、离开保护、中文版本/状态提示。
- [x] 测试旧 HTML 保留、危险 HTML、格式操作、保存/发布顺序、冲突输入保留。
- [x] 会话失效保持当前编辑页，提供新标签登录与重新连接按钮，重新取得 CSRF 后恢复保存/上传；增加原稿保留和新 token 使用测试。

### 5.2 图片上传与封面

- [x] 共享浏览器上传函数：客户端类型/大小校验、SHA-256、presign/PUT/confirm；签名只内存使用；请求超时，confirm 最多 3 次，有界退避并遵守 Retry-After。
- [x] 正文插图与封面上传控件；alt、图片预览、尺寸体积、显式公开使用确认与移除绑定。
- [x] 添加 GET /api/admin/media/[id]，复用 Session 鉴权、private no-store，返回已确认媒体公开 DTO；MySQL/SQLite repository 均实现 findById。
- [x] 服务器解析配置不应为读取封面要求未过期 STS：只读取公开 assets origin 和已确认 object key。
- [x] 上传后只绑定 confirm 返回资源；失败不覆盖正文；更换/移除封面不删除旧文件。
- [x] 测试上传契约、超时/重试、CSRF、未确认媒体、非法文件、代表图规格、授权与重开回显。

### 5.3 交付验证

实测发现既有 SQLite 管理员初始化和运行时仍只接受 schema 1，而当前迁移产出 schema 2，阻断 README 的后台启动流程。本 Sprint 将两处版本检查对齐 schema 2，测试数据库也通过真实 migrate 初始化，增加 migrate→bootstrap CLI 回归测试；不修改生产 MySQL 或迁移结构。

- [x] 本地账号/SQLite 隔离测试数据库验证新闻创建、草稿、发布、公开 SSR、下线与重新发布。
- [x] 四视口、键盘、错误状态；真实云上传缺少配置时以浏览器受控 HTTP fixture 验证 UI，明确其证据边界。
- [x] 使用说明、部署 CORS/STS 续期边界、评审记录和证据归档。

## 6. 验收标准

评审确认后的实施契约：

- 原始 HTML 字符串保留至真实编辑；无活动 DOM 解析，加载/切换先做受支持标签属性及结构等价检查，不兼容留源码。图片只允许来自服务端已净化正文或上传确认结果；粘贴仅纯文本，链接 https/mailto 且无凭据，禁止编辑态点击导航。
- Tiptap 3.31.3 MIT，同版本 React/core/pm/starter-kit/image；已核对 React 19 peer。仅管理端客户端延迟加载，水合与构建体积留证。
- 媒体错误提供稳定 code：401 认证、403 CSRF、409 confirmation_in_progress（Retry-After），422 校验，503 临时服务不可用。presign/session 15 秒、PUT 60 秒、confirm 30 秒；confirm 自动最多 3 次、普通错误 1/2 秒退避；处理中遵守 Retry-After，单次等待上限 30 秒；处理中或响应不确定保留 intent，提供手动“重试确认”，无需重新上传。过期/永久校验失败要求重选；不把 2 分钟租约内的处理中当作文件无效。
- 单媒体 GET DTO 固定 id/publicUrl/mimeType/byteSize/width/height/publicUsageConfirmedAt；不返回 objectKey/checksum/createdBy/intent，读取不依赖 STS。封面上传前检查体积、最小尺寸及宽高比，confirm 后复核，失败不绑定。

FR-24 各项验收通过；现有 CMS 状态机与公开页无回归；无人工 HTML/媒体 ID 操作即可完成常规图文新闻；Production 外部门禁仍独立。

## 7. 验证要求

pnpm test、pnpm lint、pnpm build；320px、390px、768px、1440px。针对新增交互写行为测试，媒体 repository 同时覆盖两适配器；不以静态 markup 测试代替编辑/上传交互。

## 8. 实施顺序

FR/Sprint → 独立文档评审 → review-confirm 与修订 → 媒体读取和上传 → 可视化编辑与防丢稿 → 独立代码评审 → review-confirm 修复 → 全量验证与浏览器核验 → 文档收口和仅本任务提交。

## 9. 风险控制

旧 HTML 不兼容留源码；HTML 安全与图片确认继续服务器负责；不自动确认文件授权；异步请求期间冻结相应操作，防止覆盖；STS 到期/真实 CORS/ESA 仍需真实环境证据。无破坏性 migration，回退应用版本即可回到旧编辑器，内容仍为兼容 HTML。

评审编排使用 Codex 原生子代理，不创建用户侧新任务。review-start 指定的 gpt-5.5 不在当前子代理可选列表内，因此第二评审使用继承主代理模型，并如实标注实际身份；用户已授权自动选择默认方案。

## 10. 交付结论

文档与代码 review-confirm 已通过，当前阶段：交付完成，提交记录见 Git。报告在 docs/4-Reviews/sprint-m5-04-review-*。两份评审均真实完成，其中一份使用当前原生模型代替不可用的 gpt-5.5，未冒充指定模型。

### 最终支持策略与复核

历史导航使用 Navigation API，在 Next.js 卸载编辑器前取消后退/前进。旧引擎只读并提示升级；已撤回不可靠的 popstate 哨兵方案。该边界经独立代码 reviewer 复核接受。未决图片文件、说明和 intent 计入离开保护；新建文章需完成/放弃待处理图片后才跳转。历史查询独立加载，有 15 秒截止时间。

全量测试 76 文件 / 416 项通过；lint 通过。浏览器在独立 SQLite 完成发布 200、草稿隔离、下线 410、重新发布 200；图片 presign/PUT/confirm 采用受控 HTTP fixture，授权、保存与重开使用真实本地接口。四视口无横向溢出。最终 pnpm build 与 pnpm smoke:standalone 均通过，详见验收记录。

证据：`docs/5-Evidence/m5-04/README.md`。代码复核输入与逐项裁决：`docs/4-Reviews/sprint-m5-04-code-review-*`。真实云部署不在本 Sprint 范围，Production 门禁不变。

## 2026-10-07 后续替代

用户要求移除可视化编辑。当前新建/编辑统一为 HTML textarea，Tiptap、可视化导入校验与专用测试已由 `docs/3-Plan/cms-html-only-editor.md` 计划移除；本文件上述检查数和可视化证据仅代表当时历史实现，当前验收另行记录。
