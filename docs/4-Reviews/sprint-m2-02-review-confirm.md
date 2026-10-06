# Sprint M2-02 Document Review Confirm

**Reviewed Inputs**

- `docs/1-Requirement/Mainland-Website-FR/FR-10-single-admin-authentication-session-and-audit.md`
- `docs/1-Requirement/Mainland-Website-FR/FR-11-private-oss-media-and-html-sanitization.md`
- `docs/3-Plan/sprint-m2-02.md`
- `docs/2-Design/Alibaba-Cloud-Fullstack-Architecture-Spec.md`
- `docs/4-Reviews/sprint-m2-02-review-by-gpt-5.5.md`
- M2-01 implementation baseline `d53bec6`

**Review Date**

- 2026-07-30

**Reviewer Scope Override**

- 依用户指示，本轮只采用 GPT-5.5 报告；GPT-5.3 Codex Spark 已跳过。

## Overall Conclusion

GPT-5.5 的 11 条意见均识别了真实安全或验收缺口。10 条完整接受；账号枚举意见部分接受：外部响应、密码哈希工作量和可观察行为必须一致，但内部安全审计可以保留不对外暴露的稳定失败类别，以便检测攻击，前提是 metadata 严格脱敏。

文档须在实现前补齐并发锁定、CSRF、bootstrap/reset/disable 原子性、Argon2id 配置、审计 taxonomy、sanitizer 版本与预览 CSP、upload intent 状态机、OSS 确认校验、魔数检测及本地/真实云结果分栏。上述修改现已全部应用。

## Decision Table

