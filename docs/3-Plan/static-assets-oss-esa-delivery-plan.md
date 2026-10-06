# 客来宝固定图片 OSS + ESA 分发方案

| 字段 | 内容 |
| --- | --- |
| 文档状态 | `PROPOSAL`（尚未进入实现） |
| 日期 | 2026-08-15 |
| 范围 | 官网固定视觉素材；不改变 CMS `media/` 链路 |
| 生产状态 | `BLOCKED`，受 `M2-LEGACY-01` 真实云资源与证据门禁约束 |

## 1. 目标与现状

固定视觉素材当前随 Next.js `public/` 制品经 FC 提供。虽然 ESA 位于站点前方并可缓存这些请求，但首次缓存未命中仍会回源 FC，且图片会增加发布制品体积。当前公开固定素材约 14.7 MiB；办公室图约 3.37 MiB、到访指引约 1.19 MiB，是优先优化对象。

本方案把**运行时所需的固定图片**存入私有 OSS，由独立 HTTPS ESA assets 域名分发。目标是减少 FC 的图片回源和制品负担，同时保持 M5-01 已实现的响应式 WebP、`srcset`、图片尺寸、懒加载、二维码与 Lightbox 行为。

新闻、案例的已确认 `media/` 对象继续沿用既有私有 OSS + `OSS_ASSETS_BASE_URL` 设计；本方案不新增 CMS 类型、图库、在线裁切、运行时图片转码或公共读 Bucket。

## 2. 目标架构与对象契约

```text
浏览器
  ├─ 页面 / API / 管理后台 → ESA → Function Compute Next.js
  └─ 固定图片 assets 域名 → ESA → 私有 OSS
                                  └─ 仅允许 ESA 受控回源
```

- assets 域名必须是独立 HTTPS ESA origin，不能是 OSS endpoint，也不能直接暴露 Bucket 的公共读地址。
- 固定图片对象使用带内容哈希的不可变键；响应式变体保留现有 `{asset-id}/{source-sha256}/{width}.webp` 语义。品牌图、二维码和 Lightbox 原图也必须使用版本化键，不允许原地覆盖。
- OSS 对象及 ESA、浏览器缓存统一使用 `Cache-Control: public, max-age=31536000, immutable`。内容改动创建新键、新 URL；旧对象不被覆盖。
- 浏览器不持有长期 OSS AccessKey。发布端、FC 运行端、ESA 刷新端使用相互隔离的最小权限身份；所有集成继续直接调用明确的 HTTP(S) API。

## 3. 实施范围

1. **构建与上传**：保留本地原图和 `pnpm assets:build`，生成响应式变体及静态资产清单；新增发布前上传步骤，逐项校验 MIME、内容哈希、缓存头、对象存在性与不可覆盖性。
2. **资源引用**：将 `VisualAssetSlot` 的 `src`/`srcset`、CSS 背景图、Logo、二维码和 ImageLightbox 的运行时 URL 统一解析为 assets 域名。页面继续输出绝对 HTTPS URL，不使用 `/_next/image`、远程 loader 或 FC 请求期转码。
3. **制品收敛**：运行时无需再把已迁移对象复制进 FC standalone 制品；原图仅作为受版本控制的构建输入。未迁移的非图片静态资源保持现状。
4. **发布与回滚**：先上传并验证新增对象，再部署引用新 URL 的应用，最后精确刷新受影响 HTML；禁止全站 purge。回滚只切回旧应用引用的已存在 URL，不删除旧对象。
5. **清理**：旧哈希对象保留至少一个可配置的回滚窗口后，由人工审批的生命周期规则清理；不得在部署脚本中立即删除。

## 4. 验证与观测

- 构建测试覆盖路径逃逸、未知 MIME、重复对象键、哈希不一致、上传失败、缺失变体和缺失对象时发布中止。
- 页面回归覆盖 SSR 首响应、`srcset/currentSrc`、CSS 背景图、二维码和 Lightbox；在 320、390、768、1440px 下仅引用 assets 域名，且无原始大图意外回退。
- 真实环境证据须分别验证：OSS 直连拒绝、ESA 正常分发、响应缓存头、缓存命中与 `Age`、首次/重复访问回源量、切图后新 URL 生效及回滚。
- 监控脱敏汇总 ESA 4xx/5xx、OSS 回源失败、命中率、回源流量、对象上传/校验失败与图片加载失败；不得采集个人浏览轨迹或将凭据写入日志。

## 5. 门禁与非目标

- 本文是实施方案，不代表真实 ESA、FC、OSS、RDS 或大陆网络已验证。缺少隔离资源、probe 身份和网络证据时，状态必须保持 `M2-LEGACY-01 / BLOCKED`。
- 不使用 ESA Pages、Vercel、第三方图片 CDN、公共读 OSS、Next.js 运行时图片优化、ESA 图片处理查询参数或通用 `webservice` 抽象。
- 在进入代码实现前，按项目规则为对应 FR/Sprint 完成 document review 与 review-confirm；实现后执行 `pnpm test && pnpm lint && pnpm build`，并补充 standalone、真实 ESA/OSS 与四视口证据。
