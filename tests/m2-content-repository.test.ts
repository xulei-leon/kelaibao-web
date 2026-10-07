import { MySqlContentRepository } from "@/server/content/mysql-repository";
import { createContentDraft } from "@/server/content/service";
import type { DatabaseConnection } from "@/server/db/pool";
import { SANITIZER_POLICY_VERSION } from "@/server/security/html/sanitizer";
import { describe, expect, it } from "vitest";

const now = new Date("2026-07-30T02:00:00.000Z");
const draft = {
  contentType: "news" as const,
  slug: "market-update",
  title: "市场更新",
  summary: "这是摘要。",
  sourceHtml: "<p>正文</p>",
  sanitizedHtml: "<p>正文</p>",
  sanitizerPolicyVersion: SANITIZER_POLICY_VERSION,
  coverMediaAssetId: null,
  coverAlt: null,
};

function database(
  query: (
    sql: string,
    values: unknown[],
  ) => Promise<[unknown, unknown]>,
) {
  const calls: string[] = [];
  let committed = 0;
  let rolledBack = 0;
  const connection: DatabaseConnection = {
    async query(sql, values = []) {
      calls.push(sql.replace(/\s+/g, " ").trim());
      return query(sql, values);
    },
    async beginTransaction() {
      calls.push("BEGIN");
    },
    async commit() {
      committed += 1;
      calls.push("COMMIT");
    },
    async rollback() {
      rolledBack += 1;
      calls.push("ROLLBACK");
    },
    release() {},
  };
  return {
    calls,
    get committed() {
      return committed;
    },
    get rolledBack() {
      return rolledBack;
    },
    run: async <T>(
      callback: (value: DatabaseConnection) => Promise<T>,
    ) => callback(connection),
  };
}

describe("M2-03 MySQL content repository", () => {
  it("rolls back an automatic slug collision before creating the next candidate", async () => {
    const insertedSlugs: unknown[] = [];
    const revisionSlugs: unknown[] = [];
    const db = database(async (sql, values) => {
      if (/INSERT INTO content_items/.test(sql)) {
        insertedSlugs.push(values[1]);
        if (insertedSlugs.length === 1) {
          throw Object.assign(new Error("duplicate"), { code: "ER_DUP_ENTRY" });
        }
        return [{ insertId: 12 }, []];
      }
      if (/INSERT INTO content_revisions/.test(sql)) {
        revisionSlugs.push(values[2]);
        return [{ insertId: 101 }, []];
      }
      return [{ affectedRows: 1 }, []];
    });
    const { slug: _legacySlug, ...input } = draft;
    const created = await createContentDraft({
      input, repository: new MySqlContentRepository(db.run),
      actorAdminId: 1, now, requestId: "auto-create",
    });
    expect(created.item.slug).toMatch(/^news-[a-f0-9]{16}$/);
    expect(insertedSlugs).toHaveLength(2);
    expect(insertedSlugs[0]).not.toBe(insertedSlugs[1]);
    expect(revisionSlugs).toEqual([created.item.slug]);
    expect(db.rolledBack).toBe(1);
    expect(db.committed).toBe(1);
    expect(db.calls.filter(sql => /INSERT INTO audit_logs/.test(sql))).toHaveLength(1);
  });

  it("commits item, immutable revision, pointer, and audit as one create transaction", async () => {
    const db = database(async (sql) => {
      if (/INSERT INTO content_items/.test(sql)) {
        return [{ insertId: 12 }, []];
      }
      if (/INSERT INTO content_revisions/.test(sql)) {
        return [{ insertId: 101 }, []];
      }
      return [{ affectedRows: 1 }, []];
    });
    const repository = new MySqlContentRepository(db.run);

    await expect(
      repository.createDraft({
        draft,
        actorAdminId: 1,
        now,
        requestId: "create-1",
      }),
    ).resolves.toMatchObject({
      item: {
        id: 12,
        version: 1,
        draftRevisionId: 101,
        publishedRevisionId: null,
      },
      revision: {
        id: 101,
        revisionNumber: 1,
        status: "draft",
      },
      purgeJobId: null,
    });
    expect(db.committed).toBe(1);
    expect(db.rolledBack).toBe(0);
    expect(db.calls.some((sql) => /INSERT INTO audit_logs/.test(sql))).toBe(
      true,
    );
    expect(
      db.calls.some((sql) => /INSERT INTO cache_purge_jobs/.test(sql)),
    ).toBe(false);
  });

  it("maps duplicate slug separately and rolls the whole transaction back", async () => {
    const duplicate = Object.assign(new Error("duplicate"), {
      code: "ER_DUP_ENTRY",
    });
    const db = database(async () => Promise.reject(duplicate));
    const repository = new MySqlContentRepository(db.run);

    await expect(
      repository.createDraft({
        draft,
        actorAdminId: 1,
        now,
        requestId: "create-duplicate",
      }),
    ).rejects.toThrow("duplicate_slug");
    expect(db.committed).toBe(0);
    expect(db.rolledBack).toBe(1);
  });

  it("rejects a stale version before creating a revision, audit, or purge job", async () => {
    const db = database(async (sql) => {
      if (/FROM content_items/.test(sql)) {
        return [
          [
            {
              id: 12,
              content_type: "news",
              status: "draft",
              slug: draft.slug,
              title: draft.title,
              summary: draft.summary,
              source_html: draft.sourceHtml,
              sanitized_html: draft.sanitizedHtml,
              sanitizer_policy_version: draft.sanitizerPolicyVersion,
              version: 2,
              draft_revision_id: 101,
              published_revision_id: null,
              first_published_at: null,
              published_at: null,
              offline_at: null,
              case_authorization_confirmed_at: null,
              case_authorization_admin_id: null,
              case_authorization_revision_id: null,
            },
          ],
          [],
        ];
      }
      throw new Error("unexpected query");
    });
    const repository = new MySqlContentRepository(db.run);

    await expect(
      repository.mutate({
        itemId: 12,
        expectedVersion: 1,
        actorAdminId: 1,
        now,
        requestId: "stale-1",
        publicOrigin: "https://www.example.cn",
        plan: () => {
          throw new Error("plan must not run");
        },
      }),
    ).rejects.toThrow("content_version_conflict");
    expect(db.committed).toBe(0);
    expect(db.rolledBack).toBe(1);
    expect(
      db.calls.some((sql) => /INSERT INTO (content_revisions|audit_logs|cache_purge_jobs)/.test(sql)),
    ).toBe(false);
  });

  it("rolls back a partial create when the success audit cannot be written", async () => {
    const db = database(async (sql) => {
      if (/INSERT INTO content_items/.test(sql)) {
        return [{ insertId: 12 }, []];
      }
      if (/INSERT INTO content_revisions/.test(sql)) {
        return [{ insertId: 101 }, []];
      }
      if (/INSERT INTO audit_logs/.test(sql)) {
        throw new Error("audit_unavailable");
      }
      return [{ affectedRows: 1 }, []];
    });
    const repository = new MySqlContentRepository(db.run);

    await expect(
      repository.createDraft({
        draft,
        actorAdminId: 1,
        now,
        requestId: "create-rollback",
      }),
    ).rejects.toThrow("audit_unavailable");
    expect(db.committed).toBe(0);
    expect(db.rolledBack).toBe(1);
  });
});
