import { describe, expect, it } from "vitest";
import { MySqlContentRepository } from "@/server/content/mysql-repository";
import { deleteNews } from "@/server/content/service";
import type { DatabaseConnection } from "@/server/db/pool";
const now = new Date("2026-10-07T08:00:00.000Z");
function database(state = "published", failPurge = false) {
  const calls: Array<{ sql: string; values: unknown[] }> = [];
  let committed = false;
  let rolledBack = false;
  const row = { id: 12, content_type: "news", status: state, slug: "delete-news", title: "删除新闻", summary: "摘要", source_html: "<p>正文</p>", sanitized_html: "<p>正文</p>", sanitizer_policy_version: "m2-html-v1", version: 2, draft_revision_id: null, published_revision_id: state === "draft" ? null : 101, first_published_at: state === "draft" ? null : now, published_at: state === "draft" ? null : now, offline_at: null };
  const connection: DatabaseConnection = {
    async query(sql, values = []) {
      calls.push({ sql: sql.replace(/\s+/g, " ").trim(), values });
      if (/FROM content_items/.test(sql)) return [[row], []];
      if (/FROM content_revisions/.test(sql)) return [[{ ...row, content_item_id: 12, revision_number: 2, created_at: now }], []];
      if (/INSERT INTO content_revisions/.test(sql)) return [{ insertId: 102 }, []];
      if (/INSERT INTO cache_purge_jobs/.test(sql)) {
        if (failPurge) throw new Error("purge insert failed");
        return [{ insertId: 80 }, []];
      }
      return [{ affectedRows: 1 }, []];
    },
    async beginTransaction() {}, async commit() { committed = true; }, async rollback() { rolledBack = true; }, release() {},
  };
  return { calls, row, get committed() { return committed; }, get rolledBack() { return rolledBack; }, run: async <T>(callback: (connection: DatabaseConnection) => Promise<T>) => callback(connection) };
}
const context = { itemId: 12, expectedVersion: 2, actorAdminId: 1, now, requestId: "mysql-delete", publicOrigin: "https://preview.example.test" };
describe("MySQL news deletion transaction", () => {
  it.each(["draft", "published", "offline"])("atomically deletes %s news while preserving rows and auditing", async state => {
    const db = database(state);
    const result = await deleteNews({ ...context, repository: new MySqlContentRepository(db.run) });
    expect(db.committed).toBe(true);
    expect(db.rolledBack).toBe(false);
    expect(result.item.version).toBe(3);
    expect(db.calls[0].sql).toMatch(/deleted_at IS NULL.*FOR UPDATE/);
    const update = db.calls.find(call => /UPDATE content_items/.test(call.sql))!;
    expect(update.sql).toMatch(/deleted_at = COALESCE\(\?, deleted_at\)/);
    expect(update.values).toContain(now);
    expect(db.calls.some(call => /INSERT INTO audit_logs/.test(call.sql) && call.values[1] === "content_deleted")).toBe(true);
    expect(db.calls.some(call => /DELETE FROM/.test(call.sql))).toBe(false);
    const purge = db.calls.find(call => /INSERT INTO cache_purge_jobs/.test(call.sql));
    if (state === "draft") expect(purge).toBeUndefined();
    else {
      expect(purge?.values[3]).toBe("offline");
      expect(JSON.parse(String(purge?.values[4]))).toContain("https://preview.example.test/news/delete-news");
    }
  });
  it("rolls back when the purge job cannot be persisted", async () => {
    const db = database("published", true);
    await expect(deleteNews({ ...context, repository: new MySqlContentRepository(db.run) })).rejects.toThrow("purge insert failed");
    expect(db.committed).toBe(false); expect(db.rolledBack).toBe(true);
  });
  it("rejects stale versions before writing evidence", async () => {
    const db = database();
    await expect(deleteNews({ ...context, expectedVersion: 1, repository: new MySqlContentRepository(db.run) })).rejects.toThrow("content_version_conflict");
    expect(db.calls).toHaveLength(1); expect(db.rolledBack).toBe(true);
  });
});
