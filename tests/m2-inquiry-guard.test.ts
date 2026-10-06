import { InquiryGuard } from "@/server/inquiry/guard";
import { describe, expect, it } from "vitest";

function request(ip?: string) {
  return new Request("https://www.example.cn/api/inquiry", {
    headers: ip ? { "X-ESA-Client-IP": ip } : undefined,
  });
}

describe("M2-05 bounded inquiry guard", () => {
  it("isolates trusted clients without retaining raw addresses", () => {
    const guard = new InquiryGuard({
      clientIpHeader: "x-esa-client-ip",
      rateKeySecret: "s".repeat(32),
      rateLimitMax: 1,
      rateLimitWindowMs: 60_000,
      dedupeTtlMs: 60_000,
      maxEntries: 10,
      now: () => 1_000,
    });

    expect(guard.check(request("203.0.113.10"), "submission-00000001")).toEqual({
      status: "allowed",
    });
    expect(guard.check(request("203.0.113.11"), "submission-00000002")).toEqual({
      status: "allowed",
    });
    expect(guard.check(request("203.0.113.10"), "submission-00000003")).toMatchObject({
      status: "rate_limited",
    });
    expect(JSON.stringify(guard)).not.toContain("203.0.113");
  });

  it("uses one fail-safe bucket when the trusted header is missing", () => {
    const guard = new InquiryGuard({
      clientIpHeader: "x-esa-client-ip",
      rateKeySecret: "s".repeat(32),
      rateLimitMax: 1,
      rateLimitWindowMs: 60_000,
      dedupeTtlMs: 60_000,
      maxEntries: 10,
      now: () => 1_000,
    });

    expect(guard.check(request(), "submission-00000001").status).toBe("allowed");
    expect(guard.check(request(), "submission-00000002").status).toBe(
      "rate_limited",
    );
  });

  it("expires dedupe and rate windows and keeps maps capacity bounded", () => {
    let now = 1_000;
    const guard = new InquiryGuard({
      clientIpHeader: "x-esa-client-ip",
      rateKeySecret: "s".repeat(32),
      rateLimitMax: 1,
      rateLimitWindowMs: 1_000,
      dedupeTtlMs: 1_000,
      maxEntries: 2,
      now: () => now,
    });

    expect(guard.check(request("203.0.113.1"), "submission-00000001").status).toBe(
      "allowed",
    );
    expect(guard.check(request("203.0.113.1"), "submission-00000001").status).toBe(
      "duplicate",
    );
    now += 1_001;
    expect(guard.check(request("203.0.113.1"), "submission-00000001").status).toBe(
      "allowed",
    );

    guard.check(request("203.0.113.2"), "submission-00000002");
    guard.check(request("203.0.113.3"), "submission-00000003");
    expect(guard.stats()).toEqual({
      dedupeEntries: 2,
      rateEntries: 2,
    });
  });
});
