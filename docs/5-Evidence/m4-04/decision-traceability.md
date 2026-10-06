# M4-04 C01-C56 decision traceability

状态说明：`LOCAL_IMPLEMENTED` 表示本地实现与契约已建立；`PRODUCTION_BLOCKED` 表示负责人已接受公开表达，但客观证据、授权或专业审查仍未满足，不能据此发布到 Production。

| Cxx | FR-22 / WP | 实现文件 | 自动检查 | 当前状态 / 证据门禁 |
| --- | --- | --- | --- | --- |
| C01 | WP1 品牌色 | `src/app/globals.css` | `tests/m4-04-owner-update.test.tsx` | LOCAL_IMPLEMENTED |
| C02 | WP1 Logo | `src/components/site-header.tsx` | `tests/m4-04-owner-update.test.tsx` | PRODUCTION_BLOCKED：Logo 授权凭据缺失 |
| C03 | WP1 Header 描述 | `src/components/site-header.tsx` | `tests/m4-04-owner-update.test.tsx` | LOCAL_IMPLEMENTED |
| C04 | WP1 媒体中心导航 | `src/lib/site-content.ts` | `tests/site-header.test.tsx` | LOCAL_IMPLEMENTED |
| C05 | WP1 导航颜色 | `src/app/globals.css` | 四视口 QA | LOCAL_IMPLEMENTED |
| C06 | WP2 首页问题层级 | `src/app/page.tsx`, `src/app/globals.css` | `tests/m4-04-owner-update.test.tsx` | LOCAL_IMPLEMENTED |
| C07 | WP2 增长口径 | `src/app/page.tsx` | `tests/m3-claims-validator.test.ts` | PRODUCTION_BLOCKED：归因与真实数据缺失 |
| C08 | WP2 Hero 布局 | `src/app/page.tsx`, `src/app/globals.css` | 四视口 QA | LOCAL_IMPLEMENTED |
| C09 | WP2 工具背景 | `src/app/globals.css` | 四视口 QA | LOCAL_IMPLEMENTED |
| C10 | WP2 五步流程 | `src/app/page.tsx` | `tests/content-layout-v1.2.test.tsx` | LOCAL_IMPLEMENTED |
| C11 | WP2 流程降级 | `src/app/page.tsx` | DOM/缩放 QA | LOCAL_IMPLEMENTED：使用真实 DOM，无固定图依赖 |
| C12 | WP2 效率口径 | `src/app/page.tsx` | `tests/m3-claims-validator.test.ts` | PRODUCTION_BLOCKED：任务样本与测量证据缺失 |
| C13 | WP2 文案标点 | `src/app/page.tsx` | `tests/visual-style-contract.test.tsx` | LOCAL_IMPLEMENTED |
| C14 | WP2 文案标点 | `src/app/page.tsx` | `tests/visual-style-contract.test.tsx` | LOCAL_IMPLEMENTED |
| C15 | WP2 模块图标 | `src/app/page.tsx` | `tests/m4-04-owner-update.test.tsx` | LOCAL_IMPLEMENTED |
| C16 | WP2 媒体撰稿文案 | `src/app/page.tsx` | `tests/m4-04-owner-update.test.tsx` | PRODUCTION_BLOCKED：专业审查缺失 |
| C17 | WP2 媒体结果文案 | `src/app/page.tsx` | `tests/m3-claims-validator.test.ts` | PRODUCTION_BLOCKED：媒体身份、收录和反馈证据缺失 |
| C18 | WP2 媒体图标 | `src/app/page.tsx` | `tests/m4-04-owner-update.test.tsx` | LOCAL_IMPLEMENTED |
| C19 | WP2 首页边界重排 | `src/app/page.tsx`, `src/components/site-footer.tsx` | `tests/m4-04-owner-update.test.tsx` | LOCAL_IMPLEMENTED |
| C20 | WP1 Footer 标语 | `src/components/site-footer.tsx` | `tests/m4-04-owner-update.test.tsx` | LOCAL_IMPLEMENTED |
| C21 | WP1 Footer 媒体标签 | `src/components/site-footer.tsx` | `tests/m4-04-owner-update.test.tsx` | LOCAL_IMPLEMENTED |
| C22 | WP1 Footer 案例入口 | `src/components/site-footer.tsx` | `tests/m4-04-owner-update.test.tsx` | LOCAL_IMPLEMENTED：`/cases` 能力保留 |
| C23 | WP5 政策入口 | `src/components/site-footer.tsx` | `tests/policy-page-copy.test.tsx` | LOCAL_IMPLEMENTED |
| C24 | WP5 隐私正文 | `src/app/privacy/page.tsx` | `tests/policy-page-copy.test.tsx` | PRODUCTION_BLOCKED：真实数据流与专业审查缺失 |
| C25 | WP5 技术中立正文 | `src/app/terms/page.tsx` | `tests/policy-page-copy.test.tsx` | PRODUCTION_BLOCKED：专业审查缺失 |
| C26 | WP5 用户行为正文 | `src/app/disclaimer/page.tsx` | `tests/policy-page-copy.test.tsx` | PRODUCTION_BLOCKED：专业审查缺失 |
| C27 | WP5 效果责任正文 | `src/app/disclaimer/page.tsx` | `tests/policy-page-copy.test.tsx` | LOCAL_IMPLEMENTED |
| C28 | WP5 小程序体验文案 | `src/components/mini-program-trial.tsx` | `tests/mini-program-trial.test.tsx` | LOCAL_IMPLEMENTED |
| C29 | WP5 体验 UI 边界迁移 | `src/components/mini-program-trial.tsx`, `src/app/privacy/page.tsx` | `tests/mini-program-trial.test.tsx` | LOCAL_IMPLEMENTED |
| C30 | WP5 联系页留白 | `src/app/globals.css` | 四视口 QA | LOCAL_IMPLEMENTED |
| C31 | WP5 双路径精简 | `src/app/contact/page.tsx` | `tests/wechat-contact.test.tsx`, `tests/mini-program-trial.test.tsx` | LOCAL_IMPLEMENTED：资源与事件仍隔离 |
| C32 | WP5 人工服务咨询 | `src/app/contact/page.tsx` | `tests/m4-04-owner-update.test.tsx` | LOCAL_IMPLEMENTED |
| C33 | WP5 电话表单 | `src/components/contact/inquiry-form.tsx`, `src/lib/inquiry-validation.ts`, `src/server/inquiry/service.ts`, `src/server/inquiry/directmail.ts`, `src/types/site.ts` | `tests/inquiry-form.test.tsx`, `tests/inquiry-validation.test.ts`, `tests/m2-inquiry-api.test.ts`, `tests/m2-directmail.test.ts`, `tests/submit-inquiry.test.ts` | LOCAL_IMPLEMENTED：客户端、服务端 DTO、DirectMail 与日志脱敏均为 phone-only |
| C34 | WP5 图片辅助边界 | 页面真实 DOM | `tests/m4-04-owner-update.test.tsx` | LOCAL_IMPLEMENTED：关键交互未改为图片 |
| C35 | WP3 括号修复 | `src/app/features/page.tsx` | `tests/product-pages.test.tsx` | LOCAL_IMPLEMENTED |
| C36 | WP3 功能边界重排 | `src/app/features/page.tsx` | `tests/m4-04-owner-update.test.tsx` | LOCAL_IMPLEMENTED |
| C37 | WP3 团队 Hero | `src/app/team/page.tsx`, `src/app/globals.css` | 四视口 QA | LOCAL_IMPLEMENTED |
| C38 | WP3 团队引语 | `src/app/team/page.tsx` | `tests/visual-style-contract.test.tsx` | LOCAL_IMPLEMENTED |
| C39 | WP3 效率与倍增 | `src/app/team/page.tsx` | `tests/m3-claims-validator.test.ts` | PRODUCTION_BLOCKED：真实基线与归因缺失 |
| C40 | WP3 可复制小程序 | `src/app/team/page.tsx` | `tests/m4-04-owner-update.test.tsx` | PRODUCTION_BLOCKED：获批准产品版本验收缺失 |
| C41 | WP3 成交率 | `src/app/team/page.tsx` | `tests/m3-claims-validator.test.ts` | PRODUCTION_BLOCKED：成交样本与归因缺失 |
| C42 | WP3 私域锁客 | `src/app/team/page.tsx` | `tests/m3-claims-validator.test.ts` | PRODUCTION_BLOCKED：绝对措辞和异常场景证据缺失 |
| C43 | WP3 访客归属 | `src/app/team/page.tsx` | `tests/m3-claims-validator.test.ts` | PRODUCTION_BLOCKED：产品版本、数据流和授权缺失 |
| C44 | WP3 团队边界重排 | `src/app/team/page.tsx` | `tests/m4-04-owner-update.test.tsx` | LOCAL_IMPLEMENTED |
| C45 | WP4 媒体中心命名 | `src/app/media/page.tsx`, `src/lib/site-content.ts` | `tests/media-page-and-redirects.test.tsx`, `tests/site-header.test.tsx` | LOCAL_IMPLEMENTED：站点 IA 使用“媒体中心”，`/media` 内保留客来宝媒体子业务身份 |
| C46 | WP4 媒体 CTA | `src/app/media/page.tsx`, `src/components/wechat-contact.tsx`, `src/components/contact/wechat-panel.tsx` | `tests/wechat-contact.test.tsx`, `tests/wechat-panel.test.tsx` | LOCAL_IMPLEMENTED：触发器、Dialog 标题、关闭名称与联系页降级文案已同步 |
| C47 | WP4 痛点卡片 | `src/app/media/page.tsx`, `src/app/globals.css` | `tests/m4-04-owner-update.test.tsx`, 四视口 QA | LOCAL_IMPLEMENTED |
| C48 | WP4 搜索口径 | `src/app/media/page.tsx` | `tests/m3-claims-validator.test.ts` | PRODUCTION_BLOCKED：真实搜索观察与专业审查缺失 |
| C49 | WP4 媒体覆盖 | `src/app/media/page.tsx` | `tests/m4-04-owner-update.test.tsx` | PRODUCTION_BLOCKED：保留批准标题和 11 个名称，并明确标注“部分媒体示例”；合作范围、有效期和名称授权仍缺失 |
| C50 | WP4 新闻中心 | `src/components/public-content-list.tsx` | `tests/visual-style-contract.test.tsx` | LOCAL_IMPLEMENTED |
| C51 | WP4 关于我们 | `src/app/about/page.tsx` | `tests/m4-04-owner-update.test.tsx` | LOCAL_IMPLEMENTED |
| C52 | WP4 公司介绍 | `src/app/about/page.tsx` | `tests/m4-04-owner-update.test.tsx` | PRODUCTION_BLOCKED：独立“公司介绍”Section 与四段批准正文已本地实现；主体资历和结果口径证据仍缺失 |
| C53 | WP4 删除合作伙伴 | `src/app/about/page.tsx` | `tests/m4-04-owner-update.test.tsx` | LOCAL_IMPLEMENTED |
| C54 | WP4 公司实景 Gallery | `src/components/image-lightbox.tsx`, `src/app/about/page.tsx` | `tests/image-lightbox.test.tsx` | LOCAL_IMPLEMENTED：原生 modal dialog、语义名称、背景/按钮/Escape 关闭与触发器焦点恢复通过 |
| C55 | WP4 办公室图 | `public/brand/office-scenes.png` | 资产/远程请求扫描 | PRODUCTION_BLOCKED：人物、Logo、屏幕与公开授权未确认 |
| C56 | WP4 到访图 | `public/brand/arrival-guide.jpeg`, `src/app/about/page.tsx` | `tests/m4-04-owner-update.test.tsx`, 资产/远程请求扫描 | PRODUCTION_BLOCKED：目的地、E 门、18 层和现场标识已提供有序文本路线；地址、电话、二维码和公开授权仍未确认 |
