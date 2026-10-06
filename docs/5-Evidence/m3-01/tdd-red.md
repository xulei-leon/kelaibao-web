# M3-01 TDD Red Evidence

## Context

- Date: 2026-07-31 (Asia/Shanghai)
- Pre-migration project path: `products/sino-cn/`
- Baseline command: `pnpm test`
- Baseline result before contract changes: `PASS` — 40 test files, 178 tests.

## Red Command

```powershell
pnpm test -- tests/project-contract.test.ts tests/site-content.test.ts tests/routes-and-metadata.test.ts
```

## Expected Failure Contract

The old project must fail only because it still exposes the old package/path/brand foundation:

1. `package.json` is not yet named `kelaibao-website` and the working directory is not yet `products/kelaibao/`.
2. `BRAND` does not yet define `客来宝`, `K-Link`, and `客来宝媒体`.
3. Open Graph metadata still uses the old public brand.

## Observed Result

`FAIL` as expected: 3 test files failed, 3 assertions failed, and 8 assertions passed.

| Test | Expected | Observed failure |
| --- | --- | --- |
| `tests/project-contract.test.ts` | package `kelaibao-website` | received `saino-quanwang-mainland-website` |
| `tests/site-content.test.ts` | `BRAND.name=客来宝`, `productName=K-Link`, `mediaName=客来宝媒体` | received old `赛诺全网` brand object without the two new fields |
| `tests/routes-and-metadata.test.ts` | 客来宝 Open Graph alt and site name | received old `赛诺全网` Open Graph alt |

The failures are contract failures from the old package/brand baseline. There were no test-environment, transform, import, or dependency failures.
