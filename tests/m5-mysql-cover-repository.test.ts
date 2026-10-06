import { afterEach, describe, expect, it, vi } from "vitest";

import { normalizeContentDraft } from "@/server/content/domain";
import { MySqlContentRepository } from "@/server/content/mysql-repository";
import type { DatabaseConnection } from "@/server/db/pool";

afterEach(() => vi.unstubAllEnvs());

function runner(
  query: (sql: string, values: unknown[]) => Promise<[unknown, unknown]>,
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
    },
    async rollback() {
      rolledBack += 1;
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
    run: async <T>(callback: (current: DatabaseConnection) => Promise<T>) =>
      callback(connection),
  };
}

const publicRow = {
  item_status: "published",
  first_published_at: new Date("2026-08-08T01:00:00.000Z"),
  published_at: new Date("2026-08-08T02:00:00.000Z"),
  revision_id: 11,
  content_item_id: 7,
  revision_number: 3,
  slug: "mysql-cover",
  title: "MySQL 代表图",
  summary: "公开摘要",
  sanitized_html: "<p>正文</p>",
  sanitizer_policy_version: "m2-html-v1",
  revision_created_at: new Date("2026-08-08T02:00:00.000Z"),
  cover_media_asset_id: 5,
  cover_alt: "公开代表图",
  cover_object_key: "media/7/cover-deadbeef.webp",
  cover_mime_type: "image/webp",
  cover_width_px: 1200,
  cover_height_px: 630,
};

describe("M5-01 MySQL cover repository", () => {
  it("maps the joined published revision to the same trusted public cover DTO", async () => {
    vi.stubEnv("OSS_ASSETS_BASE_URL", "https://assets.example/");
    const db = runner(async () => [[publicRow], []]);
    const repository = new MySqlContentRepository(db.run);

    await expect(repository.getPublicBySlug("news", "mysql-cover")).resolves.toMatchObject({
      status: "published",
      item: {
        coverImage: {
          url: "https://assets.example/media/7/cover-deadbeef.webp",
          width: 1200,
          height: 630,
          alt: "公开代表图",
          mimeType: "image/webp",
        },
      },
    });
    expect(db.calls[0]).toMatch(/LEFT JOIN media_assets m ON m\.id = r\.cover_media_asset_id/);
  });

  it("rejects a non-HTTPS asset origin instead of returning a signed or external URL", async () => {
    vi.stubEnv("OSS_ASSETS_BASE_URL", "http://assets.example/");
    const db = runner(async () => [[publicRow], []]);
    const repository = new MySqlContentRepository(db.run);
    await expect(repository.getPublicBySlug("news", "mysql-cover")).rejects.toThrow(
      /published_cover_origin_invalid/i,
    );
  });

  it("rolls back before content insertion when cover authorization is absent", async () => {
    const db = runner(async (sql) => {
      if (/FROM media_assets/.test(sql)) {
        return [[{
          id: 5,
          mime_type: "image/webp",
          byte_size: 200 * 1024,
          width_px: 1200,
          height_px: 630,
          public_usage_confirmed_at: null,
        }], []];
      }
      throw new Error("unexpected query");
    });
    const repository = new MySqlContentRepository(db.run);
    await expect(
      repository.createDraft({
        actorAdminId: 1,
        now: new Date("2026-08-08T02:00:00.000Z"),
        requestId: "mysql-cover-reject",
        draft: normalizeContentDraft({
          contentType: "news",
          slug: "mysql-cover",
          title: "MySQL 代表图",
          summary: "公开摘要",
          sourceHtml: "<p>正文</p>",
          coverMediaAssetId: 5,
          coverAlt: "公开代表图",
        }),
      }),
    ).rejects.toThrow(/not confirmed for public representative use/i);
    expect(db.calls.some((sql) => /INSERT INTO content_items/.test(sql))).toBe(false);
    expect(db.committed).toBe(0);
    expect(db.rolledBack).toBe(1);
  });
});
