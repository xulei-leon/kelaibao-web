# M3-04 Visual QA Evidence

- Date: 2026-07-31
- Runtime: rebuilt Next.js standalone production artifact
- Origin: `http://127.0.0.1:34104`
- Runtime mode: `SINO_RUNTIME_MODE=preview`（无本地数据库）
- Browser surface: Codex in-app Browser

## Route / viewport matrix

每个单元格均检查页面身份（title + 非空 H1）、单一 `<main>`、公开 Header/Footer、免费体验入口、非空页面、无 Next runtime overlay、无横向溢出。`/news` 与 `/cases` 还检查 Preview 空状态和 canonical。

| Route | 320px | 390px | 768px | 1440px | Identity / special result |
| --- | --- | --- | --- | --- | --- |
| `/` | PASS | PASS | PASS | PASS | `一站式拓客工具系统` |
| `/features` | PASS | PASS | PASS | PASS | 十项工具与五阶段路径 |
| `/team` | PASS | PASS | PASS | PASS | 团队解决方案 |
| `/media` | PASS | PASS | PASS | PASS | 客来宝媒体；企业微信 CTA 与产品体验分离 |
| `/news` | PASS | PASS | PASS | PASS | `当前没有已公开的新闻。`；canonical `/news` |
| `/cases` | PASS | PASS | PASS | PASS | `当前没有已公开的案例。`；canonical `/cases` |
| `/about` | PASS | PASS | PASS | PASS | 关于客来宝 |
| `/contact` | PASS | PASS | PASS | PASS | 产品体验 / 媒体咨询双路径 |
| `/privacy` | PASS | PASS | PASS | PASS | 隐私政策 |
| `/terms` | PASS | PASS | PASS | PASS | 服务条款 |
| `/disclaimer` | PASS | PASS | PASS | PASS | 免责声明 |

总计：`44 / 44 PASS`，所有页面 `overflow <= 0`，未出现 500 标题、500 H1 或 Next overlay。

浏览器控制面未提供 console message 流；用 HTTP 200、完整 title/H1/DOM、无 runtime overlay，并结合 `pnpm smoke:standalone` 作为运行时错误证据。

## Preview SSR regression and resolution

首轮矩阵中 `/news` 与 `/cases` 在四个视口均显示 `500: Internal Server Error`。根因是 Preview 明确允许不配置数据库，但公开列表仍无条件创建 MySQL repository。

修复后：

- `/news`：HTTP 200，H1 `新闻`，输出可抓取空状态，canonical `https://preview.example.invalid/news`。
- `/cases`：HTTP 200，H1 `案例`，输出可抓取空状态，canonical `https://preview.example.invalid/cases`。
- 降级只适用于默认 repository、Preview 且数据库未配置；Production 缺库和已配置 repository 故障仍保持失败边界。

## Interaction and accessibility checks

| Check | Result | Evidence |
| --- | --- | --- |
| 320px mobile menu | PASS | 打开后 `aria-expanded=true`，初始焦点位于关闭按钮；Escape 后关闭且焦点恢复至“打开导航菜单”按钮。 |
| Product trial Dialog | PASS | `role=dialog`、`aria-modal=true`，标题“体验 K-Link 小程序”，初始焦点位于关闭按钮；Escape 后关闭并恢复至原产品 CTA。 |
| Media consultation separation | PASS | `/media` 同时保留产品“免费体验”和“咨询客来宝媒体”；媒体 CTA 打开“咨询客来宝媒体”企业微信 Dialog，不出现 K-Link 小程序文案。 |
| Media Dialog Escape | PASS | Escape 关闭并恢复至“咨询客来宝媒体”触发器。 |
| 200% zoom-equivalent reflow | PASS | 以 1440px 的半宽有效视口进行等效重排抽样；首页 Header/Footer、单一 main 与 H1 完整，横向 overflow 为 0。 |
| Reduced motion | PASS | 生产 CSSOM 含 `@media (prefers-reduced-motion: reduce)`；禁用 smooth scroll，并将 transition / animation 收敛至 `0.01ms`、单次执行。 |
| Admin boundary | PASS | `/admin` 重定向 `/admin/login`；二者均无公开 Header/Footer、免费体验 CTA，且保持单一 main。 |
| Health boundary | PASS | `/health` 无公开 Header/Footer、免费体验 CTA，单一 main，H1 `运行状态`。 |

## Verification context

- `pnpm test`: `46 files / 234 tests PASS`
- `pnpm lint`: PASS
- `pnpm build`: PASS
- `pnpm smoke:standalone`: PASS
- `pnpm smoke:media-redirects`: PASS
- `pnpm validate:release`: exit `0`, `localReady=true`, `productionReady=false`, `CODE_READY_WITH_EXTERNAL_LEGACY`
- Production blockers: `16`（外部正式资产、域名/备案、云服务验证等既有门禁）
