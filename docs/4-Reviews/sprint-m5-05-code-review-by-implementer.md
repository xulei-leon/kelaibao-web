# M5-05 代码复核意见

日期：2026-10-20。复核者：实施者，不是独立评审。输入：当前工作区差异、FR-25、文档 review-confirm、测试、构建路由清单、standalone smoke 和浏览器结果。

- R1（High/Correctness）：静态封面可以是本地路径，OG/Twitter 和 ImageObject 必须转成绝对 URL；已在 discovery/metadata.ts 修复，并增加本地封面测试。
- R2（Medium/Clarity）：首次截图发现长英文标题超出卡片，根级 overflow 裁剪使文档 scrollWidth 断言漏检；已补充局部 overflow-wrap，并用元素内部溢出和截图复验。
- R3（Medium/Performance）：middleware 不应导入全量正文及校验逻辑；已只导入撤回/跳转清单，正文与构建校验不进入该运行路径。
- R4（High/Requirement）：空静态清单不等于真实数据已迁移；必须明确真实历史内容和云发布未验证，并让 require-production-live 返回非零。
- R5（Info/Test）：旧 CMS 专用测试随功能移除，保留公开页面、询盘、隔离、发布、底层迁移安全等测试，新增静态内容和发布工具覆盖；不得继续把原 432 项计为当前结果。
