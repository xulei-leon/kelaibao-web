import { afterEach, describe, expect, it } from "vitest";

import { SqliteContentRepository } from "@/server/content/sqlite-repository";
import {
  LocalSqlitePurgeProvider,
  SqliteCachePurgeJobRepository,
} from "@/server/content/sqlite-purge-job-repository";
import { processNextPurgeJob } from "@/server/content/purge-jobs";
import {
  createContentDraft,
  offlineContent,
  publishContent,
  saveContentDraft,
} from "@/server/content/service";
import {
  createSqliteTestDatabase,
  seedSqliteAdmin,
} from "./sqlite-local-test-helpers";

const cleanups: Array<() => void> = [];

afterEach(() => {
  while (cleanups.length) cleanups.pop()?.();
});

function draft(overrides: Record<string, unknown> = {}) {
  return {
    contentType: "news",
    slug: "SQLite-Local-News",
    title: "SQLite 本地新闻",
    summary: "用于验证本地数据库适配层的新闻摘要。",
    sourceHtml: "<p>第一版正文</p>",
    ...overrides,
  };
}

describe("M4-01 SQLite content integration", () => {
  it("creates, revises, publishes, reads, and offlines immutable content", async () => {
    const runtime = createSqliteTestDatabase();
    cleanups.push(runtime.cleanup);
    const adminId = seedSqliteAdmin(runtime.database, "$argon2id$local-test-only");
    const repository = new SqliteContentRepository(runtime);
    const origin = "http://localhost:3000";

    const created = await createContentDraft({
      input: draft(), actorAdminId: adminId, repository,
      now: new Date("2026-08-01T11:00:00.000Z"), requestId: "sqlite-create",
    });
    expect(created.item.slug).toBe("sqlite-local-news");

    const saved = await saveContentDraft({
      itemId: created.item.id, expectedVersion: created.item.version,
      input: draft({ sourceHtml: "<p>第二版正文</p>" }),
      actorAdminId: adminId, repository,
      now: new Date("2026-08-01T11:01:00.000Z"), requestId: "sqlite-save",
      publicOrigin: origin,
    });
    const published = await publishContent({
      itemId: saved.item.id, expectedVersion: saved.item.version,
      confirmCaseAuthorization: false, actorAdminId: adminId, repository,
      now: new Date("2026-08-01T11:02:00.000Z"), requestId: "sqlite-publish",
      publicOrigin: origin,
    });
    expect(published.purgeJobId).toBeTypeOf("number");
    if (!published.purgeJobId) throw new Error("Expected purge job.");
    expect(await processNextPurgeJob({
      repository: new SqliteCachePurgeJobRepository(runtime),
      provider: new LocalSqlitePurgeProvider(),
      jobId: published.purgeJobId,
      now: new Date("2026-08-01T11:02:01.000Z"),
      requestId: "sqlite-purge",
    })).toEqual({ status: "succeeded", jobId: published.purgeJobId });
    const publicResult = await repository.getPublicBySlug("news", "sqlite-local-news");
    expect(publicResult.status).toBe("published");
    if (publicResult.status !== "published") throw new Error("Expected published content.");
    expect(publicResult.item.sanitizedHtml).toContain("第二版正文");

    const offlined = await offlineContent({
      itemId: published.item.id, expectedVersion: published.item.version,
      actorAdminId: adminId, repository,
      now: new Date("2026-08-01T11:03:00.000Z"), requestId: "sqlite-offline",
      publicOrigin: origin,
    });
    expect(offlined.item.publicStatus).toBe("offline");
    expect(await repository.getPublicBySlug("news", "sqlite-local-news"))
      .toEqual({ status: "gone" });
    expect((await repository.listRevisions(created.item.id)).map((item) => item.revisionNumber))
      .toEqual([4, 3, 2, 1]);
    expect(runtime.database.prepare(
      "SELECT COUNT(*) AS count FROM audit_logs WHERE action LIKE 'content_%'",
    ).get()?.count).toBe(4);
  });

  it("enforces type-local slug uniqueness and first case authorization", async () => {
    const runtime = createSqliteTestDatabase();
    cleanups.push(runtime.cleanup);
    const adminId = seedSqliteAdmin(runtime.database, "$argon2id$local-test-only");
    const repository = new SqliteContentRepository(runtime);
    const now = new Date("2026-08-01T12:00:00.000Z");
    await createContentDraft({
      input: draft(), actorAdminId: adminId, repository, now, requestId: "first",
    });
    await expect(createContentDraft({
      input: draft({ slug: "SQLITE-local-news" }),
      actorAdminId: adminId, repository, now, requestId: "duplicate",
    })).rejects.toThrow(/duplicate_slug/);

    const caseDraft = await createContentDraft({
      input: draft({ contentType: "case", slug: "authorized-case", title: "获授权案例" }),
      actorAdminId: adminId, repository, now, requestId: "case-create",
    });
    await expect(publishContent({
      itemId: caseDraft.item.id, expectedVersion: caseDraft.item.version,
      confirmCaseAuthorization: false, actorAdminId: adminId, repository,
      now, requestId: "case-reject", publicOrigin: "https://preview.example.test",
    })).rejects.toThrow(/authorization/i);
    const published = await publishContent({
      itemId: caseDraft.item.id, expectedVersion: caseDraft.item.version,
      confirmCaseAuthorization: true, actorAdminId: adminId, repository,
      now, requestId: "case-publish", publicOrigin: "https://preview.example.test",
    });
    expect(published.item.caseAuthorizationRevisionId).toBe(published.revision.id);
  });
});
