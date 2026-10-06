# M4-03 asset provenance ledger

## 结论

17 张素材均由本次 M4-03 设计会话使用 OpenAI 图像生成能力制作，经定向移除越界图标后，从会话 `019fc141-346f-7c62-9398-e5eb7cb6487f` 的候选 PNG 中人工选定。入库版本统一使用 Pillow `ImageOps.fit`、Lanczos 重采样和 WebP `quality=88 / method=6`。生成服务条款与本项目生产使用授权未在仓库内形成可审计凭据，因此授权状态统一为 `BLOCKED`，注册表状态保持 `provisional`，不得标记为 Production Ready。

| ID | 选定源 PNG | 原始尺寸 | 入库 WebP | 目标尺寸 | 字节 | 禁用内容检查 | 授权 / Production |
| --- | --- | ---: | --- | ---: | ---: | --- | --- |
| `home-hero` | `exec-1ef26bc6-cd15-4414-a7f4-67549caf035c.png` | `1448×1086` | `public/visual/m4-03/home/home-hero.webp` | `1600×1200` | 71,030 | PASS：抽象结构；无人物、客户/媒体 Logo、指标、评价或结果 | `BLOCKED` / No |
| `home-tool-content` | `exec-df2354d7-76ba-4416-8200-46d8d8fac5f7.png` | `1536×1024` | `public/visual/m4-03/home/tool-content.webp` | `1200×800` | 37,060 | PASS | `BLOCKED` / No |
| `home-tool-showcase` | `exec-66009a58-3ffb-4c27-a3fb-563754571e40.png` | `1536×1024` | `public/visual/m4-03/home/tool-showcase.webp` | `1200×800` | 32,748 | PASS | `BLOCKED` / No |
| `home-tool-team` | `exec-fe6d20d4-f615-4b5e-9026-b257a2cd5b64.png` | `1536×1024` | `public/visual/m4-03/home/tool-team.webp` | `1200×800` | 42,094 | PASS | `BLOCKED` / No |
| `home-tool-growth` | `exec-4cc02c18-5c32-4ceb-945f-5c3abb234302.png` | `1536×1024` | `public/visual/m4-03/home/tool-growth.webp` | `1200×800` | 45,808 | PASS | `BLOCKED` / No |
| `feature-today-hotspot` | `exec-1e22819f-2c9b-4821-a222-17c23a78562c.png` | `971×1619` | `public/visual/m4-03/features/today-hotspot.webp` | `900×1500` | 39,126 | PASS | `BLOCKED` / No |
| `feature-daily-health` | `exec-6bd8bdd8-2c2f-4db0-9134-233d1e16d501.png` | `971×1619` | `public/visual/m4-03/features/daily-health.webp` | `900×1500` | 49,264 | PASS | `BLOCKED` / No |
| `feature-future-weekly` | `exec-e67582db-e5e6-48ab-b34e-8511b37394f1.png` | `971×1619` | `public/visual/m4-03/features/future-weekly.webp` | `900×1500` | 39,006 | PASS | `BLOCKED` / No |
| `feature-business-insight` | `exec-a0f6e199-b217-4cfc-87c4-08b643f77c9e.png` | `971×1619` | `public/visual/m4-03/features/business-insight.webp` | `900×1500` | 55,016 | PASS | `BLOCKED` / No |
| `feature-digital-card` | `exec-61ec7897-a91d-4d2f-89d2-636d7b9b0c16.png` | `971×1619` | `public/visual/m4-03/features/digital-card.webp` | `900×1500` | 30,930 | PASS | `BLOCKED` / No |
| `feature-promotion-poster` | `exec-b1068c18-4cd1-4ab9-843a-66f4e3dbaf46.png` | `971×1619` | `public/visual/m4-03/features/promotion-poster.webp` | `900×1500` | 66,472 | PASS | `BLOCKED` / No |
| `feature-brand-journal` | `exec-9c4c0a4d-5771-42bd-b078-2188885f5e37.png` | `971×1619` | `public/visual/m4-03/features/brand-journal.webp` | `900×1500` | 45,074 | PASS | `BLOCKED` / No |
| `feature-team-mini-program` | `exec-3d615478-d438-4580-b282-3390e56ccb90.png` | `972×1619` | `public/visual/m4-03/features/team-mini-program.webp` | `900×1500` | 68,756 | PASS | `BLOCKED` / No |
| `feature-resource-market` | `exec-7985929d-7b8a-4f1a-b3f2-8e3da2592d24.png` | `971×1619` | `public/visual/m4-03/features/resource-market.webp` | `900×1500` | 72,596 | PASS | `BLOCKED` / No |
| `feature-network-circle` | `exec-9ef57a05-66db-48e4-bfac-5aabf26cc85f.png` | `971×1619` | `public/visual/m4-03/features/network-circle.webp` | `900×1500` | 64,808 | PASS | `BLOCKED` / No |
| `team-hero` | `exec-f7ad5279-ed5f-4bd3-8388-122980134021.png` | `1586×992` | `public/visual/m4-03/team/team-hero.webp` | `1600×1000` | 56,670 | PASS | `BLOCKED` / No |
| `media-hero` | `exec-ba73e868-ac37-4ec0-9f02-12cf8806833c.png` | `1942×809` | `public/visual/m4-03/media/media-hero.webp` | `2400×1000` | 131,122 | PASS | `BLOCKED` / No |

源 PNG 与未选候选不入库；仓库只保留经过尺寸、压缩和越界内容检查的 WebP。后续取得可审计授权并完成内容复核后，才能另行把对应注册表状态改为 `final`。
