import {
  createOssPutAuthorizer,
  DirectHttpsOssProvider,
  publicAssetUrl,
  resolveOssStsConfig,
} from "@/server/integrations/oss/provider";
import type { MediaUploadIntent } from "@/server/media/service";
import { describe, expect, it, vi } from "vitest";

const env = {
  OSS_BUCKET_NAME: "private-bucket",
  OSS_BUCKET_ENDPOINT:
    "https://private-bucket.oss-cn-shenzhen.aliyuncs.com",
  OSS_ASSETS_BASE_URL: "https://assets.example.cn",
  OSS_STS_ACCESS_KEY_ID: "STS.test-id",
  OSS_STS_ACCESS_KEY_SECRET: "do-not-leak-this-secret",
  OSS_STS_SECURITY_TOKEN: "temporary-security-token",
  OSS_STS_EXPIRES_AT: "2026-07-30T01:00:00.000Z",
};

const intent: MediaUploadIntent = {
  id: "intent-oss-1",
  adminId: 1,
  objectKey: "pending/1/intent-oss-1.png",
  mimeType: "image/png",
  maxByteSize: 24,
  expectedSha256: "a".repeat(64),
  nonceHash: "b".repeat(64),
  expiresAt: new Date("2026-07-30T00:05:00.000Z"),
  consumedAt: null,
  mediaAssetId: null,
  confirmationTokenHash: null,
  confirmationExpiresAt: null,
  createdAt: new Date("2026-07-30T00:00:00.000Z"),
};

describe("direct HTTPS OSS boundary", () => {
  it("rejects non-HTTPS endpoints and long-lived bucket/public origin reuse", () => {
    expect(() =>
      resolveOssStsConfig(
        { ...env, OSS_BUCKET_ENDPOINT: "http://oss.example" },
        new Date("2026-07-30T00:00:00.000Z"),
      ),
    ).toThrow(/HTTPS/i);
    expect(() =>
      resolveOssStsConfig(
        {
          ...env,
          OSS_ASSETS_BASE_URL: env.OSS_BUCKET_ENDPOINT,
        },
        new Date("2026-07-30T00:00:00.000Z"),
      ),
    ).toThrow(/distinct HTTPS ESA/i);
  });

  it("creates a bounded PUT authorization without exposing the STS secret", async () => {
    const config = resolveOssStsConfig(
      env,
      new Date("2026-07-30T00:00:00.000Z"),
    );
    const result = await createOssPutAuthorizer(
      config,
      () => new Date("2026-07-30T00:00:00.000Z"),
    )({ intent, nonce: "nonce-value" });

    expect(result.method).toBe("PUT");
    expect(result.url).toMatch(/^https:/);
    expect(result.url).toContain("OSSAccessKeyId=STS.test-id");
    expect(result.url).toContain("Signature=");
    expect(result.url).not.toContain(env.OSS_STS_ACCESS_KEY_SECRET);
    expect(result.headers).toEqual(
      expect.objectContaining({
        "content-type": "image/png",
        "x-oss-meta-intent": intent.id,
        "x-oss-meta-sha256": intent.expectedSha256,
      }),
    );
  });

  it("downloads through fetch and constructs public URLs only for confirmed media", async () => {
    const bytes = Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      Buffer.from("fixture"),
    ]);
    let requestedUrl = "";
    const request = vi.fn(async (input: RequestInfo | URL) => {
      requestedUrl = String(input);
      return new Response(bytes, {
        status: 200,
        headers: {
          "content-length": String(bytes.length),
          "content-type": "image/png",
          etag: '"0123456789abcdef0123456789abcdef"',
        },
      });
    });
    const config = resolveOssStsConfig(
      env,
      new Date("2026-07-30T00:00:00.000Z"),
    );
    vi.setSystemTime(new Date("2026-07-30T00:00:00.000Z"));
    const provider = new DirectHttpsOssProvider(config, request as typeof fetch);

    await expect(provider.inspectObject(intent.objectKey)).resolves.toEqual({
      bytes,
      contentType: "image/png",
      contentLength: bytes.length,
      etag: '"0123456789abcdef0123456789abcdef"',
    });
    expect(requestedUrl).toMatch(/^https:/);
    expect(
      publicAssetUrl(config, "media/1/confirmed.png"),
    ).toBe("https://assets.example.cn/media/1/confirmed.png");
    expect(() => publicAssetUrl(config, intent.objectKey)).toThrow(
      /confirmed media/i,
    );
    vi.useRealTimers();
  });

  it("binds copy to the inspected ETag and keeps staging cleanup separate", async () => {
    const requests: Array<{ url: string; init?: RequestInit }> = [];
    const request = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        requests.push({ url: String(input), init });
        return new Response(null, {
          status: init?.method === "DELETE" ? 503 : 200,
        });
      },
    );
    const config = resolveOssStsConfig(
      env,
      new Date("2026-07-30T00:00:00.000Z"),
    );
    vi.setSystemTime(new Date("2026-07-30T00:00:00.000Z"));
    const provider = new DirectHttpsOssProvider(config, request as typeof fetch);

    await expect(
      provider.promoteObject({
        sourceKey: intent.objectKey,
        targetKey: "media/1/confirmed.png",
        expectedSha256: intent.expectedSha256,
        sourceEtag: '"0123456789abcdef0123456789abcdef"',
        mimeType: "image/png",
      }),
    ).resolves.toBeUndefined();
    expect(requests).toHaveLength(1);
    expect(requests[0].init?.headers).toEqual(
      expect.objectContaining({
        "x-oss-copy-source-if-match":
          '"0123456789abcdef0123456789abcdef"',
        "x-oss-metadata-directive": "REPLACE",
      }),
    );

    await expect(provider.cleanupObject(intent.objectKey)).rejects.toThrow(
      /cleanup/i,
    );
    expect(requests).toHaveLength(2);
    vi.useRealTimers();
  });
});
