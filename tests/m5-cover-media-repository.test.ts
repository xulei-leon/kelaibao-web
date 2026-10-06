import { afterEach, describe, expect, it, vi } from "vitest";

import {
  applyContentAction,
  normalizeContentDraft,
} from "@/server/content/domain";
import { SqliteContentRepository } from "@/server/content/sqlite-repository";
import { SqliteMediaUploadRepository } from "@/server/media/sqlite-repository";
import {
  DirectHttpsOssProvider,
  IMMUTABLE_MEDIA_CACHE_CONTROL,
} from "@/server/integrations/oss/provider";
import {
  createSqliteTestDatabase,
  seedSqliteAdmin,
} from "./sqlite-local-test-helpers";

const cleanups: Array<() => void> = [];

afterEach(() => {
  vi.unstubAllEnvs();
  while (cleanups.length) cleanups.pop()?.();
});

function insertMedia(
  database: ReturnType<typeof createSqliteTestDatabase>["database"],
  adminId: number,
  {
    objectKey,
    width = 1200,
    height = 630,
    byteSize = 200 * 1024,
    authorized = true,
  }: {
    objectKey: string;
    width?: number;
    height?: number;
    byteSize?: number;
    authorized?: boolean;
  },
) {
  const result = database.prepare(
    `INSERT INTO media_assets
      (object_key, mime_type, byte_size, checksum_sha256, width_px, height_px,
       public_usage_confirmed_at, public_usage_confirmed_by, created_by, created_at)
     VALUES (?, 'image/webp', ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    objectKey,
    byteSize,
    "a".repeat(64),
    width,
    height,
    authorized ? "2026-08-08T01:00:00.000Z" : null,
    authorized ? adminId : null,
    adminId,
    "2026-08-08T00:00:00.000Z",
  );
  return Number(result.lastInsertRowid);
}

describe("M5-01 cover media revision contract", () => {
  it("promotes content-addressed media with immutable caching and overwrite protection", async () => {
    const requests: RequestInit[] = [];
    const request = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      requests.push(init ?? {});
      return new Response(null, { status: 409 });
    });
    const provider = new DirectHttpsOssProvider(
      {
        bucketName: "private-media",
        bucketEndpoint: "https://private-media.oss-cn-shenzhen.aliyuncs.com",
        assetsBaseUrl: "https://assets.example/",
        accessKeyId: "temporary-id",
        accessKeySecret: "temporary-secret",
        securityToken: "temporary-token",
        credentialExpiresAt: new Date(Date.now() + 10 * 60_000),
      },
      request as typeof fetch,
    );

    await expect(
      provider.promoteObject({
        sourceKey: "pending/1/upload.webp",
        targetKey: "media/1/upload-deadbeef.webp",
        expectedSha256: "a".repeat(64),
        sourceEtag: "b".repeat(32),
        mimeType: "image/webp",
      }),
    ).resolves.toBeUndefined();
    expect(requests).toHaveLength(1);
    expect(requests[0]?.headers).toMatchObject({
      "cache-control": IMMUTABLE_MEDIA_CACHE_CONTROL,
      "x-oss-forbid-overwrite": "true",
    });
  });

  it("publishes one immutable cover snapshot and builds its URL from the trusted asset origin", async () => {
    vi.stubEnv("OSS_ASSETS_BASE_URL", "https://assets.example/");
    const runtime = createSqliteTestDatabase();
    cleanups.push(runtime.cleanup);
    const adminId = seedSqliteAdmin(runtime.database, "$argon2id$local-test-only");
    const coverId = insertMedia(runtime.database, adminId, {
      objectKey: "media/1/cover-deadbeef.webp",
    });
    const repository = new SqliteContentRepository(runtime);
    const createdAt = new Date("2026-08-08T02:00:00.000Z");
    const created = await repository.createDraft({
      actorAdminId: adminId,
      now: createdAt,
      requestId: "m5-create",
      draft: normalizeContentDraft({
        contentType: "news",
        slug: "cover-contract",
        title: "代表图契约",
        summary: "代表图公开契约测试。",
        sourceHtml: "<p>正文</p>",
        coverMediaAssetId: coverId,
        coverAlt: "活动现场公开照片",
      }),
    });
    await repository.mutate({
      itemId: created.item.id,
      expectedVersion: 1,
      actorAdminId: adminId,
      now: new Date("2026-08-08T03:00:00.000Z"),
      requestId: "m5-publish",
      publicOrigin: "http://localhost:3000",
      plan: (context) =>
        applyContentAction({
          action: "publish",
          item: context.item,
          expectedVersion: 1,
          actorAdminId: adminId,
          now: new Date("2026-08-08T03:00:00.000Z"),
          draftRevision: context.draftRevision ?? undefined,
          publishedRevision: context.publishedRevision ?? undefined,
        }),
    });

    const firstPublic = await repository.getPublicBySlug("news", "cover-contract");
    expect(firstPublic).toMatchObject({
      status: "published",
      item: {
        revisionNumber: 2,
        coverImage: {
          url: "https://assets.example/media/1/cover-deadbeef.webp",
          width: 1200,
          height: 630,
          alt: "活动现场公开照片",
          mimeType: "image/webp",
        },
      },
    });

    const current = await repository.getAdminItem(created.item.id);
    if (!current) throw new Error("fixture content missing");
    await repository.mutate({
      itemId: current.item.id,
      expectedVersion: 2,
      actorAdminId: adminId,
      now: new Date("2026-08-08T04:00:00.000Z"),
      requestId: "m5-new-draft",
      publicOrigin: "http://localhost:3000",
      plan: (context) =>
        applyContentAction({
          action: "save_draft",
          item: context.item,
          expectedVersion: 2,
          actorAdminId: adminId,
          now: new Date("2026-08-08T04:00:00.000Z"),
          draft: normalizeContentDraft({
            contentType: "news",
            slug: "cover-contract",
            title: "代表图契约更新",
            summary: "尚未发布的新草稿。",
            sourceHtml: "<p>新正文</p>",
          }),
        }),
    });
    expect(await repository.getPublicBySlug("news", "cover-contract")).toEqual(
      firstPublic,
    );
  });

  it.each([
    { authorized: false, width: 1200, height: 630, byteSize: 200 * 1024 },
    { authorized: true, width: 1199, height: 630, byteSize: 200 * 1024 },
    { authorized: true, width: 1200, height: 630, byteSize: 351 * 1024 },
    { authorized: true, width: 1200, height: 800, byteSize: 200 * 1024 },
  ])("rejects an ineligible cover before revision insertion: %#", async (eligibility) => {
    const runtime = createSqliteTestDatabase();
    cleanups.push(runtime.cleanup);
    const adminId = seedSqliteAdmin(runtime.database, "$argon2id$local-test-only");
    const mediaId = insertMedia(runtime.database, adminId, {
      objectKey: `media/1/rejected-${String(eligibility.width)}-${String(eligibility.height)}.webp`,
      ...eligibility,
    });
    const repository = new SqliteContentRepository(runtime);
    await expect(
      repository.createDraft({
        actorAdminId: adminId,
        now: new Date("2026-08-08T02:00:00.000Z"),
        requestId: "m5-reject",
        draft: normalizeContentDraft({
          contentType: "news",
          slug: "rejected-cover",
          title: "拒绝代表图",
          summary: "不符合门禁的代表图。",
          sourceHtml: "<p>正文</p>",
          coverMediaAssetId: mediaId,
          coverAlt: "不符合门禁的图片",
        }),
      }),
    ).rejects.toThrow(/not confirmed for public representative use/i);
    expect(
      runtime.database.prepare("SELECT COUNT(*) AS count FROM content_items").get()?.count,
    ).toBe(0);
  });

  it("records a fixed, idempotent public-usage audit without free text", async () => {
    const runtime = createSqliteTestDatabase();
    cleanups.push(runtime.cleanup);
    const adminId = seedSqliteAdmin(runtime.database, "$argon2id$local-test-only");
    const mediaId = insertMedia(runtime.database, adminId, {
      objectKey: "media/1/authorization-target.webp",
      authorized: false,
    });
    const repository = new SqliteMediaUploadRepository(runtime);
    const input = {
      mediaAssetId: mediaId,
      adminId,
      confirmedAt: new Date("2026-08-08T05:00:00.000Z"),
      requestId: "m5-public-usage",
    };
    await repository.confirmPublicUsage(input);
    await repository.confirmPublicUsage(input);

    const audits = runtime.database.prepare(
      "SELECT action, metadata_json FROM audit_logs WHERE action = 'media_public_usage_confirmed'",
    ).all();
    expect(audits).toHaveLength(1);
    expect(audits[0]?.action).toBe("media_public_usage_confirmed");
    expect(JSON.parse(String(audits[0]?.metadata_json))).toEqual({
      mediaAssetId: mediaId,
      reasonCode: "editor_confirmed_public_use_v1",
    });
  });
});
