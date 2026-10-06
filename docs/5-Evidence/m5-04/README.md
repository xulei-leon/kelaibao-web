# M5-04 新闻 CMS 验收记录

日期：2026-09-24。范围：新闻/案例共享编辑器、浏览器图片上传、媒体单项读取、既有 MySQL/私有 OSS 接入及本地 SQLite 启动修复。

## 交付能力

- Tiptap 可视化正文与 HTML 高级模式；加载/切换不重写原始 HTML，不兼容格式留源码；只接受安全链接和已确认图片。
- 正文图片与封面选图、说明、尺寸/大小预检、上传进度、错误提示、同一 intent 重试和显式放弃。
- 封面自动绑定、公开使用授权、重开回显、移除绑定；不再手填媒体 ID。
- 未保存正文、待处理图片和上传操作均受离开保护；发布前保存，版本冲突和会话失效保留原稿。Navigation API 缺失时只读并提示升级浏览器。
- 版本历史独立查询且有截止时间；过期初始化响应不能覆盖当前输入；封面加载失败时保持容器宽度。
- MySQL/SQLite 媒体读取使用同一公开 DTO；SQLite runtime/bootstrap 对齐既有 schema 2，不改变生产 schema。

## 验证

| 项目 | 结果与边界 |
| --- | --- |
| 自动测试 | `pnpm test`：76 个文件、416 项通过 |
| 客户端边界 | 构建静态 JS 中未发现 OSS/MySQL/管理员 CSRF/DirectMail 服务端秘密变量标记；不是云凭据审计 |
| 类型检查 | `pnpm lint` 通过 |
| 生产构建 | `pnpm build` 通过，standalone 制品打包完成 |
| 制品 smoke | `pnpm smoke:standalone` 通过：SSR、Route Handler、WebP、OG PNG、运行时环境与公开页 |
| 真实本地新闻生命周期 | Chrome + Next dev + 独立 SQLite：登录、可视化创建、保存、发布；公开详情 HTTP 200 包含正文；草稿标题不出现在公开页；下线 410；重新发布 200 |
| 图片浏览器契约 | presign/PUT/confirm 受控 HTTP fixture；JPEG/PNG/WebP 控件与真实 PNG 文件，正文插入；封面未授权阻止保存；真实本地授权/保存/GET，刷新恢复封面 |
| 确认恢复 | HTTP fixture 连续三次 409 后显示重试；离开取消仍保留 intent；手动第四次确认成功，presign 总计一次，没有重新上传 |
| 导航与键盘 | 实际后退、链接离开取消后保留标题和路由；恢复到已保存值后后退/前进无需确认；Tab 从标题到摘要；模拟缺少 Navigation API 时全部编辑控件只读 |
| 防丢稿自动回归 | 版本冲突、失效会话→新 CSRF 重连保存、危险/旧 HTML 保留、悬挂历史响应、Strict Mode 旧初始化响应、pending 图片导航保护 |
| 四视口 | 320/390/768/1440px，document scrollWidth 等于 viewport width；截图人工核对工具栏折行、输入、图片、操作按钮，无横向溢出；同时检查控件 bounding rect，图片加载失败的 320px 封面也不超出视口 |

浏览器图片为 1200×630 纯色测试 PNG（约 12 KB），不是正式素材。fixture 只替代对象存储请求，不替代文章数据库、管理员鉴权、封面公开使用授权或保存/读取接口。使用 agent-browser 完成生命周期初验；其长请求控制出现挂起后改用本机 Playwright + Chrome 完成图片及边界验收。测试凭据、数据库和临时脚本保留在忽略目录 `.local-data`，未纳入提交。

生产构建的编辑路由 First Load JS 为 175 kB，共享 App JS 为 102 kB；Tiptap 使用管理页客户端延迟加载，公开新闻详情 First Load JS 为 115 kB。未将编辑器注入公开页面。

## 截图

- [320px](admin-320.png)
- [390px](admin-390.png)
- [768px](admin-768.png)
- [1440px](admin-1440.png)
- [320px 图片加载失败](admin-320-image-error.png)

## 评审与限制

文档/代码均完成双独立评审及逐项 review-confirm；gpt-5.5 不可选时采用原生继承模型作为第二 reviewer，并如实记录。已修复类型错误、历史导航、未决上传状态、Retry-After、历史请求冻结；额外修复实际 migrate→bootstrap schema 版本不一致和异步初次加载覆盖输入。

真实 RDS、OSS、STS 轮换、CORS、ESA purge、FC 部署和 Production 门禁本次未验证或执行。不能把本地 fixture/SQLite 结果解释成云环境已上线。生产架构仍为 ESA → FC → RDS MySQL + 私有 OSS。
