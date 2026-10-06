import {
  LOCAL_CHECK_IDS,
  M3_LOCAL_CHECK_IDS,
  M3_PRODUCTION_GATE_IDS,
  PRODUCTION_GATE_IDS,
  evaluateRelease,
  validateReleaseGateInput,
} from "../scripts/lib/release-validator.mjs";
import { describe, expect, it } from "vitest";

function evidence(actualResult = "contract passed") {
  return {
    date: "2026-08-01",
    commandOrRequest: "pnpm test",
    expectedResult: "contract passes",
    actualResult,
    evidencePath: "tests/m3-release-validator.test.ts",
    sensitiveDataCheck: "no secrets or PII recorded",
  };
}

function productionGate(id: string) {
  const claimsPass = id === "production_claims_authorization";
  return {
    id,
    status: claimsPass ? "PASS" : "BLOCKED",
    mandatory: true,
    ...(PRODUCTION_GATE_IDS.includes(id)
      ? {
          legacyId:
            id === "production_cost_budget"
              ? "M2-LEGACY-02"
              : id === "production_domain_icp" ||
                  id ===
                    "production_policies_professional_review_authorization" ||
                  id === "production_wecom" ||
                  id === "production_mini_program" ||
                  id === "production_mainland_wechat_browser"
                ? undefined
                : "M2-LEGACY-01",
        }
      : {}),
    region: claimsPass ? "repository" : "cn-shenzhen (planned)",
    resourceRef: claimsPass
      ? "claims-register-2026-08-01"
      : "not-provided",
    ...(claimsPass
      ? {}
      : {
          reason: "Required real production evidence has not been provided.",
        }),
    evidence: claimsPass
      ? evidence("all claims are approved or weakened and absent from public output")
      : evidence("BLOCKED: no real production evidence"),
    ...(id === "fc_previous_app_new_schema_compatibility"
      ? {
          compatibility: {
            previousAppVersion: "not-provided",
            migrationVersion: "003",
            schemaState: "not-probed",
            commandOrProbe: "not run: missing FC/RDS inputs",
            expectedResult: "previous app works with migrated schema",
            actualResult: "BLOCKED",
            evidencePath: "docs/2-Design/FC-Deployment-Runbook.md",
          },
        }
      : {}),
  };
}

function m3Input(): any {
  return {
    schemaVersion: 2,
    generatedAt: "2026-08-01T00:00:00+08:00",
    m3Evidence: {
      claimsRegisterPath: "docs/5-Evidence/m3-05/claims-register.json",
      contentInventoryPath:
        "docs/5-Evidence/m3-05/content-inventory.fixture.json",
    },
    inheritedProductionGateIds: [...PRODUCTION_GATE_IDS],
    localChecks: M3_LOCAL_CHECK_IDS.map((id: string) => ({
      id,
      status: "LOCAL_PASS",
      evidence: evidence(),
    })),
    productionGates: M3_PRODUCTION_GATE_IDS.map(productionGate),
  };
}

describe("M3-05 release validator", () => {
  it("keeps every inherited production gate and adds the CMS and claims gates", () => {
    expect(M3_LOCAL_CHECK_IDS).toEqual([
      ...LOCAL_CHECK_IDS,
      "m3_brand_release_contract",
      "m3_claims_contract",
      "m3_cms_inventory_contract",
    ]);
    expect(M3_PRODUCTION_GATE_IDS).toEqual([
      ...PRODUCTION_GATE_IDS,
      "production_cms_brand_migration",
      "production_claims_authorization",
    ]);

    const input = m3Input();
    expect(validateReleaseGateInput(input)).toBe(input);
    expect(evaluateRelease(input)).toMatchObject({
      localReady: true,
      productionReady: false,
      status: "CODE_READY_WITH_EXTERNAL_LEGACY",
      productionBlockers: expect.arrayContaining([
        ...PRODUCTION_GATE_IDS,
        "production_cms_brand_migration",
      ]),
    });
  });

  it("rejects an omitted inherited production gate", () => {
    const input = m3Input();
    input.productionGates = input.productionGates.filter(
      (gate: { id: string }) => gate.id !== "esa_cache_purge",
    );
    expect(() => validateReleaseGateInput(input)).toThrow(/esa_cache_purge/);
  });

  it("rejects a falsified inherited gate continuity declaration", () => {
    const missing = m3Input();
    missing.inheritedProductionGateIds = missing.inheritedProductionGateIds.filter(
      (id: string) => id !== "rds_backup_restore",
    );
    expect(() => validateReleaseGateInput(missing)).toThrow(
      /inheritedProductionGateIds.*rds_backup_restore/i,
    );

    const reordered = m3Input();
    reordered.inheritedProductionGateIds.reverse();
    expect(() => validateReleaseGateInput(reordered)).toThrow(
      /inheritedProductionGateIds/i,
    );
  });

  it("keeps the CMS gate blocked for fixture-only inventory", () => {
    const input = m3Input();
    const cmsGate = input.productionGates.find(
      (gate: { id: string }) =>
        gate.id === "production_cms_brand_migration",
    );
    expect(cmsGate).toBeDefined();

    const result = evaluateRelease(input);
    expect(result.productionBlockers).toContain(
      "production_cms_brand_migration",
    );
  });

  it("requires exact M3 evidence paths for schema version 2", () => {
    const missing = m3Input();
    delete missing.m3Evidence.claimsRegisterPath;
    expect(() => validateReleaseGateInput(missing)).toThrow(
      /m3Evidence\.claimsRegisterPath/i,
    );

    const absolute = m3Input();
    absolute.m3Evidence.contentInventoryPath =
      "D:/secrets/content-inventory.json";
    expect(() => validateReleaseGateInput(absolute)).toThrow(
      /relative repository path/i,
    );
  });
});
