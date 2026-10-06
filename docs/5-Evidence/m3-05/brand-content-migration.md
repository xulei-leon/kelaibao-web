# M3-05 CMS 品牌内容迁移清单

## 判定

- Local contract：`PASS`
- Production gate `production_cms_brand_migration`：`BLOCKED`
- 本报告只验证脱敏清单 schema、Local 扫描和 fail-closed 判定；**未连接、查询或扫描真实 CMS/RDS 数据库**。
- 不得用本报告或 fixture 声称真实已发布内容已经盘点、修订、重新发布或下线。

## 清单来源与扫描时间

| 字段 | 值 |
| --- | --- |
| 清单路径 | `docs/5-Evidence/m3-05/content-inventory.fixture.json` |
| `schemaVersion` | `1` |
| `generatedAt` | `2026-08-01T00:00:00.000Z` |
| `sourceMode` | `fixture` |
| `inventoryComplete` | `false` |
| 真实 CMS 扫描时间 | 未执行 |
| 数据库连接 | 未建立 |

## 脱敏条目与决定

| ID | 类型 | Slug | 状态 | 旧品牌匹配 | 决定 | Revision ID | Audit ID | 授权状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `fixture-news-001` | `news` | `sanitized-news-entry-a` | `published` | `legacy-brand-token` | `pending` | 未提供 | 未提供 | `not-required` |
| `fixture-case-001` | `case` | `sanitized-case-entry-a` | `published` | `legacy-brand-token` | `pending` | 未提供 | 未提供 | `unknown` |

这些条目仅用于验证契约，不对应真实 CMS 记录。`pending`、缺少 revision/audit ID 以及案例授权未知均不能成为 Production PASS 证据。

## Production 未解决项

1. 使用现有 repository/admin 能力从真实 CMS 导出完整的已发布新闻与案例清单，生成 `sourceMode=live-cms` 且 `inventoryComplete=true` 的脱敏证据。
2. 对每个旧品牌匹配条目只通过现有修订并重新发布或下线能力处理；禁止直接 SQL 替换正文、slug 或净化快照。
3. 为每个 live 条目记录非占位的 revision ID 与 audit ID；重新发布案例前确认授权为 `authorized`。
4. 重新验证列表、详情、`404/410`、修订记录和缓存刷新；真实清单不得为空，也不得保留 blocker。

## 敏感信息检查

- 清单和报告不包含正文、富文本、净化前后 HTML、客户资料、联系方式或案例原始素材。
- 不包含数据库 DSN、主机、用户名、密码、Session、Cookie、OSS/阿里云凭据或其他 secret。
- 只保留契约要求的最小元数据；校验器拒绝 item 上的任何未声明字段，包括 `body`、`html`、`databaseUrl` 和 `credential`。

## TDD 记录

| 阶段 | 命令 | 退出码 | 结果 |
| --- | --- | --- | --- |
| RED | `pnpm vitest run tests/m3-content-inventory.test.ts` | `1` | 预期失败：`scripts/lib/content-inventory-validator.mjs` 尚不存在，测试无法解析导入。 |
| GREEN | `pnpm vitest run tests/m3-content-inventory.test.ts` | `0` | `1` 个测试文件、`7` 个测试全部通过，并直接验证已签入的脱敏 fixture。 |

## 契约边界

- `fixture`、空 items 或 `inventoryComplete=false` 可通过 Local schema/contract，但 Production CMS gate 必须保持 `BLOCKED`。
- `live-cms` 只有在清单非空、完整、无 blocker、逐条决定完成、revision/audit ID 非占位且重新发布案例授权有效时才可 `PASS`。
- 声称完整的空 live 清单、fixture/mock 伪装的 live 证据、缺字段或夹带未声明/敏感字段的清单均校验失败。
