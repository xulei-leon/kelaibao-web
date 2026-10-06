import { readFileSync } from "node:fs";
import { relative, resolve } from "node:path";

import { validateClaimsRegister } from "./claims-validator.mjs";
import { evaluateContentInventory } from "./content-inventory-validator.mjs";
import { scanPublicBrandSurfaces } from "./public-brand-scanner.mjs";
import { validateReleaseGateInput } from "./release-validator.mjs";

function resolveEvidencePath(packageRoot, repositoryPath, context) {
  const root = resolve(packageRoot);
  const target = resolve(root, repositoryPath);
  const pathFromRoot = relative(root, target);
  if (
    pathFromRoot === "" ||
    pathFromRoot === ".." ||
    pathFromRoot.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`)
  ) {
    throw new Error(`${context} must resolve inside the package root.`);
  }
  return target;
}

function readJson(path, context) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    const detail = error instanceof Error ? error.message : "unknown error";
    throw new Error(`${context} could not be read as JSON: ${detail}`);
  }
}

function productionGate(input, id) {
  const gate = input.productionGates.find((candidate) => candidate.id === id);
  if (!gate) {
    throw new Error(`productionGates is missing required gate ${id}.`);
  }
  return gate;
}

export function validateM3ReleaseEvidence({ packageRoot, input, now = new Date() }) {
  validateReleaseGateInput(input);
  if (input.schemaVersion !== 2) {
    throw new Error("M3 release evidence validation requires schemaVersion 2.");
  }
  if (typeof packageRoot !== "string" || !packageRoot.trim()) {
    throw new Error("packageRoot must be a non-empty path.");
  }

  const claimsPath = resolveEvidencePath(
    packageRoot,
    input.m3Evidence.claimsRegisterPath,
    "m3Evidence.claimsRegisterPath",
  );
  const inventoryPath = resolveEvidencePath(
    packageRoot,
    input.m3Evidence.contentInventoryPath,
    "m3Evidence.contentInventoryPath",
  );
  const claimsRegister = readJson(claimsPath, "claims register");
  const contentInventory = readJson(inventoryPath, "content inventory");
  const brandScan = scanPublicBrandSurfaces(resolve(packageRoot));

  if (brandScan.findings.length > 0) {
    const first = brandScan.findings[0];
    throw new Error(
      `Public brand scan found ${first.kind} in ${first.path}: ${first.match}.`,
    );
  }

  validateClaimsRegister(claimsRegister, {
    now,
    publicOutputs: brandScan.outputs,
  });
  const inventoryResult = evaluateContentInventory(contentInventory);

  const claimsGate = productionGate(input, "production_claims_authorization");
  const expectedClaimsGate = claimsRegister.claims.some(
    (claim) => claim.disposition === "accepted-blocked",
  )
    ? "BLOCKED"
    : "PASS";
  if (claimsGate.status !== expectedClaimsGate) {
    throw new Error(
      `production_claims_authorization must be ${expectedClaimsGate} for the supplied claims register.`,
    );
  }

  const cmsGate = productionGate(input, "production_cms_brand_migration");
  if (cmsGate.status !== inventoryResult.productionCmsGate) {
    throw new Error(
      `production_cms_brand_migration must be ${inventoryResult.productionCmsGate} for the supplied content inventory.`,
    );
  }

  return {
    publicBrandFileCount: brandScan.outputs.length,
    publicBrandFindingCount: brandScan.findings.length,
    claimsCount: claimsRegister.claims.length,
    claimsGate: claimsGate.status,
    inventoryItemCount: contentInventory.items.length,
    inventorySourceMode: contentInventory.sourceMode,
    inventoryProductionGate: inventoryResult.productionCmsGate,
    inventoryBlockers: inventoryResult.blockers,
  };
}
