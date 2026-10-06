# M4-04 visual and interaction QA

验证日期：2026-08-05

## 覆盖范围

- 页面：首页、团队解决方案、媒体中心、关于我们、联系我们。
- 视口：`320x568`、`390x844`、`768x1024`、`1440x900`。
- 等效 200% 检查：以 `720x450` CSS 视口复核上述五页。
- 截图：`screenshots/` 下 5 页 x 4 视口，共 20 张 PNG。

## 截图有效性

- 最终证据由 Playwright CLI 逐页、逐视口采集；曾由应用内 Browser 生成的 full-page 截图存在重复拼接/空白，已判定无效并由最终文件覆盖。
- 每页先滚动到底部触发懒加载，再强制使用非平滑滚动返回页首。
- 20 次最终采集均确认 `scrollY = 0`，Header 未被捕获在页面中段。
- 20 次最终采集均确认已加载图片中 `naturalWidth = 0` 的数量为 0。
- 最终截图与仓库证据目录逐文件哈希一致。

## 响应式结果

| 视口 | 首页 | 团队 | 媒体 | 关于 | 联系 |
| --- | --- | --- | --- | --- | --- |
| 320x568 | PASS | PASS | PASS | PASS | PASS |
| 390x844 | PASS | PASS | PASS | PASS | PASS |
| 768x1024 | PASS | PASS | PASS | PASS | PASS |
| 1440x900 | PASS | PASS | PASS | PASS | PASS |
| 720x450（等效 200%） | PASS | PASS | PASS | PASS | PASS |

以上 25 个页面/视口组合均在稳定 reload 后满足 `scrollWidth === clientWidth`，未发现横向溢出、内容裁切或阅读顺序变化。

## 交互与可访问性

- 移动导航：320px 下打开后按 Escape，`aria-expanded` 恢复为 `false`，焦点返回菜单按钮。
- 公司实景 Gallery：办公室图使用原生 `dialog`；打开后按 Escape 关闭，焦点返回原触发按钮；保留原图链接降级。
- 到访指引 Gallery：应用内 Browser 实测按 Escape 后页面 Dialog 数量为 0，焦点返回“查看到访指引大图”。
- 媒体咨询 Dialog：打开后按 Escape 关闭，URL 保持 `/media`，焦点返回“咨询媒体报道”触发链接。
- 媒体痛点：四张卡均为白底，Lucide 图标和文本在四视口可读。
- 公司实景：桌面两列使用顶部对齐，办公室卡不再被到访长图拉伸；移动端按 DOM 顺序单列展示。

## 控制台记录

- 页面正常进入时无 console error。
- 开发模式包含 React DevTools 的 info 信息。
- 强制滚动整页触发懒加载时，Next 开发模式在部分关于页会话报告办公室图成为 LCP 的启发式 warning；图片位于首屏下方，未将其改为 eager/priority，避免为消除开发提示而提前加载大图。该提示不作为零 warning 结果，也不解除 Production 资产授权 blocker。
