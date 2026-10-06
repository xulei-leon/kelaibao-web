const CANONICAL_GATE_IDS = Object.freeze([
  "G1",
  "G2",
  "G3",
  "G4",
  "G5",
  "G6",
  "G7",
  "G8",
]);

const REQUIRED_EVIDENCE_FIELDS = Object.freeze([
  "title",
  "verifiedAt",
  "isolatedResource",
  "execution",
  "expected",
  "actual",
  "evidencePath",
  "sensitiveDataCheck",
  "nextAction",
]);

export function redactSensitiveText(value) {
  return String(value ?? "")
    .replace(/\bLTAI[A-Za-z0-9]{12,}\b/g, "[REDACTED_ACCESS_KEY]")
    .replace(
      /\b(AccessKeySecret|Authorization|Cookie|Set-Cookie)\s*[:=]\s*[^\s,;]+/gi,
      "$1=[REDACTED]",
    )
    .replace(
      /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
      "[REDACTED_EMAIL]",
    )
    .replace(/\b1[3-9]\d{9}\b/g, "[REDACTED_PHONE]");
}

function clean(value) {
  return redactSensitiveText(value).trim();
}

export function normalizeGateEvidence(input) {
  const normalized = {
    id: clean(input?.id),
    title: clean(input?.title),
    verifiedAt: clean(input?.verifiedAt),
    isolatedResource: clean(input?.isolatedResource),
    execution: clean(input?.execution),
    expected: clean(input?.expected),
    actual: clean(input?.actual),
    evidencePath: clean(input?.evidencePath),
    sensitiveDataCheck: clean(input?.sensitiveDataCheck),
    status: input?.status === "PASS" ? "PASS" : "BLOCKED",
    nextAction: clean(input?.nextAction),
  };

  const missingFields = REQUIRED_EVIDENCE_FIELDS.filter(
    (field) => !normalized[field],
  );

  if (missingFields.length > 0) {
    normalized.status = "BLOCKED";
    normalized.nextAction = clean(
      `Complete missing evidence fields: ${missingFields.join(", ")}.`,
    );
  }

  if (!CANONICAL_GATE_IDS.includes(normalized.id)) {
    normalized.status = "BLOCKED";
    normalized.nextAction = clean(
      `Use one canonical gate id: ${CANONICAL_GATE_IDS.join(", ")}.`,
    );
  }

  return normalized;
}

export function evaluateCostGate(cost = {}) {
  const required = [
    "currency",
    "trafficAssumptions",
    "quoteCapturedAt",
    "quoteSource",
    "monthlyHardLimit",
    "estimatedMonthlyTotal",
  ];
  const missing = required.filter(
    (field) =>
      cost[field] === undefined ||
      cost[field] === null ||
      String(cost[field]).trim() === "",
  );

  if (missing.length > 0) {
    return {
      status: "BLOCKED",
      expected:
        "A versioned quote and estimated monthly total at or below the budget hard limit.",
      actual: `Missing cost inputs: ${missing.join(", ")}.`,
      nextAction:
        "Provide a real quote, traffic assumptions, and a budget hard limit without inventing values.",
    };
  }

  const limit = Number(cost.monthlyHardLimit);
  const total = Number(cost.estimatedMonthlyTotal);
  if (!Number.isFinite(limit) || limit < 0 || !Number.isFinite(total) || total < 0) {
    return {
      status: "BLOCKED",
      expected: "Finite, non-negative cost values.",
      actual: "monthlyHardLimit or estimatedMonthlyTotal is invalid.",
      nextAction: "Correct the versioned cost inputs and rerun the gate.",
    };
  }

  const withinLimit = total <= limit;
  return {
    status: withinLimit ? "PASS" : "BLOCKED",
    expected: `Estimated monthly total must be <= ${limit} ${clean(cost.currency)}.`,
    actual: `Estimated monthly total is ${total} ${clean(cost.currency)}.`,
    nextAction: withinLimit
      ? "None."
      : "Reduce the proposed resource cost or explicitly version a different budget decision.",
  };
}

export function compileGateReport(gateInputs, generatedAt = new Date().toISOString()) {
  const byId = new Map();
  for (const input of gateInputs ?? []) {
    const normalized = normalizeGateEvidence(input);
    if (CANONICAL_GATE_IDS.includes(normalized.id) && !byId.has(normalized.id)) {
      byId.set(normalized.id, normalized);
    }
  }

  const missingGateIds = CANONICAL_GATE_IDS.filter((id) => !byId.has(id));
  const gates = CANONICAL_GATE_IDS.filter((id) => byId.has(id)).map((id) =>
    byId.get(id),
  );
  const blockedGateIds = gates
    .filter((gate) => gate.status === "BLOCKED")
    .map((gate) => gate.id);

  return {
    schemaVersion: 1,
    generatedAt,
    overallStatus:
      missingGateIds.length === 0 && blockedGateIds.length === 0
        ? "PASS"
        : "BLOCKED",
    missingGateIds,
    blockedGateIds,
    gates,
  };
}

export { CANONICAL_GATE_IDS };
