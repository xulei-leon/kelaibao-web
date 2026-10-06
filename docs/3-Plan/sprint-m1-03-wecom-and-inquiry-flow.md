# Sprint M1-03 企业微信与备用询盘

> **状态：** draft，待文档 review-confirm；未开始实现。

## 1. Sprint 目标

本 Sprint 覆盖 [FR-04](../1-Requirement/Mainland-Website-FR/FR-04-wecom-primary-contact-entry.md) 与 [FR-05](../1-Requirement/Mainland-Website-FR/FR-05-fallback-inquiry-form.md)，建立企业微信为主、最小表单为辅的双路径咨询闭环。

核心目标：

- 桌面端可扫码、移动端可长按识别或保存二维码。
- 任一微信交互失败时，访问者可使用直接 HTTPS 备用表单。
- 线索内容不进入本地数据库、URL、浏览器存储、分析或客户端日志。

## 2. 前置依赖

- `sprint-m1-02` 已完成全部评审、验证和提交门禁。
- FR-04、FR-05 与本 Sprint 文档 review-confirm 已完成。

协同说明：

- 自动测试使用受控占位二维码与 mock endpoint，不向真实服务发送请求。
- 正式企业微信二维码和真实 endpoint 由 M1-05 配置并验证。

## 3. 纳入范围

本 Sprint 纳入以下 FR：

- `FR-04` 企业微信首要咨询入口。
- `FR-05` 隐私安全的备用询盘表单。

涉及包和目录：

- `src/components/wechat-contact.*`、`wechat-contact-dialog.*`。
- `src/app/contact/page.tsx`、`src/components/inquiry-form.*`。
- `src/lib/site-config.ts`、`src/lib/inquiry-validation.ts`。
- `public/wechat/` 测试占位资源、组件与表单测试。

## 4. 暂不纳入范围

- 微信 API、小程序、公众号、群二维码、自动唤起或好友状态追踪。
- 本地 API route、数据库、CRM、邮件通知、文件上传和自动回复。
- 真实客户数据提交和正式企业微信/endpoint 生产验证。

原因：

- 首版追求无微信平台开发的最小转化链路；生产外部配置集中在 M1-05。

## 5. 工作范围

### 5.1 工作包：企业微信联系入口

目标：

- 用单一配置实现可访问、可降级的全站微信 CTA。

实现任务清单：

- [ ] 先写失败测试，覆盖弹层打开/关闭、Escape、焦点进入与恢复、资源失败和无脚本链接。
- [ ] 实现集中 `WechatContactConfig` 与本地二维码路径，不允许远程图片 URL。
- [ ] 实现 CTA 与轻量 dialog；所有 CTA 的稳定 `href` 指向 `/contact`。
- [ ] 桌面端显示扫码说明，移动端显示长按识别或保存说明。
- [ ] 二维码加载失败时显示明确状态与备用表单锚点。
- [ ] 记录只含事件名和来源页面的匿名 CTA 事件；分析失败不影响交互。

测试要求：

- [ ] 组件测试覆盖键盘、焦点、提示文案、失败降级和匿名载荷。
- [ ] 测试配置中不允许 `accountType` 之外的生产账号类型。

### 5.2 工作包：最小备用表单

目标：

- 通过浏览器直接 HTTP(S) 请求承接无法使用微信的访问者。

实现任务清单：

- [ ] 先写 `MainlandLeadRequest` 字段、枚举、长度、同意和 honeypot 的失败测试。
- [ ] 实现称呼、职业、可选城市、联系方式、需求和隐私同意字段。
- [ ] 用 `fetch` 直接 POST JSON 到 `NEXT_PUBLIC_CONTACT_FORM_ENDPOINT`；不创建 API route。
- [ ] 实现提交中锁定、有限超时、成功、非 2xx、网络错误和未配置状态。
- [ ] 失败时保留用户输入并显示企业微信入口；不得自动重试或输出响应正文。
- [ ] 确认请求正文不写入 URL、Web Storage、分析、console 或错误记录。

测试要求：

- [ ] 覆盖合法提交、所有字段边界、重复点击、成功、失败、超时、未配置和 honeypot。
- [ ] 检查只发送白名单字段，生产拒绝非 HTTPS endpoint。

## 6. 验收标准

- 全站微信 CTA 共用一份配置并可到达 `/contact`。
- dialog 满足关闭、Escape、焦点管理和二维码替代文本要求。
- 桌面和移动提示正确，二维码失败时仍可使用表单。
- 合法表单只向配置的 HTTPS endpoint 发送一次白名单 JSON 请求。
- 失败和超时不清空输入，不泄露响应正文，并回到微信路径。
- 个人信息不进入 URL、存储、分析或客户端日志。

## 7. 验证要求

项目声明/推断的验证命令：

- `pnpm test`
- `pnpm lint`
- `pnpm build`

专项验证：

- 使用 mock endpoint 验证全部表单状态，不访问真实网络。
- 手工检查桌面二维码、移动长按提示、无脚本链接和键盘操作。
- 扫描源码与测试输出，确认无真实二维码、联系人或 endpoint。

## 8. 实施顺序

1. 写微信 dialog 和表单失败测试。
2. 实现集中微信配置、CTA 与可访问 dialog。
3. 实现表单类型、校验和直接 HTTP(S) 请求状态机。
4. 完成失败降级、隐私载荷和移动端检查。
5. 完成代码 review-confirm、全量验证和独立提交。

## 9. 风险控制

- 微信内置浏览器行为不一致：保留图片、文字提示、`/contact` 和表单多级降级。
- endpoint 泄露或滥用：公开配置只包含 URL，使用 honeypot、长度限制和提交锁定；服务端防护属于 endpoint 责任。
- 测试误发真实线索：测试只使用 mock 与虚构数据，不读取生产环境变量。

## 10. 交付结论

待实现、评审确认和验证完成后填写。

