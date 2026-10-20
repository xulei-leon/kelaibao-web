import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve, relative, isAbsolute } from "node:path";

export function evaluateStaticMigration(input, manifest, sourceDigest) {
  if (input.schemaVersion !== 1 || !Array.isArray(input.routes) || !Array.isArray(input.blockers) || typeof input.inventoryComplete !== "boolean") throw new Error("Invalid static migration evidence schema.");
  const blockers = [...input.blockers];
  if (input.sourceMode !== "verified-live-inventory" || !input.inventoryComplete) blockers.push("static_content_live_inventory_unverified");
  if (!input.reviewedBy?.trim() || !input.reviewedAt || !Number.isFinite(Date.parse(input.reviewedAt)) || !input.evidencePath?.trim()) blockers.push("static_content_review_evidence_missing");
  if (!manifest || manifest.sourceDigest !== sourceDigest || input.sourceDigest !== sourceDigest) blockers.push("static_content_build_or_evidence_stale");
  if (manifest && JSON.stringify([...input.routes].sort((a, b) => a.path.localeCompare(b.path, "en"))) !== JSON.stringify(manifest.routes)) blockers.push("static_content_url_mapping_incomplete");
  return { productionReady: blockers.length === 0, blockers: [...new Set(blockers)] };
}

export function validateStaticReleaseEvidence(root, evidencePath) {
  const input = JSON.parse(readFileSync(evidencePath, "utf8"));
  const sourceDigest = createHash("sha256").update(readFileSync(resolve(root, "src/content/articles.ts"))).digest("hex");
  let manifest;
  try { manifest = JSON.parse(readFileSync(resolve(root, ".next/static-content-manifest.json"), "utf8")); } catch { /* Remains blocked until built. */ }
  const result = evaluateStaticMigration(input, manifest, sourceDigest);
  if (result.productionReady) {
    const evidence = resolve(root, input.evidencePath);
    const fromRoot = relative(resolve(root), evidence);
    if (!fromRoot || fromRoot.startsWith("..") || isAbsolute(fromRoot)) throw new Error("Static migration evidence must stay inside the repository.");
    const document = readFileSync(evidence, "utf8");
    if (!document.trim() || /^(?:TODO|placeholder|fixture)$/i.test(document.trim())) throw new Error("Static migration review evidence is missing.");
  }
  return result;
}
