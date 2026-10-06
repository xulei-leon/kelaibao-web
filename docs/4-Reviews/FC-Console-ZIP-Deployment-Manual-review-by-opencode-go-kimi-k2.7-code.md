# FC-Console-ZIP-Deployment-Manual Review by opencode-go/kimi-k2.7-code

Review type: document review  
Reviewed commit: `9f41d2dbc3e83b5102d64a8c87416865503168ca`

Reviewed primary file:

- `docs/2-Design/FC-Console-ZIP-Deployment-Manual.md`

Reviewed consistency set (also changed in the commit):

- `README.md`
- `deploy/fc-runtime.example.json`
- `docs/2-Design/FC-Deployment-Runbook.md`

Verified against the following build/package/runtime contracts:

- `package.json`
- `next.config.ts`
- `.env.example`
- `scripts/build.mjs`
- `scripts/package-standalone.mjs`
- `scripts/smoke-standalone.mjs`
- `scripts/validate-release.mjs`
- `src/app/api/health/route.ts`
- `src/app/health/page.tsx`
- `src/server/config.ts`

Verification performed:

- Static inspection of the scripts and configuration files above.
- Ran `pnpm lint` -> passed.
- Ran `pnpm test` -> 400 passed, 3 skipped.
- Fetched current Function Compute documentation to confirm `custom.debian10` Node.js 20 path (`/var/fc/lang/nodejs20`) and the 500 MB ZIP size limit for the Shenzhen region.

## Findings

