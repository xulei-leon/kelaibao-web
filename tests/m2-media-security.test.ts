import {
  confirmMediaUpload,
  createMediaUploadIntent,
  type MediaAsset,
  type MediaObjectProvider,
  type MediaUploadIntent,
  type MediaUploadRepository,
} from "@/server/media/service";
import {
  inspectAllowedImage,
  validateMediaRequest,
} from "@/server/media/validation";
import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";

function pngBytes() {
  const bytes = Buffer.alloc(24);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(bytes);
  Buffer.from("IHDR").copy(bytes, 12);
  bytes.writeUInt32BE(1200, 16);
  bytes.writeUInt32BE(630, 20);
  return bytes;
}

function memoryRepository(): MediaUploadRepository & {
  intents: Map<string, MediaUploadIntent>;
  assets: Map<number, MediaAsset>;
  audit: string[];
} {
  const intents = new Map<string, MediaUploadIntent>();
  const assets = new Map<number, MediaAsset>();
  const audit: string[] = [];
  let nextAssetId = 1;

  return {
    intents,
    assets,
    audit,
    async createIntent(intent) {
      intents.set(intent.id, intent);
      audit.push("media_presigned");
      return intent;
    },
    async claimIntent({
      intentId,
      adminId,
      confirmationTokenHash,
      now,
      leaseExpiresAt,
    }) {
      const intent = intents.get(intentId);
      if (!intent) throw new Error("Upload intent not found.");
      if (intent.adminId !== adminId) throw new Error("Upload intent owner mismatch.");
      if (intent.mediaAssetId) {
        return {
          status: "confirmed" as const,
          asset: assets.get(intent.mediaAssetId)!,
        };
      }
      if (now >= intent.expiresAt) throw new Error("Upload intent expired.");
      if (
        intent.confirmationTokenHash &&
        intent.confirmationExpiresAt &&
        intent.confirmationExpiresAt > now
      ) {
        return { status: "in_progress" as const };
      }
      const claimed = {
        ...intent,
        confirmationTokenHash,
        confirmationExpiresAt: leaseExpiresAt,
      };
      intents.set(intentId, claimed);
      return { status: "claimed" as const, intent: claimed };
    },
    async releaseIntentClaim(intentId, confirmationTokenHash) {
      const intent = intents.get(intentId);
      if (intent?.confirmationTokenHash === confirmationTokenHash) {
        intents.set(intentId, {
          ...intent,
          confirmationTokenHash: null,
          confirmationExpiresAt: null,
        });
      }
    },
    async consumeIntent(
      intentId,
      confirmationTokenHash,
      assetInput,
      consumedAt,
    ) {
      const intent = intents.get(intentId);
      if (!intent) throw new Error("Upload intent not found.");
      if (intent.mediaAssetId) return assets.get(intent.mediaAssetId)!;
      if (intent.confirmationTokenHash !== confirmationTokenHash) {
        throw new Error("Upload confirmation claim changed.");
      }
      const asset = { id: nextAssetId++, ...assetInput };
      assets.set(asset.id, asset);
      intents.set(intentId, {
        ...intent,
        consumedAt,
        mediaAssetId: asset.id,
        confirmationTokenHash: null,
        confirmationExpiresAt: null,
      });
      audit.push("media_confirmed");
      return asset;
    },
    async recordCleanupDeferred() {
      audit.push("media_cleanup_deferred");
    },
    async confirmPublicUsage({ mediaAssetId, adminId, confirmedAt }) {
      const asset = assets.get(mediaAssetId);
      if (!asset) throw new Error("Media asset not found.");
      const confirmed = {
        ...asset,
        publicUsageConfirmedAt: confirmedAt,
        publicUsageConfirmedBy: adminId,
      };
      assets.set(mediaAssetId, confirmed);
      audit.push("media_public_usage_confirmed");
      return confirmed;
    },
  };
}

