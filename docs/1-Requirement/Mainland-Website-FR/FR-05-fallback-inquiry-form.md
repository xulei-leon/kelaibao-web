# FR-05 隐私安全的备用询盘表单

- `FR-ID`: `FR-05`
- `标题`: 隐私安全的备用询盘表单
- `所属阶段`: 阶段 2 - 线索转化
- `开发顺序`: 5
- `优先级`: P0
- `前置依赖`: `FR-01`、`FR-04`
- `涉及包`: `/contact`、表单组件、字段校验、同域 `/api/inquiry` 与测试
- `是否属于原型阶段`: 是
- `来源类型`: 新需求
- `原始 SRS 章节`: 4、6.7、7.2～7.3、8、10、11.3
- `相关 FR`: `FR-06`、`FR-07`、`FR-08`、`FR-14`

## 目标

在访问者无法使用企业微信时，以最小字段、同域 HTTPS 请求和明确失败降级承接人工咨询，同时避免保存线索或泄露个人信息。

## 背景与问题

二维码可能因设备、网络或用户偏好不可用。备用表单需要提高可达性，但不能演变为数据库、CRM 或通用后端，也不能把询盘内容发送到分析和错误日志。

## 影响范围

- `/contact` 的备用表单、字段类型、客户端校验和状态反馈。
- 同域 `/api/inquiry` 的 `fetch` 请求。
- 隐私同意、honeypot、超时、重复点击和降级测试。

## 需求描述

1. 实现 SRS 定义的 `MainlandLeadRequest`，字段只包含称呼、职业、可选城市、联系方式、需求和隐私同意。
2. 按 SRS 约束校验枚举、长度、联系方式、需求和 `privacyConsent === true`。
3. 使用浏览器 `fetch` 向同域 `/api/inquiry` 发送 JSON；DirectMail、服务端限频与日志边界由 `FR-14` 实现。
4. 使用隐藏 honeypot 阻止明显机器人请求，并在命中时不发送正文。
5. 提交期间禁用重复操作，设置有限超时并在完成后恢复交互。
6. 成功只提示“已收到咨询”和人工后续，不暗示签约、付款或结果。
7. API、DirectMail 失败或超时时，显示企业微信降级入口。
8. 页面、分析和客户端日志不得记录请求正文、姓名或联系方式。

## 高层要求

- 不创建线索数据库、CRM 或通用 webservice；同域 API 只承担校验、限频和 DirectMail 通知。
- 不收集身份证、证书、客户名单、收入、资产、金融账户、密码或文件。
- 不使用 localStorage、sessionStorage 或 URL 参数持久化表单内容。
- HTTP 错误不得向用户暴露内部响应正文或敏感诊断。

## 输入

```ts
interface MainlandLeadRequest {
  name: string;
  profession:
    | "direct_sales"
    | "insurance_broker"
    | "securities_broker"
    | "other";
  city?: string;
  contactMethod: "wechat" | "phone";
  contactValue: string;
  needs: string;
  privacyConsent: true;
}
```

- 同域 `/api/inquiry`。
- honeypot 字段和用户提交动作。

## 输出

- 对 `/api/inquiry` 的单次 JSON HTTPS 请求。
- 字段级错误、提交中、成功、失败和超时状态。
- 失败时可操作的企业微信入口。

## 失败与降级

- API 超时、网络错误、DirectMail 失败或非成功状态：不自动重试、不泄露响应正文，显示微信入口。
- honeypot 命中或校验失败：不发送请求。
- 分析或错误记录失败：不得影响表单状态，也不得重发线索。

## 不纳入范围

- 服务端线索存储、CRM 同步和自动回复。
- 文件上传、预约时间或报价计算。
- 微信 API 或好友状态联动。

## 最小验证方式

- 测试合法提交、每个字段边界、未同意、honeypot、重复点击、成功、失败和超时。
- 检查请求载荷只包含允许字段。
- 检查日志与分析调用不包含请求正文。
- 运行 `pnpm test && pnpm lint && pnpm build`。

## 验收要点

- 合法表单能向同域 `/api/inquiry` 发送一次请求。
- 所有非法或超限输入均在发送前阻止。
- 失败场景均能继续通过企业微信咨询。
- 页面不保存线索，不将个人信息写入 URL、存储、日志或分析。

## 备注

DirectMail 发信域、数据处理与可用性由 `FR-14` 实现，并由 `FR-08` 上线门禁确认。
