import { afterEach, describe, expect, it, vi } from "vitest";
import { DELETE } from "@/app/api/admin/content/[id]/route";
import { POST as login } from "@/app/api/admin/auth/login/route";
import { GET as session } from "@/app/api/admin/auth/session/route";
import { hashAdminPassword } from "@/server/auth/password";
import { SqliteContentRepository } from "@/server/content/sqlite-repository";
import { createContentDraft, deleteNews, offlineContent, publishContent, republishContent } from "@/server/content/service";
import { createSqliteTestDatabase, seedSqliteAdmin } from "./sqlite-local-test-helpers";

const cleanups: Array<() => void> = [];
afterEach(() => { vi.unstubAllEnvs(); while (cleanups.length) cleanups.pop()?.(); });
const origin = "http://localhost:3000";
const draft = { contentType: "news", title: "待删除新闻", summary: "删除测试摘要", sourceHtml: "<p>删除测试正文</p>" };
function setup() {
  const runtime = createSqliteTestDatabase(); cleanups.push(runtime.cleanup);
  const actorAdminId = seedSqliteAdmin(runtime.database, "$argon2id$test-only");
  const repository = new SqliteContentRepository(runtime);
  return { runtime, context: { actorAdminId, repository, publicOrigin: origin, requestId: "delete-test" } };
}

