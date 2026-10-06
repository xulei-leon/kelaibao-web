# M3-05 Release Gate Report

生成时间：2026-08-01T01:25:00+08:00
输入版本：schema v2
输入路径：`docs/5-Evidence/m3-05/gate-input.json`

## 结论

- `localReady=true`
- `productionReady=false`
- `status=CODE_READY_WITH_EXTERNAL_LEGACY`
- Local blockers：0
- Production blockers：17
- 继承的 M2 Production gate：16/16，顺序与 ID 完整保留；当前 16 项仍全部 `BLOCKED`。
- M3 新 gate：`production_claims_authorization=PASS`；`production_cms_brand_migration=BLOCKED`。

Production 不得提升。当前仅证明代码、契约、测试 fixture 与公开口径登记完成，不代表真实 CMS、域名/备案、云资源、二维码、企业微信或专业授权已经具备。

## 命令与退出码

| 命令 | 退出码 | 结果 |
| --- | ---: | --- |
| `pnpm validate:release` | 0 | Local Ready；Production BLOCKED。 |
| `pnpm validate:release -- --require-production-live` | 1 | 按预期拒绝 Production-live。 |
| `pnpm validate:release -- --input docs/5-Evidence/m2-05/gate-input.json` | 0 | schema v1 兼容；仍为 Local Ready / Production BLOCKED。 |
| 无效 `schemaVersion=99` CLI fixture | 2 | 按预期拒绝输入；由 `tests/m3-release-cli.test.ts` 覆盖。 |

## Local 检查

| ID | 状态 | 证据 |
| --- | --- | --- |
| `inquiry_route_contract` | LOCAL_PASS | `tests/m2-inquiry-api.test.ts` |
| `directmail_fake_contract` | LOCAL_PASS | `tests/m2-directmail.test.ts` |
| `pii_canary_scan` | LOCAL_PASS | `tests/m2-inquiry-api.test.ts` |
| `release_validator_contract` | LOCAL_PASS | `tests/m2-release-validator.test.ts`、`tests/m3-release-validator.test.ts` |
| `runbook_contract` | LOCAL_PASS | `docs/2-Design/Admin-Security-and-Media-Runbook.md` |
| `m3_brand_release_contract` | LOCAL_PASS | `tests/m3-brand-release-contract.test.ts` |
| `m3_claims_contract` | LOCAL_PASS | `docs/5-Evidence/m3-05/claims-register.json` |
| `m3_cms_inventory_contract` | LOCAL_PASS | `docs/5-Evidence/m3-05/content-inventory.fixture.json` |

可执行 M3 evidence 结果：扫描公开文件 56 个，品牌 findings 0；claims 10 项，其中 6 项依据产品负责人决定批准公开、4 项继续弱化且原口径不在公开输出；CMS fixture 2 条，`sourceMode=fixture`、`inventoryComplete=false`。

## Production gates

| ID | 状态 | 主要缺口 |
| --- | --- | --- |
| `directmail_live_send` | BLOCKED | 无真实 DirectMail 资源与受控发送证据。 |
| `esa_waf_rate_limit` | BLOCKED | 无真实 ESA/WAF 与探针身份。 |
| `esa_cache_purge` | BLOCKED | 无真实 ESA purge 证据。 |
| `fc_observability_limits` | BLOCKED | 无真实 FC 告警与容量限制证据。 |
| `fc_rollback` | BLOCKED | 无版本化 FC 回滚演练。 |
| `fc_previous_app_new_schema_compatibility` | BLOCKED | 无旧应用与隔离 RDS 兼容探针。 |
| `rds_connectivity_capacity` | BLOCKED | 无真实 RDS 连接与容量证据。 |
| `rds_backup_restore` | BLOCKED | 无真实备份恢复演练。 |
| `oss_private_delivery_alerts` | BLOCKED | 无真实私有 OSS/ESA 交付与告警证据。 |
| `directmail_failure_alert` | BLOCKED | 无真实 DirectMail 失败告警演练。 |
| `production_domain_icp` | BLOCKED | 无正式主体、域名和备案证据。 |
| `production_policies_professional_review_authorization` | BLOCKED | 无专业审查与正式公开授权。 |
| `production_wecom` | BLOCKED | 仅 Preview 测试二维码。 |
| `production_mini_program` | BLOCKED | 仅 Preview 测试二维码。 |
| `production_mainland_wechat_browser` | BLOCKED | 无正式域名与大陆/微信浏览器环境。 |
| `production_cost_budget` | BLOCKED | 无真实报价和批准预算上限。 |
| `production_cms_brand_migration` | BLOCKED | 仅脱敏 fixture；未连接真实 CMS，未证明完整迁移、revision/audit 与案例授权。 |
| `production_claims_authorization` | PASS | 6 项依据产品负责人决定恢复公开，4 项继续弱化并保持不进入公开输出。 |

## 验证汇总

- `pnpm test`：52 files / 271 tests PASS。
- `pnpm lint`：PASS。
- `pnpm build`：PASS；standalone artifact 未嵌入 runtime secrets。
- `pnpm smoke:standalone`：PASS。最终验证第一次调用出现 Windows 子进程异常退出码 `3221226505` 且无应用错误输出；检查后单独干净复跑通过，未发现实现级回归。
- `pnpm smoke:media-redirects`：PASS。
- 四视口与交互 QA：PASS，详见 `visual-qa.md`。
- `git diff --check -- products/kelaibao`：PASS。

## 未解决项与敏感信息检查

- 未连接真实 CMS/RDS，未扫描或输出真实正文、净化 HTML、数据库 URL 或凭据。
- 未创建、猜测或记录 AccessKey、token、签名 URL、真实邮箱、企业微信身份或客户 PII。
- 未伪造域名、备案、生产二维码、案例授权、专业审查、云资源或预算证据。
- Production blockers 必须由真实外部证据逐项关闭；Local fixture 不得用于提升 Production 状态。