describe("M2-02 media security", () => {
  it("validates the 10 MB boundary, MIME, SHA-256, and file magic", () => {
    expect(() =>
      validateMediaRequest({
        fileName: "../attack.svg",
        mimeType: "image/svg+xml",
        byteSize: 10,
        sha256: "0".repeat(64),
      }),
    ).toThrow(/mime/i);
    expect(() =>
      validateMediaRequest({
        fileName: "large.png",
        mimeType: "image/png",
        byteSize: 10 * 1024 * 1024 + 1,
        sha256: "0".repeat(64),
      }),
    ).toThrow(/10 MB/i);

    const bytes = pngBytes();
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    expect(
      inspectAllowedImage(bytes, {
        expectedMimeType: "image/png",
        expectedByteSize: bytes.length,
        expectedSha256: sha256,
      }),
    ).toEqual({
      mimeType: "image/png",
      byteSize: bytes.length,
      sha256,
      width: 1200,
      height: 630,
    });

    expect(() =>
      inspectAllowedImage(Buffer.from("<svg><script>x</script></svg>"), {
        expectedMimeType: "image/png",
        expectedByteSize: 29,
        expectedSha256: "0".repeat(64),
      }),
    ).toThrow(/signature|checksum|size/i);
  });

  it("binds a short-lived intent to the actor and returns no provider secret", async () => {
    const repository = memoryRepository();
    const authorizePut = vi.fn(async () => ({
      url: "https://private-oss.example/pending/intent.png?signature=redacted",
      method: "PUT" as const,
      headers: {
        "content-type": "image/png",
        "x-oss-meta-sha256": "a".repeat(64),
      },
      expiresAt: new Date("2026-07-30T00:05:00.000Z"),
    }));

    const result = await createMediaUploadIntent({
      adminId: 7,
      input: {
        fileName: "logo.png",
        mimeType: "image/png",
        byteSize: 24,
        sha256: "a".repeat(64),
      },
      repository,
      authorizePut,
      now: new Date("2026-07-30T00:00:00.000Z"),
      createId: () => "intent-1",
      createNonce: () => "nonce-1",
    });

    expect(result.intent.adminId).toBe(7);
    expect(result.intent.objectKey).toMatch(/^pending\/7\/intent-1-/);
    expect(JSON.stringify(result.authorization)).not.toMatch(
      /access.?key.?secret/i,
    );
  });

  it("does not persist a presign success when authorization generation fails", async () => {
    const repository = memoryRepository();
    await expect(
      createMediaUploadIntent({
        adminId: 7,
        input: {
          fileName: "logo.png",
          mimeType: "image/png",
          byteSize: 24,
          sha256: "a".repeat(64),
        },
        repository,
        authorizePut: async () => {
          throw new Error("STS unavailable");
        },
        now: new Date("2026-07-30T00:00:00.000Z"),
        createId: () => "intent-failed",
        createNonce: () => "nonce-failed",
      }),
    ).rejects.toThrow(/STS unavailable/);
    expect(repository.intents.size).toBe(0);
    expect(repository.audit).not.toContain("media_presigned");
  });

  it("confirms by content, rejects another actor, and is idempotent", async () => {
    const bytes = pngBytes();
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    const repository = memoryRepository();
    const intent: MediaUploadIntent = {
      id: "intent-2",
      adminId: 7,
      objectKey: "pending/7/intent-2-upload.png",
      mimeType: "image/png",
      maxByteSize: bytes.length,
      expectedSha256: sha256,
      nonceHash: "b".repeat(64),
      expiresAt: new Date("2026-07-30T00:05:00.000Z"),
      consumedAt: null,
      mediaAssetId: null,
      confirmationTokenHash: null,
      confirmationExpiresAt: null,
      createdAt: new Date("2026-07-30T00:00:00.000Z"),
    };
    repository.intents.set(intent.id, intent);
    const provider: MediaObjectProvider = {
      inspectObject: vi.fn(async () => ({
        bytes,
        contentType: "image/png",
        contentLength: bytes.length,
        etag: '"0123456789abcdef0123456789abcdef"',
      })),
      promoteObject: vi.fn(async () => undefined),
      cleanupObject: vi.fn(async () => undefined),
    };

    await expect(
      confirmMediaUpload({
        adminId: 8,
        intentId: intent.id,
        repository,
        provider,
        now: new Date("2026-07-30T00:01:00.000Z"),
      }),
    ).rejects.toThrow(/owner/i);

    const first = await confirmMediaUpload({
      adminId: 7,
      intentId: intent.id,
      repository,
      provider,
      now: new Date("2026-07-30T00:01:00.000Z"),
    });
    const second = await confirmMediaUpload({
      adminId: 7,
      intentId: intent.id,
      repository,
      provider,
      now: new Date("2026-07-30T00:02:00.000Z"),
    });

    expect(second).toEqual(first);
    expect(provider.promoteObject).toHaveBeenCalledOnce();
    expect(first.objectKey).toMatch(/^media\/7\/intent-2-/);
    expect(first.checksumSha256).toBe(sha256);
  });

  it("claims before side effects and rejects an object replaced before conditional copy", async () => {
    const bytes = pngBytes();
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    const repository = memoryRepository();
    const intent: MediaUploadIntent = {
      id: "intent-race",
      adminId: 7,
      objectKey: "pending/7/intent-race.png",
      mimeType: "image/png",
      maxByteSize: bytes.length,
      expectedSha256: sha256,
      nonceHash: "c".repeat(64),
      expiresAt: new Date("2026-07-30T00:05:00.000Z"),
      consumedAt: null,
      mediaAssetId: null,
      confirmationTokenHash: null,
      confirmationExpiresAt: null,
      createdAt: new Date("2026-07-30T00:00:00.000Z"),
    };
    repository.intents.set(intent.id, intent);
    let currentEtag = '"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"';
    const provider: MediaObjectProvider = {
      inspectObject: vi.fn(async () => ({
        bytes,
        contentType: "image/png",
        contentLength: bytes.length,
        etag: currentEtag,
      })),
      promoteObject: vi.fn(async ({ sourceEtag }) => {
        currentEtag = '"bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"';
        if (sourceEtag !== currentEtag) {
          throw new Error("OSS precondition failed");
        }
      }),
      cleanupObject: vi.fn(async () => undefined),
    };

    await expect(
      confirmMediaUpload({
        adminId: 7,
        intentId: intent.id,
        repository,
        provider,
        now: new Date("2026-07-30T00:01:00.000Z"),
        createClaimToken: () => "claim-race",
      }),
    ).rejects.toThrow(/precondition/i);
    expect(repository.assets.size).toBe(0);
    expect(repository.intents.get(intent.id)?.confirmationTokenHash).toBeNull();
  });

  it("single-flights concurrent confirms and does not roll back confirmation on cleanup failure", async () => {
    const bytes = pngBytes();
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    const repository = memoryRepository();
    const intent: MediaUploadIntent = {
      id: "intent-concurrent",
      adminId: 7,
      objectKey: "pending/7/intent-concurrent.png",
      mimeType: "image/png",
      maxByteSize: bytes.length,
      expectedSha256: sha256,
      nonceHash: "d".repeat(64),
      expiresAt: new Date("2026-07-30T00:05:00.000Z"),
      consumedAt: null,
      mediaAssetId: null,
      confirmationTokenHash: null,
      confirmationExpiresAt: null,
      createdAt: new Date("2026-07-30T00:00:00.000Z"),
    };
    repository.intents.set(intent.id, intent);
    let releasePromotion: () => void = () => {};
    const promotionBlocked = new Promise<void>((resolve) => {
      releasePromotion = resolve;
    });
    const provider: MediaObjectProvider = {
      inspectObject: vi.fn(async () => ({
        bytes,
        contentType: "image/png",
        contentLength: bytes.length,
        etag: '"0123456789abcdef0123456789abcdef"',
      })),
      promoteObject: vi.fn(async () => promotionBlocked),
      cleanupObject: vi.fn(async () => {
        throw new Error("delete unavailable");
      }),
    };
    const first = confirmMediaUpload({
      adminId: 7,
      intentId: intent.id,
      repository,
      provider,
      now: new Date("2026-07-30T00:01:00.000Z"),
      createClaimToken: () => "claim-first",
    });
    await vi.waitFor(() => expect(provider.promoteObject).toHaveBeenCalledOnce());

    await expect(
      confirmMediaUpload({
        adminId: 7,
        intentId: intent.id,
        repository,
        provider,
        now: new Date("2026-07-30T00:01:01.000Z"),
        createClaimToken: () => "claim-second",
      }),
    ).rejects.toThrow(/in progress/i);
    releasePromotion();

    await expect(first).resolves.toMatchObject({
      checksumSha256: sha256,
    });
    expect(provider.promoteObject).toHaveBeenCalledOnce();
    expect(repository.audit).toContain("media_confirmed");
    expect(repository.audit).toContain("media_cleanup_deferred");
  });
});
