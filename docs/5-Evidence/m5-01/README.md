# M5-01 Local Verification Evidence

> 状态：`LOCAL_PASS / Production BLOCKED`
>
> 验证日期：2026-08-09。以下结果只覆盖本地 production build、standalone 与无头浏览器，不代表真实 ESA、FC、私有 OSS、RDS MySQL、大陆网络或微信内置浏览器通过。

## 1. 自动化与制品验证

| 检查 | 结果 |
| --- | --- |
| `pnpm test` | PASS：66 个测试文件、369 个测试通过 |
| `pnpm lint` | PASS：TypeScript `--noEmit` 无错误 |
| `pnpm build` | PASS：生成 19 个响应式资产 manifest，Next.js production build 与 standalone 打包完成 |
| `pnpm smoke:standalone` | PASS：SSR、Route Handler、generated WebP、immutable 缓存、OG PNG、runtime env 与公开页面通过 |
| `git diff --check` | PASS：无空白或补丁格式错误 |

SQLite 专项覆盖从 pre-M5 schema v1 到 v2 的增量升级；standalone smoke 直接校验 WebP MIME、RIFF/WEBP 签名、immutable 缓存，以及 `/opengraph-image` 的 PNG MIME、签名和非空响应。

## 2. 响应式图片与四视口

Vercel `agent-browser` 使用彼此隔离的浏览器会话，逐图滚动并等待懒加载完成后截图。每个视口均满足：页面非空、无 Next.js 错误覆盖、11 张响应式图片全部加载、URL 位于 `/visual/generated/`，且不存在 `/_next/image`。

| 视口 | Hero CSS 宽度 / 候选 | 功能图 CSS 宽度 / 候选 | 结果 |
| --- | --- | --- | --- |
| 320×800 | 320px / 480w | 182px / 320w | PASS |
| 390×844 | 390px / 480w | 252px / 320w | PASS |
| 768×1024 | 768px / 768w | 256px / 320w | PASS |
| 1440×1000 | 1440px / 1600w | 256px / 320w | PASS |

本地默认 DPR 1 候选的静态字节估算：390px 为 241,900 bytes，1440px 为 272,368 bytes，均显著低于 2.0 MB / 3.0 MB 门槛；Hero 480w 为 7,926 bytes，Hero 1600w 为 38,394 bytes。即使按功能图 480w 的保守高 DPR 估算，1440px 总量约 419,700 bytes，仍低于门槛。

截图：

- [features-320.png](features-320.png)
- [features-390.png](features-390.png)
- [features-768.png](features-768.png)
- [features-1440.png](features-1440.png)
- [home-390.png](home-390.png)

## 3. SSR 结构化数据

对 `/`、`/features`、`/team`、`/about`、`/media`、`/privacy`、`/terms`、`/disclaimer` 的原始首响应 HTML 逐页检查：全部返回 200、包含两个 JSON-LD script、不包含 `/_next/image`。每页恰好一个稳定 `Organization`；页面类型分别为 WebPage、AboutPage，`/media` 为 WebPage + Service，Service provider 引用同一个 Organization。

未输出未授权 Logo、Product、SoftwareApplication、Offer、AggregateRating 或 Review schema。

## 4. Lightbox、二维码与缩放

- `/about` 在点击“查看办公室场景大图”前，performance resources 不含 `office-scenes.png`；点击后才请求该原图并打开原生 dialog。
- Escape 可关闭 Lightbox；自动化测试同时覆盖焦点恢复和键盘行为。
- 四张二维码均保持 `.png`，父容器没有绝对定位装饰覆盖层，未经过 WebP 或 `/_next/image` 转换。
- 浏览器内 200% 缩放仿真时 `scrollWidth === clientWidth`，未产生横向溢出。

截图：

- [about-before-lightbox-390.png](about-before-lightbox-390.png)
- [about-lightbox-open-390.png](about-lightbox-open-390.png)
- [about-200-percent-zoom.png](about-200-percent-zoom.png)

## 5. 结论与外部门禁

M5-01 达到 `LOCAL_PASS / Local Code Ready`。以下项目仍为 `BLOCKED/DEFERRED`，不得由本地结果替代：真实 ESA 缓存命中与 Age、FC 回源、私有 OSS/RDS 链路、正式域名、搜索平台验证、大陆移动网络、微信内置浏览器、真实资产授权与既有 M2 Production 门禁。
