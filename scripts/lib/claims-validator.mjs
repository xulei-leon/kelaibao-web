const CLAIM_FIELDS = [
  "id",
  "claim",
  "publicPattern",
  "definition",
  "calculation",
  "source",
  "sourceCapturedAt",
  "asOfDate",
  "scope",
  "owner",
  "reviewer",
  "evidenceType",
  "evidencePath",
  "maxAgeDays",
  "expiresAt",
  "authorizationStatus",
  "publicUseApproved",
  "placeholder",
  "disposition",
  "replacementCopy",
  "weakenedReason",
];

const APPROVED_REQUIRED_TEXT = [
  "claim",
  "publicPattern",
  "definition",
  "calculation",
  "source",
  "sourceCapturedAt",
  "asOfDate",
  "scope",
  "owner",
  "reviewer",
  "evidenceType",
  "evidencePath",
  "expiresAt",
];

const PLACEHOLDER_PATTERN =
  /(?:^|[\s/_.-])(todo|tbd|n\/a|not[- ]?provided|pending|placeholder|example|sample|mock|fake|fixture)(?:$|[\s/_.-])/i;

function fail(path, message) {
  throw new Error(`${path}: ${message}`);
}

function isNonEmptyText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function parseDate(value, path) {
  if (!isNonEmptyText(value)) {
    fail(path, "must be a non-empty date");
  }
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) {
    fail(path, "must be a valid date");
  }
  return timestamp;
}

function assertFixedFields(claim, path) {
  if (!claim || typeof claim !== "object" || Array.isArray(claim)) {
    fail(path, "must be an object");
  }

  for (const field of CLAIM_FIELDS) {
    if (!Object.hasOwn(claim, field)) {
      fail(`${path}.${field}`, "is required by the fixed claims contract");
    }
  }

  const unknownFields = Object.keys(claim).filter(
    (field) => !CLAIM_FIELDS.includes(field),
  );
  if (unknownFields.length > 0) {
    fail(path, `contains unknown fields: ${unknownFields.join(", ")}`);
  }

  if (!isNonEmptyText(claim.id)) fail(`${path}.id`, "must be non-empty");
  if (!isNonEmptyText(claim.claim)) fail(`${path}.claim`, "must be non-empty");
  if (!isNonEmptyText(claim.publicPattern)) {
    fail(`${path}.publicPattern`, "must be non-empty");
  }
  if (typeof claim.publicUseApproved !== "boolean") {
    fail(`${path}.publicUseApproved`, "must be boolean");
  }
  if (typeof claim.placeholder !== "boolean") {
    fail(`${path}.placeholder`, "must be boolean");
  }
}

function assertApproved(claim, path, nowTimestamp) {
  for (const field of APPROVED_REQUIRED_TEXT) {
    if (!isNonEmptyText(claim[field])) {
      fail(`${path}.${field}`, "is required for an approved claim");
    }
    if (PLACEHOLDER_PATTERN.test(claim[field])) {
      fail(`${path}.${field}`, "contains placeholder, fake, or fixture evidence");
    }
  }

  if (claim.placeholder !== false) {
    fail(`${path}.placeholder`, "approved evidence cannot be a placeholder");
  }
  if (claim.authorizationStatus !== "authorized") {
    fail(
      `${path}.authorizationStatus`,
      'must be "authorized" for an approved claim',
    );
  }
  if (claim.publicUseApproved !== true) {
    fail(`${path}.publicUseApproved`, "must be true for an approved claim");
  }
  if (!Number.isInteger(claim.maxAgeDays) || claim.maxAgeDays <= 0) {
    fail(`${path}.maxAgeDays`, "must be a positive integer");
  }

  const capturedAt = parseDate(
    claim.sourceCapturedAt,
    `${path}.sourceCapturedAt`,
  );
  parseDate(claim.asOfDate, `${path}.asOfDate`);
  const expiresAt = parseDate(claim.expiresAt, `${path}.expiresAt`);
  if (expiresAt < nowTimestamp) {
    fail(`${path}.expiresAt`, "approved evidence is expired");
  }

  const ageMilliseconds = nowTimestamp - capturedAt;
  if (ageMilliseconds < 0) {
    fail(`${path}.sourceCapturedAt`, "cannot be in the future");
  }
  if (ageMilliseconds > claim.maxAgeDays * 86_400_000) {
    fail(`${path}.maxAgeDays`, "approved evidence is expired by maximum age");
  }
}

