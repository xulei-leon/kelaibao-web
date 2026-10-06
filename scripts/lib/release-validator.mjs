export const LOCAL_CHECK_IDS = Object.freeze([
  "inquiry_route_contract",
  "directmail_fake_contract",
  "pii_canary_scan",
  "release_validator_contract",
  "runbook_contract",
]);

export const PRODUCTION_GATE_IDS = Object.freeze([
  "directmail_live_send",
  "esa_waf_rate_limit",
  "esa_cache_purge",
  "fc_observability_limits",
  "fc_rollback",
  "fc_previous_app_new_schema_compatibility",
  "rds_connectivity_capacity",
  "rds_backup_restore",
  "oss_private_delivery_alerts",
  "directmail_failure_alert",
  "production_domain_icp",
  "production_policies_professional_review_authorization",
  "production_wecom",
  "production_mini_program",
  "production_mainland_wechat_browser",
  "production_cost_budget",
]);

export const M3_LOCAL_CHECK_IDS = Object.freeze([
  ...LOCAL_CHECK_IDS,
  "m3_brand_release_contract",
  "m3_claims_contract",
  "m3_cms_inventory_contract",
]);

export const M3_PRODUCTION_GATE_IDS = Object.freeze([
  ...PRODUCTION_GATE_IDS,
  "production_cms_brand_migration",
  "production_claims_authorization",
]);

const LOCAL_STATUSES = new Set([
  "LOCAL_PASS",
  "LOCAL_FAIL",
  "NOT_RUN",
  "N/A",
]);
const PRODUCTION_STATUSES = new Set(["PASS", "BLOCKED", "N/A"]);
const EVIDENCE_FIELDS = [
  "date",
  "commandOrRequest",
  "expectedResult",
  "actualResult",
  "evidencePath",
  "sensitiveDataCheck",
];
const COMPATIBILITY_FIELDS = [
  "previousAppVersion",
  "migrationVersion",
  "schemaState",
  "commandOrProbe",
  "expectedResult",
  "actualResult",
  "evidencePath",
];
const PLACEHOLDER_PATTERN =
  /\b(example|placeholder|fake|mock|not-provided|not run|blocked|planned|todo|pending)\b/i;
const CONTRADICTORY_PASS_RESULT_PATTERN =
  /\b(fail(?:ed|ure)?|error|incompatible|unsuccessful|not[\s_-]*(?:run|probed|tested|verified|passed|successful))\b/i;
const REQUIRED_LEGACY_ID_BY_GATE = Object.freeze({
  directmail_live_send: "M2-LEGACY-01",
  esa_waf_rate_limit: "M2-LEGACY-01",
  esa_cache_purge: "M2-LEGACY-01",
  fc_observability_limits: "M2-LEGACY-01",
  fc_rollback: "M2-LEGACY-01",
  fc_previous_app_new_schema_compatibility: "M2-LEGACY-01",
  rds_connectivity_capacity: "M2-LEGACY-01",
  rds_backup_restore: "M2-LEGACY-01",
  oss_private_delivery_alerts: "M2-LEGACY-01",
  directmail_failure_alert: "M2-LEGACY-01",
  production_cost_budget: "M2-LEGACY-02",
});

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function requireString(record, field, context) {
  if (typeof record[field] !== "string" || !record[field].trim()) {
    throw new Error(`${context}.${field} must be a non-empty string.`);
  }
}

function validateEvidence(evidence, context) {
  if (!isRecord(evidence)) {
    throw new Error(`${context}.evidence is required.`);
  }
  for (const field of EVIDENCE_FIELDS) {
    requireString(evidence, field, `${context}.evidence`);
  }
}

function validateGateSet(items, requiredIds, context) {
  if (!Array.isArray(items)) {
    throw new Error(`${context} must be an array.`);
  }
  const required = new Set(requiredIds);
  const seen = new Set();
  for (const item of items) {
    if (!isRecord(item) || typeof item.id !== "string") {
      throw new Error(`${context} contains a gate without an id.`);
    }
    if (!required.has(item.id)) {
      throw new Error(`${context} contains unknown gate ${item.id}.`);
    }
    if (seen.has(item.id)) {
      throw new Error(`${context} contains duplicate gate ${item.id}.`);
    }
    seen.add(item.id);
  }
  for (const id of requiredIds) {
    if (!seen.has(id)) {
      throw new Error(`${context} is missing required gate ${id}.`);
    }
  }
}

function validateExactIdList(items, requiredIds, context) {
  if (!Array.isArray(items)) {
    throw new Error(`${context} must be an array.`);
  }
  if (items.length !== requiredIds.length) {
    const missing = requiredIds.find((id) => !items.includes(id));
    throw new Error(
      `${context} must preserve all inherited gates${missing ? `; missing ${missing}` : ""}.`,
    );
  }
  requiredIds.forEach((id, index) => {
    if (items[index] !== id) {
      throw new Error(
        `${context} must preserve inherited gate order; expected ${id} at index ${index}.`,
      );
    }
  });
}

