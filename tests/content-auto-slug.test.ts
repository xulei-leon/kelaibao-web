import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { contentInput } from "@/server/content/admin-api";
import { SqliteContentRepository } from "@/server/content/sqlite-repository";
import {
  createContentDraft,
  offlineContent,
  publishContent,
  republishContent,
  saveContentDraft,
  type ContentRepository,
} from "@/server/content/service";
import { createSqliteTestDatabase, seedSqliteAdmin } from "./sqlite-local-test-helpers";

const random = vi.hoisted(() => ({ bytes: vi.fn() }));
vi.mock("node:crypto", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:crypto")>();
  const randomBytes = (size: number) => random.bytes(size);
  return { ...actual, default: { ...actual, randomBytes }, randomBytes };
});

const cleanups: Array<() => void> = [];
beforeEach(() => {
  let sequence = 1;
  random.bytes.mockReset().mockImplementation((size: number) => Buffer.alloc(size, sequence++));
});
afterEach(() => { while (cleanups.length) cleanups.pop()?.(); });

function setup() {
  const runtime = createSqliteTestDatabase();
  cleanups.push(runtime.cleanup);
  const actorAdminId = seedSqliteAdmin(runtime.database, "$argon2id$local-test-only");
  const repository = new SqliteContentRepository(runtime);
  return { runtime, repository, actorAdminId, requestId: "auto-slug", publicOrigin: "http://localhost:3000" };
}

function fields(contentType: "news" | "case" = "news") {
  return contentInput({ contentType, title: "中文同名标题", summary: "自动链接验证摘要", sourceHtml: "<p>自动链接正文</p>" });
}

function counts(runtime: ReturnType<typeof createSqliteTestDatabase>) {
  return ["content_items", "content_revisions", "audit_logs", "cache_purge_jobs"].map(table =>
    runtime.database.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get()?.count,
  );
}