describe("news logical deletion", () => {
  it.each(["draft", "published", "offline"])("removes %s news, preserves evidence, and prevents resurrection", async (state) => {
    const { runtime, context } = setup();
    let { item } = await createContentDraft({ input: draft, ...context });
    if (state !== "draft") ({ item } = await publishContent({ itemId: item.id, expectedVersion: item.version, confirmCaseAuthorization: false, ...context }));
    if (state === "offline") ({ item } = await offlineContent({ itemId: item.id, expectedVersion: item.version, ...context }));
    const deleted = await deleteNews({ itemId: item.id, expectedVersion: item.version, ...context });
    const stored = runtime.database.prepare("SELECT deleted_at, version FROM content_items WHERE id = ?").get(item.id);
    expect(stored?.deleted_at).toBeTruthy();
    expect(stored?.version).toBe(item.version + 1);
    expect(deleted.revision.revisionNumber).toBe(item.version + 1);
    expect(await context.repository.listByType("news")).toEqual([]);
    expect(await context.repository.getAdminItem(item.id)).toBeNull();
    expect(await context.repository.listRevisions(item.id)).toEqual([]);
    expect(await context.repository.listPublishedByType("news")).toEqual([]);
    expect(await context.repository.getPublicBySlug("news", item.slug)).toEqual({ status: state === "draft" ? "not_found" : "gone" });
    expect(runtime.database.prepare("SELECT COUNT(*) AS n FROM content_revisions WHERE content_item_id = ?").get(item.id)?.n).toBe(item.version + 1);
    expect(runtime.database.prepare("SELECT COUNT(*) AS n FROM audit_logs WHERE action = 'content_deleted'").get()?.n).toBe(1);
    expect(deleted.purgeJobId === null).toBe(state === "draft");
    if (deleted.purgeJobId) {
      const job = runtime.database.prepare("SELECT action, urls_json FROM cache_purge_jobs WHERE id = ?").get(deleted.purgeJobId);
      expect(job?.action).toBe("offline");
      expect(JSON.parse(String(job?.urls_json))).toContain(`${origin}/news/${item.slug}`);
    }
    await expect(deleteNews({ itemId: item.id, expectedVersion: deleted.item.version, ...context })).rejects.toThrow("content_not_found");
    await expect(republishContent({ itemId: item.id, expectedVersion: deleted.item.version, ...context })).rejects.toThrow("content_not_found");
    await expect(createContentDraft({ input: { ...draft, slug: item.slug }, ...context })).rejects.toThrow("duplicate_slug");
  });

  it("rejects cases and stale versions without side effects", async () => {
    const { runtime, context } = setup();
    for (const contentType of ["news", "case"]) {
      const { item } = await createContentDraft({ input: { ...draft, contentType }, ...context });
      await expect(deleteNews({ itemId: item.id, expectedVersion: contentType === "news" ? item.version + 1 : item.version, ...context })).rejects.toThrow(contentType === "news" ? "content_version_conflict" : "Only news");
      expect(await context.repository.getAdminItem(item.id)).not.toBeNull();
    }
    expect(runtime.database.prepare("SELECT COUNT(*) AS n FROM audit_logs WHERE action = 'content_deleted'").get()?.n).toBe(0);
    expect(runtime.database.prepare("SELECT COUNT(*) AS n FROM content_revisions").get()?.n).toBe(2);
  });

  it("rolls back the tombstone, revision and purge when deletion audit fails", async () => {
    const { runtime, context } = setup();
    const created = await createContentDraft({ input: draft, ...context });
    const { item } = await publishContent({ itemId: created.item.id, expectedVersion: created.item.version, confirmCaseAuthorization: false, ...context });
    runtime.database.exec("CREATE TRIGGER fail_delete_audit BEFORE INSERT ON audit_logs WHEN NEW.action = 'content_deleted' BEGIN SELECT RAISE(ABORT, 'audit unavailable'); END");
    await expect(deleteNews({ itemId: item.id, expectedVersion: item.version, ...context })).rejects.toThrow("audit unavailable");
    expect((await context.repository.getAdminItem(item.id))?.item.version).toBe(item.version);
    expect((await context.repository.getPublicBySlug("news", item.slug)).status).toBe("published");
    expect(runtime.database.prepare("SELECT deleted_at FROM content_items WHERE id = ?").get(item.id)?.deleted_at).toBeNull();
    expect(runtime.database.prepare("SELECT COUNT(*) AS n FROM content_revisions").get()?.n).toBe(2);
    expect(runtime.database.prepare("SELECT COUNT(*) AS n FROM cache_purge_jobs").get()?.n).toBe(1);
  });

  it("can delete legacy content without validating unavailable image storage", async () => {
    const { runtime, context } = setup();
    const { item } = await createContentDraft({ input: draft, ...context });
    runtime.database.prepare("UPDATE content_revisions SET source_html = ?, sanitized_html = ? WHERE id = ?")
      .run('<img src="https://unconfigured.example/media/old.png">', '<img src="https://unconfigured.example/media/old.png">', item.draftRevisionId);
    await expect(deleteNews({ itemId: item.id, expectedVersion: item.version, ...context })).resolves.toHaveProperty("item.version", 2);
  });

  it("protects the DELETE route with authentication, CSRF and version checks", async () => {
    const { runtime, context } = setup();
    const password = "local-delete-test-password";
    runtime.database.prepare("UPDATE admins SET password_hash = ?").run(await hashAdminPassword(password));
    for (const [name, value] of Object.entries({ SINO_RUNTIME_MODE: "preview", DATABASE_ADAPTER: "sqlite", DATABASE_RUNTIME_SCOPE: "local-test", SQLITE_DATABASE_PATH: runtime.path, DATABASE_URL: "", NEXT_PUBLIC_SITE_URL: origin, ADMIN_CSRF_SECRET: Buffer.alloc(32, 7).toString("base64url"), ADMIN_DUMMY_PASSWORD_HASH: await hashAdminPassword("local-dummy-delete-password") })) vi.stubEnv(name, value);
    const { item } = await createContentDraft({ input: draft, ...context });
    const routeContext = { params: Promise.resolve({ id: String(item.id) }) };
    const send = (cookie = "", token = "", version = item.version) => DELETE(new Request(`${origin}/api/admin/content/${item.id}`, { method: "DELETE", headers: { cookie, host: "localhost:3000", origin, "content-type": "application/json", "x-csrf-token": token }, body: JSON.stringify({ expectedVersion: version }) }), routeContext);
    expect((await send()).status).toBe(401);
    const loggedIn = await login(new Request(`${origin}/api/admin/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ username: "admin@example.test", password }) }));
    expect(loggedIn.status).toBe(200);
    const cookie = loggedIn.headers.get("set-cookie")!.split(";", 1)[0];
    const current = await session(new Request(`${origin}/api/admin/auth/session`, { headers: { cookie } }));
    const token = (await current.json()).csrfToken;
    expect((await send(cookie, "wrong-token")).status).toBe(403);
    expect((await send(cookie, token, item.version + 1)).status).toBe(409);
    expect((await send(cookie, token)).status).toBe(200);
    expect((await send(cookie, token)).status).toBe(404);
  });
});