function outputText(output, index) {
  if (typeof output === "string") return output;
  if (output && typeof output === "object" && typeof output.content === "string") {
    return output.content;
  }
  fail(`options.publicOutputs[${index}]`, "must be text or an object with content");
}

function assertWeakened(claim, path, publicOutputs) {
  if (claim.publicUseApproved !== false) {
    fail(`${path}.publicUseApproved`, "must be false for a weakened claim");
  }
  if (!isNonEmptyText(claim.replacementCopy)) {
    fail(`${path}.replacementCopy`, "is required for a weakened claim");
  }
  if (!isNonEmptyText(claim.weakenedReason)) {
    fail(`${path}.weakenedReason`, "is required for a weakened claim");
  }
  if (PLACEHOLDER_PATTERN.test(claim.replacementCopy)) {
    fail(`${path}.replacementCopy`, "cannot be placeholder or fake text");
  }

  publicOutputs.forEach((output, index) => {
    if (outputText(output, index).includes(claim.publicPattern)) {
      fail(
        `${path}.publicPattern`,
        `weakened original remains in public output ${index}`,
      );
    }
  });
}

function assertAcceptedBlocked(claim, path) {
  if (claim.publicUseApproved !== false) {
    fail(`${path}.publicUseApproved`, "must remain false while Production evidence is blocked");
  }
  if (claim.authorizationStatus !== "not-authorized") {
    fail(`${path}.authorizationStatus`, 'must be "not-authorized" while Production evidence is blocked');
  }
  if (!isNonEmptyText(claim.weakenedReason)) {
    fail(`${path}.weakenedReason`, "must describe the unresolved Production evidence blocker");
  }
  if (claim.placeholder !== false) {
    fail(`${path}.placeholder`, "accepted public copy cannot be a placeholder");
  }
  if (claim.replacementCopy !== null) {
    fail(`${path}.replacementCopy`, "must be null when the accepted original copy remains public");
  }
}

export function validateClaimsRegister(input, options = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    fail("claims register", "must be an object");
  }
  if (input.schemaVersion !== 1) {
    fail("schemaVersion", "must equal 1");
  }
  parseDate(input.generatedAt, "generatedAt");
  if (!Array.isArray(input.claims) || input.claims.length === 0) {
    fail("claims", "must be a non-empty array");
  }

  const now = options.now ?? new Date();
  const nowTimestamp = now instanceof Date ? now.getTime() : Date.parse(now);
  if (!Number.isFinite(nowTimestamp)) fail("options.now", "must be a valid date");
  const publicOutputs = options.publicOutputs ?? [];
  if (!Array.isArray(publicOutputs)) {
    fail("options.publicOutputs", "must be an array");
  }

  const ids = new Set();
  input.claims.forEach((claim, index) => {
    const path = `claims[${index}]`;
    assertFixedFields(claim, path);
    if (ids.has(claim.id)) fail(`${path}.id`, `duplicate id ${claim.id}`);
    ids.add(claim.id);

    if (claim.disposition === "approved") {
      assertApproved(claim, path, nowTimestamp);
    } else if (claim.disposition === "weakened") {
      assertWeakened(claim, path, publicOutputs);
    } else if (claim.disposition === "accepted-blocked") {
      assertAcceptedBlocked(claim, path);
    } else {
      fail(`${path}.disposition`, 'must be "approved", "weakened", or "accepted-blocked"');
    }
  });

  return input;
}

export { CLAIM_FIELDS };
