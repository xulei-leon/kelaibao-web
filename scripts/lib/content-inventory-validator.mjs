const TOP_LEVEL_FIELDS = Object.freeze([
  "schemaVersion",
  "generatedAt",
  "sourceMode",
  "inventoryComplete",
  "blockers",
  "items",
]);

const ITEM_FIELDS = Object.freeze([
  "id",
  "contentType",
  "slug",
  "title",
  "status",
  "publishedAt",
  "oldBrandMatches",
  "decision",
  "revisionId",
  "auditId",
  "authorizationStatus",
]);

const CONTENT_TYPES = new Set(["news", "case"]);
const DECISIONS = new Set(["pending", "revise-and-republish", "unpublish"]);
const AUTHORIZATION_STATUSES = new Set([
  "authorized",
  "not-authorized",
  "not-required",
  "unknown",
]);
const PLACEHOLDER_EVIDENCE_PATTERN =
  /(?:^|[-_\s])(fixture|mock|fake|example|placeholder|test|not[-_\s]?provided|pending)(?:$|[-_\s])/i;

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function assertExactFields(record, allowedFields, context) {
  const allowed = new Set(allowedFields);
  for (const field of Object.keys(record)) {
    if (!allowed.has(field)) {
      throw new Error(`${context} contains undeclared field ${field}; it is not allowed.`);
    }
  }
  for (const field of allowedFields) {
    if (!Object.hasOwn(record, field)) {
      throw new Error(`${context}.${field} is required.`);
    }
  }
}

function requireNonEmptyString(record, field, context) {
  if (typeof record[field] !== "string" || !record[field].trim()) {
    throw new Error(`${context}.${field} must be a non-empty string.`);
  }
}

function requireIsoDate(record, field, context) {
  requireNonEmptyString(record, field, context);
  if (Number.isNaN(Date.parse(record[field]))) {
    throw new Error(`${context}.${field} must be an ISO-compatible date.`);
  }
}

function validateItem(item, index) {
  const context = `items[${index}]`;
  if (!isRecord(item)) {
    throw new Error(`${context} must be an object.`);
  }
  assertExactFields(item, ITEM_FIELDS, context);
  for (const field of ["id", "contentType", "slug", "title", "status"]) {
    requireNonEmptyString(item, field, context);
  }
  requireIsoDate(item, "publishedAt", context);

  if (!CONTENT_TYPES.has(item.contentType)) {
    throw new Error(`${context}.contentType must be news or case.`);
  }
  if (!Array.isArray(item.oldBrandMatches)) {
    throw new Error(`${context}.oldBrandMatches must be an array.`);
  }
  for (const [matchIndex, match] of item.oldBrandMatches.entries()) {
    if (typeof match !== "string" || !match.trim()) {
      throw new Error(
        `${context}.oldBrandMatches[${matchIndex}] must be a non-empty string.`,
      );
    }
  }
  if (!DECISIONS.has(item.decision)) {
    throw new Error(`${context}.decision is invalid.`);
  }
  for (const field of ["revisionId", "auditId"]) {
    if (item[field] !== null && (typeof item[field] !== "string" || !item[field].trim())) {
      throw new Error(`${context}.${field} must be a non-empty string or null.`);
    }
  }
  if (!AUTHORIZATION_STATUSES.has(item.authorizationStatus)) {
    throw new Error(`${context}.authorizationStatus is invalid.`);
  }
}

function validateCompleteLiveInventory(input) {
  if (input.items.length === 0) {
    throw new Error(
      "A complete live-cms inventory must contain a non-empty items array.",
    );
  }
  if (input.blockers.length > 0) {
    throw new Error("A complete live-cms inventory cannot retain blockers.");
  }

  input.items.forEach((item, index) => {
    const context = `items[${index}]`;
    if (item.decision === "pending") {
      throw new Error(`${context}.decision cannot be pending for complete live-cms evidence.`);
    }
    const requiredStatus =
      item.decision === "unpublish" ? "offline" : "published";
    if (item.status !== requiredStatus) {
      throw new Error(
        `${context}.decision ${item.decision} requires status ${requiredStatus}.`,
      );
    }
    for (const field of ["revisionId", "auditId"]) {
      if (typeof item[field] !== "string") {
        throw new Error(`${context}.${field} is required for complete live-cms evidence.`);
      }
    }
    if (
      item.contentType === "case" &&
      item.decision === "revise-and-republish" &&
      item.authorizationStatus !== "authorized"
    ) {
      throw new Error(
        `${context}.authorizationStatus must be authorized before republishing a case.`,
      );
    }
  });
}

function rejectPseudoLiveEvidence(input) {
  input.items.forEach((item, index) => {
    for (const field of ["id", "revisionId", "auditId"]) {
      if (
        typeof item[field] === "string" &&
        PLACEHOLDER_EVIDENCE_PATTERN.test(item[field])
      ) {
        throw new Error(
          `items[${index}].${field} cannot contain placeholder, fixture, or mock live evidence.`,
        );
      }
    }
  });
}

export function validateContentInventory(input) {
  if (!isRecord(input)) {
    throw new Error("Content inventory must be an object.");
  }
  assertExactFields(input, TOP_LEVEL_FIELDS, "contentInventory");
  if (input.schemaVersion !== 1) {
    throw new Error("contentInventory.schemaVersion must be 1.");
  }
  requireIsoDate(input, "generatedAt", "contentInventory");
  if (!new Set(["fixture", "live-cms"]).has(input.sourceMode)) {
    throw new Error("contentInventory.sourceMode must be fixture or live-cms.");
  }
  if (typeof input.inventoryComplete !== "boolean") {
    throw new Error("contentInventory.inventoryComplete must be a boolean.");
  }
  if (!Array.isArray(input.blockers)) {
    throw new Error("contentInventory.blockers must be an array.");
  }
  input.blockers.forEach((blocker, index) => {
    if (typeof blocker !== "string" || !blocker.trim()) {
      throw new Error(
        `contentInventory.blockers[${index}] must be a non-empty string.`,
      );
    }
  });
  if (!Array.isArray(input.items)) {
    throw new Error("contentInventory.items must be an array.");
  }
  input.items.forEach(validateItem);

  if (input.sourceMode === "live-cms") {
    rejectPseudoLiveEvidence(input);
    if (input.inventoryComplete) validateCompleteLiveInventory(input);
  }
  return input;
}

export function evaluateContentInventory(input) {
  validateContentInventory(input);
  const blockers = [];
  if (input.sourceMode !== "live-cms") blockers.push("source_mode_is_not_live_cms");
  if (!input.inventoryComplete) blockers.push("inventory_is_incomplete");
  if (input.items.length === 0) blockers.push("inventory_is_empty");
  if (input.blockers.length > 0) blockers.push("inventory_reports_blockers");

  return {
    localContractReady: true,
    productionCmsGate: blockers.length === 0 ? "PASS" : "BLOCKED",
    blockers,
  };
}
