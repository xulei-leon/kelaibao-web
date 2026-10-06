# M4-02 公开站视觉升级证据

## 基线环境

- 日期：`2026-08-02`（Asia/Shanghai）
- Git 基线：`6c3dbb560a84c993eb50d2a22b85e8713a06bf67`，叠加本 Sprint 已确认但未提交的文档与 WP0 fixture
- Node：`v24.15.0`
- pnpm：`11.9.0`
- Next.js：`15.5.21`
- 浏览器：连接的 Chrome（扩展未暴露完整版本号）
- 截图语言/时区：页面 `zh-CN`；系统时区 Asia/Shanghai
- 动效基线：截图只记录静态首屏；完整验收同时检查 `prefers-reduced-motion`

## WP0 自动化基线

| 命令 | 结果 |
| --- | --- |
| `pnpm test` | PASS；58 files / 294 tests |
| `pnpm lint` | PASS；`tsc --noEmit` |
| `pnpm build` | PASS；App Router 16 个静态页生成完成，Pages Router 新闻/案例路由构建完成，standalone 已打包 |
| `pnpm test -- tests/visual-style-contract.test.tsx` | PASS；11 个冻结契约 |

## 最终验证

| 命令/门禁 | 结果 |
| --- | --- |
| `pnpm test` | PASS；59 files / 320 tests |
| `pnpm lint` | PASS；`tsc --noEmit` |
| `pnpm build` | PASS；Next production build 与 standalone 打包完成 |
| `pnpm test -- tests/visual-style-contract.test.tsx` | PASS；26 个契约，覆盖完整文本摘要、H2/H3、Section 顺序、关键集合数量、Hero 子结构、导航、variant、双 Router import、公开边界与 reduced motion |
| `git diff --check` | PASS |
| 回退演练 | PASS；临时移除 App/Pages Router 两处 `visual-refresh.css` import 后，21 个 DOM/行为契约与 production build 通过；随后恢复 import 并完成最终全量验证 |

## 证据方法与工具限制

- 视口矩阵固定为 `320×844`、`390×844`、`768×1024`、`1440×1000`。
- 路由固定为 `/`、`/features`、`/team`、`/media`、`/about`、`/contact`、`/news`、`/cases`、`/privacy`、`/terms`、`/disclaimer`。
- Chrome 的普通视口截图可用且能精确设置四个目标视口；当前 Browser 后端的 `fullPage` 捕获对长页超过 5 秒上限，in-app Browser 的长页捕获则返回空白。为避免使用无效证据，本 Sprint 保存同条件首屏 PNG，并以 `before-dom-checks.json` / `after-dom-checks.json` 对完整 DOM 验证 H1、Section、scrollWidth 和溢出元素。
- `/contact` 的 `.honeypot` 及其子元素按安全设计固定在 `left:-10000px`，不计为用户可见横向溢出；其余 before DOM 检查无溢出。
- Chrome 控制台只有浏览器扩展自身的 `chrome-extension://...` 警告，没有来自 `http://127.0.0.1:3102` 的页面错误或警告。
- 新闻与案例当前以诚实空状态截图，不制造 CMS 数据；详情由既有 `PublicDetailPage`、SSR 与 metadata 契约覆盖。
- 最终 before/after 各 44 张 PNG、各 44 条 DOM 记录；H1 与 Section 数量逐单元一致，无缺失或不匹配。

## Before/After 矩阵

每个目录包含 44 张 PNG，命名为 `{phase}-{route-slug}-{viewport}.png`。例如：

- `before/before-home-390.png`
- `before/before-media-1440.png`
- `after/after-home-390.png`
- `after/after-media-1440.png`

配套机器可读检查：

- `before-dom-checks.json`
- `before-console.json`
- `after-dom-checks.json`
- `after-console.json`

## 人工验收清单

| 范围 | Before | After | 结论 |
| --- | --- | --- | --- |
| 文案、H1、H2/H3、Section、Grid、CTA | fixture 已冻结 | 完整文本摘要、标题、顺序、数量和 Hero 子结构契约 PASS | PASS |
| 320/390/768/1440 横向溢出 | PASS（仅排除 honeypot） | 44/44 DOM 单元无可见溢出；`/contact` 仍仅有预期 honeypot | PASS |
| Header、移动菜单 | 自动化基线 PASS | 390px 菜单可打开；Escape 关闭并恢复到“打开导航菜单”按钮 | PASS |
| 小程序与企业微信 Dialog | 自动化基线 PASS | 两类 Dialog 均有 QR、初始焦点在内；Escape 关闭并恢复原触发器 | PASS |
| `/admin/login` 与后台壳隔离 | 既有边界测试 PASS | `/admin/login` 无 `.public-site-main`/`.site-header`；未登录访问 `/admin` 正确回到登录页且无公共 shell | PASS |
| 颜色对比 | 待视觉实现后检查 | 下表抽样均达到本 Sprint 门槛 | PASS |
| 200% 缩放重排 | 待视觉实现后检查 | 控制面不提供字面 zoom；以 1440px/200%=720 CSS px 等效视口复核，Header 折叠、表单、Dialog 和 QR 无横向溢出或裁切 | PASS（记录工具限制） |
| reduced motion | 待视觉实现后检查 | 契约确认 `prefers-reduced-motion: reduce` 将非必要 transition 缩至 `0.01ms` 并取消 hover 位移；功能交互不依赖动画 | PASS |
| 控制台 hydration/CSS/资源错误 | 页面来源无错误 | `after-console.json` 共 100 条均来自浏览器扩展；localhost 页面来源为 0 | PASS |

## 对比度抽样

| 样本 | 前景 / 背景 | 比值 | 门槛 | 结论 |
| --- | --- | --- | --- | --- |
| 媒体深色 Hero 标题 | `#FFFFFF` / `#102A56` | `14.12:1` | 普通/大字 `>=4.5/3` | PASS |
| 产品蓝 CTA | `#F8FBFF` / `#2563EB` | `4.98:1` | `>=4.5` | PASS |
| 媒体绿 CTA | `#F8FBFF` / `#0F6B50` | `6.25:1` | `>=4.5` | PASS |
| muted 文本 | `#52657D` / `#F5F8FC` | `5.61:1` | `>=4.5` | PASS |
| disabled 提交按钮 | `#F8FBFF` / `#69747F` | `4.59:1` | `>=4.5`（本轮主动按普通文字门槛） | PASS |
| focus 环 | `#2563EB` / `#FFFFFF` | `5.17:1` | `>=3` | PASS |
| 表单控件边界 | `#7B91AD` / `#FFFFFF` | `3.23:1` | 非文本 UI `>=3` | PASS |

`--champagne` 仅用于下划线、编号和编辑装饰，不单独承载状态、正文或 CTA，因此不作为文字对比样本。

## 状态边界

本目录只证明本地视觉与回归质量，不关闭备案、真实云、二维码、DirectMail、专业审查或其他 Production 外部门禁。
