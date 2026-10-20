import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  evaluateRelease,
  validateReleaseGateInput,
} from "./lib/release-validator.mjs";
import { validateM3ReleaseEvidence } from "./lib/m3-release-evidence.mjs";

import { validateStaticReleaseEvidence } from "./lib/static-release-evidence.mjs";

function argumentValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const inputPath = resolve(
  process.cwd(),
  argumentValue("--input") ?? "docs/5-Evidence/m3-05/gate-input.json",
);
const requireProductionLive = process.argv.includes("--require-production-live");

try {
  const input = JSON.parse(await readFile(inputPath, "utf8"));
  validateReleaseGateInput(input);
  const m3Evidence =
    input.schemaVersion === 2
      ? validateM3ReleaseEvidence({ packageRoot: process.cwd(), input })
      : undefined;
  const result = evaluateRelease(input);
  const staticEvidence = validateStaticReleaseEvidence(process.cwd(), resolve(process.cwd(), argumentValue("--static-migration") ?? "docs/5-Evidence/m5-05/static-migration.json"));
  const sqliteLocalTest = process.env.DATABASE_ADAPTER === "sqlite";
  if (sqliteLocalTest && process.env.SINO_RUNTIME_MODE === "production") {
    throw new Error("SQLite is not allowed in production runtime.");
  }
  // The static migration gate supersedes the retired online CMS migration gate.
  // Infrastructure, claims and all other production evidence stay mandatory.
  const productionBlockers = [...new Set([
    ...result.productionBlockers.filter((id) => id !== "production_cms_brand_migration"),
    ...staticEvidence.blockers,
    ...(sqliteLocalTest ? ["m4_01_sqlite_local_test_active"] : []),
  ])];
  const productionReady = result.localReady && productionBlockers.length === 0;
  process.stdout.write(
    `${JSON.stringify(
      {
        status: !result.localReady ? "LOCAL_NOT_READY" : productionReady ? "PRODUCTION_LIVE_READY" : "CODE_READY_WITH_EXTERNAL_LEGACY",
        localReady: result.localReady,
        productionReady,
        localBlockers: result.localBlockers,
        productionBlockers,
        databaseEvidence: sqliteLocalTest
          ? "SQLITE_LOCAL_PASS_ONLY"
          : "STATIC_CONTENT_NO_RUNTIME_DATABASE",
        staticEvidence,
        ...(m3Evidence ? { m3Evidence } : {}),
      },
      null,
      2,
    )}\n`,
  );
  if (requireProductionLive && !productionReady) {
    process.exitCode = 1;
  }
} catch (error) {
  const message = error instanceof Error ? error.message : "unknown error";
  process.stderr.write(`Release gate validation failed: ${message}\n`);
  process.exitCode = 2;
}
