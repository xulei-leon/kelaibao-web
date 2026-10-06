# M2-05 Release Gate Report

- 执行日期：2026-07-30（Asia/Shanghai）
- 输入：`docs/5-Evidence/m2-05/gate-input.json`
- 默认校验：`pnpm validate:release` → `CODE_READY_WITH_EXTERNAL_LEGACY`
- Production 硬门禁：`pnpm validate:release -- --require-production-live` → 预期 exit 1
- Local 状态：`LOCAL_PASS`
- Production 状态：`BLOCKED`

## 本地工程证据

| Check | Status | Evidence |
| --- | --- | --- |
| `inquiry_route_contract` | `LOCAL_PASS` | `tests/m2-inquiry-api.test.ts`、`tests/m2-inquiry-guard.test.ts`、`tests/submit-inquiry.test.ts`、`tests/inquiry-form.test.tsx` |
| `directmail_fake_contract` | `LOCAL_PASS` | `tests/m2-directmail.test.ts` |
| `pii_canary_scan` | `LOCAL_PASS` | `tests/m2-inquiry-api.test.ts` |
| `release_validator_contract` | `LOCAL_PASS` | `tests/m2-release-validator.test.ts` |
| `runbook_contract` | `LOCAL_PASS` | `docs/2-Design/Admin-Security-and-Media-Runbook.md`、`docs/2-Design/FC-Deployment-Runbook.md` |

上述状态只证明本地代码与文档契约，不等同于真实 DirectMail、ESA、FC、RDS、
OSS、正式域名、合规、企业微信、恢复/回退或成本 `PASS`。

## Production 阻塞

以下 mandatory gate 当前均为 `BLOCKED`：

- `directmail_live_send`
- `esa_waf_rate_limit`
- `esa_cache_purge`
- `fc_observability_limits`
- `fc_rollback`
- `fc_previous_app_new_schema_compatibility`
- `rds_connectivity_capacity`
- `rds_backup_restore`
- `oss_private_delivery_alerts`
- `directmail_failure_alert`
- `production_domain_icp`
- `production_policies_professional_review_authorization`
- `production_wecom`
- `production_mainland_wechat_browser`
- `production_cost_budget`

其中云资源、probe 身份/token、告警、WAF、恢复、回退与缓存证据归入
`M2-LEGACY-01`；真实报价、流量假设和预算硬上限归入 `M2-LEGACY-02`。
主体/域名/ICP备案、政策/专业审查/授权、正式企业微信和大陆网络/微信浏览器
继续作为 FR-08 mandatory gate。任何一项非真实 `PASS` 时均不得标记
Production Live。

## 敏感信息检查

- 本报告和 gate input 不包含 AccessKey、token、数据库 URL、邮箱实际凭据、
  原始客户端地址或询盘正文。
- fake provider、示例资源引用和本地构建不会被 validator 接受为 production
  `PASS`。
