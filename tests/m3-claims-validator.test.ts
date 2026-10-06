import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { validateClaimsRegister } from "../scripts/lib/claims-validator.mjs";

const FIELD_NAMES = [
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
] as const;

function approvedClaim(overrides: Record<string, unknown> = {}) {
  return {
    id: "claim-approved",
    claim: "24H 响应",
    publicPattern: "24H 响应",
    definition: "工作日内收到询盘后 24 小时内发送首次人工回复",
    calculation: "首次人工回复时间减去询盘接收时间",
    source: "2026 年第二季度询盘响应台账",
    sourceCapturedAt: "2026-07-31T10:00:00+08:00",
    asOfDate: "2026-06-30",
    scope: "2026 年第二季度工作日内收到的官网询盘",
    owner: "运营负责人",
    reviewer: "合规复核负责人",
    evidenceType: "operational-record",
    evidencePath: "external-evidence/claims/response-time-2026-q2.md",
    maxAgeDays: 120,
    expiresAt: "2026-10-28",
    authorizationStatus: "authorized",
    publicUseApproved: true,
    placeholder: false,
    disposition: "approved",
    replacementCopy: null,
    weakenedReason: null,
    ...overrides,
  };
}

function register(
  claims: Array<Record<string, unknown>> = [approvedClaim()],
) {
  return {
    schemaVersion: 1,
    generatedAt: "2026-08-01T00:00:00+08:00",
    claims,
  };
}

const validate = (input: unknown, publicOutputs: string[] = []) =>
  validateClaimsRegister(input, {
    now: new Date("2026-08-01T00:00:00+08:00"),
    publicOutputs,
  });

