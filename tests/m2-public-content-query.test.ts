import { MySqlContentRepository } from "@/server/content/mysql-repository";
import type { DatabaseConnection } from "@/server/db/pool";
import { describe, expect, it } from "vitest";

function database(
  query: (
    sql: string,
    values: unknown[],
  ) => Promise<[unknown, unknown]>,
) {
  const calls: Array<{ sql: string; values: unknown[] }> = [];
  const connection: DatabaseConnection = {
    async query(sql, values = []) {
      calls.push({ sql: sql.replace(/\s+/g, " ").trim(), values });
      return query(sql, values);
    },
    async beginTransaction() {},
    async commit() {},
    async rollback() {},
    release() {},
  };
  return {
    calls,
    run: async <T>(
      callback: (value: DatabaseConnection) => Promise<T>,
    ) => callback(connection),
  };
}

const publishedRow = {
  item_status: "published",
  first_published_at: new Date("2026-07-20T02:00:00.000Z"),
  published_at: new Date("2026-07-30T02:00:00.000Z"),
  revision_id: 104,
  content_item_id: 12,
  revision_number: 4,
  slug: "market-update",
  title: "市场更新",
  summary: "这是公开摘要。",
  sanitized_html: "<h2>公开正文</h2><p>仅来自 published revision。</p>",
  sanitizer_policy_version: "m2-html-v1",
  revision_created_at: new Date("2026-07-30T01:59:00.000Z"),
};

describe("M2-04 public content query boundary", () => {
  it("lists only immutable published snapshots with deterministic bounds", async () => {
    const db = database(async () => [[publishedRow], []]);
    const repository = new MySqlContentRepository(db.run);

    const result = await repository.listPublishedByType("news");

    expect(result).toEqual([
      {
        id: 104,
        contentItemId: 12,
        revisionNumber: 4,
        contentType: "news",
        slug: "market-update",
        title: "市场更新",
        summary: "这是公开摘要。",
        sanitizedHtml:
          "<h2>公开正文</h2><p>仅来自 published revision。</p>",
        sanitizerPolicyVersion: "m2-html-v1",
        firstPublishedAt: new Date("2026-07-20T02:00:00.000Z"),
        publishedAt: new Date("2026-07-30T02:00:00.000Z"),
        updatedAt: new Date("2026-07-30T01:59:00.000Z"),
        coverImage: null,
      },
    ]);
    expect(db.calls).toHaveLength(1);
    expect(db.calls[0].sql).toMatch(
      /JOIN content_revisions[\s\S]+published_revision_id/,
    );
    expect(db.calls[0].sql).toMatch(/i\.status = 'published'/);
    expect(db.calls[0].sql).toMatch(/r\.status = 'published'/);
    expect(db.calls[0].sql).toMatch(
      /ORDER BY i\.published_at DESC, i\.id DESC/,
    );
    expect(db.calls[0].sql).toMatch(/LIMIT 100/);
    expect(db.calls[0].sql).not.toMatch(
      /source_html|draft_revision_id|actor_admin_id|case_authorization/i,
    );
    expect(db.calls[0].values).toEqual(["news"]);
  });

  it("maps detail states without selecting draft, source, or admin fields", async () => {
    const states = [
      { rows: [] as unknown[], status: "not_found" },
      { rows: [{ item_status: "draft" }], status: "not_found" },
      { rows: [{ item_status: "offline" }], status: "gone" },
      { rows: [publishedRow], status: "published" },
    ] as const;

    for (const state of states) {
      const db = database(async () => [[...state.rows], []]);
      const repository = new MySqlContentRepository(db.run);
      const result = await repository.getPublicBySlug(
        "news",
        "market-update",
      );

      expect(result.status).toBe(state.status);
      expect(db.calls[0].sql).not.toMatch(
        /source_html|draft_revision_id|actor_admin_id|case_authorization/i,
      );
      expect(db.calls[0].sql).toMatch(/r\.status = 'published'/);
      if (result.status === "published") {
        expect(result.item.sanitizedHtml).toContain("published revision");
        expect(result.item).not.toHaveProperty("sourceHtml");
        expect(result.item).not.toHaveProperty("actorAdminId");
      }
    }
  });

  it("fails closed when a published pointer has no matching immutable revision", async () => {
    const db = database(async () => [
      [
        {
          item_status: "published",
          first_published_at: new Date("2026-07-20T02:00:00.000Z"),
          published_at: new Date("2026-07-30T02:00:00.000Z"),
          revision_id: null,
        },
      ],
      [],
    ]);
    const repository = new MySqlContentRepository(db.run);

    await expect(
      repository.getPublicBySlug("news", "broken-pointer"),
    ).rejects.toThrow("published_content_snapshot_missing");
    expect(db.calls[0].sql).toMatch(/r\.status = 'published'/);
  });
});
