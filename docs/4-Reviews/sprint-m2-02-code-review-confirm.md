# Sprint M2-02 Code Review Confirm

**Reviewed Inputs**

- `docs/4-Reviews/sprint-m2-02-code-review-by-gpt-5.5.md`
- `docs/1-Requirement/Mainland-Website-FR/FR-10-single-admin-authentication-session-and-audit.md`
- `docs/1-Requirement/Mainland-Website-FR/FR-11-private-oss-media-and-html-sanitization.md`
- `docs/3-Plan/sprint-m2-02.md`
- M2-02 implementation and tests relative to baseline commit `d53bec6`

**Review Date**

- 2026-07-30

## Overall Conclusion

GPT-5.5 的 7 条代码审查意见均有当前代码和 FR/Sprint 证据支持，且都属于 M2-02 的本地安全工程范围。本次确认接受全部 7 条意见；修复完成前，M2-02 实现不能进入最终提交门禁。

本轮按用户明确覆盖只运行 GPT-5.5，跳过 GPT-5.3 Codex Spark。`M2-LEGACY-01` 与 `M2-LEGACY-02` 继续作为外部遗留项，不阻止本地修复，但 Production Live 必须保持 `BLOCKED`，本地 fake/fixture 不得替代真实 OSS/ESA/FC/RDS/WAF/Cookie 或预算证据。

## Decision Table

| No. | Severity | Type | Review Source | Original Comment Summary | Decision | Evidence | Follow-up Plan / Rejection Reason |
|---|---|---|---|---|---|---|---|
| 1 | High | Security | `GPT-5.5 H1` | OSS 检查与复制之间存在对象替换窗口，并发 confirm 会在数据库锁定前重复执行复制。 | Accept | `src/server/media/service.ts` 先 `inspectObject()`、再 `promoteObject()`，最后才由 `consumeIntent()` 执行 `FOR UPDATE`；FR-11 要求拒绝对象替换并原子消费 intent。 | 为 intent 增加有期限的 confirmation claim/lease，在 OSS 副作用前通过行锁单飞；检查阶段记录源 ETag，复制使用条件头绑定 ETag，复制后重新读取目标并校验 MIME、大小、魔数和 SHA-256；增加对象替换和并发 confirm 回归测试。 |
| 2 | High | Correctness | `GPT-5.5 H2` | OSS copy 成功后 staging DELETE 失败会阻止数据库确认，产生无数据库记录的已提升对象。 | Accept | `DirectHttpsOssProvider.promoteObject()` 将 copy 和 DELETE 绑定为一次抛错操作，而 `confirmMediaUpload()` 只在其整体返回后写 `media_assets`；这与 FR-11 的可重试失败语义冲突。 | 将 immutable copy/目标复验与 staging cleanup 分离；数据库确认成功后才执行 best-effort cleanup，失败记录脱敏的 deferred-cleanup 审计并允许后续维护重试；增加 copy 成功/DELETE 失败测试。 |
| 3 | High | Correctness | `GPT-5.5 H3` | MySQL DDL 隐式提交使 migration 002 在中途失败后无法安全重跑。 | Accept | `migrations/002_security_foundation.sql` 使用不可重入的多项 `ALTER TABLE ADD`，`scripts/migrate.mjs` 和 `src/server/db/migrations.ts` 只在全部语句后记录版本；MySQL rollback 不能撤销已提交 DDL。 | 将 expand-only DDL 拆为单一变更语句，并在执行前通过 `INFORMATION_SCHEMA` 检查列、索引和约束；表创建改为 `IF NOT EXISTS`；加入模拟首个 DDL 已落地但版本未记录的重跑测试。 |
| 4 | Medium | Security | `GPT-5.5 M1` | Host/Origin 校验只验证请求字段彼此一致，没有固定到预期生产 origin。 | Accept | `assertTrustedMutation()` 仅比较 `Host`、`request.url` 和 `Origin`；FR-10 要求“可信 Origin/Host”，现有 `NEXT_PUBLIC_SITE_URL` 已是 canonical production origin 配置。 | 将 canonical `NEXT_PUBLIC_SITE_URL` origin 作为服务端明确 allowlist 输入，拒绝直连 FC/internal host 和攻击者控制的 Host；不信任未经已确认 ingress 约束的 forwarded headers；增加 production host、直连 host、伪造 host、缺 Origin 测试。 |
| 5 | Medium | Correctness | `GPT-5.5 M2` | 每次读取 session 都覆盖唯一 CSRF hash，导致多标签页互相使 token 失效。 | Accept | `/api/admin/auth/session` 每次生成 token 并调用 `rotateCsrfToken()`；后续 mutation 只接受最新 hash。FR-10 要求 Session 绑定 token，但不要求每次读取旋转。 | 改为由随机 Session token 和独立服务端 secret 派生稳定的 256-bit CSRF token；登录事务只保存其 hash，session GET 从 HttpOnly Session Cookie 重新派生并核对数据库 hash，不再旋转；增加两个标签页按任意顺序读取和提交的测试。 |
| 6 | Medium | Correctness | `GPT-5.5 M3` | presign 在授权成功生成前已提交 intent 和成功审计。 | Accept | `createMediaUploadIntent()` 先调用 `repository.createIntent()`，再调用 `authorizePut()`；后者失败时 `media_presigned` 仍已提交，违反成功业务与成功审计一致性。 | 先在服务端生成并校验短期 HTTPS 授权，再在同一数据库事务创建 intent 与 `media_presigned` 审计；授权不会在数据库提交失败时返回给客户端；增加 authorizer 抛错时无 intent/成功审计测试。 |
| 7 | Medium | Security | `GPT-5.5 M4` | 已实现 Argon2 `needsRehash`，但成功登录不会升级旧 PHC 参数。 | Accept | FR-10 明确要求在受控登录/重置流程识别并升级旧 PHC；当前 `authenticateAdmin()` 只 verify，`recordSuccess()` 无密码 hash 更新输入。 | 扩展 PasswordHasher 和登录成功事务，在 verify 成功且 `needsRehash()` 为真时生成新 PHC 并随 Session、计数复位和成功审计在同一事务更新；增加旧参数升级与无需升级测试。 |

## Needs Immediate Action

- 完成全部 7 条 Accept 项及其回归测试。
- 修复后重跑 `pnpm test`、`pnpm lint`、`pnpm build`、`pnpm smoke:standalone`、客户端秘密扫描和通用 `webservice` 扫描。
- 更新 Sprint 状态为最多 `CODE_READY_WITH_EXTERNAL_LEGACY`，不得将外部云证据标为 PASS。

## Can Be Deferred

- `M2-LEGACY-01`：隔离 ESA/FC/RDS/OSS/DirectMail 资源、probe 身份/token 与真实云链路证据。
- `M2-LEGACY-02`：真实报价、流量假设和预算硬上限。
- staging 对象的生产级定时清理任务可由后续运维 Sprint 落地；本 Sprint 必须先确保 cleanup 失败不破坏已确认媒体的一致性，并留下可审计的 deferred 状态。

## Final Status

`ACCEPTED_AFTER_CHANGES`

上述 7 项修复已全部应用。最终本地验证为 `85/85` 测试、`tsc --noEmit`、Next.js production build、standalone smoke、客户端秘密扫描和通用 `webservice` 扫描全部 PASS。M2-02 可进入独立提交门禁；`M2-LEGACY-01`、`M2-LEGACY-02` 与 Production Live `BLOCKED` 状态不变。
