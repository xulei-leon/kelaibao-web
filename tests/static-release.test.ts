import { describe, expect, it, vi } from "vitest";
import { evaluateStaticMigration } from "../scripts/lib/static-release-evidence.mjs";
// @ts-expect-error -- release-only plain Node module, tested over a fake HTTPS boundary.
import { DirectHttpsEsaPurgeProvider } from "../scripts/lib/esa-purge.mjs";

const digest = "a".repeat(64);
const routes = [{ path: "/news/public", status: 200 }, { path: "/news/retired", status: 410 }];
const evidence = () => ({ schemaVersion: 1, sourceMode: "verified-live-inventory", inventoryComplete: true, reviewedBy: "Content owner", reviewedAt: "2026-10-20T08:00:00Z", evidencePath: "review.md", sourceDigest: digest, routes, blockers: [] });

describe("static release evidence", () => {
  it("requires a verified inventory, review and matching build for production", () => {
    expect(evaluateStaticMigration(evidence(), { sourceDigest: digest, routes }, digest)).toEqual({ productionReady: true, blockers: [] });
    expect(evaluateStaticMigration({ ...evidence(), sourceMode: "local-unverified", inventoryComplete: false }, { sourceDigest: digest, routes }, digest).productionReady).toBe(false);
    expect(evaluateStaticMigration({ ...evidence(), reviewedBy: "" }, { sourceDigest: digest, routes }, digest).productionReady).toBe(false);
  });
  it("rejects stale builds and omitted historical routes", () => {
    expect(evaluateStaticMigration(evidence(), undefined, digest).productionReady).toBe(false);
    expect(evaluateStaticMigration(evidence(), { sourceDigest: "b".repeat(64), routes }, digest).productionReady).toBe(false);
    expect(evaluateStaticMigration({ ...evidence(), routes: [] }, { sourceDigest: digest, routes }, digest).blockers).toContain("static_content_url_mapping_incomplete");
  });
  it("allows a genuinely verified empty previous site but keeps local emptiness blocked", () => {
    expect(evaluateStaticMigration({ ...evidence(), routes: [] }, { sourceDigest: digest, routes: [] }, digest).productionReady).toBe(true);
    expect(evaluateStaticMigration({ ...evidence(), routes: [], sourceMode: "local-unverified" }, { sourceDigest: digest, routes: [] }, digest).productionReady).toBe(false);
  });
});

describe("release-only direct HTTPS ESA refresh", () => {
  const config = { endpoint: "https://esa.example", siteId: "123", accessKeyId: "test-id", accessKeySecret: "test-secret", securityToken: "test-token" };
  it("signs exact URL batches and reports acceptance separately from completion", async () => {
    const request = vi.fn(async (_input: string, _options?: RequestInit) => Response.json({ RequestId: "request", TaskId: "task" }));
    const client = new DirectHttpsEsaPurgeProvider(config, request, () => new Date("2026-10-20T08:00:00Z"), () => "nonce");
    expect(await client.purgeUrls({ urls: ["https://site.example/news"], idempotencyKey: digest })).toEqual({ providerRequestId: "request", providerTaskId: "task" });
    expect(request).toHaveBeenCalledOnce();
    expect(request.mock.calls[0][0]).toMatch(/^https:\/\/esa.example\//);
  });
  it("rejects cross-origin/wildcard refreshes and redacts provider errors", async () => {
    const request = vi.fn(async (_input: string, _options?: RequestInit) => { throw new Error("test-secret"); });
    const client = new DirectHttpsEsaPurgeProvider(config, request);
    await expect(client.purgeUrls({ urls: ["https://site.example/news", "https://other.example/news"], idempotencyKey: digest })).rejects.toThrow(/boundary/);
    await expect(client.purgeUrls({ urls: ["https://site.example/*"], idempotencyKey: digest })).rejects.toThrow(/boundary/);
    expect(request).not.toHaveBeenCalled();
    await expect(client.purgeUrls({ urls: ["https://site.example/news"], idempotencyKey: digest })).rejects.toThrow("network_or_timeout");
  });
});
