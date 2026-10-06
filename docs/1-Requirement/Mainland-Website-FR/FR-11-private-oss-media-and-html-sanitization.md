# FR-11 私有 OSS 媒体与 HTML 安全净化

- `FR-ID`: `FR-11`
- `标题`: 私有 OSS 媒体与 HTML 安全净化
- `所属阶段`: 阶段 5 - 阿里云全栈升级
- `开发顺序`: 11
- `优先级`: P0
- `前置依赖`: `FR-09`、`FR-10`
- `涉及包`: 编辑器/预览、HTML sanitizer、`/api/admin/media/*`、OSS、`media_assets`
- `是否属于原型阶段`: 否
- `来源类型`: 新需求
- `原始 SRS 章节`: 6.12、8、11.5
- `相关 FR`: `FR-12`、`FR-13`

## 目标

允许管理员编辑富内容和上传图片，同时确保任何原始 HTML 或云凭据都不能直接到达公开页面或浏览器。

## 背景与问题

自由 HTML 能降低编辑限制，但会引入存储型 XSS；OSS 公共读或浏览器长期密钥会扩大数据暴露面。

## 影响范围

- HTML source/sanitized 存储、服务端净化和 sandbox 预览。
- JPEG/PNG/WebP 上传、短期预签名、私有 OSS 与 ESA 媒体分发。
- `media_assets` 元数据、删除/引用规则和安全测试。

## 需求描述

1. 编辑器可接收 HTML source，但保存/预览/发布均由服务端使用当前 sanitizer policy 重新净化，旧版本 sanitized 结果不得直接复用。
2. source 和 sanitized HTML 分开保存；sanitized 产物同时记录 sanitizer policy/version 和脱敏诊断摘要，公开渲染只使用当前 policy 生成的 sanitized 版本。
3. allowlist 必须阻止 script、事件属性、iframe、form、SVG、危险 URL、未知嵌入和可执行样式。
4. 预览在 sandbox iframe 中显示净化结果，不允许 `allow-scripts` 或 `allow-same-origin`；预览文档使用 restrictive CSP，禁止表单、顶层导航和非 allowlist 外联。
5. 媒体只接受 JPEG、PNG、WebP，单文件最大 10 MB。
6. `/api/admin/media/presign` 在鉴权和 CSRF 校验后创建短期单次 upload intent，绑定管理员、服务端对象键、MIME、最大大小、nonce 与过期时间，再生成只允许该约束集合的上传授权。
7. 浏览器 HTTPS 直传私有 OSS；`/api/admin/media/confirm` 必须通过独立的 OSS 直接 HTTPS 客户端读取对象元数据和受限内容，验证 intent 归属/有效期/未消费、对象键、大小、MIME、魔数和 SHA-256 后，原子写入 `media_assets` 并消费 intent。
8. confirm 重复调用必须幂等返回同一媒体记录或安全失败；不得确认他人 intent、复用已消费 intent 或用同一对象键替换已确认内容。
9. 公开媒体 URL 的本地构造只允许 ESA 控制的 assets 域名或路径；真实 Bucket 私有性、ESA 回源/分发与签名过期/越权证据继续为 `M2-LEGACY-01 / DEFERRED`。

## 高层要求

- 浏览器不得获得长期 OSS AccessKey；Bucket 不得设为公共读。
- 文件名由服务端生成，不信任用户路径和扩展名。
- 每次发布都重新净化，避免旧算法结果永久绕过新规则。
- sanitizer allowlist、协议、属性和 CSS 策略以版本化服务端配置维护；诊断不得回显可执行 payload 或秘密。
- 所有 OSS 调用通过独立 provider 边界直接使用明确 HTTPS API/受限签名，不使用通用 webservice 或浏览器长期凭据。
- 服务端内容确认不得只信任扩展名、请求 MIME 或 OSS HEAD；必须在 10 MB 上限内流式计算 SHA-256 并检查 JPEG/PNG/WebP 魔数，拒绝 HTML/SVG/JS/polyglot 伪装。

## 输入

- 管理员 HTML source。
- 图片文件名、声明 MIME、大小、SHA-256 和上传请求。

## 输出

- sanitized HTML、安全预览与净化诊断。
- 私有 OSS 对象、短期 upload intent 和幂等 `media_assets` 记录。

## 失败与降级

- 净化后为空/无效：拒绝发布并显示可修复提示。
- 文件不符合类型/大小：拒绝签名或确认。
- intent 过期、归属错误、已消费、对象元数据/内容不一致或 OSS 查询失败：拒绝确认，不写入媒体记录；允许同一合法 confirm 请求幂等重试。
- OSS/ESA 不可用：保留草稿，不发布断链媒体；不得降级为公共读 Bucket 或浏览器长期 AccessKey。

## 不纳入范围

- 视频、PDF、SVG、任意附件、图库管理、自动裁切或图片审核服务。
- 原始 HTML 直接发布、第三方 iframe 或脚本嵌入。

## 最小验证方式

- 使用 XSS 攻击语料验证标签、属性、URL、CSS 与 sanitizer policy 升级后的重新净化。
- 验证 sandbox 属性、预览 CSP、脚本/表单/导航/外联限制；即使 sanitizer 语料漏拦，预览也不得获得脚本执行能力。
- 验证 10 MB 边界、路径穿越、未认证/缺失 CSRF、intent 归属/过期/消费/幂等、对象替换和直接 HTTPS OSS 客户端错误。
- 验证声明 MIME、扩展名、JPEG/PNG/WebP 魔数和 SHA-256 一致；HTML/SVG/JS/polyglot 伪装必须失败。
- 本地 provider fake/fixture 结果只记为 `LOCAL_PASS`；真实 OSS/ESA/WAF/签名过期越权只记为 `M2-LEGACY-01 / DEFERRED`。
- 实施阶段运行 `pnpm test`、`pnpm lint`、`pnpm build`。

## 验收要点

- 已知攻击载荷不能在预览或公开页面执行。
- 公开页面永远不读取 source HTML 或旧 policy 生成的 sanitized HTML。
- 非允许媒体、超限媒体、伪造内容、过期/篡改/越权 intent 和对象替换均失败；合法重复 confirm 结果幂等。
- 客户端 bundle、浏览器请求和日志无长期 OSS 凭据或完整签名 URL。
- 本地 assets URL/私有配置契约可标记 `LOCAL_PASS`；真实 OSS 保持私有且公开媒体只通过 ESA 分发的结论保持 `M2-LEGACY-01 / DEFERRED`，不得由 mock 代替。

## 备注

允许标签、属性和协议清单应作为可测试配置维护。