| Severity | Type | Location | Issue | Evidence | Recommendation |
| --- | --- | --- | --- | --- | --- |
| High | Risk | `package.json:6-7`; `README.md:41-43`; `docs/2-Design/FC-Console-ZIP-Deployment-Manual.md:47-49` | The manual requires Node.js 20.x for FC artifact builds, but `package.json` allows `>=20 <25`, and the README requires Node.js 22.13+ for local SQLite debugging. An operator building the FC ZIP with Node 22/24 can produce native binaries or an ABI that is incompatible with FC's Node 20 runtime, leading to `Exec format error` or module load failures in production. | `package.json` engines field: `node: >=20 <25`; README: `本地可使用 Node 22.13+ 内置 SQLite`; manual: `node --version 应为 v20.x`. | Pin the FC build toolchain explicitly. Add a `.nvmrc` / CI check that enforces Node 20.x when producing the FC ZIP, and add a bold warning in the manual that local Node 22/24 must not be used for the production artifact even though it is allowed for local SQLite development. |
| Medium | Security | `docs/2-Design/FC-Console-ZIP-Deployment-Manual.md:146-156` | The manual instructs exporting `NEXT_PUBLIC_*` values for the production build but does not warn about an existing `.env.local` file left over from local development. Next.js loads `.env.local` at build time; if an operator omits one of the exported variables, the local/preview value from `.env.local` can be embedded into the client bundle. | `.env.example` is gitignored and typically copied to `.env.local`; `next build` reads `.env` / `.env.local` unless the value is overridden by a shell variable. The manual only says `设置生产构建所需的公开变量` without telling the operator to remove or override local env files. | Add a pre-build step: delete or rename `.env.local` before the production build, or explicitly `unset` every `NEXT_PUBLIC_*` variable that should not come from `.env.local`, then re-export the production values. Verify with a post-build grep/canary that no preview secrets or `NEXT_PUBLIC_*` values leaked. |
| Medium | Correctness | `docs/2-Design/FC-Console-ZIP-Deployment-Manual.md:339` vs. `docs/2-Design/FC-Console-ZIP-Deployment-Manual.md:322-331` | `PUBLIC_CRAWL_STATUS` is listed as a required production runtime variable in section 7.1 but is omitted from the base FC environment variable block in section 7. Although the code currently defaults to non-`production-approved` (i.e. blocked), relying on implicit defaults in an operator-facing runbook is fragile. | Manual 7.1: `PUBLIC_CRAWL_STATUS；全部上线门禁通过前保持 blocked.` Manual 7 environment block lists PATH, NODE_ENV, HOSTNAME, PORT, TZ, SINO_RUNTIME_MODE, SINO_APP_VERSION, DATABASE_ADAPTER but not PUBLIC_CRAWL_STATUS. `src/server/discovery/config.ts:10-11` only sets `production-approved` when the env value exactly matches that string. | Add `PUBLIC_CRAWL_STATUS=blocked` explicitly to the section 7 environment block, with a note that it must only be changed to the approved production value after all indexing/release gates pass. |
| Low | Consistency | `docs/2-Design/FC-Console-ZIP-Deployment-Manual.md:448` | The ESA cache baseline lists `/llms.txt` as a public content path that should be cached for up to 60 seconds, but the application currently has no `/llms.txt` route in `src/app`. | `src/app` contains no `llms.txt` route; the only reference is in `src/server/content/purge.ts:58` as a URL to purge. | Either create the `/llms.txt` route before publishing this cache rule, or annotate the entry in the manual as experimental / planned and remove it from the production cache baseline until the route exists. |
| Low | Maintainability | `docs/2-Design/FC-Console-ZIP-Deployment-Manual.md:252` | The ZIP root-directory check uses `unzip -l out/kelaibao-fc.zip | head -n 40`. If the archive contains many files, `head` may truncate before the root-level entries (`server.js`, `package.json`, `.next/`, etc.) appear, giving a false impression of an incorrect structure. | The command only inspects the first 40 lines of `unzip -l` output; large `node_modules` can push root entries below that window. | Use a command that searches for the required root files, e.g. `unzip -l out/kelaibao-fc.zip | grep -E 'server.js|package.json|.next/|node_modules/|public/'`, or list with `zipinfo -1 out/kelaibao-fc.zip | sort | head -n 30`. |
| Info | Correctness | `deploy/fc-runtime.example.json:1-15`; `docs/2-Design/FC-Console-ZIP-Deployment-Manual.md:18-34,300-313,322-331` | The example runtime configuration is internally consistent with the manual and with current FC documentation. | `runtime` is `custom.debian10`, `nodePath` is `/var/fc/lang/nodejs20/bin`, `entrypoint` is `node server.js`, `handler` is `null`, `listenPort`/`PORT`/`HOSTNAME` are `9000`/`0.0.0.0`. Official FC docs confirm `custom.debian10` provides Node.js 20 at that path. | No change required; keep the example updated when FC runtime versions change. |
| Info | Correctness | `src/app/api/health/route.ts`; `scripts/smoke-standalone.mjs:77-92`; `docs/2-Design/FC-Console-ZIP-Deployment-Manual.md:382-391,416-420` | The health-check contract described in the manual matches the implementation and the local smoke test. | Route returns JSON `{status, runtimeMode, version, database, externalLegacy}` with `Cache-Control: private, no-store, max-age=0`; on config failure it returns 503. Smoke asserts the same. | No change required. |
| Info | Correctness | `scripts/build.mjs`; `scripts/package-standalone.mjs`; `docs/2-Design/FC-Console-ZIP-Deployment-Manual.md:162-178` | The build sequence in the manual matches the actual scripts: responsive assets -> `next build` -> standalone packaging (copy `.next/static` and `public`, assert no SQLite data). | `build.mjs` calls `build-responsive-assets.mjs`, `next build`, and `package-standalone.mjs`; `package-standalone.mjs` copies static/public and runs `assertNoSqliteData`. | No change required. |
| Info | Correctness | `docs/2-Design/FC-Console-ZIP-Deployment-Manual.md:257` | The stated 500 MB ZIP size limit for the Shenzhen region matches the current Function Compute quota documentation. | Official FC limits page lists 500 MB for console/CLI/OSS-specified ZIP packages in Shenzhen and several other regions. | No change required; add a note that limits should be re-checked if the region or upload method changes. |

## Consistency Checks Against the Commit's Other Files

- `README.md` was updated only to add a cross-reference to the new manual in the closing paragraph. No conflicting statements.
- `docs/2-Design/FC-Deployment-Runbook.md` was updated to point to the new manual for console step-by-step operations and to make the `PORT=9000`/`HOSTNAME=0.0.0.0` contract explicit. These changes align with `deploy/fc-runtime.example.json` and the manual.
- `deploy/fc-runtime.example.json` correctly captures `runtime`, `nodePath`, `entrypoint`, `handler`, `listenAddress`, `listenPort`, `portEnvironmentVariable`, and the base environment variables. It intentionally leaves `minimumInstances`, `maximumInstances`, and `concurrency` as `null` because the corresponding gates are `M2-LEGACY-01-DEFERRED`; the manual provides recommended initial values for these fields.

## Overall Assessment

The new `FC-Console-ZIP-Deployment-Manual.md` is directionally correct and well aligned with the project's standalone build scripts, the `custom.debian10`/Node.js 20 runtime, the RDS MySQL production architecture, and the deferred `M2-LEGACY-*` gates. The main risks are toolchain-version drift between the manual, `package.json`, and the README, and two operator-facing gaps (`.env.local` hygiene and the missing `PUBLIC_CRAWL_STATUS` entry in the base FC env block). These should be addressed before the manual is treated as frozen. Minor wording and verification improvements can be fixed in a follow-up pass.
