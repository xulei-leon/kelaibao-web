# 首页 Banner 替换 Review Confirm

日期：2026-10-23。方式：实施者复核，不声称独立评审。

输入：用户指定的 `var/banner.png`、FR-26/FR-27、M5-06/M5-07 及其文档确认、现行视觉与架构规格。

- 仅替换首页 Hero 图片，沿用当前公开资源 WebP 格式；保留原图 2048×1152 构图，不预先裁成旧手机竖图。
- 当前 Hero 使用初始 HTML 中的 `<picture>/<img>`，以 `object-fit: cover` 实现背景覆盖；使用等效的 `object-position`，桌面 `center`，≤768px 为 `65% center`。断点仅作用于首页，其他页面沿用原图与断点。
- 首页桌面和手机使用同一张新 WebP，保留高优先级加载、图片尺寸、空 alt 和现有蒙层、文案、按钮与自适应高度。
- 验证 `pnpm test && pnpm lint && pnpm build`，并检查 320、390、768、1440px 图片加载、裁切与现有体验弹窗；本地验证不代表生产部署。

结论：APPROVED_FOR_IMPLEMENTATION。用户已授权本次图片替换及裁切位置，无需额外审批；不涉及云资源或发布。
