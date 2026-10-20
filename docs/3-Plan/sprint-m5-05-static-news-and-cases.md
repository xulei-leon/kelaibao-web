# Sprint M5-05：新闻与案例静态化

- 日期：2026-10-20
- 覆盖：[FR-25](../1-Requirement/Mainland-Website-FR/FR-25-static-news-and-cases.md)，FR-13 增量
- 设计：[静态内容规格与基线分析](../2-Design/Static-News-and-Cases-Spec.md)
- 状态：LOCAL_CODE_READY_WITH_EXTERNAL_LEGACY；文档/代码实施者复核、代码与本地验收完成，真实历史内容/URL 迁移及 Production BLOCKED。

## 交付顺序

1. 完成 FR/Sprint 文档 review-confirm，复核基线 `f4cfea3` 之后的增量；既有 CMS review-confirm 不适用于本次退场变更。
2. 盘点实际公开内容、草稿、下线/删除 URL、图片与授权，形成受控迁移清单和备份。只有本地测试库时记录外部缺口；不访问或改动其他项目数据。
3. 建立代码维护的新闻/案例公开模块及撤回/跳转清单，迁入经过核对的公开 snapshot，保留原路径与日期。实现静态列表/详情及真实 404/410，保持公开视觉与交互。
4. 将首页/关于页摘要、metadata、结构化数据、sitemap、RSS、llms 统一接入同一静态清单；消除公开内容对内容 repository、运行时数据库、CMS HTTP 请求与客户端取数的依赖。
5. 移除仅用于 CMS 的后台和 API、上传/认证/编辑组件、事务发布与 purge worker/调度，以及无调用的专用依赖和测试。调用核查后再处理共享模块；保留历史迁移和数据，不 DROP 或清库。
6. 按实际剩余用途更新运行配置校验、健康检查、部署模板、README、FC 部署指南、运维手册和 release validator。静态页面验收不要求连接内容数据库；整个应用/基础设施是否还需 RDS/OSS 另按实际依赖判断，不擅自退役。
7. 运行质量检查与视口验证，完成代码 review-confirm，保留本地证据。部署时先停旧 CMS 写入并核对最终导出，再切换版本、刷新受影响 ESA URL 并抽查；记录失败回退结果。真实数据或云证据缺失时 Production 保持 BLOCKED。

## 验证与退出条件

- 内容字段、稳定排序、唯一 slug、日期、授权与清单冲突的有意义校验；未知 URL、历史撤回/跳转和无内容状态。
- 无数据库和数据库不可用两种条件下，静态页面构建/首响应与发现文件可用；用现有适配器边界断言不查询内容库，不只检查最终 HTML。
- CMS 入口与 mutation API 不可用；保留询盘 DirectMail、限频、隐私、二维码、旧顾问路由与品牌边界回归。
- 运行 `pnpm test`、`pnpm lint`、`pnpm build`；涉及制品/发布追加 `pnpm smoke:standalone`、`pnpm validate:release`。
- 检查 320、390、768、1440px 的新闻/案例列表与详情、长标题、图片、空状态、返回入口及首页/关于页摘要。
- 迁移清单逐条核对，私有草稿/证明不进入制品；真实 FC/ESA 发布、缓存与回退仅以真实证据判定，不以本地测试替代。

当前实现和验证结果见 [M5-05 验收](../5-Evidence/m5-05/README.md)，文档与代码 review-confirm 均已记录。剩余外部任务是实际内容/URL/授权核对、Linux FC 制品与真实部署/缓存证据；本地代码完成不代表 Production Live。
