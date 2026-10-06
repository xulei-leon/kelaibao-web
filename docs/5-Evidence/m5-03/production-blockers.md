# M5-03 Production blocker 报告

## 本次解除的内容口径

V3.3 归档 DOCX 已作为产品负责人事实证明和公开授权，用于 15 条 approved claims，包括效率、媒体范围、三项规模指标、隐私/业务干预/归属口径、四套套餐价格和 50% 补贴。可变口径统一在 `2026-12-13` 到期；到期后 validator 自动失败。

## 仍未解除

`pnpm validate:release` 输出 `localReady=true`、`productionReady=false`，继续保留 18 项 Production blocker：DirectMail、ESA WAF/限频、ESA 缓存刷新、FC 可观测性/限制、FC 回退、旧应用与新 schema 兼容、RDS 连接容量、RDS 备份恢复、OSS 私有交付告警、DirectMail 失败告警、生产域名/备案、政策专业审查、正式企业微信、正式小程序、境内与微信浏览器、生产成本预算、真实 CMS 品牌迁移，以及五条非 V3.3 结果 claims 的授权缺口。

`pnpm validate:release -- --require-production-live` 按预期退出 1。本 Sprint 不改变 CMS、后台、数据库、询盘 API、云架构或小程序代码，也不把 Local 验证冒充 Production 证据。
