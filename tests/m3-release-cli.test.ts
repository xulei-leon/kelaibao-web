import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";

function runReleaseWithEnv(env: Partial<NodeJS.ProcessEnv>, ...args: string[]) {
  return spawnSync(
    process.execPath,
    [resolve(process.cwd(), "scripts/validate-release.mjs"), ...args],
    { cwd: process.cwd(), encoding: "utf8", env: { ...process.env, ...env } },
  );
}

function runRelease(...args: string[]) {
  return runReleaseWithEnv({}, ...args);
}

describe("M3-05 release validation CLI", () => {
  it("uses the M3 evidence input by default and exits zero for Local readiness", () => {
    const result = runRelease();

    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({
      status: "CODE_READY_WITH_EXTERNAL_LEGACY",
      localReady: true,
      productionReady: false,
      m3Evidence: {
        publicBrandFindingCount: 0,
        claimsCount: 22,
        inventoryProductionGate: "BLOCKED",
      },
    });
  });

  it("exits one when Production-live readiness is required", () => {
    const result = runRelease("--require-production-live");

    expect(result.status).toBe(1);
    expect(JSON.parse(result.stdout)).toMatchObject({
      localReady: true,
      productionReady: false,
    });
  });

  it("preserves schema v1 input compatibility", () => {
    const result = runRelease(
      "--input",
      "docs/5-Evidence/m2-05/gate-input.json",
    );

    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({
      status: "CODE_READY_WITH_EXTERNAL_LEGACY",
      localReady: true,
      productionReady: false,
    });
  });

  it("exits two for an invalid input schema", () => {
    const directory = mkdtempSync(join(tmpdir(), "kelaibao-m3-release-"));
    const inputPath = join(directory, "invalid.json");
    writeFileSync(inputPath, JSON.stringify({ schemaVersion: 99 }), "utf8");

    const result = runRelease("--input", inputPath);

    expect(result.status).toBe(2);
    expect(result.stderr).toMatch(/schemaVersion must be 1 or 2/i);
  });

  it("keeps SQLite evidence local and rejects it for Production-live validation", () => {
    const result = runReleaseWithEnv(
      {
        DATABASE_ADAPTER: "sqlite",
        DATABASE_RUNTIME_SCOPE: "local-test",
        SINO_RUNTIME_MODE: "preview",
      },
      "--require-production-live",
    );

    expect(result.status).toBe(1);
    expect(JSON.parse(result.stdout)).toMatchObject({
      localReady: true,
      productionReady: false,
      databaseEvidence: "SQLITE_LOCAL_PASS_ONLY",
      productionBlockers: expect.arrayContaining([
        "m4_01_sqlite_local_test_active",
      ]),
    });
  });

  it("treats Production plus SQLite as a configuration error", () => {
    const result = runReleaseWithEnv({
      DATABASE_ADAPTER: "sqlite",
      DATABASE_RUNTIME_SCOPE: "local-test",
      SINO_RUNTIME_MODE: "production",
    });

    expect(result.status).toBe(2);
    expect(result.stderr).toMatch(/SQLite is not allowed in production/i);
  });
});
