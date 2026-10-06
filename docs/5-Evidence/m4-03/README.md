# Sprint M4-03 验收证据

状态：`Local Code Ready / Production BLOCKED`

## 证据索引

- [Allowed-copy inventory](allowed-copy-inventory.md)
- [Concept-to-section / slot mapping](concept-to-section-mapping.md)
- [Asset provenance ledger](asset-provenance-ledger.md)
- [Concept-to-browser fidelity ledger](fidelity-ledger.md)
- [Verification record](verification.md)
- `screenshots/before/`：提交 `2583ff4` 的冻结基线
- `screenshots/after/`：review-confirm 修复后的实现截图

## 验收结论

- “可信增长网络”视觉系统已覆盖 App Router 与 Pages Router 公开页，并保持后台隔离。
- 首页 5、功能页 10、团队页 1、媒体页 1，共 17 个固定本地 WebP 槽位完成；metadata、真实文件尺寸、状态、`alt`、focalPoint 与 aspect ratio 自动锁定。
- 用户可见文字、路由、Section、CTA、Dialog、CMS、发现文件与业务能力冻结测试通过。
- 五个固定视口、200% 等效布局、移动菜单 Escape、无横向溢出、无远程图片、无损坏图片和控制台错误均通过。
- 双模型 code review 与 code-review-confirm 完成，所有 Accept/Partial 项已应用。
- `pnpm test`、`pnpm lint`、`pnpm build`、standalone/media smoke、release validation、客户端秘密扫描与 `git diff --check` 通过。

17 张生成素材尚缺仓库内可审计的 Production 授权，继续保持 `provisional / BLOCKED`；本地视觉验收不关闭任何既有生产门禁。
