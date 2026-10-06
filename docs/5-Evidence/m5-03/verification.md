# M5-03 验证记录

日期：2026-09-14

## 自动化验证

| 检查 | 结果 |
| --- | --- |
| `pnpm test` | PASS：68 个测试文件、378 项测试 |
| `pnpm lint` | PASS：`tsc --noEmit` |
| `pnpm build` | PASS：Next.js 生产构建与 standalone 打包；`/media/packages` 静态生成 |
| `git diff --check` | PASS |

## 浏览器验证

- 环境：本地 production standalone，`http://localhost:3000`，Codex in-app Chromium。
- 路由：`/`、`/features`、`/team`、`/media`、`/media/packages`、`/about`。
- 视口：320×900、390×900、768×900、1440×900，共 24 组。
- 结果：每组都有唯一 H1，页面 `scrollWidth <= clientWidth`，破损图片为 0。
- `/features`：九行会员权益均存在；`/media/packages`：四套套餐均存在。
- 320px 移动导航：按钮由 `aria-expanded=false` 切换为 `true`，Escape 后恢复为 `false`，焦点回到“打开导航菜单”按钮。
- 控制台：目标页无相关 error 或 warn。

Browser 专用技能在当前会话中未提供；常规 Playwright CLI也未安装，因此使用已提供的 Codex in-app Chromium Playwright 能力完成等价检查。
