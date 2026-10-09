import {
  LOCAL_CHECK_IDS,
  PRODUCTION_GATE_IDS,
  evaluateRelease,
  validateReleaseGateInput,
} from "../scripts/lib/release-validator.mjs";
import { describe, expect, it } from "vitest";

function evidence(overrides: Record<string, unknown> = {}) {
  return {
    date: "2026-07-30",
    commandOrRequest: "pnpm test",
    expectedResult: "contract passes",
    actualResult: "contract passed",
    evidencePath: "tests/m2-release-validator.test.ts",
    sensitiveDataCheck: "no secrets or PII recorded",
    ...overrides,
  };
}

function gateInput(): any {
  return {
    schemaVersion: 1,
    generatedAt: "2026-07-30T00:00:00+08:00",
    localChecks: LOCAL_CHECK_IDS.map((id: string) => ({
      id,
      status: "LOCAL_PASS",
      evidence: evidence(),
    })),
    productionGates: PRODUCTION_GATE_IDS.map((id: string) => ({
      id,
      status: "BLOCKED",
      mandatory: true,
      legacyId:
        id === "production_cost_budget"
          ? "M2-LEGACY-02"
          : id.startsWith("production_") ||
              id.startsWith("esa_") ||
              id.startsWith("fc_") ||
              id.startsWith("rds_") ||
              id.startsWith("oss_") ||
              id.startsWith("directmail_")
            ? "M2-LEGACY-01"
            : undefined,
      region: "cn-shenzhen (planned)",
      resourceRef: "not-provided",
      reason: "Required real production evidence has not been provided.",
      evidence: evidence({
        commandOrRequest: "not run: missing isolated production input",
        expectedResult: "real production gate passes",
        actualResult: "BLOCKED: no real production evidence",
        evidencePath: "docs/3-Plan/sprint-m2-05.md",
      }),
      ...(id === "fc_previous_app_new_schema_compatibility"
        ? {
            compatibility: {
              previousAppVersion: "not-provided",
              migrationVersion: "003",
              schemaState: "not-probed",
              commandOrProbe: "not run: missing FC/RDS inputs",
              expectedResult: "previous app works with migrated schema",
              actualResult: "BLOCKED",
              evidencePath: "FC部署指南.md",
            },
          }
        : {}),
    })),
  };
}