describe("CMS automatically generated slugs", () => {
  it.each(["news", "case"] as const)("keeps %s links stable throughout the publication lifecycle", async contentType => {
    const context = setup();
    const created = await createContentDraft({ ...context, input: fields(contentType) });
    const sameTitle = await createContentDraft({ ...context, input: fields(contentType) });
    const slug = created.item.slug;
    expect(slug).toMatch(new RegExp(`^${contentType}-[a-f0-9]{16}$`));
    expect(random.bytes).toHaveBeenCalledWith(8);
    expect(sameTitle.item.slug).not.toBe(slug);
    expect(created.revision.slug).toBe(slug);
    const saved = await saveContentDraft({
      ...context, itemId: created.item.id, expectedVersion: created.item.version,
      input: { ...fields(contentType), title: "改标题不会改链接" },
    });
    expect(saved.item.slug).toBe(slug);
    expect((await context.repository.getAdminItem(saved.item.id))?.draftRevision?.slug).toBe(slug);
    const published = await publishContent({
      ...context, itemId: saved.item.id, expectedVersion: saved.item.version,
      confirmCaseAuthorization: contentType === "case",
    });
    const updated = await saveContentDraft({
      ...context, itemId: published.item.id, expectedVersion: published.item.version,
      input: { ...fields(contentType), title: "已发布后修改标题" },
    });
    const publicBefore = await context.repository.getPublicBySlug(contentType, slug);
    expect(publicBefore.status).toBe("published");
    if (publicBefore.status === "published") expect(publicBefore.item.title).toBe("改标题不会改链接");
    const republishedDraft = await publishContent({
      ...context, itemId: updated.item.id, expectedVersion: updated.item.version,
      confirmCaseAuthorization: false,
    });
    const offline = await offlineContent({
      ...context, itemId: updated.item.id, expectedVersion: republishedDraft.item.version,
    });
    expect(await context.repository.getPublicBySlug(contentType, slug)).toEqual({ status: "gone" });
    const republished = await republishContent({
      ...context, itemId: offline.item.id, expectedVersion: offline.item.version,
    });
    expect(republished.item.slug).toBe(slug);
    expect(republished.revision.slug).toBe(slug);
    expect((await context.repository.getPublicBySlug(contentType, slug)).status).toBe("published");
    expect(random.bytes).toHaveBeenCalledTimes(2);
  });

  it("retries an automatic collision only after rollback without leaving extra rows", async () => {
    const context = setup();
    random.bytes.mockReturnValueOnce(Buffer.alloc(8, 1)).mockReturnValueOnce(Buffer.alloc(8, 1)).mockReturnValueOnce(Buffer.alloc(8, 2));
    await createContentDraft({ ...context, input: fields() });
    const created = await createContentDraft({ ...context, input: fields() });
    expect(created.item.slug).toBe("news-0202020202020202");
    expect(counts(context.runtime)).toEqual([2, 2, 2, 0]);
    expect(random.bytes).toHaveBeenCalledTimes(3);
  });

  it("stops after three automatic attempts and leaves no failed revisions or audits", async () => {
    const context = setup();
    random.bytes.mockReturnValue(Buffer.alloc(8, 1));
    await createContentDraft({ ...context, input: fields() });
    const before = counts(context.runtime);
    const insert = vi.spyOn(context.repository, "createDraft");
    await expect(createContentDraft({ ...context, input: fields() })).rejects.toThrow("duplicate_slug");
    expect(insert).toHaveBeenCalledTimes(3);
    expect(counts(context.runtime)).toEqual(before);
  });

  it("does not retry other repository failures", async () => {
    const createDraft = vi.fn().mockRejectedValue(new Error("database_unavailable"));
    const repository = { createDraft } as unknown as ContentRepository;
    await expect(createContentDraft({ repository, actorAdminId: 1, requestId: "failed", input: fields() })).rejects.toThrow("database_unavailable");
    expect(createDraft).toHaveBeenCalledTimes(1);
    expect(random.bytes).toHaveBeenCalledTimes(1);
  });

  it("keeps explicit legacy slugs, rejects invalid values, and does not retry explicit duplicates", async () => {
    const context = setup();
    const input = { ...fields(), slug: "Legacy News" };
    const created = await createContentDraft({ ...context, input });
    expect(created.item.slug).toBe("legacy-news");
    const insert = vi.spyOn(context.repository, "createDraft");
    await expect(createContentDraft({ ...context, input })).rejects.toThrow("duplicate_slug");
    expect(insert).toHaveBeenCalledTimes(1);
    for (const slug of [null, "", "../escape", 123]) {
      await expect(createContentDraft({ ...context, input: { ...input, slug } })).rejects.toThrow(/slug/i);
      await expect(saveContentDraft({ ...context, itemId: created.item.id, expectedVersion: 1, input: { ...input, slug } })).rejects.toThrow(/slug/i);
    }
    const saved = await saveContentDraft({ ...context, itemId: created.item.id, expectedVersion: 1, input: fields() });
    expect(saved.item.slug).toBe("legacy-news");
    expect(random.bytes).not.toHaveBeenCalled();
    expect(counts(context.runtime)).toEqual([1, 2, 2, 0]);
  });

  it("rejects stale versions and explicit changes to published slugs with no side effects", async () => {
    const context = setup();
    const created = await createContentDraft({ ...context, input: fields() });
    const published = await publishContent({ ...context, itemId: created.item.id, expectedVersion: 1, confirmCaseAuthorization: false });
    const before = counts(context.runtime);
    await expect(saveContentDraft({ ...context, itemId: created.item.id, expectedVersion: 1, input: fields() })).rejects.toThrow(/version_conflict/);
    await expect(saveContentDraft({ ...context, itemId: created.item.id, expectedVersion: published.item.version, input: { ...fields(), slug: "changed" } })).rejects.toThrow(/immutable/);
    expect(counts(context.runtime)).toEqual(before);
    expect((await context.repository.getAdminItem(created.item.id))?.item.slug).toBe(created.item.slug);
  });
});
