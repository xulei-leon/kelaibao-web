# M4-02 公网站视觉升级代码评审（`sprint-m4-02-public-site-visual-style-upgrade`）

## 审查范围

- `products/kelaibao/src/app/layout.tsx`
- `products/kelaibao/src/pages/_app.tsx`
- `products/kelaibao/src/components/public-app-shell.tsx`
- `products/kelaibao/src/components/public-content-list.tsx`
- `products/kelaibao/src/components/ui/page-hero.tsx`
- `products/kelaibao/src/server/content/public-page.tsx`
- `products/kelaibao/src/app/{page,features,team,media,about}/page.tsx`
- `products/kelaibao/src/app/visual-refresh.css`（新增）
- `products/kelaibao/tests/visual-style-contract.test.tsx`（新增）
- `products/kelaibao/tests/fixtures/m4-02-public-page-baseline.json`（新增）
- `products/kelaibao/docs/5-Evidence/m4-02/*`（新增）

## Findings

| Severity | Type | Location | Issue | Evidence | Recommendation |
| --- | --- | --- | --- | --- | --- |
| Medium | Requirement | `D:\code\tokengate\products\kelaibao\docs\5-Evidence\m4-02\README.md` | Sprint 门禁尚未闭环：多个 FR-20/§6 要求的验收项仍标注为“待复核”，该实现目前不能视为正式满足 M4-02 交付门禁。 | 人工验收清单里“Header、移动菜单”“小程序与企业微信 Dialog”“`/admin/login` 与后台壳隔离”“颜色对比、200% 缩放、reduced motion”“控制台 hydration/CSS/资源错误”等均是“待复核”。此外 `docs/5-Evidence/m4-02/before/` 与 `after/` 的截图条目未见“通过”结果补齐。 | 在完成前补齐相应人工核验并填入结论；如需持续推进，至少先提供可复核证据（含键盘焦点、缩放、对比度与后台隔离）并更新为 `PASS/Fail`。 |
| Info | Correctness | `D:\code\tokengate\products\kelaibao\src\components\ui\page-hero.tsx`, `D:\code\tokengate\products\kelaibao\src\app\{page,features,team,media,about}\page.tsx`, `D:\code\tokengate\products\kelaibao\tests\visual-style-contract.test.tsx` | 当前实现对 FR-20 的“可逆视觉变体 / layout 与文案不改”边界执行得较为一致：`PageHero` 仅新增 `variant` class，不改 DOM、文字或逻辑；公开路由变体映射、两个路由入口 import 顺序和公共主容器 `public-site-main` 也均已覆盖。 | `visual-style-contract.test.tsx` 约束了：1) `PageHero` class-only diff（`expect(themed).toContain("page-hero--...")` 与 class-属性剥离对比）；2) 主页/功能/团队/关于/媒体对应 variant；3) `layout.tsx` 与 `_app.tsx` 中 `visual-refresh.css` 在 `globals.css` 之后；4) 两路由都使用 `public-site-main`。 | 保持当前实现方式，不建议以文本差异修补视觉覆盖层；继续保持 fixture 和 contract test 的版本化以便回归。 |
