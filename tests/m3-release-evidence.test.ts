import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

// @ts-expect-error -- the independent Node validator intentionally ships as an .mjs runtime contract.
import { validateM3ReleaseEvidence } from "../scripts/lib/m3-release-evidence.mjs";

function loadInput() {
  return JSON.parse(
    readFileSync(
      resolve(process.cwd(), "docs/5-Evidence/m3-05/gate-input.json"),
      "utf8",
    ),
  );
}

describe("M3-05 executable release evidence", () => {
  it("validates brand, claims, and fixture inventory without promoting Production", () => {
    const result = validateM3ReleaseEvidence({
      packageRoot: process.cwd(),
      input: loadInput(),
      now: new Date("2026-09-15T00:30:00+08:00"),
    });

    expect(result).toMatchObject({
      publicBrandFindingCount: 0,
      claimsCount: 26,
      claimsGate: "BLOCKED",
      inventorySourceMode: "fixture",
      inventoryProductionGate: "BLOCKED",
    });
  });

  it("rejects a claims gate that contradicts validated claims evidence", () => {
    const input = loadInput();
    const gate = input.productionGates.find(
      (gate: { id: string }) =>
        gate.id === "production_claims_authorization",
    );
    gate.status = "PASS";
    delete gate.reason;
    gate.region = "repository";
    gate.resourceRef = "claims-register-reviewed";
    gate.evidence.expectedResult = "all claims have current objective evidence and authorization";
    gate.evidence.actualResult = "claims evidence authorized";

    expect(() =>
      validateM3ReleaseEvidence({ packageRoot: process.cwd(), input }),
    ).toThrow(/production_claims_authorization.*BLOCKED/i);
  });

  it("rejects a CMS gate that contradicts the fixture inventory result", () => {
    const input = loadInput();
    const gate = input.productionGates.find(
      (candidate: { id: string }) =>
        candidate.id === "production_cms_brand_migration",
    );
    gate.status = "PASS";
    delete gate.reason;
    gate.region = "repository";
    gate.resourceRef = "cms-inventory-live";
    gate.evidence.actualResult = "complete live CMS inventory passed";

    expect(() =>
      validateM3ReleaseEvidence({ packageRoot: process.cwd(), input }),
    ).toThrow(/production_cms_brand_migration.*BLOCKED/i);
  });
});
