import {
  buildContentPurgeUrls,
  nextPurgeRetry,
} from "@/server/content/purge";
import {
  DirectHttpsEsaPurgeProvider,
  resolveEsaPurgeConfig,
} from "@/server/integrations/esa/provider";
import { describe, expect, it, vi } from "vitest";

const env = {
  ESA_PURGE_ENDPOINT: "https://esa.cn-hangzhou.aliyuncs.com",
  ESA_SITE_ID: "123456789",
  ESA_ACCESS_KEY_ID: "STS.test-id",
  ESA_ACCESS_KEY_SECRET: "do-not-log-this-secret",
  ESA_SECURITY_TOKEN: "temporary-security-token",
};

describe("M2-03 ESA purge boundary", () => {
  it("builds a bounded, exact, deduplicated URL set without wildcard purge", () => {
    expect(
      buildContentPurgeUrls({
        publicOrigin: "https://www.example.cn",
        contentType: "news",
        slug: "market-update",
      }),
    ).toEqual([
      "https://www.example.cn/news",
      "https://www.example.cn/news/market-update",
      "https://www.example.cn/sitemap.xml",
      "https://www.example.cn/feed.xml",
      "https://www.example.cn/llms.txt",
    ]);
    expect(() =>
      buildContentPurgeUrls({
        publicOrigin: "https://www.example.cn/path",
        contentType: "news",
        slug: "market-update",
      }),
    ).toThrow(/origin/i);
    expect(() =>
      buildContentPurgeUrls({
        publicOrigin: "https://www.example.cn",
        contentType: "case",
        slug: "*",
      }),
    ).toThrow(/slug/i);

    expect(() =>
      buildContentPurgeUrls({
        publicOrigin: "http://localhost:3000",
        contentType: "news",
        slug: "market-update",
      }),
    ).toThrow(/HTTPS origin/i);
    expect(
      buildContentPurgeUrls({
        publicOrigin: "http://localhost:3000",
        contentType: "news",
        slug: "market-update",
        allowLocalHttp: true,
      })[0],
    ).toBe("http://localhost:3000/news");
    expect(() =>
      buildContentPurgeUrls({
        publicOrigin: "http://example.test:3000",
        contentType: "news",
        slug: "market-update",
        allowLocalHttp: true,
      }),
    ).toThrow(/HTTPS origin/i);
  });

  it("sends Alibaba ESA PurgeCaches 2024-09-10 over signed HTTPS without leaking credentials", async () => {
    let requestedUrl = "";
    let requestedInit: RequestInit | undefined;
    const request = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        requestedUrl = String(input);
        requestedInit = init;
        return Response.json(
          { RequestId: "request-1", TaskId: "task-1" },
          { status: 200 },
        );
      },
    );
    const config = resolveEsaPurgeConfig(env);
    const provider = new DirectHttpsEsaPurgeProvider(
      config,
      request as typeof fetch,
      () => new Date("2026-07-30T02:00:00.000Z"),
      () => "nonce-1",
    );
    const urls = buildContentPurgeUrls({
      publicOrigin: "https://www.example.cn",
      contentType: "case",
      slug: "case-one",
    });

    await expect(
      provider.purgeUrls({
        urls,
        idempotencyKey: "a".repeat(64),
      }),
    ).resolves.toEqual({
      providerRequestId: "request-1",
      providerTaskId: "task-1",
    });

    const url = new URL(requestedUrl);
    expect(url.protocol).toBe("https:");
    expect(url.origin).toBe(env.ESA_PURGE_ENDPOINT);
    expect(url.searchParams.get("SiteId")).toBe(env.ESA_SITE_ID);
    expect(url.searchParams.get("Type")).toBe("file");
    expect(JSON.parse(url.searchParams.get("Content") ?? "{}")).toEqual({
      Files: urls,
    });
    expect(requestedInit?.method).toBe("POST");
    expect(requestedInit?.headers).toEqual(
      expect.objectContaining({
        "x-acs-action": "PurgeCaches",
        "x-acs-version": "2024-09-10",
        "x-acs-date": "2026-07-30T02:00:00Z",
        "x-acs-signature-nonce": "nonce-1",
        "x-acs-security-token": env.ESA_SECURITY_TOKEN,
        "x-saino-idempotency-key": "a".repeat(64),
        authorization: expect.stringMatching(
          /^ACS3-HMAC-SHA256 Credential=STS\.test-id,/,
        ),
      }),
    );
    expect(JSON.stringify(requestedInit)).not.toContain(
      env.ESA_ACCESS_KEY_SECRET,
    );
  });

  it("classifies retry windows deterministically and keeps terminal failures bounded", () => {
    expect(nextPurgeRetry(1, new Date("2026-07-30T02:00:00.000Z"))).toEqual({
      status: "retry",
      nextAttemptAt: new Date("2026-07-30T02:00:05.000Z"),
    });
    expect(nextPurgeRetry(2, new Date("2026-07-30T02:00:00.000Z"))).toEqual({
      status: "retry",
      nextAttemptAt: new Date("2026-07-30T02:00:15.000Z"),
    });
    expect(nextPurgeRetry(3, new Date("2026-07-30T02:00:00.000Z"))).toEqual({
      status: "failed",
      nextAttemptAt: null,
    });
  });
});
