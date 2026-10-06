import assert from "node:assert/strict";
import test from "node:test";

import {
  compileGateReport,
  evaluateCostGate,
  normalizeGateEvidence,
  redactSensitiveText,
} from "../lib/gate-model.mjs";

const completeEvidence = (id) => ({
  id,
  title: `Gate ${id}`,
  verifiedAt: "2026-07-29T00:00:00.000Z",
  isolatedResource: "redacted-cn-shenzhen-resource",
  execution: "HTTPS probe",
  expected: "expected result",
  actual: "actual result",
  evidencePath: `docs/5-Evidence/m2-00/gate-${id}.md`,
  sensitiveDataCheck: "No credentials, cookies, or PII recorded.",
  status: "PASS",
  nextAction: "None.",
});

test("normalizeGateEvidence blocks an incomplete PASS record", () => {
  const evidence = completeEvidence("G1");
  evidence.evidencePath = "";

  const normalized = normalizeGateEvidence(evidence);

  assert.equal(normalized.status, "BLOCKED");
  assert.match(normalized.nextAction, /evidencePath/);
});

test("evaluateCostGate blocks when a budget hard limit is absent", () => {
  const result = evaluateCostGate({
    currency: "CNY",
    trafficAssumptions: "10k visits/month",
    quoteCapturedAt: "2026-07-29T00:00:00.000Z",
    quoteSource: "Alibaba Cloud calculator",
    estimatedMonthlyTotal: 500,
  });

  assert.equal(result.status, "BLOCKED");
  assert.match(result.actual, /monthlyHardLimit/);
});

test("evaluateCostGate passes only when the quote is within the hard limit", () => {
  const result = evaluateCostGate({
    currency: "CNY",
    trafficAssumptions: "10k visits/month",
    quoteCapturedAt: "2026-07-29T00:00:00.000Z",
    quoteSource: "Alibaba Cloud calculator",
    monthlyHardLimit: 800,
    estimatedMonthlyTotal: 500,
  });

  assert.equal(result.status, "PASS");
});

test("compileGateReport requires all eight canonical gates", () => {
  const gates = Array.from({ length: 7 }, (_, index) =>
    completeEvidence(`G${index + 1}`),
  );

  const report = compileGateReport(gates);

  assert.equal(report.overallStatus, "BLOCKED");
  assert.deepEqual(report.missingGateIds, ["G8"]);
});

test("compileGateReport is blocked when any gate is blocked", () => {
  const gates = Array.from({ length: 8 }, (_, index) =>
    completeEvidence(`G${index + 1}`),
  );
  gates[2].status = "BLOCKED";

  const report = compileGateReport(gates);

  assert.equal(report.overallStatus, "BLOCKED");
  assert.deepEqual(report.blockedGateIds, ["G3"]);
});

test("redactSensitiveText removes common credentials, cookies, email, and phone values", () => {
  const input =
    "AccessKeyId=LTAI1234567890abcdef Cookie=session=secret user@example.com 13800138000";

  const output = redactSensitiveText(input);

  assert.doesNotMatch(output, /LTAI1234567890abcdef/);
  assert.doesNotMatch(output, /session=secret/);
  assert.doesNotMatch(output, /user@example\.com/);
  assert.doesNotMatch(output, /13800138000/);
});
