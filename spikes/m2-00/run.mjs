import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { compileGateReport } from "./lib/gate-model.mjs";
import { runM200Gates } from "./lib/probes.mjs";
import { renderMarkdownReport } from "./lib/report.mjs";

const spikeRoot = dirname(fileURLToPath(import.meta.url));
const productRoot = resolve(spikeRoot, "../..");
const outputRoot = resolve(productRoot, "docs/5-Evidence/m2-00");

function configPathFromArgs(args) {
  const index = args.indexOf("--config");
  return index >= 0 && args[index + 1]
    ? resolve(productRoot, args[index + 1])
    : resolve(spikeRoot, "config.local.json");
}

async function loadConfig(path) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") {
      return {};
    }
    throw error;
  }
}

const generatedAt = new Date().toISOString();
const config = await loadConfig(configPathFromArgs(process.argv.slice(2)));
const gates = await runM200Gates(config, { now: () => generatedAt });
const report = compileGateReport(gates, generatedAt);

await mkdir(outputRoot, { recursive: true });
await Promise.all([
  writeFile(
    resolve(outputRoot, "gate-report.json"),
    `${JSON.stringify(report, null, 2)}\n`,
    "utf8",
  ),
  writeFile(
    resolve(outputRoot, "gate-report.md"),
    renderMarkdownReport(report),
    "utf8",
  ),
]);

console.log(`M2-00 overall status: ${report.overallStatus}`);
console.log(`Evidence: ${resolve(outputRoot, "gate-report.md")}`);

if (report.overallStatus !== "PASS") {
  process.exitCode = 2;
}