function validateRepositoryRelativePath(value, context) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${context} must be a non-empty relative repository path.`);
  }
  const normalized = value.replaceAll("\\", "/");
  if (
    normalized.startsWith("/") ||
    /^[a-z]:\//i.test(normalized) ||
    normalized.split("/").includes("..")
  ) {
    throw new Error(`${context} must be a relative repository path.`);
  }
}

function validateM3Evidence(evidence) {
  if (!isRecord(evidence)) {
    throw new Error("m3Evidence is required for schemaVersion 2.");
  }
  const fields = ["claimsRegisterPath", "contentInventoryPath"];
  for (const field of fields) {
    validateRepositoryRelativePath(evidence[field], `m3Evidence.${field}`);
  }
  const unknown = Object.keys(evidence).filter(
    (field) => !fields.includes(field),
  );
  if (unknown.length) {
    throw new Error(`m3Evidence contains unknown field ${unknown[0]}.`);
  }
}

function validateLocalCheck(check, index) {
  const context = `localChecks[${index}]`;
  if (!LOCAL_STATUSES.has(check.status)) {
    throw new Error(`${context} has invalid local status ${String(check.status)}.`);
  }
  validateEvidence(check.evidence, context);
  if (check.status === "N/A") {
    requireString(check, "reason", context);
  }
}

function validateCompatibility(gate, context) {
  if (!isRecord(gate.compatibility)) {
    throw new Error(`${context}.compatibility matrix is required.`);
  }
  for (const field of COMPATIBILITY_FIELDS) {
    requireString(gate.compatibility, field, `${context}.compatibility`);
  }
}

function validatePassActualResult(actualResult, context) {
  if (CONTRADICTORY_PASS_RESULT_PATTERN.test(actualResult)) {
    throw new Error(`${context} contradicts PASS.`);
  }
}

function validateProductionGate(gate, index) {
  const context = `productionGates[${index}]`;
  if (!PRODUCTION_STATUSES.has(gate.status)) {
    throw new Error(
      `${context} has invalid production status ${String(gate.status)}.`,
    );
  }
  if (gate.mandatory !== true) {
    throw new Error(`${context}.mandatory must be true.`);
  }
  requireString(gate, "region", context);
  requireString(gate, "resourceRef", context);
  validateEvidence(gate.evidence, context);
  if (gate.status === "BLOCKED" || gate.status === "N/A") {
    requireString(gate, "reason", context);
  }
  const requiredLegacyId = REQUIRED_LEGACY_ID_BY_GATE[gate.id];
  if (gate.status !== "PASS" && requiredLegacyId) {
    if (gate.legacyId !== requiredLegacyId) {
      throw new Error(
        `${context} gate ${gate.id} must map non-PASS status to ${requiredLegacyId}.`,
      );
    }
  }
  if (gate.id === "fc_previous_app_new_schema_compatibility") {
    validateCompatibility(gate, context);
  }
  if (gate.status === "PASS") {
    validatePassActualResult(
      gate.evidence.actualResult,
      `${context}.evidence.actualResult`,
    );
    if (gate.compatibility) {
      validatePassActualResult(
        gate.compatibility.actualResult,
        `${context}.compatibility.actualResult`,
      );
    }
    const productionEvidence = [
      gate.region,
      gate.resourceRef,
      ...EVIDENCE_FIELDS.map((field) => gate.evidence[field]),
      ...(gate.compatibility
        ? COMPATIBILITY_FIELDS.map((field) => gate.compatibility[field])
        : []),
    ].join(" ");
    if (PLACEHOLDER_PATTERN.test(productionEvidence)) {
      throw new Error(
        `${context} cannot use placeholder, fake, mock, example, or blocked evidence for PASS.`,
      );
    }
  }
}

export function validateReleaseGateInput(input) {
  if (!isRecord(input)) {
    throw new Error("Release gate input must be an object.");
  }
  if (![1, 2].includes(input.schemaVersion)) {
    throw new Error("schemaVersion must be 1 or 2.");
  }
  requireString(input, "generatedAt", "releaseGateInput");
  const localCheckIds =
    input.schemaVersion === 2 ? M3_LOCAL_CHECK_IDS : LOCAL_CHECK_IDS;
  const productionGateIds =
    input.schemaVersion === 2
      ? M3_PRODUCTION_GATE_IDS
      : PRODUCTION_GATE_IDS;
  if (input.schemaVersion === 2) {
    validateM3Evidence(input.m3Evidence);
    validateExactIdList(
      input.inheritedProductionGateIds,
      PRODUCTION_GATE_IDS,
      "inheritedProductionGateIds",
    );
  }
  validateGateSet(input.localChecks, localCheckIds, "localChecks");
  validateGateSet(
    input.productionGates,
    productionGateIds,
    "productionGates",
  );
  input.localChecks.forEach(validateLocalCheck);
  input.productionGates.forEach(validateProductionGate);
  return input;
}

export function evaluateRelease(input) {
  validateReleaseGateInput(input);
  const localBlockers = input.localChecks
    .filter((check) => !["LOCAL_PASS", "N/A"].includes(check.status))
    .map((check) => check.id);
  const productionBlockers = input.productionGates
    .filter((gate) => gate.status !== "PASS")
    .map((gate) => gate.id);
  const localReady = localBlockers.length === 0;
  const productionReady = localReady && productionBlockers.length === 0;

  return {
    localReady,
    productionReady,
    status: !localReady
      ? "LOCAL_NOT_READY"
      : productionReady
        ? "PRODUCTION_LIVE_READY"
        : "CODE_READY_WITH_EXTERNAL_LEGACY",
    localBlockers,
    productionBlockers,
  };
}