describe("M3-05 claims validator", () => {
  it("accepts a complete, current, authorized and real approved claim", () => {
    const input = register();
    expect(validate(input)).toBe(input);
  });

  it.each([
    ["source", ""],
    ["sourceCapturedAt", null],
    ["asOfDate", ""],
  ])("rejects an approved claim with missing %s", (field, value) => {
    expect(() =>
      validate(register([approvedClaim({ [field]: value })])),
    ).toThrow(new RegExp(field, "i"));
  });

  it("rejects evidence expired by either explicit expiry or maximum age", () => {
    expect(() =>
      validate(register([approvedClaim({ expiresAt: "2026-07-31" })])),
    ).toThrow(/expiresAt|expired/i);

    expect(() =>
      validate(
        register([
          approvedClaim({
            sourceCapturedAt: "2026-01-01T00:00:00+08:00",
            maxAgeDays: 30,
            expiresAt: "2026-12-31",
          }),
        ]),
      ),
    ).toThrow(/maxAgeDays|expired/i);
  });

  it("rejects an unauthorized approved claim", () => {
    expect(() =>
      validate(
        register([
          approvedClaim({
            authorizationStatus: "pending",
            publicUseApproved: false,
          }),
        ]),
      ),
    ).toThrow(/authorizationStatus|publicUseApproved/i);
  });

  it.each([
    ["placeholder flag", { placeholder: true }],
    ["placeholder text", { source: "TODO" }],
    [
      "fake local evidence",
      {
        evidenceType: "local-fixture",
        evidencePath: "tests/fixtures/fake-claim.json",
      },
    ],
  ])("rejects approved evidence backed by %s", (_label, overrides) => {
    expect(() => validate(register([approvedClaim(overrides)]))).toThrow(
      /placeholder|fake|fixture|todo/i,
    );
  });

  it("rejects weakened claims when the original public pattern remains public", () => {
    const weakened = approvedClaim({
      authorizationStatus: "not-authorized",
      publicUseApproved: false,
      disposition: "weakened",
      replacementCopy: "我们提供人工响应和进度同步。",
      weakenedReason: "没有足以批准时效承诺的真实生产证据。",
    });

    expect(() =>
      validate(register([weakened]), ["联系我们，承诺 24H 响应。"]),
    ).toThrow(/publicPattern|public output/i);
  });

  it("accepts a safe weakened claim only with approval disabled, replacement copy and reason", () => {
    const weakened = approvedClaim({
      authorizationStatus: "not-authorized",
      publicUseApproved: false,
      disposition: "weakened",
      replacementCopy: "我们提供人工响应和进度同步。",
      weakenedReason: "没有足以批准时效承诺的真实生产证据。",
    });

    expect(validate(register([weakened]), ["我们提供人工响应和进度同步。"]))
      .toEqual(register([weakened]));

    for (const overrides of [
      { publicUseApproved: true },
      { replacementCopy: "" },
      { weakenedReason: "" },
    ]) {
      expect(() =>
        validate(register([{ ...weakened, ...overrides }])),
      ).toThrow(/publicUseApproved|replacementCopy|weakenedReason/i);
    }
  });

  it("allows owner-accepted public copy while keeping Production authorization blocked", () => {
    const acceptedBlocked = approvedClaim({
      authorizationStatus: "not-authorized",
      publicUseApproved: false,
      disposition: "accepted-blocked",
      replacementCopy: null,
      weakenedReason: "Owner accepted the copy, but objective evidence and professional review remain incomplete.",
    });

    expect(validate(register([acceptedBlocked]), ["公开展示 24H 响应"])).toEqual(register([acceptedBlocked]));
  });

  it("rejects replacement copy on an accepted-blocked claim", () => {
    const acceptedBlocked = approvedClaim({
      authorizationStatus: "not-authorized",
      publicUseApproved: false,
      disposition: "accepted-blocked",
      replacementCopy: "不应存在替代文案",
      weakenedReason: "Owner accepted the original copy, but Production evidence remains blocked.",
    });

    expect(() => validate(register([acceptedBlocked]), [])).toThrow(/replacementCopy/i);
  });

  it("registers every workbook claim with the fixed field contract and safe dispositions", () => {
    const path = resolve(
      process.cwd(),
      "docs/5-Evidence/m3-05/claims-register.json",
    );
    const input = JSON.parse(readFileSync(path, "utf8"));

    const expectedIds = [
      "workbook-24h-response",
      "workbook-efficiency-hour-to-minute",
      "workbook-growth-one-percent",
      "workbook-customers-100-plus",
      "workbook-team-100k-plus",
      "workbook-content-reach-1m-plus",
      "workbook-stability-99-99-percent",
      "workbook-zero-privacy-collection",
      "workbook-zero-business-intervention",
      "workbook-private-domain-ownership-100-percent",
      "m4-search-visible-quality-content",
      "m4-mainstream-media-coverage",
      "m4-conversion-rate-improvement",
      "m4-performance-doubling",
      "m4-visitor-attribution",
      "m4-absolute-private-domain-lock",
      "m4-official-media-realtime-indexing-feedback",
      "v3-3-media-package-personal-ip-price",
      "v3-3-media-package-team-recruitment-price",
      "v3-3-media-package-brand-project-price",
      "v3-3-media-package-offline-event-price",
      "v3-3-media-member-subsidy-50-percent",
    ];

    expect(input.claims.map((claim: { id: string }) => claim.id)).toEqual(
      expectedIds,
    );
    for (const claim of input.claims) {
      expect(Object.keys(claim).sort()).toEqual([...FIELD_NAMES].sort());
    }
    expect(input.claims.filter((claim: { disposition: string }) => claim.disposition === "approved")).toHaveLength(15);
    expect(input.claims.filter((claim: { disposition: string }) => claim.disposition === "accepted-blocked")).toHaveLength(5);
    expect(input.claims.filter((claim: { disposition: string }) => claim.disposition === "weakened")).toHaveLength(2);
    expect(validateClaimsRegister(input, { now: new Date("2026-09-15T00:30:00+08:00") })).toBe(input);
    expect(() => validateClaimsRegister(input, { now: new Date("2026-12-14T00:00:00+08:00") })).toThrow(/expiresAt|expired/i);
  });
});
