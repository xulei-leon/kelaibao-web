# Sprint M2-05 Code Review Confirm

**Reviewed Inputs**

- `docs/3-Plan/sprint-m2-05.md`
- `docs/4-Reviews/sprint-m2-05-code-review-by-gpt-5.5.md`
- `docs/1-Requirement/Mainland-Website-FR/FR-14-inquiry-observability-security-production-readiness.md`
- `docs/1-Requirement/Mainland-Website-FR/FR-08-mainland-production-readiness.md`
- `AGENTS.md`
- `scripts/lib/release-validator.mjs`
- `tests/m2-release-validator.test.ts`
- `src/app/api/inquiry/route.ts`
- `src/server/inquiry/service.ts`
- `tests/m2-inquiry-api.test.ts`

**Review Date**

- 2026-07-30

## Overall Conclusion

GPT-5.5 的四项意见均有代码和 Sprint 验收条款支持。当前实现不能原样通过代码审查门禁：release validator 仍可能接受与 `PASS` 矛盾的实际结果，且没有机器校验两项遗留问题与指定生产门禁的映射；询盘 route 也缺少显式方法边界及严格 JSON media type 判断。

四项均在 M2-05 已确认范围内，可以通过局部实现和测试补齐，不需要改变架构、引入持久化或扩大外部依赖。完成下表修复并通过最终验证后，可接受为 `CODE_READY_WITH_EXTERNAL_LEGACY`；真实 Production Live 仍必须保持 `BLOCKED`。

## Decision Table

| No. | Severity | Type | Review Source | Original Comment Summary | Decision | Evidence | Follow-up Plan / Rejection Reason |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | High | Correctness | `GPT-5.5 C1` | production gate 的 `status=PASS` 可与 evidence 或兼容矩阵中的失败 actualResult 并存。 | Accept | `scripts/lib/release-validator.mjs` 当前只用占位词模式扫描整组证据，没有拒绝 `FAIL`、`FAILED`、`incompatible` 等矛盾实际结果；Sprint 5.4/测试要求明确要求兼容矩阵失败或占位时阻断，且 FR-08 要求所有门禁有真实通过证据。 | 在 validator 中对 production `PASS` 的 `evidence.actualResult` 以及兼容 gate 的 `compatibility.actualResult` 增加矛盾失败结果校验；增加普通 production gate 失败结果、兼容矩阵失败/占位结果的拒绝测试。 |
| 2 | Medium | Requirement | `GPT-5.5 C2` | validator 没有强制校验 M2-LEGACY-01/02 与被阻断生产门禁的映射。 | Accept | Sprint 5.4 明确要求校验“遗留映射”；Sprint 7 的证据分栏把真实 ESA/FC/RDS/OSS/DirectMail 门禁映射到 `M2-LEGACY-01`，把真实成本/预算门禁映射到 `M2-LEGACY-02`。当前 checked-in JSON 写对了映射，但删除或篡改 `legacyId` 仍可通过 schema。 | 建立固定 gate-to-legacy 映射；这些 gate 非 `PASS` 时必须提供精确 `legacyId`。增加缺失及错误映射测试；FR-08 的域名/备案、政策、企业微信和大陆浏览器 gate 继续作为独立阻塞项，不错误归入两项资源/成本遗留。 |
| 3 | Medium | Requirement | `GPT-5.5 C3` | 非 POST 方法依赖框架默认处理，无法保证方法边界响应均为 private no-store。 | Accept | Sprint 5.1 要求只接受 POST JSON、所有响应使用 `private, no-store`，测试还明确要求覆盖请求方法边界；`route.ts` 当前只导出 `POST`，现有测试未覆盖 GET/HEAD/PUT/PATCH/DELETE/OPTIONS 的状态、`Allow` 和 cache header。 | 增加共享 405 方法边界响应及显式 GET/HEAD/PUT/PATCH/DELETE/OPTIONS handlers，统一返回 `Allow: POST` 与 `Cache-Control: private, no-store, max-age=0`；增加 route 方法矩阵测试。 |
| 4 | Low | Correctness | `GPT-5.5 C4` | `startsWith("application/json")` 会错误接受 `application/jsonp`。 | Accept | `src/server/inquiry/service.ts` 当前使用前缀判断；Sprint 要求错误 Content-Type 在到达 DirectMail 前被拒绝。`application/jsonp` 不是 `application/json` media type。 | 只比较分号前、trim/lowercase 后的精确 media type `application/json`，保留合法 charset 参数；增加 `application/jsonp` 负向测试和带 charset 的正向测试。 |

## Needs Immediate Action

- 修复 production `PASS` 与 actual result/兼容矩阵结果矛盾时仍可通过的问题。
- 强制执行 M2-LEGACY-01/02 的指定门禁映射。
- 补齐非 POST route 方法边界与统一 no-store/Allow 响应。
- 收紧 JSON media type 判断并补齐测试。

## Can Be Deferred

- 无。四项均为已确认 M2-05 契约或验收测试缺口，应在本 Sprint 提交前完成。
- `M2-LEGACY-01`、`M2-LEGACY-02` 和其余 FR-08 真实外部门禁不属于本地代码修复；继续作为遗留阻塞 Production Live。

## Final Status

`APPLIED_AND_VERIFIED`。四项接受意见均已应用；专项测试、40 文件/178 测试全量测试、lint、build、standalone smoke、release validator、静态扫描和 `/contact` 浏览器 QA 均通过。最终状态为 `CODE_READY_WITH_EXTERNAL_LEGACY / Production BLOCKED`。