| No. | Severity | Type | Review Source | Original Comment Summary | Decision | Evidence | Follow-up Plan / Rejection Reason |
|---|---|---|---|---|---|---|---|
| 1 | High | Security | `GPT-5.5 C1` | 并发登录失败可能丢计数并绕过第 5 次锁定。 | Accept | M2-01 的失败计数字段位于单行，但 FR/Sprint 未要求行锁、事务或原子条件更新。 | FR-10 与 Sprint 增加同一管理员行的事务/行锁要求，并用并发失败测试验证唯一、确定的锁定状态。 |
| 2 | High | Security | `GPT-5.5 C2` | 不存在账号、密码错误和锁定账号可能通过耗时或行为被枚举。 | Partial | 通用提示只覆盖文案；dummy Argon2id 工作量和统一外部响应是必要的。但内部审计若完全合并类别，会削弱攻击检测，且审计并非浏览器可见输出。 | 统一 HTTP 状态、响应体和密码哈希工作量；不存在账号执行固定 dummy hash verify。内部审计允许使用稳定的脱敏失败类别，但不得记录原始用户名、密码或向客户端暴露类别；测试不采用易抖动的严格毫秒等值断言。 |
| 3 | High | Security | `GPT-5.5 C3` | 仅 `SameSite=Strict` 未形成完整 CSRF 验收边界。 | Accept | FR-10 要求 Cookie Session 和后台写操作，却未定义 Origin/Host 或 token 校验。 | 所有 `/api/admin/*` 变更请求校验可信 Origin/Host 与 Session 绑定 CSRF token；覆盖缺失、错误、跨站、合法同源和 Session 撤销后的失效测试。 |
| 4 | Medium | Requirement | `GPT-5.5 C4` | bootstrap、reset、disable 与 Session 撤销缺少持久化和事务契约。 | Accept | M2-01 schema 无禁用字段；现有文档未说明重复 bootstrap 和重置半提交处理。 | 增加 `disabled_at` 等 expand-only 字段；bootstrap 仅允许空库或显式维护条件且幂等/安全失败；密码重置、Session 撤销与审计同事务，失败整体回滚。 |
| 5 | Medium | Security | `GPT-5.5 C5` | Argon2id 缺少服务端运行边界、参数、PHC 格式和资源预算。 | Accept | 当前依赖没有 Argon2，FR 只规定算法和 14 字符。 | 将 Argon2id 参数集中为服务端配置，采用 PHC encoded hash、独立随机 salt、最低安全参数与本地性能预算；禁止进入 Edge/客户端，并为后续参数升级保留 rehash 判断。 |
| 6 | Medium | Correctness | `GPT-5.5 C6` | 审计事件、事务一致性和 metadata allowlist 不明确。 | Accept | `audit_logs` 有通用字段，但 FR/Sprint 未定义最小事件集合与敏感字段规则。 | 定义登录、锁定、退出、撤销、重置、禁用、净化、预签名和确认事件 taxonomy；业务写入与成功审计同事务，失败事件按独立安全审计路径记录；metadata 使用显式 allowlist。 |
| 7 | Medium | Security | `GPT-5.5 C7` | sanitizer 规则版本没有进入数据和发布契约。 | Accept | 现有内容表只有 source/sanitized，没有 policy version；无法证明规则升级后重净化。 | 用 expand-only migration 增加 sanitizer policy version；保存诊断只保留脱敏摘要；每次预览/发布用当前 policy 重净化，旧版本不得直接复用。 |
| 8 | Medium | Security | `GPT-5.5 C8` | sandbox 预览缺少最小 token、CSP、导航和网络约束。 | Accept | “sandbox iframe”没有具体可执行属性，仍依赖 sanitizer 单点。 | iframe 不允许 `allow-scripts`/`allow-same-origin`，预览文档使用 restrictive CSP 并禁止表单、顶层导航和非 allowlist 外联；增加浏览器/DOM 契约测试。 |
| 9 | High | Security | `GPT-5.5 C9` | OSS 确认缺少 upload intent、归属、单次/幂等与对象元数据校验。 | Accept | `media_assets.object_key` 唯一不足以表达短期上传授权状态；FR 未定义 TOCTOU 防护。 | 增加 `media_upload_intents` 状态表和状态机，绑定管理员、对象键、MIME、上限、nonce、expiry；confirm 通过独立直接 HTTPS OSS 客户端验证对象并原子消费 intent，重复确认幂等返回同一资产或安全失败。 |
| 10 | Medium | Consistency | `GPT-5.5 C10` | “配置 ESA/只经 ESA 分发”可能让占位契约误报真实云 PASS。 | Accept | 架构和 Sprint 前置说明已标记 external legacy，但工作包/FR 验收仍用绝对语气。 | 文档与证据分为 `LOCAL_PASS` 和 `M2-LEGACY-01 / DEFERRED`；真实 Bucket、ESA、WAF、签名过期/越权和 Cookie 链路不得由本地 mock 代替。 |
| 11 | Low | Test | `GPT-5.5 C11` | MIME 声明验证不足以阻止伪装内容/polyglot。 | Accept | FR 已声明不信任扩展名，但未要求魔数/内容检测；仅 HEAD 元数据也不足。 | confirm 使用直接 HTTPS 获取受限内容进行 MIME、魔数、大小和 SHA-256 一致性验证；覆盖 HTML/SVG/JS 伪装、扩展名/MIME/魔数不一致和边界大小。 |

## Needs Immediate Action

- 将 11 项确认结论写入 FR-10、FR-11 与 M2-02 Sprint。
- 补齐所需 expand-only schema 变化、接口契约和专项测试清单后才进入代码实现。

## Can Be Deferred

- 真实 OSS Bucket 私有性、真实签名过期/越权、ESA 分发、WAF/限频和同域 Cookie 证据继续为 `M2-LEGACY-01 / DEFERRED`。
- Argon2id 的真实 FC 冷启动/内存调优与云端阈值验证归入 `M2-LEGACY-01`；本地最低参数和性能预算必须在本 Sprint 通过。
- 报价、流量假设和预算硬上限继续为 `M2-LEGACY-02 / DEFERRED`。

## Final Status

`ACCEPTED_AFTER_CHANGES`

- FR-10 已补齐并发锁定、统一外部失败、CSRF、bootstrap/reset/disable、Argon2id 和审计事务契约。
- FR-11 已补齐 sanitizer policy/version、sandbox/CSP、upload intent、直接 HTTPS 对象确认、魔数/SHA-256 和本地/真实云分栏契约。
- M2-02 Sprint 已把上述要求映射为 TDD 工作包、专项验证、风险控制与 expand-only migration 范围。
- 链接、范围与 `git diff --check` 通过后，可进入 M2-02 TDD 实现；真实云与成本遗留仍为 `BLOCKED/DEFERRED`。
