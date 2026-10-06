import { afterEach, describe, expect, it } from "vitest";

import { SqliteMediaUploadRepository } from "@/server/media/sqlite-repository";
import {
  createSqliteTestDatabase,
  seedSqliteAdmin,
} from "./sqlite-local-test-helpers";

const cleanups: Array<() => void> = [];
afterEach(() => {
  while (cleanups.length) cleanups.pop()?.();
});

describe("M4-01 SQLite media metadata repository", () => {
  it("persists intent claim, confirmed asset, and audit atomically", async () => {
    const runtime = createSqliteTestDatabase();
    cleanups.push(runtime.cleanup);
    const adminId = seedSqliteAdmin(runtime.database, "$argon2id$local-test-only");
    const repository = new SqliteMediaUploadRepository(runtime);
    const now = new Date("2026-08-01T13:00:00.000Z");
    const intent = {
      id: "local-media-intent",
      adminId,
      objectKey: "pending/1/local-media-intent.png",
      mimeType: "image/png" as const,
      maxByteSize: 128,
      expectedSha256: "a".repeat(64),
      nonceHash: "b".repeat(64),
      expiresAt: new Date(now.getTime() + 300_000),
      consumedAt: null,
      mediaAssetId: null,
      confirmationTokenHash: null,
      confirmationExpiresAt: null,
      createdAt: now,
    };
    await repository.createIntent(intent, "sqlite-presign");
    const claimHash = "c".repeat(64);
    expect((await repository.claimIntent({
      intentId: intent.id,
      adminId,
      confirmationTokenHash: claimHash,
      now,
      leaseExpiresAt: new Date(now.getTime() + 60_000),
    })).status).toBe("claimed");
    const asset = await repository.consumeIntent(
      intent.id,
      claimHash,
      {
        objectKey: "media/1/confirmed.png",
        mimeType: "image/png",
        byteSize: 128,
        checksumSha256: "a".repeat(64),
        width: 1200,
        height: 630,
        publicUsageConfirmedAt: null,
        publicUsageConfirmedBy: null,
        createdBy: adminId,
        createdAt: new Date(now.getTime() + 1_000),
      },
      new Date(now.getTime() + 1_000),
      "sqlite-confirm",
    );
    expect(asset.id).toBeGreaterThan(0);
    expect(await repository.findById(asset.id)).toEqual(asset);
    expect(await repository.findById(99999)).toBeNull();
    expect((await repository.claimIntent({
      intentId: intent.id,
      adminId,
      confirmationTokenHash: "d".repeat(64),
      now,
      leaseExpiresAt: new Date(now.getTime() + 60_000),
    })).status).toBe("confirmed");
    expect(runtime.database.prepare(
      "SELECT COUNT(*) AS count FROM audit_logs WHERE action IN ('media_presigned', 'media_confirmed')",
    ).get()?.count).toBe(2);
  });
});
