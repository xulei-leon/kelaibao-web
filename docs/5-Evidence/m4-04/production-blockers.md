# M4-04 verification and Production blocker report

## 当前结论

- Local 状态：`Local Code Ready`。实现、代码 review-start / review-confirm、接受项修正和完整验证均已完成；FR/Sprint 文档 review-start / review-confirm 由用户于 2026-08-05 明确跳过。
- Production 状态：`BLOCKED`。负责人已接受 C01-C56 不改变客观证据、授权、备案、云资源和专业审查门禁。

## Local 验证记录

| 检查 | 结果 | 备注 |
| --- | --- | --- |
| Windows `pnpm test` | PASS | 64 files；351 passed，2 skipped；两项仅因当前 Windows 无 symlink 权限跳过 |
| Windows `pnpm lint` | PASS | `tsc --noEmit` |
| Windows `pnpm build` | ENV BLOCKED | 编译、类型检查、16/16 静态页生成通过；standalone trace 创建 symlink 时 `EPERM` |
| WSL2 `pnpm test` | PASS | 同一源码临时副本；64 files，353/353 passed，symlink 安全夹具未跳过 |
| WSL2 `pnpm lint` | PASS | `tsc --noEmit` |
| WSL2 `pnpm build` | PASS | 完整 Next build 与 `package:standalone` 通过 |
| WSL2 `pnpm smoke:standalone` | PASS | SSR、Route Handler、runtime env、公开页与失败关闭检查通过 |
| WSL2 `pnpm smoke:media-redirects` | PASS | 旧媒体路由、query 保留与未知路由检查通过 |
| `pnpm validate:release` | PASS / Production BLOCKED | `localReady: true`，`productionReady: false`，claims gate 保持 `BLOCKED` |
| 客户端秘密扫描 | PASS | `src`、`public`、`scripts` 与 `package.json` 未命中已知密钥模式 |
| `git diff --check` | PASS | 无空白错误 |
| 四视口与 200% QA | PASS | 详见 `visual-qa.md` 和 `screenshots/` |

WSL2 临时验证目录以当前工作树为源，排除了 `node_modules`、`.next`、浏览器日志和测试生成物；使用 Node 22.23.2 与 pnpm 11.9.0 按锁文件安装。Windows `EPERM` 只作为当前宿主权限差异记录，不替代或降低 Linux 完整门禁。

Windows SQLite 集成测试在并行宿主负载下曾出现 20～39 秒随机 I/O 抖动，失败位置会在无关测试间移动；因此最终配置统一使用 60 秒单测上限。该配置是在代码 review-confirm 后根据重复隔离复现加入的宿主稳定性调整；最终 Windows 全套耗时 34.04 秒，WSL2 全套无跳过通过，未以拆分套件或弱化断言规避失败。

正式代码评审产物为两份初始报告、两份完整范围报告及 `sprint-m4-04-code-review-confirm.md`；所有 Accept/Partial 即时项均已实施并复验。中止的 FR/Sprint 文档评审报告未作为正式产物保留。

## M4-04 新增 blocker

| Blocker | 负责人 | 所需证据 | 解除条件 |
| --- | --- | --- | --- |
| 结果与效率口径 | 产品负责人 + 独立审查人 | 真实样本、定义、基线、算法、归因、观察周期、公开授权 | claims register 对应项满足 approved schema 并通过专业审查 |
| 搜索与收录结果 | 产品负责人 + 搜索平台审查 | 固定关键词/地区/设备/周期的可复核真实结果 | 不再依赖不可控承诺，或获有效客观证据与批准文案 |
| 媒体覆盖与名称 | 媒体业务负责人 | 逐媒体主体、合作/可投依据、有效期、审核条件、名称使用授权 | 台账逐项有效且页面范围与台账一致 |
| K-Link 分享/归属/锁客 | 产品负责人 + 产品验收人 | 获批准版本、完整数据流、授权撤回、跨端/缓存/异常场景测试 | C40-C43 专项验收通过并完成隐私/专业审查 |
| 公司主体与资历 | 产品负责人 | 主体登记、团队资历、业务范围和公开授权 | 关于页事实逐项有可审计证据 |
| Logo | 权利人 | 原始来源与官网公开使用授权 | provenance 状态改为 authorized |
| 办公室图 | 权利人 + 场所负责人 | 人物/Logo/屏幕/场所真实性和公开授权 | 逐项核对通过且无未授权个人或敏感信息 |
| 到访图 | 场所负责人 + 隐私审查人 | 地址、电话、二维码、地图/照片权利与公开授权 | 图片与文本信息一致、二维码有效、公开授权完整 |
| 政策正文 | 产品负责人 + 专业审查人 | 真实数据流、第三方依赖、适用范围与正式审查记录 | 隐私/条款/用户行为/责任文本与实际处理一致并获授权 |

既有 `docs/5-Evidence/m3-05/gate-input.json` 中的 Production blocker 全部继承，不因本地测试或截图解除。
