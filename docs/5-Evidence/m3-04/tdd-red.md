# M3-04 TDD RED Evidence

- Date: 2026-07-31
- Phase: implementation gate / RED
- Working directory: `products/kelaibao/`

## Command

```powershell
pnpm exec vitest run tests/home-and-global-shell.test.tsx tests/mini-program-trial.test.tsx tests/site-header.test.tsx tests/site-content.test.ts tests/routes-and-metadata.test.ts tests/indexing-and-config.test.ts --reporter=dot
```

## Result

- Exit code: `1` (expected RED)
- Test files: `6 failed / 6`
- Tests: `9 failed / 25 passed / 34 total`
- Duration: `4.33s`
- No import, transform, or test-compilation failure occurred.

## Expected Failing Contracts

1. 首页仍输出旧顾问销售路径，缺少“一站式拓客工具系统”、查找/转发/复制、四项价值、四组工具摘要、团队/媒体/新闻/案例摘要和产品免费体验入口。
2. 首页缺少已确认的稳定链接，Footer 缺少 `/cases`，移动栏仍使用旧企业微信 CTA。
3. `PRIMARY_NAVIGATION` 与 Header 仍为五项旧 IA，而非六项精确导航。
4. `/news` 尚未进入 `PUBLIC_ROUTES`、集中 metadata、canonical、Open Graph、sitemap 和 `llms.txt`。初始 RED 曾错误假设该路由应位于 App Router；实现前审计确认既有 CMS 列表使用 `src/pages/news/index.tsx`，故测试已收窄为验证该真实 Pages Router 路由，避免创建冲突的 `src/app/news/page.tsx`。
5. 小程序全局壳分析 source 仍原样上报 query、hash 与联系方式；预期将 `header:/features?utm_source=private-campaign&phone=13800138000#trial` 净化为 `header:/features`。

## Already-Green Regression Assertions

- 二维码失败后 `<img>` 被移除。
- 失败状态以 `role="status"` 暴露。
- 产品降级保持 `/contact#klink-trial`。
- 失败状态不出现媒体企业微信路径、文案或 `open_media_wechat_contact` 事件。

## Gate Decision

RED 证据有效，可以开始最小实现。实现不得修改测试以规避上述失败契约。

## Public/Admin Shell Boundary RED

在审查意见要求下追加公共壳隔离测试：

```powershell
pnpm test -- tests/public-shell-boundary.test.tsx
```

- Exit code: `1`（预期 RED）
- 精确失败：无法解析尚不存在的 `@/components/public-app-shell`；测试套件失败且未进入断言。
- 该 RED 固定 `/admin`、`/admin/*`、`/health`、空 pathname fail-closed，`/administrator` 仍为公开路径，以及 Hybrid Pages Router 同时具备小程序与企业微信 Provider 的契约。

实现后复跑：

```powershell
pnpm test -- tests/public-shell-boundary.test.tsx tests/m2-admin-runtime-contract.test.ts tests/m2-runtime-contract.test.ts
```

- Result: `3 files passed / 21 tests passed`

## Initial GREEN Transition

```powershell
pnpm exec vitest run tests/home-and-global-shell.test.tsx tests/mini-program-trial.test.tsx tests/site-header.test.tsx tests/site-content.test.ts tests/routes-and-metadata.test.ts tests/indexing-and-config.test.ts --reporter=dot
```

- Result: `6 files passed / 34 tests passed`
- Hybrid Router 路径修正后，`/news` 验证真实 `src/pages/news/index.tsx`，且未创建冲突的 App Router route。

## Preview Empty-list SSR RED

四视口浏览器矩阵发现 `/news` 与 `/cases` 在本地 Preview 无数据库配置时返回 500。追加回归测试：

```powershell
pnpm test -- tests/m2-public-ssr.test.tsx
```

- Exit code: `1`（预期 RED）
- Result: `1 failed / 5 passed / 6 total`
- 精确失败：数据库无配置的 Preview 列表请求拒绝为 `public_content_unavailable`，而非解析为空列表 props。
- 边界：仅默认 repository、`runtimeMode=preview` 且无数据库配置时允许空列表；自定义/已配置 repository 故障及 Production 缺库仍保持既有 5xx/配置失败契约。

实现后复跑：

```powershell
pnpm test -- tests/m2-public-ssr.test.tsx tests/routes-and-metadata.test.ts tests/home-and-global-shell.test.tsx
```

- Result: `3 files passed / 16 tests passed`
