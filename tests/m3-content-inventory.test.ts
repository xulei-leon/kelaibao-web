import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// @ts-expect-error -- the independent Node validator intentionally ships as an .mjs runtime contract.
import { evaluateContentInventory, validateContentInventory } from "../scripts/lib/content-inventory-validator.mjs";

function item(overrides: Record<string, unknown> = {}) {
  return {
    id: "news-2026-001",
    contentType: "news",
    slug: "product-update",
    title: "产品更新",
    status: "published",
    publishedAt: "2026-07-01T02:00:00.000Z",
    oldBrandMatches: ["历史品牌名称"],
    decision: "revise-and-republish",
    revisionId: "rev-8f3a2c",
    auditId: "audit-71b49d",
    authorizationStatus: "not-required",
    ...overrides,
  };
}

function inventory(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: 1,
    generatedAt: "2026-08-01T00:00:00.000Z",
    sourceMode: "fixture",
    inventoryComplete: false,
    blockers: ["No connection to the real CMS database was used."],
    items: [
      item({
        id: "fixture-news-001",
        revisionId: null,
        auditId: null,
        decision: "pending",
        authorizationStatus: "unknown",
      }),
    ],
    ...overrides,
  };
}

describe("M3-05 CMS brand content inventory contract", () => {
  it("validates the checked-in sanitized fixture as Local-only evidence", () => {
    const fixture = JSON.parse(
      readFileSync(
        resolve(
          process.cwd(),
          "docs/5-Evidence/m3-05/content-inventory.fixture.json",
        ),
        "utf8",
      ),
    );

    expect(evaluateContentInventory(fixture)).toMatchObject({
      localContractReady: true,
      productionCmsGate: "BLOCKED",
    });
  });

  it("accepts a sanitized fixture for Local contract but blocks Production", () => {
    const input = inventory();

    expect(validateContentInventory(input)).toBe(input);
    expect(evaluateContentInventory(input)).toMatchObject({
      localContractReady: true,
      productionCmsGate: "BLOCKED",
    });
  });

  it("keeps empty and incomplete inventories blocked without failing Local contract", () => {
    for (const input of [
      inventory({ items: [] }),
      inventory({ sourceMode: "live-cms", inventoryComplete: false, items: [] }),
    ]) {
      expect(evaluateContentInventory(input)).toMatchObject({
        localContractReady: true,
        productionCmsGate: "BLOCKED",
      });
    }
  });

  it("allows Production PASS only for a complete non-empty live CMS inventory", () => {
    const input = inventory({
      sourceMode: "live-cms",
      inventoryComplete: true,
      blockers: [],
      items: [item()],
    });

    expect(evaluateContentInventory(input)).toEqual({
      localContractReady: true,
      productionCmsGate: "PASS",
      blockers: [],
    });

    expect(
      evaluateContentInventory(
        inventory({
          sourceMode: "live-cms",
          inventoryComplete: true,
          blockers: [],
          items: [
            item({
              status: "offline",
              decision: "unpublish",
              authorizationStatus: "not-required",
            }),
          ],
        }),
      ),
    ).toMatchObject({ productionCmsGate: "PASS" });
  });

  it("rejects live inventories whose migration decision contradicts public status", () => {
    for (const contradictoryItem of [
      item({ status: "published", decision: "unpublish" }),
      item({ status: "offline", decision: "revise-and-republish" }),
    ]) {
      expect(() =>
        validateContentInventory(
          inventory({
            sourceMode: "live-cms",
            inventoryComplete: true,
            blockers: [],
            items: [contradictoryItem],
          }),
        ),
      ).toThrow(/decision.*status|status.*decision/i);
    }
  });

  it("rejects pseudo-live evidence and an empty live inventory claiming completeness", () => {
    const pseudoLive = inventory({
      sourceMode: "live-cms",
      inventoryComplete: true,
      blockers: [],
      items: [item({ revisionId: "fixture-revision", auditId: "mock-audit" })],
    });
    expect(() => validateContentInventory(pseudoLive)).toThrow(
      /placeholder|fixture|mock/i,
    );

    const incompletePseudoLive = inventory({
      sourceMode: "live-cms",
      inventoryComplete: false,
      items: [item({ id: "fixture-news-001", revisionId: null, auditId: null })],
    });
    expect(() => validateContentInventory(incompletePseudoLive)).toThrow(
      /placeholder|fixture|mock/i,
    );

    const emptyLive = inventory({
      sourceMode: "live-cms",
      inventoryComplete: true,
      blockers: [],
      items: [],
    });
    expect(() => validateContentInventory(emptyLive)).toThrow(/non-empty/i);
  });

  it("rejects missing required item fields", () => {
    const missingSlug = item() as Record<string, unknown>;
    delete missingSlug.slug;

    expect(() =>
      validateContentInventory(
        inventory({ sourceMode: "live-cms", items: [missingSlug] }),
      ),
    ).toThrow(/items\[0\]\.slug/i);
  });

  it("rejects body, HTML, credential, and other undeclared fields", () => {
    for (const leakedField of ["body", "html", "databaseUrl", "credential"]) {
      expect(() =>
        validateContentInventory(
          inventory({ items: [item({ [leakedField]: "must-not-leak" })] }),
        ),
      ).toThrow(/undeclared field|not allowed/i);
    }
  });
});
