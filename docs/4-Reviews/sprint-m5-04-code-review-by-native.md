# Sprint M5-04 独立代码评审（原生继承模型）

- 日期：2026-09-24。
- 评审身份：Codex 原生独立子代理，继承主代理模型（GPT-6 系列），未使用或冒充 `gpt-5.5`。
- 基线：当前工作区 M5-04 变更及新增文件；依据已通过的 FR-24、Sprint M5-04 与文档 review-confirm。
- 范围：编辑器、图片上传与浏览器 helper、媒体 API/DTO、两种媒体 repository、SQLite schema 2 启动修复及新增测试。图谱中的编辑器仍为旧索引，新实现使用实际文件补证。
- 方法：独立静态代码审查，并核对已安装 Next.js 的 App Router 历史导航实现。未执行浏览器操作或新增测试，主代理正在并行完成运行验证；不把静态推演写为已实测。
- 结论：发现 1 项 High、1 项 Medium，建议修复后验收。未发现需要扩大数据库、图库或云部署范围的问题。

| Severity | Type | Location | Issue | Evidence | Recommendation |
| --- | --- | --- | --- | --- | --- |
| High | Correctness | `src/components/admin/content-editor.tsx:94`，离开保护 effect | 浏览器后退/前进绕过未保存保护，普通的“列表进入编辑→修改正文→浏览器后退”路径仍可无提示丢稿。 | 当前仅注册 `beforeunload` 与 document `click`，只能处理文档卸载或链接点击。Next.js App Router 在同文档历史导航的 `popstate` 中执行 `dispatchTraverseAction`，不会触发上述两个事件（已核对本地 `node_modules/next/dist/client/components/app-router.js` 的 `onPopState`）。页面中的正文只在 React state 中，切回列表卸载组件即丢失；busy 上传也有相同缺口。FR-24 第 7 项明确要求离开保护。 | 补齐 App Router 历史导航保护，取消离开时保持当前 URL、编辑器状态和上传状态；不要把未保存正文持久化到 Web Storage。浏览器验收覆盖列表→编辑→改正文→浏览器后退/Alt+Left，以及取消离开后可继续保存；不要仅 dispatch 合成事件而不验证路由是否实际保留。 |
| Medium | Reliability | `src/components/admin/content-editor.tsx:337`，`loadRevisions()` 与新增表单 disabled fieldset | 历史读取无超时或取消路径，却占用全局 busy；悬挂请求会使正文、保存和会话重连全部持续禁用，无法在当前页继续工作。 | `loadRevisions` 在 fetch 前设 busy，fetch 仅有 `cache: "no-store"`，并继续等待 `response.json()`；只有请求结束才执行 finally。新实现把整个编辑 fieldset 和 RichTextEditor 都绑定到 busy，同时重连按钮也禁用。用户有未保存正文时点击“查看版本历史”，遇到响应或 JSON body 长时间不结束，将只能等待或离开未保存页面。历史请求无截止时间是既有行为，但本次引入全表单冻结扩大了其影响。 | 为历史请求及响应体读取设置有界截止时间，失败后释放 busy、保留原稿，并增加悬挂响应/响应体的行为回归；或将只读历史查询与会冻结编辑器的操作状态分离。无需更改业务状态机。 |

已检查而未列为缺陷的部分：重新连接会话不卸载编辑页、变更前读取新 CSRF；原始 HTML 经纯解析白名单及结构等价检查后才进入 Tiptap，不兼容内容留源码；上传只绑定确认结果并保留待确认 intent；封面显式授权；单媒体 GET 鉴权、无缓存且不读取 STS；MySQL 参数化读取；SQLite 运行时及管理员初始化与真实迁移 schema 2 对齐。新增测试能证明其中一部分契约，但完整上传交互和真实 OSS/CORS/STS 仍需按 Sprint 的证据边界验收。

## 修复复核（2026-09-24）

本轮只读核对 `use-leave-guard.ts`、`content-editor.tsx`、`image-upload.tsx` 与相关测试，未操作浏览器、未修改源码、未重新执行测试。实际浏览器证据由主代理补充。以下结论更新上文各问题状态，不将源码核对等同浏览器实测。

