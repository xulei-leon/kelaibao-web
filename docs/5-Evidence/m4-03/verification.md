# M4-03 verification record

## 基线与工具

- before 基线：提交 `2583ff4`，通过临时 detached worktree 在 `http://127.0.0.1:3104` 启动。
- after 实现：当前工作树，在 `http://127.0.0.1:3103` 启动。
- 浏览器：Codex in-app Browser（IAB）。IAB 在 Windows 缩放后的 `fullPage` 拼接会出现重复/空白，因此保存精确 CSS 首屏截图，并以逐页 DOM/布局指标与交互检查覆盖完整页面；未使用该异常输出作为证据。
- 截图目录：`screenshots/before/` 与 `screenshots/after/`。首页包含 `320×568`、`390×844`、`768×1024`、`1280×800`、`1440×900` 五组前后截图；功能、团队、媒体页另有对应 `1440×900` 概念基线截图。

## 浏览器验证

| 检查 | 结果 |
| --- | --- |
| `/`、`/features`、`/team`、`/media` × 五个固定视口 | PASS：20 组均 `overflow=0`、`brokenImages=0`、`remoteImages=0` |
| 视觉槽数量 | PASS：首页 5、功能页 10、团队页 1、媒体页 1；所有视口一致 |
| provisional 尺寸叠层 | PASS：各页叠层数与槽位数一致 |
| 移动导航 | PASS：`390×844` 下唯一菜单按钮可打开；Escape 后 `aria-expanded=false` |
| 200% 缩放等效检查 | PASS：以 `1440×900` 的 `720×450` CSS viewport 等效验证四个核心页；H1 与交互元素可见，横向溢出均为 0 |
| 后台隔离 | PASS：`/admin/login` 的视觉槽和 `.page-hero` 均为 0，横向溢出为 0 |
| 浏览器控制台 | PASS：应用页面无 error/warn；IAB 自身遥测网络超时不属于应用请求或应用日志 |
| 概念图 fidelity | PASS：详见 `fidelity-ledger.md`；旧 CSS 特异性导致的媒体/团队单列和默认 Hero 过高已修复 |

## 自动验证

| 命令 | 结果 |
| --- | --- |
| `pnpm test` | PASS：60 files / 331 tests。首次并发高负载运行出现既有 5 秒测试超时；清理评审任务后原命令重跑全部通过，未放宽 timeout |
| `pnpm lint` | PASS：`tsc --noEmit` |
| `pnpm build` | PASS：Next.js production build、16 个静态页面与 standalone 打包完成 |
| `pnpm smoke:standalone` | PASS：SSR、Route Handler、运行时环境与公开页 |
| `pnpm smoke:media-redirects` | PASS：旧媒体路由、query 保留与未知路由 |
| `pnpm validate:release` | PASS：`CODE_READY_WITH_EXTERNAL_LEGACY`；Local Ready，Production 17 项 blocker 保持 |
| 客户端秘密扫描 | PASS：`.next/static` 对数据库、管理员、OSS、DirectMail、ESA secret 标识 0 matches |
| `git diff --check` | PASS |

## 发布边界

- 本 Sprint 最多达到 `Local Code Ready`。
- 17 张生成素材的可审计生产授权未确认，均保持 `provisional / BLOCKED`；Production 不可据此解锁。
- 既有备案、云资源、恢复、内容授权和 Production-live 门禁保持原状态。
