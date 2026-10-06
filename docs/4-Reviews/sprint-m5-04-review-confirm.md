# Sprint M5-04 文档 Review Confirm

日期：2026-09-23。目标：FR-24 与 Sprint M5-04。

## 输入与结论

已读取 `sprint-m5-04-review-by-native.md`、`sprint-m5-04-review-by-gpt-5.6-sol.md`、FR/Sprint、现有编辑器、Session API、sanitizer、OSS provider 与媒体接口。下列裁决应用后允许实施。

| No. | Severity | Type | Review Source | Original Comment Summary | Decision | Evidence | Follow-up Plan / Rejection Reason |
| --- | --- | --- | --- | --- | --- | --- | --- |
| N1 | High | Correctness | native 第 1 项 | 会话过期后登录与旧 CSRF 可能导致丢稿或无法继续保存 | Accept | 编辑器使用组件状态与缓存 token；登录页跳转会卸载原页；Session API 支持重新取得 token | FR 第 9 项和 Sprint §5.1 已明确新标签登录、原页重连、每次变更读取当前 token，并要求恢复测试。 |
| S1 | High | Correctness | sol 第 1 项 | 媒体错误分类与会话恢复不明确 | Accept | 媒体路由统一 400，无法识别鉴权与重试 | 媒体错误响应增加稳定 code 和 401/403；按 N1 恢复，不自动重放发布动作。 |
| S2 | High | Correctness | sol 第 2 项 | HTML 无损判定不明确 | Partial | sanitizer 支持表格等超出最小编辑器 schema 的内容 | 保留原始字符串直到实际用户编辑；使用无活动 DOM 的解析校验及序列化结构等价检查，失败留源码。无需新增服务端兼容 API：保存/预览已有服务端净化；可视化图片仅接受既有 sanitizedHtml 中的确认 URL 或新上传确认 URL。 |
| S3 | High | Security | sol 第 3 项 | 编辑态链接协议与点击行为缺少约束 | Accept | 保存时净化不能保护编辑时交互 | 限制 https/mailto、拒绝凭据/相对/危险 URL；关闭点击导航，粘贴仅纯文本；添加安全测试。 |
| S4 | Medium | Reliability | sol 第 4 项 | confirm 租约与短重试不匹配 | Partial | 租约 120 秒；成功重复调用返回同一 asset | 自动确认最多 3 次，处理中返回 409 confirmation_in_progress/Retry-After；保留 intent 提供“重试确认”，不自动重传；过期/永久校验失败不重试，临时异常可重试。无需阻塞浏览器自动轮询整个租约窗口。 |
| S5 | Medium | Clarity | sol 第 5 项 | 单媒体 DTO 不明确 | Accept | 回显无需 STS 或内部字段 | 固定 id/publicUrl/mimeType/byteSize/width/height/publicUsageConfirmedAt；仅解析公开 origin，鉴权、无缓存。 |
| S6 | Medium | Usability | sol 第 6 项 | 封面应先校验规格 | Accept | 正文 10 MB 与封面 350 KB 规则不同 | 上传前用本地图片尺寸校验，confirm 后复核；失败不绑定；服务器最终校验不变。 |
| S7 | Medium | Dependency | sol 第 7 项 | 依赖、水合与包体缺少门禁 | Accept | React 19/Next.js 15，Tiptap 尚未安装 | 锁定 3.31.3 MIT 同版本套件（已查询 peerDependencies 支持 React 19），管理员客户端延迟加载，检查水合及构建体积。 |

## 状态

全部建议已裁决；Accepted/Partial 契约写回 Sprint 后文档门禁通过。用户已授权自动默认选择，不需要人工确认。