- N2 历史请求冻结：修复代码通过静态复核。`loadRevisions` 改为独立 `historyLoading`，通过 `mediaJson` 设置 15 秒截止时间，finally 释放历史按钮；正文、保存、会话重连不依赖该状态。新增测试显式模拟 response JSON body 挂起、触发 abort，并断言原稿及控件可用。
- S3 pending 上传保护：修复代码通过静态复核。文件、说明、待确认 intent 通过 `onPendingChange` 上报并合并进 leave guard；显式放弃和成功插入清除 pending。新建草稿在 pending 状态禁止通过 `router.replace` 离开；既有草稿保存不会卸载上传组件。测试覆盖已保存文章上仅有待处理图片说明时点击返回被阻止，以及确认响应不确定后保留 intent、只重试确认、成功后清除 pending。
- N1/S2 历史导航保护：部分修复。Navigation API 分支对可取消的同文档 traverse 在路由更新前询问，取消时 `preventDefault()`；普通单步后退的旧浏览器 sentinel 流程也有保护。然而旧浏览器降级仍存在下表中的明确绕过路径，不能整体标记为关闭。现有新增测试未覆盖 Navigation API traverse 或旧浏览器 sentinel 的实际历史跳转；需要补充针对性证据。

| Severity | Type | Location | Issue | Evidence | Recommendation |
| --- | --- | --- | --- | --- | --- |
| Medium | Correctness | `src/lib/admin/use-leave-guard.ts`，`pop` 的 `event.state.cmsEditorGuard` 分支 | 无 Navigation API 时，跨越 sentinel 的历史跳转仍会无提示丢稿。 | 本页首次 dirty 后历史为 `[列表, 编辑页 base, 编辑页 sentinel]`。浏览器历史菜单直接选择列表，或 `history.go(-2)`，只在最终条目派发 popstate；目标列表没有 `cmsEditorGuard`，因此两个分支都不命中，既不询问也不阻止 Next App Router 接收事件。此次为同文档导航，不触发 beforeunload，旧问题仍在该路径成立。 | 降级方案需要识别并拦截任何离开当前编辑项的历史遍历，不能只识别中间 base 条目；取消时恢复到正确历史位置，避免破坏 Next 的状态。增加无 Navigation API 的单步后退、取消恢复、历史菜单跨多项跳转与保存后正常离开的针对性测试/浏览器证据。 |

复核结论：历史请求与 pending 上传保护可进入最终验证；历史导航保护保留上述降级分支问题，等待修复或明确限制支持范围后再裁决。

## 最终支持策略复核（2026-09-24）

再次只读核对最终 `use-leave-guard.ts`、`content-editor.tsx` 与相关测试；未操作浏览器或改动源码。本节取代上一节关于 sentinel 残留问题的开放状态。

- 已移除 sentinel、popstate 恢复及 history push/replace 操作，不再依赖无法保证的旧引擎历史拦截。
- `useLeaveGuard` 默认返回不支持；effect 确认 Navigation API 存在并注册监听后才启用编辑。`editingDisabled` 同时控制原生 form fieldset、RichTextEditor 和两个上传组件，避免不支持的浏览器在检测前或检测后产生新的正文、字段或待上传输入。界面明确提示编辑已暂停，并允许读取已有内容和历史。
- 支持的浏览器继续对可取消的同文档 traverse 调用 `preventDefault()`，文档离开及站内链接保留各自保护；未保存正文、busy 操作与 pending 图片均参与判断。新建草稿的程序化跳转仍须先消除 pending 图片。
- 已添加无 Navigation API 时正文、标题禁用及提示的测试。源码中图片控件获得同一个禁用条件，其内部文件、说明和上传/重试/放弃按钮全部使用该条件；原生 fieldset 同时覆盖保存、预览、发布和授权操作。

最终静态复核结论：在“仅具有 Navigation API 的浏览器可编辑，其余浏览器只读”的明确支持策略下，N1/S2 与上一轮 sentinel 绕过问题可关闭；N2 和 pending 上传保护保持已修复结论。本轮未发现新增阻断问题。主代理应将支持策略写入 FR/Sprint/review-confirm，并以其实际浏览器验收及工程检查结果完成最终交付记录；本报告不声称完成这些运行验证，也不保证所有旧版本浏览器可编辑。
