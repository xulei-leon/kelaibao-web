# M3-05 浏览器与视口 QA

验证时间：2026-08-01 01:18–01:25（Asia/Shanghai）
运行目标：本地 production standalone，`http://127.0.0.1:3105`，`SINO_RUNTIME_MODE=preview`
浏览器：Codex in-app Browser

## 四视口矩阵

在 `320×720`、`390×844`、`768×1024`、`1440×900` 下分别检查：

- `/`
- `/features`
- `/team`
- `/media`
- `/privacy`
- `/terms`
- `/disclaimer`
- `/contact`
- `/news`
- `/cases`

共 `4 × 10 = 40` 项，全部 PASS：每页存在 `main` 与 H1，无横向溢出、无破损图片、无“赛诺全网”公开文本。320px 首页与 1440px 隐私政策页另做可视截图检查，排版、导航、主 CTA 和政策目录均正常。

## 政策与品牌

Privacy、Terms、Disclaimer 均满足：

- 页面标题为客来宝品牌。
- 正文同时说明客来宝官网、K-Link 产品介绍、客来宝媒体咨询边界。
- 无横向溢出。

## 转化路径

| 路径 | 结果 |
| --- | --- |
| 首页 → “立即申请免费体验会员” | PASS；打开“体验 K-Link 小程序”对话框，显示 Preview 测试二维码和“无法扫码”联系页回退，不跳转到 Web 注册或 Dashboard。 |
| 首页 → “查看核心功能” | PASS；到达 `/features`，H1 正确。 |
| 首页 → “了解团队解决方案” | PASS；到达 `/team`，H1 正确。 |
| 移动导航 → 客来宝媒体 | PASS；菜单打开后到达 `/media`。 |
| 媒体页 → “咨询客来宝媒体” | PASS；打开企业微信咨询对话框，明确测试二维码不可用于正式联系。 |
| 新闻 → 联系我们 | PASS；空状态稳定，通过页脚到达 `/contact`。 |
| 案例 → 联系我们 | PASS；授权空状态稳定，通过页脚到达 `/contact`。 |

## 键盘、缩放与减少动效

- K-Link 对话框按 `Escape` 关闭后，焦点恢复到原“立即申请免费体验会员”链接。
- 移动导航按 `Escape` 关闭后，`aria-expanded` 复位，焦点恢复到“打开导航菜单”按钮。
- 页面包含“跳到主要内容”链接和 `#main-content` 目标。
- production CSS 中存在 `prefers-reduced-motion` 规则；自动化单元测试同时覆盖 reduced-motion 行为契约。
- 受控浏览器未提供原生 zoom/emulate-media 开关；未伪造原生 200% 截图。改用约半宽 CSS 像素视口作为 200% 布局等效检查，首页切换到移动导航且无横向溢出；320px 更窄视口也通过。
- 页面 console `error` / `warning`：0。

## 二维码与 Production 边界

- Preview K-Link 与企业微信测试二维码均正常渲染，且明确标注不可用于正式体验/联系。
- 未提供真实生产二维码，`production_mini_program`、`production_wecom` 继续为 `BLOCKED`。