describe("M2-05 release validator", () => {
  it("keeps local PASS separate from blocked production evidence", () => {
    const input = gateInput();
    expect(validateReleaseGateInput(input)).toBe(input);
    expect(evaluateRelease(input)).toMatchObject({
      localReady: true,
      productionReady: false,
      status: "CODE_READY_WITH_EXTERNAL_LEGACY",
    });
  });

  it("rejects missing, duplicate, and unknown gates", () => {
    const missing = gateInput();
    missing.productionGates = missing.productionGates.filter(
      (gate: { id: string }) =>
        gate.id !== "fc_previous_app_new_schema_compatibility",
    );
    expect(() => validateReleaseGateInput(missing)).toThrow(
      /fc_previous_app_new_schema_compatibility/,
    );

    const duplicate = gateInput();
    duplicate.localChecks.push({ ...duplicate.localChecks[0] });
    expect(() => validateReleaseGateInput(duplicate)).toThrow(/duplicate/i);

    const unknown = gateInput();
    unknown.productionGates[0] = {
      ...unknown.productionGates[0],
      id: "unknown_gate",
    };
    expect(() => validateReleaseGateInput(unknown)).toThrow(/unknown_gate/i);
  });

  it("rejects cross-layer statuses and unexplained N/A", () => {
    const localPassAsProduction = gateInput();
    localPassAsProduction.productionGates[0].status = "LOCAL_PASS";
    expect(() => validateReleaseGateInput(localPassAsProduction)).toThrow(
      /production status/i,
    );

    const productionPassAsLocal = gateInput();
    productionPassAsLocal.localChecks[0].status = "PASS";
    expect(() => validateReleaseGateInput(productionPassAsLocal)).toThrow(
      /local status/i,
    );

    const unexplained = gateInput();
    unexplained.productionGates[0].status = "N/A";
    delete unexplained.productionGates[0].reason;
    expect(() => validateReleaseGateInput(unexplained)).toThrow(/reason/i);
  });

  it("rejects placeholder production PASS and missing compatibility details", () => {
    const placeholder = gateInput();
    placeholder.productionGates[0] = {
      ...placeholder.productionGates[0],
      status: "PASS",
      reason: undefined,
      resourceRef: "example-resource",
      evidence: evidence({
        evidencePath: "fixtures/mock-evidence.json",
      }),
    };
    expect(() => validateReleaseGateInput(placeholder)).toThrow(
      /placeholder|fake|mock|example/i,
    );

    const compatibility = gateInput();
    const matrix = compatibility.productionGates.find(
      (gate: { id: string }) =>
        gate.id === "fc_previous_app_new_schema_compatibility",
    );
    matrix.status = "PASS";
    matrix.resourceRef = "fc-service-redacted";
    matrix.evidence = evidence({
      evidencePath: "external-evidence/fc-compatibility-2026-07-30.md",
    });
    delete matrix.reason;
    delete matrix.compatibility;
    expect(() => validateReleaseGateInput(compatibility)).toThrow(
      /compatibility/i,
    );
  });

  it("rejects production PASS when evidence or compatibility actual results failed", () => {
    const failedEvidence = gateInput();
    failedEvidence.productionGates[0] = {
      ...failedEvidence.productionGates[0],
      status: "PASS",
      reason: undefined,
      region: "cn-shenzhen",
      resourceRef: "directmail-account-redacted",
      evidence: evidence({
        commandOrRequest: "HTTPS DirectMail production probe",
        expectedResult: "controlled notification is delivered",
        actualResult: "FAIL: notification was not delivered",
        evidencePath: "external-evidence/directmail-live-send.md",
      }),
    };
    expect(() => validateReleaseGateInput(failedEvidence)).toThrow(
      /actualResult.*contradicts PASS/i,
    );

    const failedCompatibility = gateInput();
    const compatibilityGate = failedCompatibility.productionGates.find(
      (gate: { id: string }) =>
        gate.id === "fc_previous_app_new_schema_compatibility",
    );
    compatibilityGate.status = "PASS";
    compatibilityGate.reason = undefined;
    compatibilityGate.region = "cn-shenzhen";
    compatibilityGate.resourceRef = "fc-service-redacted";
    compatibilityGate.evidence = evidence({
      commandOrRequest: "HTTPS previous-version compatibility probe",
      expectedResult: "previous application works with migrated schema",
      actualResult: "production compatibility probe passed",
      evidencePath: "external-evidence/fc-compatibility.md",
    });
    compatibilityGate.compatibility = {
      previousAppVersion: "a9a387e",
      migrationVersion: "003",
      schemaState: "003 applied",
      commandOrProbe: "previous FC artifact route and query smoke",
      expectedResult: "previous app works with migrated schema",
      actualResult: "INCOMPATIBLE: previous application query failed",
      evidencePath: "external-evidence/fc-schema-compatibility.md",
    };
    expect(() => validateReleaseGateInput(failedCompatibility)).toThrow(
      /compatibility\.actualResult.*contradicts PASS/i,
    );
  });

  it("requires exact legacy mappings for blocked resource and cost gates", () => {
    const missingLegacy = gateInput();
    const directMailGate = missingLegacy.productionGates.find(
      (gate: { id: string }) => gate.id === "directmail_live_send",
    );
    delete directMailGate.legacyId;
    expect(() => validateReleaseGateInput(missingLegacy)).toThrow(
      /directmail_live_send.*M2-LEGACY-01/i,
    );

    const wrongLegacy = gateInput();
    const costGate = wrongLegacy.productionGates.find(
      (gate: { id: string }) => gate.id === "production_cost_budget",
    );
    costGate.legacyId = "M2-LEGACY-01";
    expect(() => validateReleaseGateInput(wrongLegacy)).toThrow(
      /production_cost_budget.*M2-LEGACY-02/i,
    );
  });

  it("requires local checks to pass before code-ready status", () => {
    const input = gateInput();
    input.localChecks[0].status = "NOT_RUN";
    expect(evaluateRelease(input)).toMatchObject({
      localReady: false,
      productionReady: false,
      status: "LOCAL_NOT_READY",
    });
  });

  it("allows production readiness only when every real gate passes", () => {
    const input = gateInput();
    for (const gate of input.productionGates) {
      gate.status = "PASS";
      gate.resourceRef = `${gate.id}-redacted-resource`;
      gate.region = "cn-shenzhen";
      gate.evidence = evidence({
        commandOrRequest: `HTTPS probe for ${gate.id}`,
        expectedResult: "production gate passes",
        actualResult: "production gate passed",
        evidencePath: `external-evidence/${gate.id}-2026-07-30.md`,
      });
      delete gate.reason;
      if (gate.compatibility) {
        gate.compatibility = {
          previousAppVersion: "a9a387e",
          migrationVersion: "003",
          schemaState: "003 applied",
          commandOrProbe: "previous FC artifact route and query smoke",
          expectedResult: "previous app works with migrated schema",
          actualResult: "PASS",
          evidencePath:
            "external-evidence/fc-schema-compatibility-2026-07-30.md",
        };
      }
    }

    expect(validateReleaseGateInput(input)).toBe(input);
    expect(evaluateRelease(input)).toMatchObject({
      localReady: true,
      productionReady: true,
      status: "PRODUCTION_LIVE_READY",
    });
  });

  it("registers the formal mini-program asset as a mandatory production gate", () => {
    expect(PRODUCTION_GATE_IDS).toContain("production_mini_program");

    const input = gateInput();
    const result = evaluateRelease(input);
    expect(result.productionReady).toBe(false);
    expect(result.productionBlockers).toContain("production_mini_program");
  });

  it("rejects a production mini-program PASS backed by the preview placeholder", () => {
    const input = gateInput();
    const miniProgramGate = input.productionGates.find(
      (gate: { id: string }) => gate.id === "production_mini_program",
    );

    expect(miniProgramGate).toBeDefined();
    Object.assign(miniProgramGate, {
      status: "PASS",
      reason: undefined,
      region: "cn-shenzhen",
      resourceRef: "/wechat/k-link-mini-program-qr-placeholder.svg",
      evidence: evidence({
        commandOrRequest: "local preview QR render",
        expectedResult: "formal K-Link mini-program QR is verified",
        actualResult: "preview placeholder rendered",
        evidencePath: "public/wechat/k-link-mini-program-qr-placeholder.svg",
      }),
    });

    expect(() => validateReleaseGateInput(input)).toThrow(
      /placeholder|preview|production-mini-program/i,
    );
  });
});
