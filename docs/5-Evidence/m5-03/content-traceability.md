# M5-03 内容追踪矩阵

| V3.3 范围 | 实现 | 自动检查 | 状态 |
| --- | --- | --- | --- |
| 导航、Footer、首页 SEO | `src/lib/site-content.ts`、`src/components/site-footer.tsx`、`src/lib/route-metadata.ts` | `site-header`、`site-content`、`routes-and-metadata`、`m5-search-semantics` | PASS |
| 首页六屏 | `src/app/page.tsx` | `home-and-global-shell`、`content-layout-v1.2`、视觉基线 | PASS |
| 核心工具五阶段、二维码、九项权益 | `src/app/features/page.tsx` | `product-pages`、`content-layout-v1.2` | PASS |
| 团队 Banner | `src/app/team/page.tsx` | `product-pages`、`m4-04-owner-update` | PASS |
| 媒体叙事与套餐入口 | `src/app/media/page.tsx` | `media-page-and-redirects` | PASS |
| 四套咨询型媒体套餐 | `src/app/media/packages/page.tsx` | `media-packages-page`、`routes-and-metadata` | PASS |
| 关于页介绍、指标、文化 | `src/app/about/page.tsx` | `product-pages`、`content-layout-v1.2` | PASS |
| 22 条 claims 与 90 天到期 | `docs/5-Evidence/m3-05/claims-register.json` | `m3-claims-validator`、release validator | PASS / Production 仍有无关 blocker |
| sitemap、`llms.txt`、WebPage JSON-LD | `PUBLIC_ROUTES`、现有 discovery 生成器 | `indexing-and-config`、`routes-and-metadata`、`media-packages-page` | PASS |
